-- Manual ID verification. Apply once to the project's Supabase database.
create schema if not exists kyc_private;
revoke all on schema kyc_private from public, anon;
grant usage on schema kyc_private to authenticated;
create table kyc_private.reviewers (user_id uuid primary key references auth.users(id) on delete cascade);
alter table kyc_private.reviewers enable row level security;
revoke all on kyc_private.reviewers from public, anon, authenticated;
-- Snapshot existing administrators; future profile flag changes cannot grant ID access.
insert into kyc_private.reviewers select id from public.profiles where is_admin = true and not coalesce(is_deleted, false);
create function kyc_private.is_reviewer() returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (select 1 from kyc_private.reviewers where user_id = auth.uid());
$$;
revoke all on function kyc_private.is_reviewer() from public, anon;
grant execute on function kyc_private.is_reviewer() to authenticated;
create function public.is_kyc_reviewer() returns boolean language sql stable security invoker set search_path = '' as $$ select kyc_private.is_reviewer(); $$;
revoke all on function public.is_kyc_reviewer() from public, anon;
grant execute on function public.is_kyc_reviewer() to authenticated;

create table public.kyc_submissions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 150),
  country text not null check (char_length(trim(country)) between 2 and 80),
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  consent_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  check ((status = 'rejected' and rejection_reason is not null and char_length(trim(rejection_reason)) between 3 and 1000) or (status <> 'rejected' and rejection_reason is null))
);
create unique index kyc_one_active on public.kyc_submissions(user_id) where status in ('pending','verified');
create index kyc_user_history on public.kyc_submissions(user_id, created_at desc);
create index kyc_review_queue on public.kyc_submissions(status, created_at);
create index kyc_reviewer_history on public.kyc_submissions(reviewed_by);
alter table public.kyc_submissions enable row level security;
revoke all on public.kyc_submissions from public, anon, authenticated;
grant select on public.kyc_submissions to authenticated;
grant insert (id, user_id, full_name, country) on public.kyc_submissions to authenticated;
grant update (status, rejection_reason) on public.kyc_submissions to authenticated;
create policy kyc_read on public.kyc_submissions for select to authenticated using (user_id = (select auth.uid()) or (select kyc_private.is_reviewer()));
create policy kyc_submit on public.kyc_submissions for insert to authenticated with check (user_id = (select auth.uid()) and status = 'pending' and reviewed_at is null and reviewed_by is null);
create policy kyc_review on public.kyc_submissions for update to authenticated using ((select kyc_private.is_reviewer()) and user_id <> (select auth.uid()) and status = 'pending') with check ((select kyc_private.is_reviewer()) and user_id <> (select auth.uid()) and status in ('verified','rejected'));

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types) values ('kyc-documents', 'kyc-documents', false, 5242880, array['image/jpeg','image/png']);
create policy kyc_photo_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/(front|back)$'
  and not exists (select 1 from public.kyc_submissions s where s.user_id = (select auth.uid()) and s.status in ('pending','verified'))
);
create policy kyc_photo_read on storage.objects for select to authenticated using (
  bucket_id = 'kyc-documents' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select kyc_private.is_reviewer()))
);
-- No client UPDATE or DELETE: reviewed documents cannot be replaced after submission.
create function kyc_private.validate_submission() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if TG_OP = 'INSERT' then
    if new.user_id <> auth.uid() then raise exception 'Owner mismatch'; end if;
    if (select count(*) from storage.objects where bucket_id = 'kyc-documents' and name in (new.user_id::text || '/' || new.id::text || '/front', new.user_id::text || '/' || new.id::text || '/back')) <> 2 then
      raise exception 'Both ID photos must be uploaded before submitting';
    end if;
  else
    if not kyc_private.is_reviewer() or old.user_id = auth.uid() or old.status <> 'pending' then raise exception 'Review not allowed'; end if;
    new.reviewed_by := auth.uid(); new.reviewed_at := now();
    if new.status = 'verified' then new.rejection_reason := null; end if;
  end if;
  return new;
end;
$$;
revoke all on function kyc_private.validate_submission() from public, anon, authenticated;
create trigger kyc_validate before insert or update on public.kyc_submissions for each row execute function kyc_private.validate_submission();
