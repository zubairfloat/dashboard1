const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const moduleExports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/kyc.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: moduleExports, File, Uint8Array });
const { validateKycFile, getKycDocument, isKycDocumentType, MAX_KYC_FILE_BYTES } = moduleExports;
const fixtures = [
  { extension: 'jpg', type: 'image/jpeg', bytes: [255,216,255,224] },
  { extension: 'jpeg', type: 'image/jpeg', bytes: [255,216,255,224] },
  { extension: 'png', type: 'image/png', bytes: [137,80,78,71,13,10,26,10] },
  { extension: 'pdf', type: 'application/pdf', bytes: [37,80,68,70,45,49,46,55] },
];
test('all supported formats pass with matching signature, extension and MIME', async () => {
  for (const fixture of fixtures) {
    const file = new File([new Uint8Array(fixture.bytes)], 'document.'+fixture.extension, { type: fixture.type });
    assert.equal(await validateKycFile(file), fixture.type);
  }
});
test('empty files, disguised files, and unsupported types fail', async () => {
  for (const file of [new File([], 'empty.pdf', { type: 'application/pdf' }), new File(['<html>'], 'fake.pdf', { type: 'application/pdf' }), new File(['<svg/>'], 'card.svg', { type: 'image/svg+xml' }), new File([new Uint8Array(fixtures[0].bytes)], 'card.png', { type: 'image/png' })]) {
    await assert.rejects(validateKycFile(file));
  }
});
test('5 MB boundary is accepted and larger files are rejected', async () => {
  const bytes = new Uint8Array(MAX_KYC_FILE_BYTES);
  bytes.set(fixtures[0].bytes);
  assert.equal(await validateKycFile(new File([bytes], 'card.JPG', { type: 'image/jpeg' })), 'image/jpeg');
  await assert.rejects(validateKycFile(new File([bytes, 'x'], 'card.jpg', { type: 'image/jpeg' })), /5 MB/);
});
test('missing browser MIME is inferred only after checking extension and contents', async () => {
  assert.equal(await validateKycFile(new File([new Uint8Array(fixtures[3].bytes)], 'passport.PDF')), 'application/pdf');
  await assert.rejects(validateKycFile(new File([new Uint8Array(fixtures[3].bytes)], 'passport.pdf', { type: 'image/png' })));
});
test('passport needs one page, ID and driving license need both sides', () => {
  assert.equal(getKycDocument('passport').uploads.length, 1);
  assert.equal(getKycDocument('national_id').uploads.length, 2);
  assert.equal(getKycDocument('driving_license').uploads.length, 2);
  assert.equal(getKycDocument(undefined).label, 'National ID Card');
  assert.equal(isKycDocumentType('passport'), true);
  assert.equal(isKycDocumentType('unsupported'), false);
  assert.equal(isKycDocumentType('__proto__'), false);
});
