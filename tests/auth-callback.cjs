const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function callback(exchangeError = null) {
  const exports = {};
  const codes = [];
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/auth/callback/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, URL, console: { warn() {} },
    require(name) {
      if (name === 'next/server') return { NextResponse: { redirect: url => url.href } };
      return { createServerSupabase: async () => ({ auth: { exchangeCodeForSession: async code => { codes.push(code); return { error: exchangeError }; } } }) };
    },
  });
  return { GET: exports.GET, codes };
}
test('recovery exchanges the code before redirecting to password reset', async () => {
  const { GET, codes } = callback();
  assert.equal(await GET({ url: 'https://example.com/auth/callback?code=valid&next=/auth/reset-password' }), 'https://example.com/auth/reset-password');
  assert.deepEqual(codes, ['valid']);
});
test('missing and expired recovery codes lead to recovery error', async () => {
  for (const code of ['', '&code=expired']) {
    const { GET } = callback({ message: 'expired' });
    assert.equal(await GET({ url: 'https://example.com/auth/callback?next=/auth/reset-password' + code }), 'https://example.com/auth/reset-password?error=invalid_link');
  }
});
test('redirect targets remain allowlisted and original auth routes work', async () => {
  for (const [next, expected] of [['https://evil.test', '/dashboard'], ['//evil.test', '/dashboard'], ['/auth/confirmed', '/auth/confirmed'], ['/dashboard', '/dashboard']]) {
    const { GET } = callback();
    assert.equal(await GET({ url: 'https://example.com/auth/callback?code=valid&next=' + encodeURIComponent(next) }), 'https://example.com' + expected);
  }
});

test('missing browser verifier gives a specific recovery error', async () => {
  const { GET } = callback({ code: 'pkce_code_verifier_not_found', status: 400 });
  assert.equal(await GET({ url: 'https://example.com/auth/callback?code=test&next=/auth/reset-password' }), 'https://example.com/auth/reset-password?error=missing_verifier');
});
test('proxy leaves callback verifier cookies intact instead of refreshing stale sessions', async () => {
  const exports = {};
  let refreshed = false;
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('proxy.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, URL, process: { env: {} },
    require(name) {
      if (name === 'next/server') return { NextResponse: { next: () => ({ headers: new Map() }) } };
      return { createServerClient: () => { refreshed = true; throw new Error('callback must not refresh'); } };
    },
  });
  const response = await exports.proxy({ nextUrl: new URL('https://example.com/auth/callback?code=test'), url: 'https://example.com/auth/callback?code=test' });
  assert.equal(refreshed, false);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
});
