const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('lib/dashboard-data.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function setup({ user = { id: 'user-id' }, profile = { id: 'user-id', is_admin: false, is_deleted: false }, authError = null } = {}) {
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: authError }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profile, error: null }) }) }) }),
  };
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module, exports: module.exports, Date,
    require: name => {
      if (name === 'server-only') return {};
      if (name === 'react') return { cache: fn => fn };
      if (name === 'next/navigation') return { redirect: path => { throw new Error('redirect:' + path); }, notFound: () => { throw new Error('notFound'); } };
      if (name === '@/lib/supabase/server') return { createServerSupabase: async () => client };
      return require(name);
    },
  });
  return module.exports;
}
test('server account loader rejects missing and invalid sessions', async () => {
  await assert.rejects(setup({ user: null }).getAccount(), /redirect:\/login/);
  await assert.rejects(setup({ authError: {} }).getAccount(), /redirect:\/login/);
});
test('server admin guard redirects ordinary users', async () => {
  await assert.rejects(setup().requireAdmin(), /redirect:\/dashboard/);
});
test('disabled admins cannot pass the server guard', async () => {
  await assert.rejects(setup({ profile: { is_admin: true, is_deleted: true } }).requireAdmin(), /redirect:\/dashboard\/restricted/);
});
test('active admins pass and numeric profile defaults are normalized', async () => {
  const { profile } = await setup({ profile: { is_admin: true, is_deleted: false } }).requireAdmin();
  assert.equal(profile.is_admin, true);
  assert.equal(profile.total_tokens, 0);
});
