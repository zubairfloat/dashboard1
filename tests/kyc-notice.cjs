const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const source = ts.transpileModule(fs.readFileSync('components/dashboard/kyc-notice.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
function render(submission, extra = {}) {
  const module = { exports: {} };
  vm.runInNewContext(source, {
    exports: module.exports, module,
    require: name => {
      if (name === '@/hooks/use-kyc-status') return { useKycStatus: () => ({ ready: true, reviewer: false, submission, error: '', ...extra }) };
      if (name === '@/lib/kyc') {
        const out = { exports: {} };
        vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/kyc.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: out.exports });
        return out.exports;
      }
      if (name === '@/lib/email/notifyKyc') return { notifyKyc: async () => true };
      if (name === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
      if (name === 'lucide-react') return { ShieldAlert: () => null };
      return require(name);
    },
  });
  return renderToStaticMarkup(React.createElement(module.exports.default));
}
test('unsubmitted users see exact persistent pending message', () => {
  const html = render(null);
  assert.match(html, /Your KYC verification is pending\. Please complete the verification process as soon as possible\./);
  assert.match(html, /Complete verification/);
  assert.doesNotMatch(html, /dismiss|Close notification/);
});
test('submitted users retain notice and are told not to upload again', () => {
  const html = render({ id: 'test', status: 'pending' });
  assert.match(html, /under admin review/);
  assert.match(html, /No further upload is needed/);
  assert.match(html, /View KYC status/);
});
test('verified users and admin reviewers have no pending notice', () => {
  assert.equal(render({ status: 'verified', bank_name: 'Bank', iban: 'PK36SCBL0000001123456702', account_holder_name: 'Test User' }), '');
  assert.equal(render(null, { reviewer: true }), '');
  assert.equal(render(null, { admin: true, reviewer: false }), '');
});
test('rejected users see feedback and resubmission link with escaped text', () => {
  const html = render({ status: 'rejected', rejection_reason: '<script>blurry card</script>' });
  assert.match(html, /action required/);
  assert.match(html, /Correct and resubmit/);
  assert.match(html, /&lt;script&gt;blurry card&lt;\/script&gt;/);
});

test('legacy verified users get a bank reminder without a document resubmission request', () => {
  const html = render({ status: 'verified', bank_name: null, iban: null, account_holder_name: null });
  assert.match(html, /Complete your bank details/);
  assert.match(html, /Your identity is verified/);
  assert.match(html, /do not need to upload your identity documents again/);
  assert.doesNotMatch(html, /KYC verification pending|Correct and resubmit/);
});
test('saved supplement clears the reminder while keeping KYC verified', () => {
  assert.equal(render({ status: 'verified', bank_supplement: { bank_name: 'Bank' } }), '');
});
