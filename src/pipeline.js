import {randomUUID} from 'node:crypto';
import {adapters} from './adapters.js';
export function constraintsFrom(query,old={budget:150,rain:false,size:null}){
 const next={...old}; const match=query.match(/(?:under|below|budget(?:\s+of)?|up to|max)\s*\$?\s*(\d+(?:\.\d+)?)/i);if(match)next.budget=Number(match[1]);
 if(/(?:no|without|don't need)\s+(?:rain|waterproof)/i.test(query))next.rain=false;else if(/rain|waterproof|water-resistant/i.test(query))next.rain=true;
 const size=query.match(/\bsize\s+(XS|XL|S|M|L|XXL)\b/i);if(size)next.size=size[1].toUpperCase();return next;
}
export function eligible(p,context){return p.verified===true&&p.currency==='USD'&&p.kind===context.kind&&typeof p.price==='number'&&Number.isFinite(p.price)&&p.price>=0&&p.stock>0&&p.price<=context.constraints.budget&&(!context.constraints.rain||p.features.includes('rain'))&&(!context.constraints.size||p.size===context.constraints.size)&&p.variantId&&Date.now()-Date.parse(p.verifiedAt)<300000&&Date.parse(p.verifiedAt)<=Date.now()+5000;}
export async function search({owner,thread,query,provider,mode,state,allowSharing=false},override){
 if(!['openai','claude','grok'].includes(provider))throw new Error('Unknown search provider');
 if(mode==='live'&&!allowSharing)throw new Error('Approve sharing scoped memory before a live search.');
 const io=override||adapters({mode,state}); const audit={id:randomUUID(),owner,threadId:thread.id,mode,provider,at:new Date().toISOString(),steps:[]};
 const combined=thread.messages.filter(m=>m.role==='user').map(m=>m.text).join(' ')+' '+query;
 const kind=/jacket|blazer|conference/i.test(combined)?'jacket':'backpack';
 const constraints=constraintsFrom(query,thread.constraints);if(!Number.isFinite(constraints.budget)||constraints.budget<=0||constraints.budget>100000)throw new Error('Budget must be between $1 and $100,000');
 const scope={owner,query:combined,kind,types:['preference','ownership','event']};
 const raw=await io.retrieve(scope);
 const memories=raw.filter(m=>m.owner===owner&&m.authorized===true&&scope.types.includes(m.type)&&typeof m.source==='string'&&m.source&&typeof m.text==='string'&&typeof m.id==='string'&&Array.isArray(m.tags)).filter(m=>m.tags.some(t=>combined.toLowerCase().includes(t)||t===kind)).map(m=>({id:m.id,type:m.type,text:m.text,source:m.source,features:Array.isArray(m.features)?m.features:[],date:m.date}));
 const context={requestId:audit.id,owner,query:combined,kind,constraints,memories}; audit.context=context;
 audit.steps.push({stage:'Cognee retrieval',status:mode==='demo'?'simulated':'completed',memoryIds:memories.map(m=>m.id)});
 const discovery=await io.discover(provider,context);if(!Array.isArray(discovery.candidates)||!Array.isArray(discovery.queries))throw new Error('Invalid discovery response');
 const candidates=discovery.candidates.filter(c=>typeof c.productId==='string'&&typeof c.variantId==='string'&&Array.isArray(c.citations)&&c.citations.some(s=>/^https:\/\//.test(s.url||'')));
 audit.steps.push({stage:'Agent discovery',status:mode==='demo'?'simulated':'completed',queries:discovery.queries,candidateCount:candidates.length});
 const verified=await io.verify(candidates,context);
 const eligibleProducts=verified.filter(p=>candidates.some(c=>c.productId===p.id&&c.variantId===p.variantId)&&Array.isArray(p.features)&&eligible(p,context)).map(p=>({...p,citations:candidates.find(c=>c.productId===p.id&&c.variantId===p.variantId).citations}));
 audit.steps.push({stage:'Variant & commerce verification',status:mode==='demo'?'simulated':'completed',eligible:eligibleProducts.map(p=>p.variantId),rejected:verified.filter(p=>!eligibleProducts.some(x=>x.variantId===p.variantId)).map(p=>({id:p.id,reason:p.stock<=0?'Out of stock':p.price>constraints.budget?'Over budget':'Constraint, variant, or verification mismatch'}))});
 const ranking=await io.rank(eligibleProducts,context);if(!Array.isArray(ranking.ranking))throw new Error('Invalid ranking response');
 const seen=new Set();const ranked=ranking.ranking.map(r=>{const p=eligibleProducts.find(p=>p.id===r.productId&&p.variantId===r.variantId);if(!p||seen.has(p.variantId)||!Number.isFinite(r.score))return null;seen.add(p.variantId);return {...p,score:r.score,evidence:Array.isArray(r.evidence)?r.evidence.filter(e=>memories.some(m=>m.id===e.memoryId)):[]};}).filter(Boolean).sort((a,b)=>b.score-a.score);
 audit.steps.push({stage:'Superlinked reranking',status:mode==='demo'?'simulated':'completed',ranked:ranked.map(p=>({variantId:p.variantId,score:p.score}))});
 return {products:ranked,audit,constraints,kind};
}
