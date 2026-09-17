# Manual identity verification

## Using the feature

- Users: open **KYC Verification** in the sidebar or profile. Select the issuing country, then National ID Card, Passport or Driving License. Enter the name on the document. Passports require the photo/details page; IDs and driving licenses require front and back. Upload JPG, JPEG, PNG or PDF files (maximum 5 MB each), accept the review consent and submit.
- Reviewers: **Admin Panel → Review KYC submissions**. Open all required documents, review the selected country and document type, then approve or reject with feedback. Images preview inline; PDFs download privately for review. Approved IDs do not automatically approve the general account.
- Rejected users can submit new photos. Each attempt keeps its own immutable record, reviewer ID and review timestamp.

## Database and security

Migration: `supabase/migrations/20260915180025_manual_kyc.sql`. Applied to the configured SaaS Dashboard Supabase project.

`kyc_submissions` has row-level security. Users can insert pending submissions and read only their own history. Only authorized reviewers can change pending decisions, and reviewers cannot review their own IDs. Decisions cannot be overwritten. The database validates the country and document type and checks that all required files exist before accepting a submission.

Photos use the private `kyc-documents` bucket. Uploads enforce 5 MB and JPEG/PNG/PDF MIME limits. The UI also checks file signatures. Users cannot replace or delete uploaded photos. Admin viewing uses authenticated downloads and temporary browser blob URLs, released when hidden or unmounted. No service-role key or paid verification provider is needed.

Reviewer access uses `kyc_private.reviewers`, initially seeded with the two existing active administrator accounts. This is intentionally independent of the existing writable `profiles.is_admin` flag. Only a trusted database operator can add/remove reviewers:

```sql
insert into kyc_private.reviewers(user_id) values ('REVIEWER_AUTH_USER_UUID');
delete from kyc_private.reviewers where user_id = 'REVIEWER_AUTH_USER_UUID';
```

Removing the reviewer entry revokes future document downloads and decisions; photos already downloaded cannot be recalled. Changing `profiles.is_admin` alone does not change KYC permissions.

## Operational details

- This is human document review, with no automatic authenticity or face/liveness check.
- Decide and publish a document retention period. A trusted operator must process deletion requests through the Supabase Storage API/dashboard. Do not delete storage metadata directly with SQL.
- Interrupted uploads may leave private unsubmitted files. Periodically remove files with no matching submission after a grace period (for example 24 hours), using the Storage API. No automatic cleanup job is configured.
- Bucket MIME validation is not an antivirus/content-authenticity check. Review documents carefully; don't treat a file extension or a submitted name as proof of identity.
- KYC is informational: feature access still follows existing account approval rules.
- Existing profile policies allow broad profile updates; the KYC reviewer list avoids depending on that flag, but the broader profile permission issue remains outside this change.

## Verification

`tests/kyc-rls.sql` uses synthetic users and must run inside a transaction followed by ROLLBACK. It verifies missing-photo rejection, ownership isolation, blocked self-approval and privilege escalation, required rejection reasons, reviewer audit data, resubmission, approval, and protection against stale review overwrites. These checks were run against the configured database without retaining synthetic data.

## Persistent notices and admin email

- All user dashboard pages show the requested non-dismissible pending notice until approval. Submitted users also see that their documents are under review and no further upload is needed. Rejected users see feedback and a correction/resubmission link.
- Status, the review list and the dashboard summary refresh every 15 seconds while visible and on window focus. Successful submissions also trigger an immediate notice refresh.
- The Admin Dashboard has a KYC Verification section showing the pending count and oldest five requests. Each link opens that specific request, including links from emails.
- Each successful submission atomically creates a private email job. Submission and email delivery are separate: provider failures never discard the request.
- The authenticated `/api/kyc/notify` endpoint sends via the existing Resend account. Destinations come from current active admin profiles that are also authorized KYC reviewers; their Auth email addresses are used. Browser-supplied recipients are ignored. Later, remove other reviewer entries and keep the designated person's entry to narrow recipients and review access.
- New submissions attempt delivery immediately. Visible dashboards retry once a minute: users retry their own pending request and authorized admins process the oldest queued job. Jobs persist when all dashboards close; retry processing resumes when a relevant dashboard opens. There is no independent background scheduler yet.
- Successful sends are recorded permanently. Concurrent sends use a two-minute lease and a stable Resend idempotency key. Ambiguous jobs stop automatic retry after 23 hours from the first attempt, inside Resend's 24-hour deduplication window. An operator should reconcile these against provider logs before resetting them.
- Photos are never attached to email. Admins must sign in to open the private request.

### Email configuration

The notification migration is `supabase/migrations/20260915182453_kyc_notifications.sql` and has been applied to the configured Supabase project.

Uses existing `RESEND_API_KEY`. Optional `KYC_EMAIL_FROM` defaults to the app's existing sender domain (`Axnetix <noreply@linkedupai.xyz>`). Optional `NEXT_PUBLIC_APP_URL` defaults to `https://axnetix-dashboard.vercel.app` and supplies email review links. Deploy the updated app with these environment settings for production delivery.

A scoped server capability is derived from the Resend key; only its SHA-256 verifier is stored in the private database configuration. The actual Resend key is never passed to Supabase or exposed to clients. The current local key's verifier has been registered. When rotating the key or using a different deployment key, run `node --env-file=.env.local scripts/kyc-email-config.cjs` and apply the printed SQL to the target database. Register a production verifier from that deployment's environment.

The existing Resend key is restricted from listing domains, so sender-domain verification and real inbox delivery were not confirmed. Email behavior was tested with a mocked provider, without sending synthetic ID-request emails to admins.

### Additional tests

- `node --test tests/kyc-notice.cjs tests/kyc-notify-route.cjs`: notice states, escaped feedback, authentication, recipient tampering, deduplication, and provider failure handling.
- Run `tests/kyc-rls.sql` followed by `tests/kyc-notifications.sql` inside one transaction and roll back: queue creation, secret enforcement, cross-user isolation, concurrent claim protection, successful delivery persistence and retry scheduling. Synthetic fixtures are not retained and these tests send no email.

## Country and document selection

Migration `20260916220633_kyc_document_types.sql` adds country codes and document types and enables PDF uploads. Existing submissions remain national IDs with their original files and country names. New submissions require a country from the supported list.

This initial version offers the same three document types for all countries. Country-specific acceptance rules, document numbers, expiry dates and documents without expiry dates are deferred. Admin accounts remain exempt from personal KYC.

File validation tests: `node --test tests/kyc-files.cjs`. Run `tests/kyc-document-types.sql` after `tests/kyc-rls.sql` in a rolled-back transaction to verify country validation and required files for each type.
