-- Isolated test database only. Fixtures bypass triggers; all changes roll back.
begin;
set local session_replication_role = replica;
insert into auth.users(id,email) select ('10000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid, 'optional' || n || '@test.invalid' from generate_series(1,6) n;
insert into public.kyc_submissions(id,user_id,full_name,country,status,bank_name,iban,account_holder_name)
select id,id,'Test User','Pakistan',case when email='optional4@test.invalid' then 'pending' else 'verified' end,
case when email in ('optional3@test.invalid','optional6@test.invalid') then null else 'Bank' end,
case when email in ('optional3@test.invalid','optional6@test.invalid') then null else 'PK36SCBL0000001123456702' end,
case when email in ('optional3@test.invalid','optional6@test.invalid') then null else 'Test User' end from auth.users where email like 'optional%@test.invalid';
update public.kyc_submissions set crypto_wallet='{"cryptocurrency":"USDT","network":"ethereum","address":"0x1111111111111111111111111111111111111111"}' where id='10000000-0000-4000-8000-000000000002';
insert into public.kyc_bank_supplements(submission_id,country_code,bank_name,iban,account_holder_name,residential_address) values
('10000000-0000-4000-8000-000000000006','PK','Bank','PK36SCBL0000001123456702','Test User','{"line1":"Old Street","city":"Lahore","country":"PK"}');
insert into kyc_private.reviewers values ('10000000-0000-4000-8000-000000000005');
set local session_replication_role = origin;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
do $$ begin begin insert into public.kyc_optional_additions(submission_id,section,crypto_wallet) values ('10000000-0000-4000-8000-000000000001','crypto','{"cryptocurrency":"USDT","network":"ethereum","address":"bad"}'); raise exception 'TEST FAILED: operation accepted'; exception when raise_exception then if SQLERRM like 'TEST FAILED:%%' then raise; end if; end; end $$;
insert into public.kyc_optional_additions(submission_id,section,crypto_wallet) values ('10000000-0000-4000-8000-000000000001','crypto','{"cryptocurrency":"USDT","network":"ethereum","address":"0x1111111111111111111111111111111111111111"}');
insert into public.kyc_optional_additions(submission_id,section,residential_address) values ('10000000-0000-4000-8000-000000000001','address','{"line1":"Main Street","city":"Lahore","country":"PK"}');
do $$ begin begin insert into public.kyc_optional_additions(submission_id,section,crypto_wallet) values ('10000000-0000-4000-8000-000000000001','crypto','{"cryptocurrency":"USDT","network":"ethereum","address":"0x1111111111111111111111111111111111111111"}'); raise exception 'TEST FAILED: operation accepted'; exception when unique_violation then null; end; end $$;
do $$ begin begin update public.kyc_optional_additions set crypto_wallet=null; raise exception 'TEST FAILED: operation accepted'; exception when insufficient_privilege then null; end; end $$;
do $$ begin begin delete from public.kyc_optional_additions; raise exception 'TEST FAILED: operation accepted'; exception when insufficient_privilege then null; end; end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
do $$ begin begin insert into public.kyc_optional_additions(submission_id,section,crypto_wallet) values ('10000000-0000-4000-8000-000000000002','crypto','{"cryptocurrency":"USDT","network":"ethereum","address":"0x1111111111111111111111111111111111111111"}'); raise exception 'TEST FAILED: operation accepted'; exception when insufficient_privilege then null; end; end $$;
do $$ begin begin insert into public.kyc_optional_additions(submission_id,section,residential_address) values ('10000000-0000-4000-8000-000000000001','address','{"line1":"Main Street","city":"Lahore","country":"PK"}'); raise exception 'TEST FAILED: operation accepted'; exception when insufficient_privilege then null; end; end $$;
do $$ begin if exists(select 1 from public.kyc_optional_additions) then raise exception 'Cross-user read'; end if; end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
do $$ begin begin insert into public.kyc_optional_additions(submission_id,section,crypto_wallet) values ('10000000-0000-4000-8000-000000000003','crypto','{"cryptocurrency":"USDT","network":"ethereum","address":"0x1111111111111111111111111111111111111111"}'); raise exception 'TEST FAILED: operation accepted'; exception when insufficient_privilege then null; end; end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
do $$ begin begin insert into public.kyc_optional_additions(submission_id,section,crypto_wallet) values ('10000000-0000-4000-8000-000000000004','crypto','{"cryptocurrency":"USDT","network":"ethereum","address":"0x1111111111111111111111111111111111111111"}'); raise exception 'TEST FAILED: operation accepted'; exception when insufficient_privilege then null; end; end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000006',true);
do $$ begin begin insert into public.kyc_optional_additions(submission_id,section,residential_address) values ('10000000-0000-4000-8000-000000000006','address','{"line1":"Main Street","city":"Lahore","country":"PK"}'); raise exception 'TEST FAILED: operation accepted'; exception when insufficient_privilege then null; end; end $$;
insert into public.kyc_optional_additions(submission_id,section,crypto_wallet) values ('10000000-0000-4000-8000-000000000006','crypto','{"cryptocurrency":"USDT","network":"ethereum","address":"0x1111111111111111111111111111111111111111"}');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',true);
do $$ begin if (select count(*) from public.kyc_optional_additions) <> 3 then raise exception 'Reviewer read failed'; end if; end $$;
reset role; set local role anon;
do $$ begin begin select * from public.kyc_optional_additions; raise exception 'TEST FAILED: operation accepted'; exception when insufficient_privilege then null; end; end $$;
reset role;
do $$ begin if exists(select 1 from public.kyc_submissions where id='10000000-0000-4000-8000-000000000001' and (status <> 'verified' or crypto_wallet is not null or residential_address is not null)) then raise exception 'Original identity changed'; end if; end $$;
rollback;
