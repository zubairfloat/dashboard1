const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file) {
 const exports = {};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports,require(name){
  if(name==='@/lib/supabase/client') return {supabase:{}};
  if(name.startsWith('@/')) return load(name.replace('@/','')+'.ts');
  if(name.startsWith('.')) return load(path.join(path.dirname(file), name)+'.tsx');
  return require(name);
 }});
 return exports;
}
const Component=load('components/dashboard/forms/kyc-optional-additions.tsx').default;
const base={id:'test',status:'verified',bank_name:'Bank',iban:'PK36SCBL0000001123456702',account_holder_name:'Owner'};
const wallet={cryptocurrency:'USDT',network:'ethereum',address:'0x'+'1'.repeat(40)};
const address={line1:'Street',city:'City',country:'PK'};
const render=submission=>renderToStaticMarkup(React.createElement(Component,{submission}));
test('completed required sections offer both missing optional sections',()=>{
 const html=render(base);
 assert.match(html,/Add Crypto Wallet/); assert.match(html,/Add Residential Address/);
});
test('each saved source independently hides its own add action',()=>{
 for (const extra of [{crypto_wallet:wallet},{bank_supplement:{...base,crypto_wallet:wallet}},{optional_additions:[{section:'crypto',crypto_wallet:wallet}]}]) {
  const html=render({...base,...extra}); assert.doesNotMatch(html,/Add Crypto Wallet/); assert.match(html,/Add Residential Address/);
 }
 const html=render({...base,residential_address:address});
 assert.match(html,/Add Crypto Wallet/); assert.doesNotMatch(html,/Add Residential Address/);
});
test('both saved sections and incomplete required sections expose no add action',()=>{
 for(const submission of [{...base,crypto_wallet:wallet,residential_address:address},{...base,status:'pending'},{...base,status:'rejected'},{...base,bank_name:null}]) assert.doesNotMatch(render(submission),/Add Crypto Wallet|Add Residential Address/);
});
