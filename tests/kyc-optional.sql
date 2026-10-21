-- Run after the migration; uses only a temporary table and rolls everything back.
begin;
create temporary table optional_test (crypto_wallet jsonb, residential_address jsonb, status text);
create trigger optional_validation before insert or update on optional_test
for each row execute function kyc_private.validate_optional_details();
do $$
declare bad jsonb;
begin
  insert into optional_test values (null, null, 'pending');
  insert into optional_test values ('{"cryptocurrency":"ETH","network":"ethereum","address":"0x1111111111111111111111111111111111111111"}', '{"line1":"1 Main St","city":"Lahore","country":"PK"}', 'pending');
  update optional_test set status = 'verified';
  foreach bad in array array['{}'::jsonb, 'null'::jsonb, '[]'::jsonb,
    '{"cryptocurrency":"BTC","network":"ethereum","address":"0x1111111111111111111111111111111111111111"}'::jsonb,
    '{"cryptocurrency":"USDT","network":"tron","address":"bad"}'::jsonb,
    '{"cryptocurrency":null,"network":"ethereum","address":"0x1111111111111111111111111111111111111111"}'::jsonb] loop
    begin
      insert into optional_test values (bad, null, 'pending');
      raise exception 'TEST FAILED: invalid crypto accepted';
    exception when raise_exception then
      if SQLERRM like 'TEST FAILED:%' then raise; end if;
    end;
  end loop;
  foreach bad in array array['{}'::jsonb, 'null'::jsonb, '[]'::jsonb,
    '{"line1":" ","city":"Lahore","country":"PK"}'::jsonb,
    '{"line1":"1 Main St","city":null,"country":"PK"}'::jsonb,
    '{"line1":"1 Main St","city":"Lahore","country":"Pakistan"}'::jsonb] loop
    begin
      insert into optional_test values (null, bad, 'pending');
      raise exception 'TEST FAILED: invalid address accepted';
    exception when raise_exception then
      if SQLERRM like 'TEST FAILED:%' then raise; end if;
    end;
  end loop;
  begin
    update optional_test set crypto_wallet = null where crypto_wallet is not null;
    raise exception 'TEST FAILED: optional data mutation accepted';
  exception when raise_exception then
    if SQLERRM <> 'Submitted optional details cannot be changed' then raise; end if;
  end;
  if not has_column_privilege('authenticated', 'public.kyc_submissions', 'crypto_wallet', 'INSERT')
    or has_column_privilege('authenticated', 'public.kyc_submissions', 'crypto_wallet', 'UPDATE')
    or has_column_privilege('anon', 'public.kyc_submissions', 'residential_address', 'SELECT') then
    raise exception 'TEST FAILED: optional column permissions';
  end if;
end;
$$;
rollback;
