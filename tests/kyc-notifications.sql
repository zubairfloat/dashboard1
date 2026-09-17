-- Run after the migration and tests/kyc-rls.sql in a transaction, then ROLLBACK.
insert into kyc_private.notification_config(id,secret_hash) values(true,encode(sha256(convert_to('test-only-secret','UTF8')),'hex'))
  on conflict(id) do update set secret_hash=excluded.secret_hash;
-- Populate email destinations only for synthetic test reviewers.
update auth.users set email='kyc-reviewer@example.invalid' where id='00000000-0000-4000-8000-000000000003';
update public.profiles set is_admin=true where id='00000000-0000-4000-8000-000000000003';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
do $$ declare job jsonb; result jsonb; begin
  begin
    perform public.kyc_email_job('wrong-secret','10000000-0000-4000-8000-000000000002');
    raise exception 'TEST FAILURE: browser can claim email jobs';
  exception when insufficient_privilege then null; end;
  begin
    perform public.kyc_email_job('test-only-secret');
    raise exception 'TEST FAILURE: non-reviewer can drain email queue';
  exception when insufficient_privilege then null; end;
  job := public.kyc_email_job('test-only-secret','10000000-0000-4000-8000-000000000002');
  if job->>'state' <> 'claimed' then raise exception 'TEST FAILURE: notification not queued with submission'; end if;
  if jsonb_array_length(job->'payload'->'recipients') < 1 then raise exception 'TEST FAILURE: no admin recipients'; end if;
  result := public.kyc_email_job('test-only-secret','10000000-0000-4000-8000-000000000002');
  if result->>'state' <> 'deferred' then raise exception 'TEST FAILURE: concurrent duplicate delivery'; end if;
  perform public.kyc_email_job('test-only-secret','10000000-0000-4000-8000-000000000002',(job->>'lease')::uuid,'test-provider-id',true);
  result := public.kyc_email_job('test-only-secret','10000000-0000-4000-8000-000000000002');
  if result->>'state' <> 'sent' then raise exception 'TEST FAILURE: successful notification can be sent twice'; end if;
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
do $$ begin
  begin
    perform public.kyc_email_job('test-only-secret','10000000-0000-4000-8000-000000000001');
    raise exception 'TEST FAILURE: cross-user notification access';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
do $$ declare job jsonb; result jsonb; begin
  job := public.kyc_email_job('test-only-secret','10000000-0000-4000-8000-000000000001');
  if job->>'state'<>'claimed' then raise exception 'TEST FAILURE: admin cannot retry notification'; end if;
  result := public.kyc_email_job('test-only-secret','10000000-0000-4000-8000-000000000001',(job->>'lease')::uuid,null,true);
  if result->>'state'<>'retry' then raise exception 'TEST FAILURE: provider failure cannot retry'; end if;
end $$;
reset role;
do $$ begin
  if not exists(select 1 from kyc_private.email_jobs where submission_id='10000000-0000-4000-8000-000000000001' and sent_at is null and lease is null and next_attempt_at>now()) then raise exception 'TEST FAILURE: failed delivery lost'; end if;
end $$;
