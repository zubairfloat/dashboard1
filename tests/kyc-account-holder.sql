-- Run after the account-holder migration. No real users or submissions are touched.
begin;
create temporary table kyc_holder_test (account_holder_name text, status text);
-- Simulate a historic row before attaching the trigger.
insert into kyc_holder_test values (null, 'pending');
create trigger test_holder before insert or update on kyc_holder_test
for each row execute function kyc_private.validate_account_holder_name();
do $$
declare invalid_name text;
begin
  update kyc_holder_test set status = 'verified';
  foreach invalid_name in array array[null, '', ' ', E'\t\n'] loop
    begin
      insert into kyc_holder_test values (invalid_name, 'pending');
      raise exception 'TEST FAILED: blank holder accepted';
    exception when raise_exception then
      if SQLERRM <> 'Enter the account holder name registered with your bank account' then raise; end if;
    end;
  end loop;
  insert into kyc_holder_test values ('محمد علی', 'pending'), ('Anne-Marie O''Neill', 'pending');
  update kyc_holder_test set status = 'verified';
  begin
    update kyc_holder_test set account_holder_name = 'Changed';
    raise exception 'TEST FAILED: holder mutation accepted';
  exception when raise_exception then
    if SQLERRM <> 'Submitted account holder name cannot be changed' then raise; end if;
  end;
  if not has_column_privilege('authenticated', 'public.kyc_submissions', 'account_holder_name', 'INSERT')
    or has_column_privilege('authenticated', 'public.kyc_submissions', 'account_holder_name', 'UPDATE') then
    raise exception 'TEST FAILED: unexpected holder column permissions';
  end if;
end;
$$;
rollback;
