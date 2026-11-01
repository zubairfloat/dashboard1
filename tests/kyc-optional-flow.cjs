const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
function setup() {
 const state=[];let cursor=0;const calls=[];let response=()=>Promise.resolve({error:null});
 const hooks={...React,useState(initial){const i=cursor++;if(!(i in state))state[i]=initial;return [state[i],value=>state[i]=typeof value==='function'?value(state[i]):value]},useRef(initial){const i=cursor++;return state[i]??=( {current:initial} )},useEffect(){}};
 function load(file){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports,Event,window:{dispatchEvent(){}},require(name){
 if(name==='react')return hooks;
 if(name==='@/lib/supabase/client')return {supabase:{from:()=>({insert:row=>{calls.push(row);return response()}})}};
 if(name.startsWith('@/lib/'))return load(name.replace('@/','')+'.ts');
 if(name==='../kyc-saved-details')return {__esModule:true,default:'saved'};
 if(name==='./kyc-details-modal')return {__esModule:true,default:'modal'};
 if(name==='./kyc-optional-details')return {KycOptionalDetails:'fields'};
 return require(name);
 }});return exports;}
 const Component=load('components/dashboard/forms/kyc-optional-additions.tsx').default;
 const submission={id:'test',status:'verified',bank_name:'Bank',iban:'PK36SCBL0000001123456702',account_holder_name:'Owner'};
 const render=()=>{cursor=0;return Component({submission})};
 function find(node,type){if(!node||typeof node!=='object')return null;if(node.type===type)return node;for(const child of React.Children.toArray(node.props?.children)){const match=find(child,type);if(match)return match;}return null;}
 const open=section=>{const saved=find(render(),'saved');find(saved.props[section==='crypto'?'cryptoAction':'addressAction'],'button').props.onClick();};
 const submit=()=>find(render(),'form').props.onSubmit({preventDefault(){}});
 return {render,find,open,submit,calls,setResponse:fn=>response=fn};
}
test('review, failed save, retry and independent optional saves preserve data',async()=>{
 const h=setup();h.open('address');h.find(h.render(),'fields').props.onAddress({line1:'10 Main Street',line2:'',city:'Lahore',state:'',postal_code:'',country:'PK'});
 await h.submit();assert.equal(h.calls.length,0);assert.equal(h.find(h.render(),'modal').props.title,'Review your information');
 h.setResponse(()=>Promise.resolve({error:{code:'network'}}));await h.submit();assert.equal(h.calls.length,1);assert.match(JSON.stringify(h.render()),/entries have been kept/);
 h.setResponse(()=>Promise.resolve({error:null}));await h.submit();assert.equal(h.calls[1].residential_address.line1,'10 Main Street');assert.equal(h.find(h.render(),'modal'),null);
 h.open('crypto');h.find(h.render(),'fields').props.onWallet({cryptocurrency:'USDT',network:'ethereum',address:'0x'+'1'.repeat(40)});await h.submit();await h.submit();
 const rows=h.find(h.render(),'saved').props.submission.optional_additions;assert.equal(rows.length,2);assert.equal(rows[0].section,'address');assert.equal(rows[1].section,'crypto');
});
test('invalid wallet does not submit and rapid confirmation clicks send one request',async()=>{
 const h=setup();h.open('crypto');await h.submit();assert.equal(h.calls.length,0);assert.ok(h.find(h.render(),'fields'));
 h.find(h.render(),'fields').props.onWallet({cryptocurrency:'USDT',network:'ethereum',address:'0x'+'1'.repeat(40)});await h.submit();
 let resolve;h.setResponse(()=>new Promise(r=>{resolve=r}));const callback=h.find(h.render(),'form').props.onSubmit;const event={preventDefault(){}};const first=callback(event);await callback(event);assert.equal(h.calls.length,1);resolve({error:null});await first;
});
