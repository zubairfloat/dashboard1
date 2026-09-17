const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('app/api/kyc/notify/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

function setup(options = {}) {
  const calls = [], messages = [];
  const client = {
    auth: { getUser: async () => options.unauthorized ? { data: { user: null }, error: {} } : { data: { user: { id: 'owner' } }, error: null } },
    rpc: async (name, args) => {
      calls.push({ name, args });
      if (options.denied) return { error: { code: '42501' } };
      if (args.p_complete) return options.finishError ? { error: {} } : { data: { state: args.p_provider_id ? 'sent' : 'retry' } };
      return { data: { state: options.state || 'claimed', id: '10000000-0000-4000-8000-000000000001', lease: 'lease', payload: { recipients: ['admin@example.invalid'], full_name: '<script>name</script>', country: 'Test', user_id: 'owner', submitted_at: '2026-01-01' } } };
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(source, {
    exports: module.exports, module, Response, URL,
    process: { env: { RESEND_API_KEY: 'test-key', NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon' } },
    require: name => {
      if (name === '@supabase/supabase-js') return { createClient: () => client };
      if (name === 'resend') return { Resend: class { emails = { send: async (message, config) => { messages.push({ message, config }); return options.sendError ? { error: {} } : { data: { id: 'provider-id' } }; } }; } };
      return require(name);
    },
  });
  return { post: module.exports.POST, calls, messages };
}
const request = (body = {}, token = true) => new Request('https://example.test/api/kyc/notify', { method: 'POST', headers: token ? { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' } : {}, body: JSON.stringify(body) });

test('anonymous and expired sessions cannot send email', async () => {
  for (const options of [{}, { unauthorized: true }]) {
    const { post, messages } = setup(options);
    assert.equal((await post(request({}, !!options.unauthorized))).status, 401);
    assert.equal(messages.length, 0);
  }
});
test('invalid IDs and forbidden claims never send', async () => {
  const bad = setup();
  assert.equal((await bad.post(request({ submissionId: 'bad-id' }))).status, 400);
  assert.equal(bad.messages.length, 0);
  const denied = setup({ denied: true });
  assert.equal((await denied.post(request())).status, 403);
  assert.equal(denied.messages.length, 0);
});
test('completed or leased jobs do not send twice', async () => {
  for (const state of ['sent', 'deferred']) {
    const s = setup({ state });
    assert.equal((await s.post(request())).status, 200);
    assert.equal(s.messages.length, 0);
  }
});
test('recipient list comes from protected database job, not request body', async () => {
  const s = setup();
  const response = await s.post(request({ to: 'attacker@example.invalid' }));
  assert.equal(response.status, 200);
  assert.deepEqual(s.messages[0].message.to, ['admin@example.invalid']);
  assert.equal(s.messages[0].config.idempotencyKey, 'kyc-submission/10000000-0000-4000-8000-000000000001');
  assert.equal(s.messages[0].message.html, undefined);
  assert.match(s.messages[0].message.text, /request=10000000/);
  assert.equal(s.calls[1].args.p_provider_id, 'provider-id');
  assert.notEqual(s.calls[0].args.p_secret, 'test-key');
});
test('provider failures keep a retryable job', async () => {
  const s = setup({ sendError: true });
  assert.equal((await s.post(request())).status, 503);
  assert.equal(s.calls[1].args.p_complete, true);
  assert.equal(s.calls[1].args.p_provider_id, undefined);
});
test('delivery confirmation failures use a stable idempotency key on retry', async () => {
  const s = setup({ finishError: true });
  assert.equal((await s.post(request())).status, 503);
  assert.equal(s.messages.length, 1);
  assert.equal(s.calls.length, 2);
});
