import {sessionEnv,connectionMetadata} from '../src/session-connections.js';
import {connections} from '../src/integrations.js';
import {send,fail} from '../src/http-api.js';
export default function handler(req,res){if(req.method!=='GET')return send(res,405,{error:'Use GET.'});try{send(res,200,{providers:connections(sessionEnv(req)),connections:connectionMetadata(req),contextSource:sessionEnv(req).CONTEXT_SOURCE||'sample'});}catch(e){fail(res,e);}}
