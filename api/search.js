import {searchRequest} from '../src/search-service.js';
export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 const send=(status,body)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(body));};
 if(req.method!=='POST')return send(405,{error:'Use POST for a search.'});
 const origin=req.headers.origin;if(origin){try{if(new URL(origin).host!==req.headers.host)return send(403,{error:'This request must come from Known.'});}catch{return send(403,{error:'Invalid request origin.'});}}
 if(!req.headers['content-type']?.includes('application/json'))return send(415,{error:'JSON required.'});
 try{
  let input=req.body;
  if(input===undefined){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>64000)return send(413,{error:'Conversation is too large.'});}input=JSON.parse(raw);}
  if(typeof input==='string')input=JSON.parse(input);
  if(JSON.stringify(input).length>64000)return send(413,{error:'Conversation is too large.'});
  return send(200,await searchRequest(input));
 }catch(e){return send(e.status||400,{error:e.name==='TimeoutError'?'The search took too long. Please try again.':e.message||'Search unavailable.'});}
}
