// Run with a temporary, confirmed fixture user. Never use a real account password.
const { createServerClient } = require('@supabase/ssr');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.SSR_TEST_URL || 'http://localhost:3013';
const cookiePath = '/tmp/saas-dashboard-ssr-test-cookies.json';

async function main() {
  let jar = [];
  if (process.env.SSR_TEST_EMAIL && process.env.SSR_TEST_PASSWORD) {
    const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: { getAll: () => jar, setAll: values => { jar = values; } },
    });
    const { error } = await client.auth.signInWithPassword({ email: process.env.SSR_TEST_EMAIL, password: process.env.SSR_TEST_PASSWORD });
    if (error) throw new Error('Fixture login failed: ' + error.message);
    fs.writeFileSync(cookiePath, JSON.stringify(jar), { mode: 0o600 });
  } else {
    jar = JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
  }
  const headers = { Cookie: jar.map(c => `${c.name}=${c.value}`).join('; ') };
  const mode = process.env.SSR_TEST_MODE || 'user';
  const expected = mode === 'admin' ? {
    '/dashboard/admin': 'ssr_test_579cbe70',
    '/dashboard/admin/kyc': 'KYC review',
    '/dashboard/admin/users/579cbe70-0db3-4030-a1ee-8cabb0dbc31a/tokens': 'Assign Tokens',
  } : {
    '/dashboard': '78,231', '/dashboard/profile': 'SSR Test Account',
    '/dashboard/tokens': '78,231', '/dashboard/settings': 'Settings', '/dashboard/kyc': 'Identity verification',
  };
  for (const [path, content] of Object.entries(expected)) {
    const response = await fetch(base + path, { headers, redirect: 'manual' });
    assert.equal(response.status, 200, `${path} response`);
    assert.match(response.headers.get('cache-control') || '', /private|no-store/);
    const html = await response.text();
    // Verify actual HTML, not data present only in the serialized RSC script.
    const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    assert.ok(markup.includes(content), `${path}: expected server-rendered ${content}`);
    if (mode === 'admin') assert.ok(!markup.includes('Your KYC verification is pending.'), 'Admin must not get personal KYC notice');
    assert.ok(!html.includes('access_token'), 'Session token must not be serialized into page props');
    console.log(`PASS ${path}: authenticated data is in server HTML`);
  }
  const redirectPath = mode === 'admin' ? '/dashboard/kyc' : '/dashboard/admin';
  const response = await fetch(base + redirectPath, { headers, redirect: 'manual' });
  const html = await response.text();
  assert.ok([307, 308].includes(response.status) || html.includes('NEXT_REDIRECT'), 'Role-based redirect');
  console.log(`PASS role redirect: ${redirectPath}`);
  const anonymous = await fetch(base + '/dashboard/profile', { redirect: 'manual' });
  const anonymousHtml = await anonymous.text();
  assert.ok([307, 308].includes(anonymous.status) || anonymousHtml.includes('NEXT_REDIRECT'), 'Anonymous redirect');
  assert.ok(!anonymousHtml.includes('SSR Test Account'), 'Anonymous cannot see account data');
  console.log('PASS anonymous requests cannot see private account data');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
