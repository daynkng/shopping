import test from 'node:test';
import assert from 'node:assert/strict';
import {readStore,writeStore,makeThread} from '../public/store.js';
test('per-browser demo storage seeds once and persists persona-specific threads and selections',async()=>{
 const values=new Map();globalThis.localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 const state=await readStore();assert.equal(state.threads.length,2);assert(state.threads.every(t=>t.constraints.budget===null));
 const thread=makeThread('maya','Conference jacket');state.threads.push(thread);state.savedPreferenceIds.push('m5');state.cart.push({owner:'maya',id:'cart-test'});writeStore(state);
 const restored=await readStore();assert.equal(restored.threads.filter(t=>t.owner==='maya').length,2);assert.equal(restored.threads.filter(t=>t.owner==='jordan').length,1);assert(restored.savedPreferenceIds.includes('m5'));assert.equal(restored.cart.filter(c=>c.owner==='jordan').length,0);
});
test('unreadable browser state is preserved and reported',async()=>{
 globalThis.localStorage={getItem:()=>'{bad',setItem:()=>assert.fail('Must not overwrite unreadable data')};await assert.rejects(readStore(),/existing browser data has been kept/);
});
