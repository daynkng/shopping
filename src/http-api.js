export function send(res,status,data){res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');res.statusCode=status;res.end(JSON.stringify(data));}
export async function inputJson(req){
 if(req.method!=='POST')throw Object.assign(new Error('Use POST.'),{status:405});
 const origin=req.headers.origin;if(origin){let host;try{host=new URL(origin).host;}catch{throw Object.assign(new Error('Invalid origin.'),{status:403});}if(host!==req.headers.host)throw Object.assign(new Error('This request must come from Known.'),{status:403});}
 if(!req.headers['content-type']?.includes('application/json'))throw Object.assign(new Error('JSON required.'),{status:415});
 let body=req.body;if(body===undefined){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>64000)throw Object.assign(new Error('Request too large.'),{status:413});}body=JSON.parse(raw);}if(typeof body==='string')body=JSON.parse(body);if(!body||typeof body!=='object'||JSON.stringify(body).length>64000)throw new Error('Invalid request.');return body;
}
export const fail=(res,e)=>send(res,e.status||400,{error:e.message||'Request failed.'});
