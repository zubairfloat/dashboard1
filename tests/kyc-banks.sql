-- Run in a transaction and roll back. Uses no real users, documents, or emails.
create temporary table kyc_bank_test (bank_name text, iban text, country_code text);
create trigger test_bank before insert or update on kyc_bank_test
for each row execute function kyc_private.validate_bank_details();
do $$
begin
  insert into kyc_bank_test values ('  NatWest  ', 'gb82 west 1234 5698 7654 32', 'GB');
  if not exists (select 1 from kyc_bank_test where bank_name='NatWest' and iban='GB82WEST12345698765432') then
    raise exception 'Normalization failed';
  end if;
  begin
    insert into kyc_bank_test values ('NatWest', 'GB83WEST12345698765432', 'GB');
    raise exception 'TEST FAILED: invalid checksum accepted';
  exception when raise_exception then
    if SQLERRM <> 'Invalid IBAN checksum' then raise; end if;
  end;
  begin
    insert into kyc_bank_test values ('NatWest', 'GB82WEST12345698765432', 'PK');
    raise exception 'TEST FAILED: country mismatch accepted';
  exception when raise_exception then
    if SQLERRM <> 'IBAN country must match the selected country' then raise; end if;
  end;
  begin
    insert into kyc_bank_test values (null, null, 'GB');
    raise exception 'TEST FAILED: missing bank accepted';
  exception when raise_exception then
    if SQLERRM <> 'Enter your bank name' then raise; end if;
  end;
  begin
    update kyc_bank_test set bank_name='Changed bank';
    raise exception 'TEST FAILED: bank mutation accepted';
  exception when raise_exception then
    if SQLERRM <> 'Submitted bank details cannot be changed' then raise; end if;
  end;
  insert into kyc_bank_test values
    ('Meezan Bank', 'PK10MEZN0001011234567890', 'PK'),
    ('United Bank Limited (UBL)', 'PK16UNIL0112094910113152', 'PK');
  begin
    insert into kyc_bank_test values ('Meezan Bank', 'PK10M3ZN0001011234567890', 'PK');
    raise exception 'TEST FAILED: malformed Pakistan bank code accepted';
  exception when raise_exception then
    if SQLERRM <> 'Invalid Pakistan IBAN format' then raise; end if;
  end;
  update kyc_bank_test set country_code=country_code;
  if not has_column_privilege('authenticated', 'public.kyc_submissions', 'iban', 'INSERT')
    or has_column_privilege('authenticated', 'public.kyc_submissions', 'iban', 'UPDATE') then
    raise exception 'Incorrect IBAN privileges';
  end if;
end;
$$;
-- Historic submissions have no bank details and must remain reviewable.
alter table kyc_bank_test disable trigger test_bank;
insert into kyc_bank_test values (null, null, null);
alter table kyc_bank_test enable trigger test_bank;
update kyc_bank_test set country_code=country_code where bank_name is null;
