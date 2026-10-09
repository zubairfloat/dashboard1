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
