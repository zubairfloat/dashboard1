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
