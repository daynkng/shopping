import {catalog} from '../src/catalog.js';
import {personas,memories} from '../src/seed.js';
import {catalogPreview,emptyConstraints} from '../src/catalog-engine.js';
const KEY='known-demo-v2';
export {catalog,personas,memories,emptyConstraints,catalogPreview};
export async function readStore(){
 const raw=localStorage.getItem(KEY);
 if(raw){try{const state=JSON.parse(raw);if(state.version!==2||!Array.isArray(state.threads)||!Array.isArray(state.savedPreferenceIds)||!Array.isArray(state.cart)||!Array.isArray(state.orders))throw new Error();return state;}catch{throw new Error('Saved demo data could not be read. Your existing browser data has been kept. Clear this site’s storage to start a new demo.');}}
 const state={version:2,threads:[],savedPreferenceIds:[],cart:[],orders:[]};
 for(const owner of Object.keys(personas)){
  const result=await catalogPreview(catalog,{owner});
  state.threads.push({id:crypto.randomUUID(),owner,title:'Everyday backpack',kind:'backpack',constraints:emptyConstraints(),messages:[{role:'user',text:'Find me a backpack'},{role:'assistant',text:'A few options for your everyday.',...result}]});
 }
 writeStore(state);return state;
}
export function writeStore(state){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{throw new Error('Your browser could not save this change. Free some storage or enable site storage, then try again.');}}
export function makeThread(owner,title='New shopping thread'){return {id:crypto.randomUUID(),owner,title,kind:'backpack',constraints:emptyConstraints(),messages:[]};}
