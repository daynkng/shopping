import test from 'node:test';
import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {catalog} from '../src/catalog.js';
import {catalogPreview,emptyConstraints,validateConstraints,rankCandidates,retrieveContext} from '../src/catalog-engine.js';
import {MockSuperlinkedAdapter} from '../src/mock-superlinked.js';
import {MockCogneeAdapter} from '../src/mock-cognee.js';
const ids=catalog.map(p=>p.id);
test('24 real, sourced products have local photos and snapshot provenance',async()=>{
 assert.equal(catalog.filter(p=>p.kind==='backpack').length,12);assert.equal(catalog.filter(p=>p.kind==='jacket').length,12);assert.equal(new Set(ids).size,24);
 for(const p of catalog){assert(p.sourceUrl.startsWith('https://'));assert(!p.sourceUrl.includes('example.com'));assert.equal(p.capturedAt,'2026-11-20');assert(p.variants.every(v=>Number.isFinite(v.price)));await access(new URL('../public'+p.image,import.meta.url));}
});
test('same request produces personalized rankings without a hidden budget',async()=>{
 const maya=await catalogPreview(catalog,{owner:'maya'}),jordan=await catalogPreview(catalog,{owner:'jordan'});
 assert.equal(maya.constraints.budget,null);assert.notEqual(maya.products[0].id,jordan.products[0].id);assert(maya.filters.features.includes('laptop'));
});
test('hard filters operate on sourced variant prices, sizes and colors',async()=>{
 const constraints={...emptyConstraints(),budget:100};const r=await catalogPreview(catalog,{owner:'maya',constraints});assert(r.products.length);assert(r.products.every(p=>p.price<=100));
 const jacket=await catalogPreview(catalog,{owner:'maya',kind:'jacket',constraints:{...emptyConstraints(),size:'M',features:['waterproof']}});assert(jacket.products.length);assert(jacket.products.every(p=>p.selectedSize==='M'&&p.features.includes('waterproof')));
 const no=await catalogPreview(catalog,{owner:'maya',constraints:{...emptyConstraints(),budget:1}});assert.equal(no.products.length,0);
});
test('unknown IDs, invalid budgets and unsupported filters are rejected',async()=>{
 const context=await retrieveContext({owner:'maya',query:'backpack',kind:'backpack'});
 await assert.rejects(rankCandidates({catalog,context,candidateIds:['invented']}),/outside the sourced catalog/);
 assert.throws(()=>validateConstraints({...emptyConstraints(),budget:-1},ids),/budget/);assert.throws(()=>validateConstraints({...emptyConstraints(),features:['invented']},ids),/Unsupported/);
});
test('retrieval respects ownership, authorization and types',async()=>{
 const r=await new MockCogneeAdapter().retrieve({owner:'jordan',kind:'backpack',query:'backpack'});assert(r.length);assert(r.every(m=>m.owner==='jordan'&&m.authorized));assert(!r.some(m=>m.id==='private'));
 const c=await retrieveContext({owner:'maya',query:'conference jacket',kind:'jacket'});assert(c.memories.some(m=>m.type==='event'));
});
