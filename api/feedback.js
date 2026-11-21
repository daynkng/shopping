import {inputJson,send,fail} from '../src/http-api.js';
import {sessionEnv} from '../src/session-connections.js';
import {validateLearning} from '../src/learning.js';
import {CogneeAdapter} from '../src/cognee.js';
export default async function handler(req,res){try{const b=await inputJson(req);if(!['maya','jordan'].includes(b.owner))throw new Error('Unknown profile.');const record=validateLearning(b.record,b.owner);if(b.sync===true){const adapter=new CogneeAdapter({env:sessionEnv(req)});await adapter.add(b.owner,record,'feedback-'+record.id+'.txt');const {id}=adapter.config(b.owner);await adapter.request(b.owner,'/api/v1/cognify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dataset_ids:[id],run_in_background:true})});return send(res,200,{id:record.id,accepted:true,synced:true,indexing:true});}send(res,200,{id:record.id,accepted:true,synced:false,indexing:false});}catch(e){fail(res,e);}}
