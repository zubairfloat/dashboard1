-- ONE-TIME SETUP FOR A NEW UAT SUPABASE PROJECT ONLY.
-- Run the entire file in the Supabase SQL Editor as the database owner.
-- Uses Supabase-provided auth.users, auth.uid(), storage tables and roles.
-- Does not create or modify the rest of the dashboard schema.
-- Stops if KYC already exists; transaction rolls back on any error.
begin;
do $$ begin
  if to_regclass('public.kyc_submissions') is not null then
    raise exception 'KYC already exists. Use incremental migrations instead of this fresh setup.';
  end if;
end $$;

-- Source: 20260915180025_manual_kyc.sql
-- Manual ID verification. Apply once to the project's Supabase database.
create schema if not exists kyc_private;
revoke all on schema kyc_private from public, anon;
grant usage on schema kyc_private to authenticated;
create table kyc_private.reviewers (user_id uuid primary key references auth.users(id) on delete cascade);
alter table kyc_private.reviewers enable row level security;
revoke all on kyc_private.reviewers from public, anon, authenticated;
-- UAT reviewers are explicitly enrolled after setup; no profiles dependency.
create function kyc_private.is_reviewer() returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (select 1 from kyc_private.reviewers where user_id = auth.uid());
$$;
revoke all on function kyc_private.is_reviewer() from public, anon;
grant execute on function kyc_private.is_reviewer() to authenticated;
create function public.is_kyc_reviewer() returns boolean language sql stable security invoker set search_path = '' as $$ select kyc_private.is_reviewer(); $$;
revoke all on function public.is_kyc_reviewer() from public, anon;
grant execute on function public.is_kyc_reviewer() to authenticated;

create table public.kyc_submissions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 150),
  country text not null check (char_length(trim(country)) between 2 and 80),
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  consent_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  check ((status = 'rejected' and rejection_reason is not null and char_length(trim(rejection_reason)) between 3 and 1000) or (status <> 'rejected' and rejection_reason is null))
);
create unique index kyc_one_active on public.kyc_submissions(user_id) where status in ('pending','verified');
create index kyc_user_history on public.kyc_submissions(user_id, created_at desc);
create index kyc_review_queue on public.kyc_submissions(status, created_at);
create index kyc_reviewer_history on public.kyc_submissions(reviewed_by);
alter table public.kyc_submissions enable row level security;
revoke all on public.kyc_submissions from public, anon, authenticated;
grant select on public.kyc_submissions to authenticated;
grant insert (id, user_id, full_name, country) on public.kyc_submissions to authenticated;
grant update (status, rejection_reason) on public.kyc_submissions to authenticated;
create policy kyc_read on public.kyc_submissions for select to authenticated using (user_id = (select auth.uid()) or (select kyc_private.is_reviewer()));
create policy kyc_submit on public.kyc_submissions for insert to authenticated with check (user_id = (select auth.uid()) and status = 'pending' and reviewed_at is null and reviewed_by is null);
create policy kyc_review on public.kyc_submissions for update to authenticated using ((select kyc_private.is_reviewer()) and user_id <> (select auth.uid()) and status = 'pending') with check ((select kyc_private.is_reviewer()) and user_id <> (select auth.uid()) and status in ('verified','rejected'));

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types) values ('kyc-documents', 'kyc-documents', false, 5242880, array['image/jpeg','image/png']);
create policy kyc_photo_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/(front|back)$'
  and not exists (select 1 from public.kyc_submissions s where s.user_id = (select auth.uid()) and s.status in ('pending','verified'))
);
create policy kyc_photo_read on storage.objects for select to authenticated using (
  bucket_id = 'kyc-documents' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select kyc_private.is_reviewer()))
);
-- No client UPDATE or DELETE: reviewed documents cannot be replaced after submission.
create function kyc_private.validate_submission() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if TG_OP = 'INSERT' then
    if new.user_id <> auth.uid() then raise exception 'Owner mismatch'; end if;
    if (select count(*) from storage.objects where bucket_id = 'kyc-documents' and name in (new.user_id::text || '/' || new.id::text || '/front', new.user_id::text || '/' || new.id::text || '/back')) <> 2 then
      raise exception 'Both ID photos must be uploaded before submitting';
    end if;
  else
    if not kyc_private.is_reviewer() or old.user_id = auth.uid() or old.status <> 'pending' then raise exception 'Review not allowed'; end if;
    new.reviewed_by := auth.uid(); new.reviewed_at := now();
    if new.status = 'verified' then new.rejection_reason := null; end if;
  end if;
  return new;
end;
$$;
revoke all on function kyc_private.validate_submission() from public, anon, authenticated;
create trigger kyc_validate before insert or update on public.kyc_submissions for each row execute function kyc_private.validate_submission();


-- Source: 20260915182453_kyc_notifications.sql
create table kyc_private.notification_config (
  id boolean primary key default true check(id),
  secret_hash text not null
);
alter table kyc_private.notification_config enable row level security;
revoke all on kyc_private.notification_config from public, anon, authenticated;

create table kyc_private.email_jobs (
  submission_id uuid primary key references public.kyc_submissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  provider_id text,
  lease uuid,
  next_attempt_at timestamptz not null default now(),
  first_attempt_at timestamptz,
  payload jsonb
);
alter table kyc_private.email_jobs enable row level security;
revoke all on kyc_private.email_jobs from public, anon, authenticated;
create index kyc_email_pending on kyc_private.email_jobs(next_attempt_at) where sent_at is null;

create function kyc_private.queue_submission_email() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or auth.uid() <> new.user_id then raise exception 'Authentication required'; end if;
  insert into kyc_private.email_jobs(submission_id) values(new.id);
  return new;
end;
$$;
revoke all on function kyc_private.queue_submission_email() from public, anon, authenticated;
create trigger kyc_queue_email after insert on public.kyc_submissions for each row execute function kyc_private.queue_submission_email();
-- Existing pending requests also receive an admin notification.
insert into kyc_private.email_jobs(submission_id) select id from public.kyc_submissions where status='pending';

create function kyc_private.email_job(p_secret text, p_submission uuid default null, p_lease uuid default null, p_provider_id text default null, p_complete boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  job kyc_private.email_jobs;
  submission public.kyc_submissions;
  recipients text[];
  reviewer boolean;
begin
  if auth.uid() is null or not exists(select 1 from kyc_private.notification_config where secret_hash=encode(sha256(convert_to(p_secret,'UTF8')),'hex')) then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  reviewer := kyc_private.is_reviewer();
  if p_submission is null and not reviewer then raise exception 'Reviewer required' using errcode='42501'; end if;
  if p_submission is not null then
    select * into submission from public.kyc_submissions where id=p_submission;
    if not found or (submission.user_id <> auth.uid() and not reviewer) then raise exception 'Not authorized' using errcode='42501'; end if;
  end if;
  if p_complete then
    update kyc_private.email_jobs set
      sent_at=case when p_provider_id is not null then now() else null end,
      provider_id=p_provider_id, lease=null, next_attempt_at=now()+interval '1 minute'
    where submission_id=p_submission and lease=p_lease and sent_at is null;
    if not found then raise exception 'Delivery lease expired'; end if;
    return jsonb_build_object('state',case when p_provider_id is not null then 'sent' else 'retry' end);
  end if;
  if p_submission is not null and exists(select 1 from kyc_private.email_jobs where submission_id=p_submission and sent_at is not null) then
    return jsonb_build_object('state','sent');
  end if;
  select j.* into job from kyc_private.email_jobs j
    where (p_submission is null or j.submission_id=p_submission) and j.sent_at is null and j.next_attempt_at<=now()
      and (j.first_attempt_at is null or j.first_attempt_at>now()-interval '23 hours')
    order by j.created_at limit 1 for update skip locked;
  if not found then return jsonb_build_object('state','deferred'); end if;
  select * into submission from public.kyc_submissions where id=job.submission_id;
  if job.payload is null then
    select array_agg(u.email order by u.email) into recipients
      from kyc_private.reviewers r join auth.users u on u.id=r.user_id
      where u.email is not null; -- Explicit UAT reviewer registry is authoritative.
    if coalesce(array_length(recipients,1),0)=0 then raise exception 'No KYC admin email recipients configured'; end if;
    job.payload := jsonb_build_object('recipients',recipients,'full_name',submission.full_name,'country',submission.country,'submitted_at',submission.created_at,'user_id',submission.user_id);
  end if;
  update kyc_private.email_jobs set lease=gen_random_uuid(), next_attempt_at=now()+interval '2 minutes', first_attempt_at=coalesce(first_attempt_at,now()), payload=job.payload
    where submission_id=job.submission_id returning * into job;
  return jsonb_build_object('state','claimed','id',job.submission_id,'lease',job.lease,'payload',job.payload);
end;
$$;
revoke all on function kyc_private.email_job(text,uuid,uuid,text,boolean) from public, anon;
grant execute on function kyc_private.email_job(text,uuid,uuid,text,boolean) to authenticated;
create function public.kyc_email_job(p_secret text, p_submission uuid default null, p_lease uuid default null, p_provider_id text default null, p_complete boolean default false)
returns jsonb language sql security invoker set search_path = '' as $$
  select kyc_private.email_job(p_secret,p_submission,p_lease,p_provider_id,p_complete);
$$;
revoke all on function public.kyc_email_job(text,uuid,uuid,text,boolean) from public, anon;
grant execute on function public.kyc_email_job(text,uuid,uuid,text,boolean) to authenticated;


-- Source: 20260916220633_kyc_document_types.sql
alter table public.kyc_submissions
  add column country_code text,
  add column document_type text not null default 'national_id'
    check (document_type in ('national_id','passport','driving_license'));
alter table public.kyc_submissions add constraint kyc_country_code
  check (country_code is null or country_code = any(array['AF','AX','AL','DZ','AS','AD','AO','AI','AQ','AG','AR','AM','AW','AU','AT','AZ','BS','BH','BD','BB','BY','BE','BZ','BJ','BM','BT','BO','BA','BW','BV','BR','IO','VG','BN','BG','BF','BI','KH','CM','CA','CV','BQ','KY','CF','TD','CL','CN','CX','CC','CO','KM','CG','CD','CK','CR','CI','HR','CU','CW','CY','CZ','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FK','FO','FJ','FI','FR','GF','PF','TF','GA','GM','GE','DE','GH','GI','GR','GL','GD','GP','GU','GT','GG','GN','GW','GY','HT','HM','HN','HK','HU','IS','IN','ID','IR','IQ','IE','IM','IL','IT','JM','JP','JE','JO','KZ','KE','KI','KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MO','MG','MW','MY','MV','ML','MT','MH','MQ','MR','MU','YT','MX','FM','MD','MC','MN','ME','MS','MA','MZ','MM','NA','NR','NP','NL','NC','NZ','NI','NE','NG','NU','NF','KP','MK','MP','NO','OM','PK','PW','PS','PA','PG','PY','PE','PH','PN','PL','PT','PR','QA','RE','RO','RU','RW','WS','SM','ST','SA','SN','RS','SC','SL','SG','SX','SK','SI','SB','SO','ZA','GS','KR','SS','ES','LK','BL','SH','KN','LC','MF','PM','VC','SD','SR','SJ','SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TK','TO','TT','TN','TR','TM','TC','TV','UM','VI','UG','UA','AE','GB','US','UY','UZ','VU','VA','VE','VN','WF','EH','YE','ZM','ZW']));
grant insert(country_code, document_type) on public.kyc_submissions to authenticated;

update storage.buckets set allowed_mime_types=array['image/jpeg','image/png','application/pdf'], file_size_limit=5242880
where id='kyc-documents';

create or replace function kyc_private.validate_submission() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  countries jsonb := $countries${"AF": "Afghanistan", "AX": "Åland Islands", "AL": "Albania", "DZ": "Algeria", "AS": "American Samoa", "AD": "Andorra", "AO": "Angola", "AI": "Anguilla", "AQ": "Antarctica", "AG": "Antigua & Barbuda", "AR": "Argentina", "AM": "Armenia", "AW": "Aruba", "AU": "Australia", "AT": "Austria", "AZ": "Azerbaijan", "BS": "Bahamas", "BH": "Bahrain", "BD": "Bangladesh", "BB": "Barbados", "BY": "Belarus", "BE": "Belgium", "BZ": "Belize", "BJ": "Benin", "BM": "Bermuda", "BT": "Bhutan", "BO": "Bolivia", "BA": "Bosnia & Herzegovina", "BW": "Botswana", "BV": "Bouvet Island", "BR": "Brazil", "IO": "British Indian Ocean Territory", "VG": "British Virgin Islands", "BN": "Brunei", "BG": "Bulgaria", "BF": "Burkina Faso", "BI": "Burundi", "KH": "Cambodia", "CM": "Cameroon", "CA": "Canada", "CV": "Cape Verde", "BQ": "Caribbean Netherlands", "KY": "Cayman Islands", "CF": "Central African Republic", "TD": "Chad", "CL": "Chile", "CN": "China", "CX": "Christmas Island", "CC": "Cocos (Keeling) Islands", "CO": "Colombia", "KM": "Comoros", "CG": "Congo - Brazzaville", "CD": "Congo - Kinshasa", "CK": "Cook Islands", "CR": "Costa Rica", "CI": "Côte d’Ivoire", "HR": "Croatia", "CU": "Cuba", "CW": "Curaçao", "CY": "Cyprus", "CZ": "Czechia", "DK": "Denmark", "DJ": "Djibouti", "DM": "Dominica", "DO": "Dominican Republic", "EC": "Ecuador", "EG": "Egypt", "SV": "El Salvador", "GQ": "Equatorial Guinea", "ER": "Eritrea", "EE": "Estonia", "SZ": "Eswatini", "ET": "Ethiopia", "FK": "Falkland Islands", "FO": "Faroe Islands", "FJ": "Fiji", "FI": "Finland", "FR": "France", "GF": "French Guiana", "PF": "French Polynesia", "TF": "French Southern Territories", "GA": "Gabon", "GM": "Gambia", "GE": "Georgia", "DE": "Germany", "GH": "Ghana", "GI": "Gibraltar", "GR": "Greece", "GL": "Greenland", "GD": "Grenada", "GP": "Guadeloupe", "GU": "Guam", "GT": "Guatemala", "GG": "Guernsey", "GN": "Guinea", "GW": "Guinea-Bissau", "GY": "Guyana", "HT": "Haiti", "HM": "Heard & McDonald Islands", "HN": "Honduras", "HK": "Hong Kong SAR China", "HU": "Hungary", "IS": "Iceland", "IN": "India", "ID": "Indonesia", "IR": "Iran", "IQ": "Iraq", "IE": "Ireland", "IM": "Isle of Man", "IL": "Israel", "IT": "Italy", "JM": "Jamaica", "JP": "Japan", "JE": "Jersey", "JO": "Jordan", "KZ": "Kazakhstan", "KE": "Kenya", "KI": "Kiribati", "KW": "Kuwait", "KG": "Kyrgyzstan", "LA": "Laos", "LV": "Latvia", "LB": "Lebanon", "LS": "Lesotho", "LR": "Liberia", "LY": "Libya", "LI": "Liechtenstein", "LT": "Lithuania", "LU": "Luxembourg", "MO": "Macao SAR China", "MG": "Madagascar", "MW": "Malawi", "MY": "Malaysia", "MV": "Maldives", "ML": "Mali", "MT": "Malta", "MH": "Marshall Islands", "MQ": "Martinique", "MR": "Mauritania", "MU": "Mauritius", "YT": "Mayotte", "MX": "Mexico", "FM": "Micronesia", "MD": "Moldova", "MC": "Monaco", "MN": "Mongolia", "ME": "Montenegro", "MS": "Montserrat", "MA": "Morocco", "MZ": "Mozambique", "MM": "Myanmar (Burma)", "NA": "Namibia", "NR": "Nauru", "NP": "Nepal", "NL": "Netherlands", "NC": "New Caledonia", "NZ": "New Zealand", "NI": "Nicaragua", "NE": "Niger", "NG": "Nigeria", "NU": "Niue", "NF": "Norfolk Island", "KP": "North Korea", "MK": "North Macedonia", "MP": "Northern Mariana Islands", "NO": "Norway", "OM": "Oman", "PK": "Pakistan", "PW": "Palau", "PS": "Palestinian Territories", "PA": "Panama", "PG": "Papua New Guinea", "PY": "Paraguay", "PE": "Peru", "PH": "Philippines", "PN": "Pitcairn Islands", "PL": "Poland", "PT": "Portugal", "PR": "Puerto Rico", "QA": "Qatar", "RE": "Réunion", "RO": "Romania", "RU": "Russia", "RW": "Rwanda", "WS": "Samoa", "SM": "San Marino", "ST": "São Tomé & Príncipe", "SA": "Saudi Arabia", "SN": "Senegal", "RS": "Serbia", "SC": "Seychelles", "SL": "Sierra Leone", "SG": "Singapore", "SX": "Sint Maarten", "SK": "Slovakia", "SI": "Slovenia", "SB": "Solomon Islands", "SO": "Somalia", "ZA": "South Africa", "GS": "South Georgia & South Sandwich Islands", "KR": "South Korea", "SS": "South Sudan", "ES": "Spain", "LK": "Sri Lanka", "BL": "St. Barthélemy", "SH": "St. Helena", "KN": "St. Kitts & Nevis", "LC": "St. Lucia", "MF": "St. Martin", "PM": "St. Pierre & Miquelon", "VC": "St. Vincent & Grenadines", "SD": "Sudan", "SR": "Suriname", "SJ": "Svalbard & Jan Mayen", "SE": "Sweden", "CH": "Switzerland", "SY": "Syria", "TW": "Taiwan", "TJ": "Tajikistan", "TZ": "Tanzania", "TH": "Thailand", "TL": "Timor-Leste", "TG": "Togo", "TK": "Tokelau", "TO": "Tonga", "TT": "Trinidad & Tobago", "TN": "Tunisia", "TR": "Türkiye", "TM": "Turkmenistan", "TC": "Turks & Caicos Islands", "TV": "Tuvalu", "UM": "U.S. Outlying Islands", "VI": "U.S. Virgin Islands", "UG": "Uganda", "UA": "Ukraine", "AE": "United Arab Emirates", "GB": "United Kingdom", "US": "United States", "UY": "Uruguay", "UZ": "Uzbekistan", "VU": "Vanuatu", "VA": "Vatican City", "VE": "Venezuela", "VN": "Vietnam", "WF": "Wallis & Futuna", "EH": "Western Sahara", "YE": "Yemen", "ZM": "Zambia", "ZW": "Zimbabwe"}$countries$::jsonb;
  required_files text[];
  file_prefix text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if TG_OP = 'INSERT' then
    if new.user_id <> auth.uid() then raise exception 'Owner mismatch'; end if;
    if new.country_code is null or not (countries ? new.country_code) then
      raise exception 'Select a supported issuing country';
    end if;
    -- Use a canonical country label; clients cannot supply a mismatched country name.
    new.country := countries ->> new.country_code;
    file_prefix := new.user_id::text || '/' || new.id::text || '/';
    if new.document_type = 'passport' then
      required_files := array[file_prefix || 'front'];
    elsif new.document_type in ('national_id','driving_license') then
      required_files := array[file_prefix || 'front', file_prefix || 'back'];
    else
      raise exception 'Select a supported document type';
    end if;
    if (select count(*) from storage.objects where bucket_id='kyc-documents' and name=any(required_files)) <> array_length(required_files,1) then
      if new.document_type='passport' then raise exception 'Upload the passport photo/details page before submitting'; end if;
      raise exception 'Both ID photos must be uploaded before submitting';
    end if;
  else
    if not kyc_private.is_reviewer() or old.user_id=auth.uid() or old.status<>'pending' then raise exception 'Review not allowed'; end if;
    new.reviewed_by := auth.uid(); new.reviewed_at := now();
    if new.status='verified' then new.rejection_reason := null; end if;
  end if;
  return new;
end;
$$;
-- Existing submissions remain national IDs, with unchanged private file paths.
-- Legacy country names remain readable; country_code is mandatory for new inserts.


-- Source: 20261006191949_kyc_bank_details.sql
-- Keep historic submissions readable. New submissions require bank details.
alter table public.kyc_submissions
  add column bank_name text,
  add column iban text;
grant insert (bank_name, iban) on public.kyc_submissions to authenticated;

create function kyc_private.validate_bank_details() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  rearranged text;
  digits text;
  character text;
  remainder integer := 0;
  expected_length integer;
begin
  if TG_OP = 'UPDATE' then
    if new.bank_name is distinct from old.bank_name or new.iban is distinct from old.iban then
      raise exception 'Submitted bank details cannot be changed';
    end if;
    return new;
  end if;
  new.bank_name := btrim(new.bank_name);
  new.iban := upper(regexp_replace(new.iban, '[[:space:]]', '', 'g'));
  if new.bank_name is null or length(new.bank_name) not between 2 and 150 then
    raise exception 'Enter your bank name';
  end if;
  if new.iban is null or new.iban !~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$' then
    raise exception 'Enter a valid IBAN';
  end if;
  if new.country_code is null or left(new.iban, 2) <> new.country_code then
    raise exception 'IBAN country must match the selected country';
  end if;
  expected_length := case new.country_code when 'PK' then 24 when 'AE' then 23 when 'SA' then 24 when 'GB' then 22 else null end;
  if expected_length is not null and length(new.iban) <> expected_length then
    raise exception 'Incorrect IBAN length for selected country';
  end if;
  -- Pakistan is format-only by product policy; do not verify bank or checksum.
  if new.country_code = 'PK' then
    if new.iban !~ '^PK[0-9]{2}[A-Z]{4}[A-Z0-9]{16}$' then
      raise exception 'Invalid Pakistan IBAN format';
    end if;
    return new;
  end if;
  rearranged := substr(new.iban, 5) || left(new.iban, 4);
  for i in 1..length(rearranged) loop
    character := substr(rearranged, i, 1);
    digits := case when character ~ '[A-Z]' then (ascii(character) - 55)::text else character end;
    for j in 1..length(digits) loop
      remainder := (remainder * 10 + substr(digits, j, 1)::integer) % 97;
    end loop;
  end loop;
  if remainder <> 1 then raise exception 'Invalid IBAN checksum'; end if;
  return new;
end;
$$;
revoke all on function kyc_private.validate_bank_details() from public;
create trigger kyc_validate_bank before insert or update on public.kyc_submissions
for each row execute function kyc_private.validate_bank_details();


-- Source: 20261016190935_kyc_account_holder_name.sql
-- Historic submissions retain NULL; all new submissions require a bank holder name.
alter table public.kyc_submissions add column account_holder_name text;
grant insert (account_holder_name) on public.kyc_submissions to authenticated;

create function kyc_private.validate_account_holder_name() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if TG_OP = 'UPDATE' then
    if new.account_holder_name is distinct from old.account_holder_name then
      raise exception 'Submitted account holder name cannot be changed';
    end if;
    return new;
  end if;
  if new.account_holder_name is null or new.account_holder_name !~ '[^[:space:]]' then
    raise exception 'Enter the account holder name registered with your bank account';
  end if;
  return new;
end;
$$;
revoke all on function kyc_private.validate_account_holder_name() from public;
create trigger kyc_validate_account_holder before insert or update on public.kyc_submissions
for each row execute function kyc_private.validate_account_holder_name();


-- Source: 20261016195504_kyc_optional_details.sql
-- Nullable additions preserve historical records and allow both sections to be skipped.
-- Existing kyc_read RLS restricts these columns to the owner and KYC reviewers.
alter table public.kyc_submissions
  add column crypto_wallet jsonb,
  add column residential_address jsonb;
grant insert (crypto_wallet, residential_address) on public.kyc_submissions to authenticated;

create function kyc_private.validate_optional_details() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  wallet jsonb := new.crypto_wallet;
  address jsonb := new.residential_address;
  entry record;
  network text;
  currency text;
  wallet_address text;
begin
  if TG_OP = 'UPDATE' then
    if new.crypto_wallet is distinct from old.crypto_wallet or new.residential_address is distinct from old.residential_address then
      raise exception 'Submitted optional details cannot be changed';
    end if;
    return new;
  end if;
  if wallet is not null then
    if jsonb_typeof(wallet) <> 'object' then raise exception 'Invalid crypto wallet'; end if;
    if not (wallet ?& array['cryptocurrency','network','address']) or (wallet - array['cryptocurrency','network','address']) <> '{}'::jsonb then
      raise exception 'Invalid crypto wallet fields';
    end if;
    for entry in select * from jsonb_each(wallet) loop
      if jsonb_typeof(entry.value) <> 'string' then raise exception 'Invalid crypto wallet value'; end if;
    end loop;
    network := wallet->>'network'; currency := wallet->>'cryptocurrency'; wallet_address := wallet->>'address';
    if not ((network = 'bitcoin' and currency = 'BTC') or (network in ('ethereum','bsc') and currency in ('ETH','USDT')) or (network = 'tron' and currency = 'USDT')) then
      raise exception 'Select a compatible cryptocurrency and network';
    end if;
    if not (case network
      when 'bitcoin' then wallet_address ~ '^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[qp][ac-hj-np-z02-9]{38,58}|BC1[QP][AC-HJ-NP-Z02-9]{38,58})$'
      when 'tron' then wallet_address ~ '^T[1-9A-HJ-NP-Za-km-z]{33}$'
      else wallet_address ~ '^0x[0-9a-fA-F]{40}$' end) then
      raise exception 'Invalid wallet address format for selected network';
    end if;
  end if;
  if address is not null then
    if jsonb_typeof(address) <> 'object' then raise exception 'Invalid residential address'; end if;
    if not (address ?& array['line1','city','country']) or (address - array['line1','line2','city','state','postal_code','country']) <> '{}'::jsonb then
      raise exception 'Invalid residential address fields';
    end if;
    for entry in select * from jsonb_each(address) loop
      if jsonb_typeof(entry.value) <> 'string' then raise exception 'Invalid residential address value'; end if;
      if length(address->>entry.key) > (case when entry.key = 'postal_code' then 32 else 200 end) or (address->>entry.key) ~ '[[:cntrl:]]' then
        raise exception 'Invalid residential address value';
      end if;
    end loop;
    if (address->>'line1') !~ '[^[:space:]]' or (address->>'city') !~ '[^[:space:]]' or (address->>'country') !~ '^[A-Z]{2}$' then
      raise exception 'Residential address requires Address Line 1, City and Country';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function kyc_private.validate_optional_details() from public, anon, authenticated;
create trigger kyc_validate_optional before insert or update on public.kyc_submissions
for each row execute function kyc_private.validate_optional_details();

notify pgrst, 'reload schema';
commit;

-- Verify installation:
select column_name, data_type from information_schema.columns
where table_schema='public' and table_name='kyc_submissions' order by ordinal_position;
