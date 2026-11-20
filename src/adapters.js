import {products} from './seed.js';
export class ConfigurationError extends Error {}
export async function gateway(name,action,payload,env=process.env){
 const url=env[name+'_GATEWAY_URL'], token=env[name+'_GATEWAY_TOKEN'];
 if(!url||!token)throw new ConfigurationError(`${name} is not configured. No API call was made. Use demo mode or configure its gateway.`);
 const endpoint=new URL(url); if(!['https:','http:'].includes(endpoint.protocol))throw new Error('Invalid gateway URL');
 const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({action,...payload}),signal:AbortSignal.timeout(25000),redirect:'error'});
 if(!response.ok)throw new Error(`${name} gateway returned ${response.status}`);
 return response.json();
}
export function relevant(memory,query,kind){return memory.tags.some(t=>query.toLowerCase().includes(t)||t===kind);}
export function adapters({mode='demo',state,env=process.env}){
 if(mode==='live')return {
  async retrieve(scope){const r=await gateway('COGNEE','retrieve',scope,env);if(!Array.isArray(r.memories))throw new Error('Cognee gateway must return typed memories');return r.memories;},
  async discover(provider,context){const r=await gateway(provider.toUpperCase(),'discover',{context},env);if(!Array.isArray(r.candidates))throw new Error('Search gateway must return cited candidates');return r;},
  async verify(candidates,context){const r=await gateway('COMMERCE','verify',{candidates,context},env);if(!Array.isArray(r.products))throw new Error('Commerce gateway must return verified variants');return r.products;},
  async rank(eligible,context){return gateway('SUPERLINKED','rank',{products:eligible,context},env);}
 };
 return {
  async retrieve(scope){return state.memories.filter(m=>m.owner===scope.owner&&m.authorized&&relevant(m,scope.query,scope.kind));},
  async discover(provider,context){
   const features=context.memories.flatMap(m=>m.features||[]);
   const queries=[`${context.kind} under $${context.constraints.budget} ${[...new Set(features)].join(' ')} ${context.constraints.rain?'rain resistant':''}`];
   // Context shapes candidate inclusion BEFORE ranking, including exclusions for already-owned use cases.
   const candidates=products.filter(p=>p.kind===context.kind&&(p.features.some(f=>features.includes(f))||features.length===0)).map(p=>({productId:p.id,variantId:p.variantId,citations:[{url:p.url,title:p.name,source:'Fictional demo catalog'}]}));
   return {candidates,queries,provider,execution:'simulated'};
  },
  async verify(candidates){return candidates.map(c=>{const p=products.find(p=>p.id===c.productId&&p.variantId===c.variantId);return p?{...p,citations:c.citations,verifiedAt:new Date().toISOString(),verification:'simulated',verified:true}:null;}).filter(Boolean);},
  async rank(eligible,context){const wanted=context.memories.flatMap(m=>m.features||[]);return {execution:'simulated',ranking:eligible.map(p=>{const evidence=context.memories.filter(m=>m.features?.some(f=>p.features.includes(f))).map(m=>({memoryId:m.id,source:m.source,text:m.text,matchedFeatures:m.features.filter(f=>p.features.includes(f))}));const matches=wanted.filter(f=>p.features.includes(f)).length;const value=Math.round((1-p.price/context.constraints.budget)*10);return {productId:p.id,variantId:p.variantId,score:Math.max(0,Math.min(99,50+matches*9+value)),evidence};}).sort((a,b)=>b.score-a.score)};}
 };
}
