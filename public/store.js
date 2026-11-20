import {catalog} from '../src/catalog.js';
import {personas,memories} from '../src/seed.js';
import {emptyConstraints} from '../src/catalog-engine.js';
const KEY='known-demo-v3';
export {catalog,personas,memories,emptyConstraints};
export async function readStore(){
 const raw=localStorage.getItem(KEY);
 if(raw){try{const state=JSON.parse(raw);if(state.version!==3||!['threads','savedPreferenceIds','cart','orders'].every(k=>Array.isArray(state[k])))throw new Error();return state;}catch{throw new Error('Saved demo data could not be read. Existing browser data has been kept.');}}
 const state={version:3,threads:[],savedPreferenceIds:[],cart:[],orders:[]};
 const old=localStorage.getItem('known-demo-v2');
 if(old){try{const prior=JSON.parse(old);state.threads=(prior.threads||[]).filter(t=>personas[t.owner]).map(t=>({...makeThread(t.owner,t.title),kind:t.kind==='jacket'?'jacket':'backpack',messages:(t.messages||[]).filter(m=>m.role==='user').map(m=>({id:crypto.randomUUID(),role:'user',text:String(m.text)})),needsRefresh:true}));state.savedPreferenceIds=(prior.savedPreferenceIds||[]).filter(id=>memories.some(m=>m.id===id&&m.type==='preference'));state.cart=(prior.cart||[]).filter(c=>personas[c.owner]&&catalog.some(p=>p.id===c.product?.id)).map(c=>({...c,product:catalog.find(p=>p.id===c.product.id)}));state.orders=(prior.orders||[]).filter(o=>personas[o.owner]);}catch{throw new Error('Older demo data could not be migrated. Original browser data has been kept.');}}
 for(const owner of Object.keys(personas))if(!state.threads.some(t=>t.owner===owner))state.threads.push(makeThread(owner,'Everyday backpack'));
 writeStore(state);return state;
}
export function writeStore(state){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{throw new Error('Your browser could not save this change. Enable site storage or free some space, then try again.');}}
export function makeThread(owner,title='New shopping thread'){return {id:crypto.randomUUID(),owner,title,kind:'backpack',constraints:emptyConstraints(),messages:[]};}
export function resetPersona(state,owner){state.threads=state.threads.filter(t=>t.owner!==owner);state.threads.push(makeThread(owner,'Everyday backpack'));state.cart=state.cart.filter(c=>c.owner!==owner);}
