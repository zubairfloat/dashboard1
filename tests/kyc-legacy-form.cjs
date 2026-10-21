const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function render(submission) {
  function load(file) {
    const exports = {};
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, require(name) {
      if (name === '@/hooks/use-kyc-status') return { useKycStatus: () => ({ submission, ready: true }) };
      if (name === '@/lib/supabase/client') return { supabase: {} };
      if (name === '@/lib/email/notifyKyc') return { notifyKyc: () => { throw new Error('No notification during render'); } };
      if (name === '@/lib/format') return { formatDateTime: () => 'Approved earlier' };
      if (name === './kyc-picker') return { KycPicker: ({ label }) => React.createElement('label', null, label) };
      if (name === './kyc-optional-details') return { KycOptionalDetails: () => React.createElement('div', null, 'Optional wallet and address') };
      if (name === '../skeleton') return { Skeleton: () => null };
      if (name === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
      if (name === '@/lib/kyc-bank-logos') return { getKycBankLogo: () => undefined };
      if (name.startsWith('@/lib/')) return load(name.replace('@/', '') + '.ts');
      return require(name);
    } });
    return exports;
  }
  return renderToStaticMarkup(React.createElement(load('components/dashboard/forms/kyc-form.tsx').default));
}
const verified = { id: 'legacy', status: 'verified', country: 'Pakistan', document_type: 'national_id', created_at: '2026-01-01' };
test('legacy verified form only collects bank and optional details', () => {
 const html = render(verified);
 assert.match(html, /KYC Verified/);
 assert.match(html, /Complete your bank details/);
 assert.match(html, /Save bank details/);
 assert.match(html, /Optional wallet and address/);
 assert.doesNotMatch(html, /type="file"|Continue to documents|Verification progress/);
});
test('saved supplement hides the completion form', () => {
 const html = render({ ...verified, bank_supplement: { bank_name: 'Bank' } });
 assert.match(html, /KYC Verified/);
 assert.doesNotMatch(html, /Save bank details|<form/);
});
test('rejected and pending users keep their existing flows', () => {
 assert.match(render({ ...verified, status: 'rejected' }), /Resubmit your documents/);
 assert.match(render({ ...verified, status: 'rejected' }), /Continue to documents/);
 assert.doesNotMatch(render({ ...verified, status: 'pending' }), /Save bank details|<form/);
});
