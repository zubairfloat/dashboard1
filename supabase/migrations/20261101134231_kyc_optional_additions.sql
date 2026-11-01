-- One immutable row per optional section, added after required KYC is complete.
create table public.kyc_optional_additions (
  submission_id uuid not null references public.kyc_submissions(id) on delete cascade,
  section text not null check (section in ('crypto', 'address')),
  crypto_wallet jsonb,
  residential_address jsonb,
  created_at timestamptz not null default now(),
  primary key (submission_id, section),
  check ((section = 'crypto' and crypto_wallet is not null and residential_address is null)
      or (section = 'address' and residential_address is not null and crypto_wallet is null))
);
alter table public.kyc_optional_additions enable row level security;
revoke all on public.kyc_optional_additions from public, anon, authenticated;
grant select on public.kyc_optional_additions to authenticated;
grant insert (submission_id, section, crypto_wallet, residential_address)
  on public.kyc_optional_additions to authenticated;
create policy kyc_optional_read on public.kyc_optional_additions for select to authenticated using (
  exists (select 1 from public.kyc_submissions s where s.id = submission_id
    and (s.user_id = (select auth.uid()) or (select kyc_private.is_reviewer())))
);
create policy kyc_optional_add on public.kyc_optional_additions for insert to authenticated with check (
  exists (select 1 from public.kyc_submissions s
    left join public.kyc_bank_supplements b on b.submission_id = s.id
    where s.id = kyc_optional_additions.submission_id
    and s.user_id = (select auth.uid()) and s.status = 'verified'
    and coalesce(btrim(coalesce(b.bank_name, s.bank_name)), '') <> ''
    and coalesce(btrim(coalesce(b.iban, s.iban)), '') <> ''
    and coalesce(btrim(coalesce(b.account_holder_name, s.account_holder_name)), '') <> ''
    and case kyc_optional_additions.section
      when 'crypto' then s.crypto_wallet is null and b.crypto_wallet is null
      when 'address' then s.residential_address is null and b.residential_address is null
      else false end)
);
create trigger kyc_optional_validate before insert on public.kyc_optional_additions
for each row execute function kyc_private.validate_optional_details();
-- No UPDATE/DELETE permissions: the primary key also prevents concurrent duplicate saves.
notify pgrst, 'reload schema';
