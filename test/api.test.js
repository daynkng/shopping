import test from 'node:test';
import assert from 'node:assert/strict';
import { requestJson } from '../public/api.js';
const ok = data => new Response(JSON.stringify(data), {headers:{'content-type':'application/json'}});
const page = () => new Response('The page could not be loaded', {status:502,headers:{'content-type':'text/plain'}});
const wait = async()=>{};
test('retries a transient page response on initial read and recovers',async()=>{
 let calls=0;const result=await requestJson('/api/state',{}, {wait,fetchImpl:async(url,options)=>{assert.equal(options.cache,'no-store');assert.equal(options.headers.Accept,'application/json');return ++calls===1?page():ok({threads:[]});}});
 assert.equal(calls,2);assert.deepEqual(result,{threads:[]});
});
test('persistent page response produces an actionable error instead of JSON SyntaxError',async()=>{
 let calls=0;await assert.rejects(requestJson('/api/state',{}, {wait,fetchImpl:async()=>{calls++;return page();}}),e=>e instanceof Error&&!(e instanceof SyntaxError)&&/page instead of app data/.test(e.message));assert.equal(calls,3);
});
test('never automatically repeats purchases or other mutations',async()=>{
 let calls=0;await assert.rejects(requestJson('/api/checkout',{method:'POST'}, {wait,fetchImpl:async()=>{calls++;return page();}}),/page instead/);assert.equal(calls,1);
});
test('network failures retry reads and leave a recoverable message',async()=>{
 let calls=0;await assert.rejects(requestJson('/api/state',{}, {wait,fetchImpl:async()=>{calls++;throw new TypeError('Failed to fetch');}}),/could not reach its app server/);assert.equal(calls,3);
});
test('preserves structured API errors and handles invalid JSON safely',async()=>{
 await assert.rejects(requestJson('/api/state',{}, {wait,fetchImpl:async()=>new Response(JSON.stringify({error:'Unknown persona'}),{status:400,headers:{'content-type':'application/json'}})}),/Unknown persona/);
 await assert.rejects(requestJson('/api/state',{}, {wait,fetchImpl:async()=>new Response('broken',{headers:{'content-type':'application/json'}})}),/unreadable app response/);
});
