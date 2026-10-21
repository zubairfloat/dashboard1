-- Run inside a transaction containing the KYC schema; all synthetic data is rolled back.
insert into auth.users (id) values ('00000000-0000-4000-8000-000000000001'), ('00000000-0000-4000-8000-000000000002'), ('00000000-0000-4000-8000-000000000003');
insert into kyc_private.reviewers values ('00000000-0000-4000-8000-000000000003');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
-- Incomplete submissions must fail.
do $$ begin
  begin
    insert into public.kyc_submissions(id,user_id,full_name,country,country_code,bank_name,iban) values ('10000000-0000-4000-8000-000000000001',auth.uid(),'Test Owner','Pakistan','PK','Test bank','PK36SCBL0000001123456702');
    raise exception 'TEST FAILURE: accepted missing photos';
  exception when raise_exception then
    if sqlerrm <> 'Both ID photos must be uploaded before submitting' then raise; end if;
  end;
end $$;
insert into storage.objects(bucket_id,name) values
('kyc-documents','00000000-0000-4000-8000-000000000001/10000000-0000-4000-8000-000000000001/front'),
('kyc-documents','00000000-0000-4000-8000-000000000001/10000000-0000-4000-8000-000000000001/back');
insert into public.kyc_submissions(id,user_id,full_name,country,country_code,bank_name,iban) values ('10000000-0000-4000-8000-000000000001',auth.uid(),'Test Owner','Pakistan','PK','Test bank','PK36SCBL0000001123456702');
do $$ declare n int; begin
  update public.kyc_submissions set status='verified' where id='10000000-0000-4000-8000-000000000001';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'TEST FAILURE: user self-approved'; end if;
  if not exists(select 1 from public.kyc_submissions where user_id=auth.uid() and status='pending') then raise exception 'TEST FAILURE: owner cannot read'; end if;
  begin
    update public.kyc_submissions set reviewed_by=auth.uid();
    raise exception 'TEST FAILURE: forged reviewer';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.kyc_submissions(id,user_id,full_name,country,country_code,bank_name,iban) values ('10000000-0000-4000-8000-000000000001',auth.uid(),'Test Owner','Pakistan','PK','Test bank','PK36SCBL0000001123456702');
    raise exception 'TEST FAILURE: duplicate submission accepted';
  exception when unique_violation then null; end;
end $$;
-- Another user sees neither submission nor documents and cannot review.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
do $$ begin
  if exists(select 1 from public.kyc_submissions where id='10000000-0000-4000-8000-000000000001') then raise exception 'TEST FAILURE: cross-user data leak'; end if;
  if exists(select 1 from storage.objects where bucket_id='kyc-documents' and name like '00000000-0000-4000-8000-000000000001/%') then raise exception 'TEST FAILURE: cross-user photo leak'; end if;
  if public.is_kyc_reviewer() then raise exception 'TEST FAILURE: regular user is reviewer'; end if;
  begin
    insert into kyc_private.reviewers values(auth.uid());
    raise exception 'TEST FAILURE: reviewer escalation';
  exception when insufficient_privilege then null; end;
end $$;
-- Authorized reviewer can read, must give a rejection reason, and records the decision.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
do $$ begin
  if not public.is_kyc_reviewer() then raise exception 'TEST FAILURE: reviewer denied'; end if;
  if (select count(*) from storage.objects where bucket_id='kyc-documents' and name like '00000000-0000-4000-8000-000000000001/%') <> 2 then raise exception 'TEST FAILURE: reviewer cannot view photos'; end if;
  begin
    update public.kyc_submissions set status='rejected' where id='10000000-0000-4000-8000-000000000001';
    raise exception 'TEST FAILURE: rejected without reason';
  exception when check_violation then null; end;
end $$;
update public.kyc_submissions set status='rejected',rejection_reason='Please upload a clearer photo.' where id='10000000-0000-4000-8000-000000000001';
do $$ begin
  if not exists(select 1 from public.kyc_submissions where id='10000000-0000-4000-8000-000000000001' and reviewed_by=auth.uid() and reviewed_at is not null and status='rejected') then raise exception 'TEST FAILURE: missing review audit'; end if;
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
insert into storage.objects(bucket_id,name) values
('kyc-documents','00000000-0000-4000-8000-000000000001/10000000-0000-4000-8000-000000000002/front'),
('kyc-documents','00000000-0000-4000-8000-000000000001/10000000-0000-4000-8000-000000000002/back');
insert into public.kyc_submissions(id,user_id,full_name,country,country_code,bank_name,iban) values ('10000000-0000-4000-8000-000000000002',auth.uid(),'Test Owner','Pakistan','PK','Test bank','PK36SCBL0000001123456702');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
update public.kyc_submissions set status='verified' where id='10000000-0000-4000-8000-000000000002';
do $$ declare n int; begin
  if not exists(select 1 from public.kyc_submissions where id='10000000-0000-4000-8000-000000000002' and status='verified') then raise exception 'TEST FAILURE: approval failed'; end if;
  update public.kyc_submissions set status='rejected',rejection_reason='Stale review' where id='10000000-0000-4000-8000-000000000002';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'TEST FAILURE: stale review overwrote decision'; end if;
end $$;
reset role;
