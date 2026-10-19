const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function render(file, states, auth) {
  const exports = {};
  let index = 0;
  const changes = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, window: { location: { origin: 'https://example.com' } },
    require(name) {
      if (name === 'react') return { useState: () => { const key = index++; return [states[key], value => changes[key] = value]; } };
      if (name === 'react/jsx-runtime') return require(name);
      if (name.includes('supabase/client')) return { supabase: { auth } };
      return { default: () => null };
    },
  });
  return { form: exports.default(), changes };
}
const event = { preventDefault() {} };
test('reset email uses trimmed email and the recovery callback', async () => {
  let args;
  const { form, changes } = render('components/auth/forgot-password-form.tsx', [' user@example.com ', false, false, ''], {
    resetPasswordForEmail: async (...values) => { args = values; return { error: null }; },
  });
  await form.props.onSubmit(event);
  assert.equal(args[0], 'user@example.com');
  assert.equal(args[1].redirectTo, 'https://example.com/auth/callback?next=/auth/reset-password');
  assert.equal(changes[2], true);
  assert.equal(changes[1], false);
});
test('short and mismatched passwords never reach the auth API', async () => {
  for (const [password, confirmation] of [['short', 'short'], ['longpassword', 'different']]) {
    const { form, changes } = render('components/auth/reset-password-form.tsx', [password, confirmation, false, false, ''], {
      updateUser: async () => { throw new Error('must not be called'); },
    });
    await form.props.onSubmit(event);
    assert.ok(changes[4]);
    assert.equal(changes[3], undefined);
  }
});
test('successful password update clears secrets and ends recovery session', async () => {
  const calls = [];
  const { form, changes } = render('components/auth/reset-password-form.tsx', ['newpassword', 'newpassword', false, false, ''], {
    updateUser: async value => { calls.push(value.password); return { error: null }; },
    signOut: async value => { calls.push(value.scope); return { error: null }; },
  });
  await form.props.onSubmit(event);
  assert.deepEqual(calls, ['newpassword', 'local']);
  assert.equal(changes[0], '');
  assert.equal(changes[1], '');
  assert.equal(changes[3], true);
});
test('failed password update keeps form available and does not sign out', async () => {
  const { form, changes } = render('components/auth/reset-password-form.tsx', ['newpassword', 'newpassword', false, false, ''], {
    updateUser: async () => ({ error: { message: 'Link expired' } }),
    signOut: async () => { throw new Error('must not be called'); },
  });
  await form.props.onSubmit(event);
  assert.equal(changes[4], 'Link expired');
  assert.equal(changes[2], false);
  assert.equal(changes[3], undefined);
});
