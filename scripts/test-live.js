import assert from 'node:assert/strict';
import {searchRequest} from '../src/search-service.js';
import {testConnection,contextAdapter} from '../src/integrations.js';
const provider=process.argv.find(a=>a.startsWith('--provider='))?.split('=')[1]||'openai';
await testConnection(provider,'maya');console.log(provider+' connection verified.');await testConnection('superlinked','maya');console.log('Superlinked connection verified.');
const results={};
for(const owner of ['maya','jordan']){
 const input={owner,provider,query:'Find me a backpack',messages:[]};const first=await searchRequest(input);assert(first.products.length);assert.equal(first.audit.context.profile.city.includes(owner==='maya'?'Seattle':'Austin'),true);assert(first.audit.steps.some(s=>s.stage==='Superlinked'&&s.execution==='live'));results[owner]=first.products.map(p=>p.id);
 const next=await searchRequest({...input,query:'Show alternatives to the first one',kind:first.kind,constraints:first.constraints,previousResultIds:first.products.map(p=>p.id),messages:[{role:'user',text:input.query},{role:'assistant',text:first.reply}]});assert(!next.clarification);assert(next.products.every(p=>p.id!==first.products[0].id));console.log(owner+' initial search and referenced follow-up verified.');
 if(process.env.CONTEXT_SOURCE==='cognee'){const c=await contextAdapter().retrieve({owner,query:'preferences'});assert(c.source==='cognee');assert(c.memories.every(m=>m.owner===owner));console.log(owner+' Cognee retrieval verified.');}
}
assert.notDeepEqual(results.maya,results.jordan,'Personas did not produce a different candidate set or ranking; inspect retrieved context and ranking prompts.');
console.log('Both live persona demos verified with distinct results.');
