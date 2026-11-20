import {vendorJson,serverBase,IntegrationError} from './vendor-http.js';
export class SuperlinkedRanker{
 constructor({env=process.env,fetchImpl=fetch}={}){this.env=env;this.fetch=fetchImpl;}
 async rank(products,context,intent={}){
  if(!this.env.SUPERLINKED_API_KEY)throw new IntegrationError('Connect Superlinked in Vercel before starting personalized search.');
  if(!products.length)return [];
  const base=serverBase(this.env.SUPERLINKED_BASE_URL||'https://api.superlinked.com','SUPERLINKED_BASE_URL');const model=this.env.SUPERLINKED_MODEL||'Qwen/Qwen3-Reranker-0.6B';
  const query=JSON.stringify({request:context.query,profile:context.profile,weather:context.weather,memories:context.memories.map(m=>({id:m.id,type:m.type,text:m.text,source:m.source})),constraints:intent.constraints||context.constraints,preferences:intent.preferredFeatures||[],instruction:'Prefer requested attributes and relevant personal context. Explicit user requirements override inferred preferences.'});
  const items=products.map(p=>({id:p.id,text:JSON.stringify({name:p.name,description:p.description,features:p.features,price:p.price,weightGrams:p.weightGrams,laptopInches:p.laptopInches,capacityLiters:p.capacityLiters,source:p.sourceUrl})}));
  const data=await vendorJson('Superlinked',`${base}/v1/score/${encodeURIComponent(model)}`,{method:'POST',headers:{Authorization:`Bearer ${this.env.SUPERLINKED_API_KEY}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({query:{text:query},items})},this.fetch);
  if(!Array.isArray(data.scores)||data.scores.length!==products.length)throw new IntegrationError('Superlinked returned incomplete product scores.',502);
  const seen=new Set();return data.scores.map(entry=>{const p=products.find(p=>p.id===entry.item_id);if(!p||seen.has(p.id)||!Number.isFinite(entry.score))throw new IntegrationError('Superlinked returned invalid product scores.',502);seen.add(p.id);const evidence=context.memories.filter(m=>m.features?.some(f=>p.features.includes(f))).map(m=>({memoryId:m.id,type:m.type,text:m.text,source:m.source,matchedFeatures:m.features.filter(f=>p.features.includes(f))}));return {...p,score:entry.score,evidence,ranking:{service:'Superlinked',model,scoredAt:new Date().toISOString()}};}).sort((a,b)=>b.score-a.score);
 }
 async test(){const context={query:'Rain-resistant commuter backpack',profile:{city:'Seattle'},weather:{conditions:'Sample rain'},memories:[],constraints:{}};await this.rank([{id:'connection-check',name:'Connection check',description:'Rain-resistant commuter bag',features:['rain']}],context);return {detail:'Reranking request succeeded.'};}
}
