import {sessionEnv,connectionMetadata} from '../src/session-connections.js';
import {testConnection} from '../src/integrations.js';
import {personas} from '../src/seed.js';
import {inputJson,send,fail} from '../src/http-api.js';
export default async function handler(req,res){try{const b=await inputJson(req);if(!Object.hasOwn(personas,b.owner)||typeof b.integration!=='string')throw new Error('Invalid connection test.');send(res,200,await testConnection(b.integration,b.owner,{env:sessionEnv(req)}));}catch(e){fail(res,e);}}
