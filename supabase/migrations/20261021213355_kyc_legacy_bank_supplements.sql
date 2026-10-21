-- Requires all previous KYC migrations. Approved identity records remain immutable.
create table public.kyc_bank_supplements (
  submission_id uuid primary key references public.kyc_submissions(id) on delete cascade,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  bank_name text not null,
  iban text not null,
  account_holder_name text not null,
  crypto_wallet jsonb,
  residential_address jsonb,
  created_at timestamptz not null default now(),
  consent_at timestamptz not null default now()
);
alter table public.kyc_bank_supplements enable row level security;
revoke all on public.kyc_bank_supplements from public, anon, authenticated;
grant select on public.kyc_bank_supplements to authenticated;
grant insert (submission_id, country_code, bank_name, iban, account_holder_name, crypto_wallet, residential_address)
  on public.kyc_bank_supplements to authenticated;

create policy kyc_supplement_read on public.kyc_bank_supplements for select to authenticated using (
  exists (select 1 from public.kyc_submissions s where s.id=submission_id
    and (s.user_id=(select auth.uid()) or (select kyc_private.is_reviewer())))
);
create policy kyc_supplement_insert on public.kyc_bank_supplements for insert to authenticated with check (
  exists (select 1 from public.kyc_submissions s where s.id=submission_id
    and s.user_id=(select auth.uid()) and s.status='verified'
    and (coalesce(btrim(s.bank_name),'')='' or coalesce(btrim(s.iban),'')='' or coalesce(btrim(s.account_holder_name),'')=''))
);
-- Reuse exactly the same bank, holder and optional-field validation as new KYC.
create trigger kyc_supplement_bank before insert on public.kyc_bank_supplements
for each row execute function kyc_private.validate_bank_details();
create trigger kyc_supplement_holder before insert on public.kyc_bank_supplements
for each row execute function kyc_private.validate_account_holder_name();
create trigger kyc_supplement_optional before insert on public.kyc_bank_supplements
for each row execute function kyc_private.validate_optional_details();
-- No UPDATE/DELETE grants or policies: a supplement can only be supplied once.
notify pgrst, 'reload schema';
