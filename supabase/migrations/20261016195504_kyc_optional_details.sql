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
