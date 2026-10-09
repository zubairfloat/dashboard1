const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/kyc-banks.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: exportsObject });
const { getKycBanks, normalizeIban, validateKycBank } = exportsObject;
test('country lists do not leak banks across countries or prototype properties', () => {
  assert.ok(getKycBanks('PK').includes('Meezan Bank'));
  assert.ok(!getKycBanks('GB').includes('Meezan Bank'));
  assert.equal(getKycBanks('US').length, 0);
  assert.equal(getKycBanks('__proto__').length, 0);
});
test('accepts a valid spaced lowercase IBAN and normalizes it', () => {
  const iban = 'gb82 west 1234 5698 7654 32';
  assert.equal(normalizeIban(iban), 'GB82WEST12345698765432');
  assert.equal(validateKycBank('GB', 'NatWest', '', iban), null);
  assert.equal(validateKycBank('PK', 'other', 'Test bank', 'PK36SCBL0000001123456702'), null);
});
test('rejects missing bank, cross-country bank and IBAN, and invalid checksum', () => {
  const iban = 'GB82WEST12345698765432';
  assert.ok(validateKycBank('GB', '', '', iban));
  assert.ok(validateKycBank('GB', 'Meezan Bank', '', iban));
  assert.ok(validateKycBank('PK', 'Meezan Bank', '', iban));
  assert.ok(validateKycBank('GB', 'NatWest', '', 'GB83WEST12345698765432'));
  assert.ok(validateKycBank('GB', 'NatWest', '', iban + '0'));
  assert.ok(validateKycBank('GB', 'NatWest', '', ''));
  assert.ok(validateKycBank('GB', 'NatWest', '', 'GB82WEST!2345698765432'));
});
test('Other bank requires a bounded name', () => {
  const iban = 'GB82WEST12345698765432';
  for (const name of ['', ' ', 'a', 'a'.repeat(151)]) assert.ok(validateKycBank('GB', 'other', name, iban));
  assert.equal(validateKycBank('GB', 'other', 'Local bank', iban), null);
});

test('Pakistan requires exactly 24 characters excluding spaces before Continue can be enabled', () => {
  const valid = 'PK36SCBL0000001123456702';
  for (const value of ['PK', 'PK123', valid.slice(0, 23), valid + '0']) {
    assert.match(validateKycBank('PK', 'Standard Chartered Pakistan', '', value), /exactly 24 characters/);
  }
  assert.equal(validateKycBank('PK', 'Standard Chartered Pakistan', '', 'pk36 scbl 0000 0011 2345 6702'), null);
  assert.match(validateKycBank('PK', 'Standard Chartered Pakistan', '', 'PK37SCBL0000001123456702'), /checksum/);
});
