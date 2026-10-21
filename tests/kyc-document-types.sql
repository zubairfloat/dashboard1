-- Run after kyc-rls.sql inside a transaction, then ROLLBACK.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
insert into storage.objects(bucket_id,name) values
('kyc-documents','00000000-0000-4000-8000-000000000002/20000000-0000-4000-8000-000000000001/front');
do $$ declare kind text; code text; begin
  foreach code in array array[null::text,'XX'] loop
    begin
      insert into public.kyc_submissions(id,user_id,full_name,country,country_code,document_type,bank_name,iban)
      values('20000000-0000-4000-8000-000000000001',auth.uid(),'Test Passport','Incorrect',code,'passport','Test bank','PK36SCBL0000001123456702');
      raise exception 'TEST FAILURE: invalid country accepted';
    exception when raise_exception then
      if sqlerrm <> 'Select a supported issuing country' then raise; end if;
    end;
  end loop;
  foreach kind in array array['national_id','driving_license'] loop
    begin
      insert into public.kyc_submissions(id,user_id,full_name,country,country_code,document_type,bank_name,iban)
      values('20000000-0000-4000-8000-000000000001',auth.uid(),'Test Card','Pakistan','PK',kind,'Test bank','PK36SCBL0000001123456702');
      raise exception 'TEST FAILURE: card accepted without back';
    exception when raise_exception then
      if sqlerrm <> 'Both ID photos must be uploaded before submitting' then raise; end if;
    end;
  end loop;
end $$;
insert into public.kyc_submissions(id,user_id,full_name,country,country_code,document_type,bank_name,iban)
values('20000000-0000-4000-8000-000000000001',auth.uid(),'Test Passport','Incorrect','PK','passport','Test bank','PK36SCBL0000001123456702');
do $$ begin
  if not exists(select 1 from public.kyc_submissions where id='20000000-0000-4000-8000-000000000001' and country='Pakistan' and document_type='passport') then
    raise exception 'TEST FAILURE: passport or canonical country missing';
  end if;
  begin
    update public.kyc_submissions set document_type='national_id' where id='20000000-0000-4000-8000-000000000001';
    raise exception 'TEST FAILURE: document type mutable';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
  if not exists(select 1 from storage.buckets where id='kyc-documents' and not public and file_size_limit=5242880 and 'application/pdf'=any(allowed_mime_types)) then
    raise exception 'TEST FAILURE: bucket configuration incorrect';
  end if;
end $$;
