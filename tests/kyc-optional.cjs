const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/kyc-optional.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: exportsObject });
const { validateOptionalDetails: validate, normalizeAddress, emptyAddress } = exportsObject;
test('omitted optional details never block progression', () => {
  assert.equal(validate(null, null), null);
  assert.equal(normalizeAddress({ ...emptyAddress, line1: '  ' }), null);
});
test('enabled crypto requires all fields and a compatible network', () => {
  for (const wallet of [
    { cryptocurrency: '', network: '', address: '' },
    { cryptocurrency: 'BTC', network: 'ethereum', address: '0x' + 'a'.repeat(40) },
    { cryptocurrency: 'USDT', network: 'tron', address: '0x' + 'a'.repeat(40) },
    { cryptocurrency: 'ETH', network: 'ethereum', address: '0x123' },
  ]) assert.ok(validate(wallet, null));
});
test('supported mainnet address formats pass, malformed formats fail', () => {
  for (const wallet of [
    { cryptocurrency: 'ETH', network: 'ethereum', address: '0x' + 'a'.repeat(40) },
    { cryptocurrency: 'USDT', network: 'bsc', address: '0x' + 'A'.repeat(40) },
    { cryptocurrency: 'USDT', network: 'tron', address: 'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8' },
    { cryptocurrency: 'BTC', network: 'bitcoin', address: '1BoatSLRHtKNngkdXEeobR76b53LETtpyT' },
    { cryptocurrency: 'BTC', network: 'bitcoin', address: 'bc1q' + 'a'.repeat(38) },
  ]) {
    assert.equal(validate(wallet, null), null);
    assert.ok(validate({ ...wallet, address: wallet.address + '!' }, null));
  }
});
test('partially filled address requires core fields; regional fields remain flexible', () => {
  assert.ok(validate(null, normalizeAddress({ ...emptyAddress, line2: 'Apartment 2' })));
  const address = normalizeAddress({ ...emptyAddress, line1: '  1 Main Street  ', city: 'Lahore', country: 'PK' });
  assert.equal(address.line1, '1 Main Street');
  assert.equal(validate(null, address), null);
  assert.ok(validate(null, { ...address, postal_code: 'x'.repeat(33) }));
  assert.ok(validate(null, { ...address, city: '\t' }));
  assert.ok(validate(null, { ...address, country: 'Pakistan' }));
});
