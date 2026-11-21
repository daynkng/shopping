import {sessionEnv,connectionMetadata} from '../src/session-connections.js';
import {searchRequest} from '../src/search-service.js';
import {inputJson,send,fail} from '../src/http-api.js';
export default async function handler(req,res){try{send(res,200,await searchRequest(await inputJson(req),{env:sessionEnv(req)}));}catch(e){fail(res,e);}}
