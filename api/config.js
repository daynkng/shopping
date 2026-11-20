import {connections} from '../src/search-service.js';
export default function handler(req,res){res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');if(req.method!=='GET'){res.statusCode=405;return res.end(JSON.stringify({error:'Use GET.'}));}res.end(JSON.stringify({providers:connections()}));}
