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
      join public.profiles p on p.id=r.user_id
      where p.is_admin=true and not coalesce(p.is_deleted,false) and u.email is not null;
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
