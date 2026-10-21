-- Isolated test database only: synthetic legacy rows intentionally bypass insert triggers.
begin;
set local session_replication_role = replica;
insert into auth.users(id,email) values
 ('20000000-0000-4000-8000-000000000001','legacy@test.invalid'),
 ('20000000-0000-4000-8000-000000000002','other@test.invalid'),
 ('20000000-0000-4000-8000-000000000003','pending@test.invalid'),
 ('20000000-0000-4000-8000-000000000004','complete@test.invalid'),
 ('20000000-0000-4000-8000-000000000005','reviewer@test.invalid');
insert into public.kyc_submissions(id,user_id,full_name,country,status,reviewed_at) values
 ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Legacy User','United Kingdom','verified','2026-01-01'),
 ('30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000003','Pending User','Pakistan','pending',null),
 ('30000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000004','Complete User','Pakistan','verified','2026-01-01');
update public.kyc_submissions set bank_name='Bank',iban='PK36SCBL0000001123456702',account_holder_name='Complete User' where id='30000000-0000-4000-8000-000000000004';
insert into kyc_private.reviewers values ('20000000-0000-4000-8000-000000000005');
set local session_replication_role = origin;
set local role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
do $$ begin
  begin
    insert into public.kyc_bank_supplements(submission_id,country_code,bank_name,iban,account_holder_name) values ('30000000-0000-4000-8000-000000000001','PK','Bank','bad','Owner');
    raise exception 'TEST FAILED: invalid bank accepted';
  exception when raise_exception then if SQLERRM like 'TEST FAILED:%' then raise; end if; end;
end $$;
insert into public.kyc_bank_supplements(submission_id,country_code,bank_name,iban,account_holder_name)
values ('30000000-0000-4000-8000-000000000001','PK','Bank','PK36SCBL0000001123456702','Legacy User');
do $$ begin
  if not exists(select 1 from public.kyc_submissions where id='30000000-0000-4000-8000-000000000001' and status='verified' and country='United Kingdom' and country_code is null and bank_name is null and reviewed_at='2026-01-01') then raise exception 'TEST FAILED: identity changed'; end if;
  begin
    insert into public.kyc_bank_supplements(submission_id,country_code,bank_name,iban,account_holder_name) values ('30000000-0000-4000-8000-000000000001','PK','Bank','PK36SCBL0000001123456702','Owner');
    raise exception 'TEST FAILED: duplicate accepted';
  exception when unique_violation then null; end;
  begin
    update public.kyc_bank_supplements set account_holder_name='Changed';
    raise exception 'TEST FAILED: update allowed';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
do $$ begin
 if exists(select 1 from public.kyc_bank_supplements) then raise exception 'TEST FAILED: cross-user read'; end if;
 begin
  insert into public.kyc_bank_supplements(submission_id,country_code,bank_name,iban,account_holder_name) values ('30000000-0000-4000-8000-000000000001','PK','Bank','PK36SCBL0000001123456702','Other');
  raise exception 'TEST FAILED: cross-user insert';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000003',true);
do $$ begin
 begin
  insert into public.kyc_bank_supplements(submission_id,country_code,bank_name,iban,account_holder_name) values ('30000000-0000-4000-8000-000000000003','PK','Bank','PK36SCBL0000001123456702','Pending');
  raise exception 'TEST FAILED: pending user accepted';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000004',true);
do $$ begin
 begin
  insert into public.kyc_bank_supplements(submission_id,country_code,bank_name,iban,account_holder_name) values ('30000000-0000-4000-8000-000000000004','PK','Bank','PK36SCBL0000001123456702','Complete');
  raise exception 'TEST FAILED: complete user accepted';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000005',true);
do $$ begin
 if (select count(*) from public.kyc_bank_supplements) <> 1 then raise exception 'TEST FAILED: reviewer cannot read'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
 begin
  perform * from public.kyc_bank_supplements;
  raise exception 'TEST FAILED: anonymous access';
 exception when insufficient_privilege then null; end;
end $$;
rollback;
