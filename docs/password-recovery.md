# Password recovery

The login page links to `/forgot-password`. The email request uses Supabase `resetPasswordForEmail` and displays an account-neutral confirmation. The link exchanges its PKCE code at `/auth/callback?next=/auth/reset-password`. The reset page verifies the user with `getUser` and permits `updateUser({ password })` only with an authenticated session. Password confirmation and the existing six-character minimum are checked before calling Supabase; Supabase enforces its configured password policy. A successful change ends the local recovery session and offers sign-in.

## Deployment configuration

In Supabase Authentication → URL Configuration, allow the following redirect URL for each deployed origin (and localhost when testing):

`https://YOUR_DOMAIN/auth/callback?next=/auth/reset-password`

Keep the recovery email template's default `{{ .ConfirmationURL }}` link so Supabase verifies the token before redirecting. Configure working email delivery/SMTP. The existing browser client uses PKCE, so the link must be opened in the same browser where recovery was requested. Invalid, expired or already-used links offer a fresh request.

No database migration is needed. Hosted Auth configuration and real email delivery have not been changed or tested by this implementation.

Validation: `node --test tests/auth-callback.cjs tests/password-recovery.cjs`, TypeScript and targeted ESLint. The tests mock Supabase; verify the full email flow with a test account after configuring the redirect URL.

References: [Supabase password reset](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [Supabase user update](https://supabase.com/docs/reference/javascript/auth-updateuser).
