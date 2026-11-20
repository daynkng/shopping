import {contextAdapter} from '../src/integrations.js';
import {personas} from '../src/seed.js';
import {inputJson,send,fail} from '../src/http-api.js';
export default async function handler(req,res){try{const b=await inputJson(req);if(!Object.hasOwn(personas,b.owner)||typeof b.memoryId!=='string'||b.memoryId.length>180)throw new Error('Invalid preference.');const adapter=contextAdapter();if(adapter.source==='cognee')return send(res,200,await adapter.savePreference(b.owner,b.memoryId));const data=await adapter.retrieve({owner:b.owner});if(!data.memories.some(m=>m.id===b.memoryId&&m.type==='preference'))throw new Error('Only a retrieved preference can be added.');send(res,200,{accepted:true,indexing:false,memoryId:b.memoryId});}catch(e){fail(res,e);}}
