import {mergeLearning} from '../src/learning.js';
import {sessionEnv,connectionMetadata} from '../src/session-connections.js';
import {contextAdapter} from '../src/integrations.js';
import {personas} from '../src/seed.js';
import {inputJson,send,fail} from '../src/http-api.js';
export default async function handler(req,res){try{const b=await inputJson(req);if(!Object.hasOwn(personas,b.owner))throw new Error('Unknown persona.');if(typeof(b.query||'')!=='string'||(b.query||'').length>2000)throw new Error('Invalid memory query.');const data=await contextAdapter(sessionEnv(req)).retrieve({owner:b.owner,query:b.query||'',kind:null,savedPreferenceIds:Array.isArray(b.savedPreferenceIds)?b.savedPreferenceIds:[]});send(res,200,mergeLearning({...data,owner:b.owner,kind:null},Array.isArray(b.learning)?b.learning:[]));}catch(e){fail(res,e);}}
