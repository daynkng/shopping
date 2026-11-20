import test from 'node:test';
import assert from 'node:assert/strict';
import {searchRequest,OpenAICatalogAgent,connections} from '../src/search-service.js';
import {emptyConstraints} from '../src/catalog-engine.js';
import {MockCogneeAdapter} from '../src/mock-cognee.js';
import {MockSuperlinkedAdapter} from '../src/mock-superlinked.js';
import {catalog} from '../src/catalog.js';
const request={owner:'maya',provider:'openai',query:'Find me a backpack',constraints:emptyConstraints()};
const intent=(overrides={})=>({kind:'backpack',reply:'Here are your options.',clarification:null,searchQuery:'personalized backpacks',preferredFeatures:[],constraints:emptyConstraints(),candidateIds:catalog.filter(p=>p.kind==='backpack').map(p=>p.id),...overrides});
test('Cognee runs before discovery and same immutable context reaches mock Superlinked',async()=>{
 const calls=[];let original,serialized;
 const result=await searchRequest(request,{cognee:{async retrieve(s){calls.push('cognee');return new MockCogneeAdapter().retrieve(s);}},agent:{async discover(c){calls.push('agent');original=c;serialized=JSON.stringify(c);assert(c.memories.length);return intent({constraints:{...emptyConstraints(),budget:150}});}},ranker:{async rank(p,c,options){calls.push('rank');assert.equal(c,original);assert.equal(JSON.stringify(c),serialized);assert(p.every(p=>p.price<=150));return new MockSuperlinkedAdapter().rank(p,c,options);}}});
 assert.deepEqual(calls,['cognee','agent','rank']);assert.equal(result.audit.context,original);assert.equal(result.constraints.budget,150);
});
test('follow-up retains prior results and constraints, and alternatives exclude first result',async()=>{
 const initial=await searchRequest(request,{agent:{discover:async()=>intent()}});const first=initial.products[0].id;
 const next=await searchRequest({...request,query:'Show alternatives to the first one',previousResultIds:initial.products.map(p=>p.id),constraints:{...emptyConstraints(),budget:200},messages:[{role:'user',text:'Find a backpack under $200'}]},{agent:{async discover(context,{messages,previousResultIds}){assert.equal(context.constraints.budget,200);assert.equal(previousResultIds[0],first);assert.equal(messages.at(-1).text,'Show alternatives to the first one');return intent({constraints:{...context.constraints,excludeIds:[first]}});}}});assert(next.products.every(p=>p.id!==first&&p.price<=200));
});
test('invalid model IDs and unsupported providers never silently fall back',async()=>{
 await assert.rejects(searchRequest(request,{agent:{discover:async()=>intent({candidateIds:['invented']})}}),/outside the sourced catalog/);
 await assert.rejects(searchRequest({...request,provider:'grok'}),/not connected/);
 await assert.rejects(new OpenAICatalogAgent({env:{}}).discover({},{}),/Connect OpenAI/);
});
test('clarifications produce a question without fabricated products',async()=>{
 const r=await searchRequest({...request,query:'That one but different'},{agent:{discover:async()=>intent({clarification:'Which product do you mean?',candidateIds:[]})}});assert(r.clarification);assert(!r.products);assert.match(r.reply,/Which product/);
});
test('native OpenAI call contains scoped memory, real catalog and strict JSON schema',async()=>{
 let called=0;const agent=new OpenAICatalogAgent({env:{OPENAI_API_KEY:'test-only',OPENAI_MODEL:'gpt-4.1-mini'},fetchImpl:async(url,options)=>{called++;assert.equal(url,'https://api.openai.com/v1/responses');const body=JSON.parse(options.body);assert.equal(body.text.format.strict,true);assert.equal(body.store,false);const input=JSON.parse(body.input);assert(input.scopedContext.memories.length);assert.equal(input.catalog.length,24);assert(body.text.format.schema.properties.candidateIds.items.enum.includes(catalog[0].id));return {ok:true,json:async()=>({output:[{content:[{type:'output_text',text:JSON.stringify(intent())}]}]})};}});
 await searchRequest(request,{agent});assert.equal(called,1);assert.equal(connections({}).openai.configured,false);
});
test('OpenAI errors surface; credentials are never returned in connection status',async()=>{
 const agent=new OpenAICatalogAgent({env:{OPENAI_API_KEY:'secret'},fetchImpl:async()=>({ok:false,status:401})});await assert.rejects(agent.discover({},{}),/key was rejected/);assert(!JSON.stringify(connections({OPENAI_API_KEY:'secret'})).includes('secret'));
});
