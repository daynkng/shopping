import {connections} from '../src/integrations.js';
import {send,fail} from '../src/http-api.js';
export default function handler(req,res){if(req.method!=='GET')return send(res,405,{error:'Use GET.'});try{send(res,200,{providers:connections(),contextSource:process.env.CONTEXT_SOURCE||'sample'});}catch(e){fail(res,e);}}
