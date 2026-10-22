const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file) {
 const exports = {};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{ compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true} }).outputText,{exports,require(name){
  if(name.startsWith('@/lib/')) return load(name.replace('@/', '')+'.ts');
  return require(name);
 }});
 return exports;
}
const Component = load('components/dashboard/kyc-saved-details.tsx').default;
const render = submission => renderToStaticMarkup(React.createElement(Component,{submission}));
const base = {status:'verified',bank_name:'Original Bank',iban:'PK36SCBL0000001123456702',account_holder_name:'Test Owner',country_code:'PK'};
test('verified users see complete read-only bank details and optional absence',()=>{
 const html=render(base);
 for(const text of ['Identity: Verified','Bank: Provided','Original Bank','Test Owner','PK36SCBL0000001123456702','Pakistan','Crypto: Not provided','Address: Not provided']) assert.ok(html.includes(text),text);
 assert.doesNotMatch(html,/<input|<textarea|<select|<form/);
});
test('legacy supplements take priority and show wallet, network and every address field',()=>{
 const html=render({...base,bank_supplement:{bank_name:'Supplement Bank',iban:'GB82WEST12345698765432',account_holder_name:'New Owner',country_code:'GB',crypto_wallet:{cryptocurrency:'USDT',network:'ethereum',address:'0x'+'1'.repeat(40)},residential_address:{line1:'1 Main Street',line2:'Unit 2',city:'London',state:'London',postal_code:'AB1 2CD',country:'GB'}}});
 for(const text of ['Supplement Bank','New Owner','United Kingdom','Crypto: Provided','Address: Provided','Ethereum (ERC20)','1 Main Street','Unit 2','AB1 2CD']) assert.ok(html.includes(text),text);
 assert.doesNotMatch(html,/Original Bank/);
});
test('missing legacy fields are visible and stored text is escaped',()=>{
 const html=render({status:'verified',bank_name:'<script>test</script>'});
 assert.match(html,/Bank: Incomplete/);
 assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(html,/<script>/);
 assert.match(render({status:'verified'}),/Bank: Not provided/);
});
