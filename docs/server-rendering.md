# Server-rendering refactor

## What changed

- Every dashboard page is now a Server Component entry point. Dashboard overview, profile, balances, packages, restricted state, and approval pages render their content on the server.
- The sidebar and navbar share the request-scoped account loader. Only the logout button needs browser JavaScript.
- Settings, token assignment, user-management controls, KYC upload/review controls, and countdowns remain client components because they are interactive. Their initial data comes from the server; they do not fetch their initial account/page data after hydration.
- Admin user search and pagination use URL parameters and server queries. Statistics use database counts instead of downloading every profile.
- KYC consumers share one server-seeded context and one visible-tab refresh request every 15 seconds. The personal KYC page no longer runs its own account/status polling loop. Admin queue lists still refresh independently to show new submissions.
- React `cache()` deduplicates server client/account/KYC lookups within a render request. No authenticated data is stored in a shared persistent cache. The status endpoint and session proxy explicitly use private, no-store responses.
- Dashboard loading and error boundaries support navigation while server requests run.

## Authentication

`@supabase/ssr` now stores browser sessions in cookies that server components can read. `proxy.ts` refreshes sessions before rendering; the request-scoped loader verifies the user with `getUser()` before reading account data. Admin loaders check account state, and KYC review additionally checks the protected reviewer permission.

Existing browser-storage sessions have a one-time migration on the login page. A successful migration validates the session, writes cookies and removes the old storage entry. If migration is not possible, normal sign-in is available.

OAuth still redirects to `/dashboard`, and signup confirmation still redirects to `/auth/confirmed`, preserving the existing Supabase allowlist destinations. The proxy forwards PKCE codes to `/auth/callback`, where the server exchanges them and writes cookies. Callback destinations are restricted to fixed internal paths.

## Validation

- Production build identifies all dashboard routes as dynamic server-rendered routes.
- TypeScript check passes; lint has no errors (two existing avatar `<img>` warnings remain).
- `node --test tests/server-account.cjs tests/kyc-notice.cjs tests/kyc-notify-route.cjs` covers server access guards and existing KYC behavior (14 tests).
- An authenticated production smoke test confirmed that overview balances, profile details and token balances are present in actual HTML, before JavaScript runs, and session tokens are not serialized as page props.
- The follow-up network test was declined, so the remaining live admin/interaction checks were not completed. The temporary fixture account was deleted and the test server stopped.

These changes remove known loading waterfalls and duplicate requests. No before/after browser timing benchmark has been recorded, so there is no claimed percentage speedup.
