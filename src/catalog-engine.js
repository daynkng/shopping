import {SampleContextAdapter} from './sample-context.js';
export const emptyConstraints=()=>({budget:null,features:[],size:null,color:null,minLaptopInches:null,maxWeightGrams:null,excludeIds:[],sort:'personal'});
export function category(query,previous='backpack') {return /tote/i.test(query)?'tote':/jacket|blazer|coat/i.test(query)?'jacket':/backpack|rucksack/i.test(query)?'backpack':/\bbags?\b/i.test(query)?(['backpack','tote'].includes(previous)?previous:'backpack'):previous;}
export function validateConstraints(value,ids) {
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid constraints.');
  const c={...emptyConstraints(),...value};
  if(c.budget!==null&&(!Number.isFinite(c.budget)||c.budget<=0||c.budget>100000))throw new Error('Enter a budget between $1 and $100,000.');
  if(!Array.isArray(c.features)||c.features.some(f=>!['laptop','rain','waterproof','packable','smart','easyclean','roomy','light','minimal','organizer','ziptop'].includes(f)))throw new Error('Unsupported product requirement.');
  if(!Array.isArray(c.excludeIds)||c.excludeIds.some(id=>!ids.includes(id)))throw new Error('Unknown product reference.');
  if(c.size!==null&&!['XS','S','M','L','XL','XXL'].includes(c.size))throw new Error('Unsupported size.');
  if(c.color!==null&&(typeof c.color!=='string'||c.color.length>50))throw new Error('Invalid color.');
  for(const key of ['minLaptopInches','maxWeightGrams'])if(c[key]!==null&&(!Number.isFinite(c[key])||c[key]<=0))throw new Error('Invalid product dimensions.');
  if(!['personal','price','weight'].includes(c.sort))throw new Error('Invalid sort.');
  return c;
}
export function resolveVariant(p,c) {
 const variants=p.variants.filter(v=>v.availableAtCapture&&(!c.size||v.size===c.size)&&(!c.color||v.color?.toLowerCase().includes(c.color.toLowerCase()))&&(c.budget===null||v.price<=c.budget));
 const v=variants.find(v=>v.size==='M')||variants[0];
 return v?{...p,price:v.price,variantId:v.id,selectedSize:v.size,selectedSizeLabel:v.sizeLabel||v.size,selectedColor:v.color,merchantUrl:p.sourceUrl+'?variant='+v.id}:null;
}
export function eligible(p,context) {
 const c=context.constraints;
 return p.kind===context.kind&&Number.isFinite(p.price)&&p.price>=0&&(c.budget===null||p.price<=c.budget)&&c.features.every(f=>p.features.includes(f))&&(!c.minLaptopInches||(p.laptopInches!==null&&p.laptopInches>=c.minLaptopInches))&&(!c.maxWeightGrams||(p.weightGrams!==null&&p.weightGrams<=c.maxWeightGrams))&&!c.excludeIds.includes(p.id)&&p.sourceUrl?.startsWith('https://')&&!!p.capturedAt;
}
export function filtersFor(products,kind) {
 const features=kind==='jacket'?['smart','packable','rain','waterproof','easyclean']:kind==='tote'?['ziptop','laptop','rain','organizer','roomy']:['laptop','rain','waterproof','roomy','light','organizer'];
 return {features:features.filter(f=>products.some(p=>p.features.includes(f))),sizes:kind==='jacket'?[...new Set(products.flatMap(p=>p.sizes))].filter(s=>['XS','S','M','L','XL','XXL'].includes(s)):[]};
}
export async function retrieveContext({owner,query,kind,constraints=emptyConstraints(),savedPreferenceIds=[]},cognee=new SampleContextAdapter()) {
 const data=await cognee.retrieve({owner,query,kind,savedPreferenceIds});
 return {owner,query,kind,constraints,profile:data.profile,weather:data.weather,contextSource:data.source,memories:data.memories.filter(m=>m.authorized===true&&m.owner===owner&&m.source&&['preference','ownership','event','filter_correction'].includes(m.type))};
}
export async function rankCandidates({catalog,context,candidateIds,constraints=context.constraints,preferredFeatures=[],ranker}) {
 if(!Array.isArray(candidateIds)||candidateIds.some(id=>!catalog.some(p=>p.id===id)))throw new Error('Search returned a product outside the sourced catalog.');
 const candidates=[...new Set(candidateIds)].map(id=>catalog.find(p=>p.id===id));
 const accepted=candidates.map(p=>resolveVariant(p,constraints)).filter(p=>p&&eligible(p,{...context,constraints}));
 if(!ranker)throw new Error('A Superlinked connection is required.');
 const ranked=accepted.length?await ranker.rank(accepted,context,{constraints,preferredFeatures}):[];
 if(!Array.isArray(ranked)||ranked.length!==accepted.length||new Set(ranked.map(p=>p.id)).size!==accepted.length||ranked.some(p=>!accepted.some(a=>a.id===p.id)||!Number.isFinite(p.score)))throw new Error('Invalid ranking response.');
 const audit={context,appliedConstraints:constraints,at:new Date().toISOString(),steps:[{stage:context.contextSource==='cognee'?'Cognee':'Sample context',execution:context.contextSource==='cognee'?'live':'sample',memoryIds:context.memories.map(m=>m.id)},{stage:'Catalog discovery',candidateIds},{stage:'Catalog evidence validation',eligibleIds:accepted.map(p=>p.id),rejectedIds:candidates.filter(p=>!accepted.some(a=>a.id===p.id)).map(p=>p.id),verification:'snapshot—not live inventory'},{stage:ranker.name||'Superlinked',execution:accepted.length?(ranker.name==='Built-in'?'local':'live'):'not needed — no eligible products',rankedIds:ranked.map(p=>p.id)}]};
 return {products:ranked.slice(0,8).map(({variants,...p})=>p),constraints,kind:context.kind,filters:filtersFor(catalog.filter(p=>p.kind===context.kind),context.kind),audit};
}
