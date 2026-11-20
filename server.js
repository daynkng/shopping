import http from 'node:http';
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {newState,personas,products} from './src/seed.js';
import {search,eligible} from './src/pipeline.js';
import {gateway} from './src/adapters.js';
const mode=process.env.COMMERCE_MODE||'demo';if(!['demo','live'].includes(mode))throw new Error('COMMERCE_MODE must be demo or live');
const root=path.dirname(fileURLToPath(import.meta.url)); const file=path.join(root,mode==='demo'?'.data/state.json':'.data/live-state.json');
let state;try{state=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;state=newState();if(mode==='live')state.memories=[];}
async function save(){await mkdir(path.dirname(file),{recursive:true});await writeFile(file+'.tmp',JSON.stringify(state,null,2),{mode:0o600});await rename(file+'.tmp',file);}
function threadFor(owner,title='Everyday backpack'){return {id:randomUUID(),owner,title,constraints:{budget:150,rain:false,size:null},messages:[]};}
if(mode==='demo'&&!state.threads.length){for(const owner of Object.keys(personas)){const t=threadFor(owner);state.threads.push(t);const result=await search({owner,thread:t,query:'Find me a backpack',provider:'openai',mode,state});t.messages=[{role:'user',text:'Find me a backpack'},{role:'assistant',text:'A few finds, with your everyday in mind.',...result}];state.audits.push(result.audit);}await save();}
const json=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(data));};
async function body(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>64000)throw new Error('Request too large');}return raw?JSON.parse(raw):{};}
let queue=Promise.resolve();
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
 try{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname.startsWith('/api/')){
  if(req.method==='GET'&&url.pathname==='/api/state'){const owner=url.searchParams.get('owner')||'maya';if(!personas[owner])throw new Error('Unknown persona');return json(res,200,{personas,mode,owner,threads:state.threads.filter(t=>t.owner===owner),memories:state.memories.filter(m=>m.owner===owner&&m.authorized&&(mode==='demo'?m.origin!=='live':m.origin==='live')),cart:state.cart.filter(c=>c.owner===owner),orders:state.orders.filter(o=>o.owner===owner),adapters:Object.fromEntries(['COGNEE','OPENAI','CLAUDE','GROK','COMMERCE','SUPERLINKED'].map(k=>[k,!!(process.env[k+'_GATEWAY_URL']&&process.env[k+'_GATEWAY_TOKEN'])]))});}
  if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
  if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return json(res,403,{error:'Cross-origin requests denied'});
  if(!req.headers['content-type']?.startsWith('application/json'))return json(res,415,{error:'JSON required'});
  const b=await body(req);if(!personas[b.owner])throw new Error('Unknown persona');
  // Serialize mutations to avoid persistence races and duplicate checkout.
  const run=queue.then(async()=>{
   const snapshot=structuredClone(state);
   try{
   if(url.pathname==='/api/thread'){const t=threadFor(b.owner,String(b.title||'New shopping thread').slice(0,80));state.threads.push(t);await save();return t;}
   if(url.pathname==='/api/search'){
    const t=state.threads.find(t=>t.id===b.threadId&&t.owner===b.owner);if(!t)throw new Error('Thread not found');
    const query=String(b.query||'').trim();if(!query||query.length>2000)throw new Error('Enter a request of 1–2000 characters');
    const working=structuredClone(t);if(b.constraints){const {budget,rain,size}=b.constraints;if(typeof budget!=='number'||typeof rain!=='boolean'||(size!==null&&!['XS','S','M','L','XL','XXL'].includes(size)))throw new Error('Invalid constraints');working.constraints={budget,rain,size};}
    const result=await search({owner:b.owner,thread:working,query,provider:b.provider||'openai',mode,state,allowSharing:b.allowSharing===true});
    t.constraints=result.constraints;t.title=t.messages.length?t.title:result.kind==='jacket'?'Conference jacket':query.slice(0,40);t.messages.push({role:'user',text:query},{role:'assistant',text:result.products.length?'Here’s what fits your context and this thread.':'No verified variants meet these constraints. Try adjusting your budget or requirements.',...result});state.audits.push(result.audit);await save();return result;
   }
   if(url.pathname==='/api/memory/search'){const q=String(b.query||'').toLowerCase();if(mode==='live'){const result=await gateway('COGNEE','retrieve',{owner:b.owner,query:q,types:['preference','ownership','event']});if(!Array.isArray(result.memories))throw new Error('Invalid Cognee memory response');const found=result.memories.filter(m=>m.owner===b.owner&&m.authorized===true&&['preference','ownership','event'].includes(m.type)&&m.id&&m.text&&m.source&&Array.isArray(m.tags));for(const m of found){m.origin='live';const index=state.memories.findIndex(x=>x.id===m.id&&x.owner===b.owner);if(index>=0)state.memories[index]=m;else state.memories.push(m);}await save();return {memories:found};}return {memories:state.memories.filter(m=>m.owner===b.owner&&m.authorized&&(m.text.toLowerCase().includes(q)||m.tags.some(t=>t.includes(q))))};}
   if(url.pathname==='/api/memory/save'){const m=state.memories.find(m=>m.id===b.id&&m.owner===b.owner&&m.authorized);if(!m||m.type!=='preference')throw new Error('Only a retrieved preference can be added to preferences');if(mode==='live')await gateway('COGNEE','save_preference',{owner:b.owner,memoryId:m.id,source:m.source});m.saved=true;await save();return {ok:true};}
   if(url.pathname==='/api/cart/add'){
    const t=state.threads.find(t=>t.id===b.threadId&&t.owner===b.owner);const msg=t?.messages.find(m=>m.audit?.id===b.auditId);const p=msg?.products.find(p=>p.variantId===b.variantId);if(!p)throw new Error('Verified result not found');if(state.cart.some(c=>c.owner===b.owner&&c.product.variantId===p.variantId))throw new Error('This variant is already in your cart');
    state.cart.push({id:randomUUID(),owner:b.owner,product:p,context:msg.audit.context,mode,auditId:b.auditId});await save();return {ok:true};
   }
   if(url.pathname==='/api/cart/remove'){state.cart=state.cart.filter(c=>!(c.owner===b.owner&&c.id===b.id));await save();return {ok:true};}
   if(url.pathname==='/api/checkout'){
    if(mode!=='demo')throw new Error('Real checkout is disabled in this prototype. No purchase was made.');
    const cart=state.cart.filter(c=>c.owner===b.owner);if(!cart.length)throw new Error('Your cart is empty');
    for(const c of cart){const current=products.find(p=>p.variantId===c.product.variantId);if(c.mode!=='demo'||!current||current.price!==c.product.price||!eligible({...current,verified:true,verifiedAt:new Date().toISOString()},c.context))throw new Error('Price, inventory, or constraints changed. Search again before checkout.');}
    if(!['manual','agent'].includes(b.method))throw new Error('Choose a checkout method');if(b.confirm!==true)throw new Error('Confirm the simulated order first');
    const order={id:randomUUID(),owner:b.owner,mode:'demo',method:b.method,total:cart.reduce((s,c)=>s+c.product.price,0),items:cart.map(c=>c.product),at:new Date().toISOString(),status:'Simulated order · No payment taken'};state.orders.push(order);state.cart=state.cart.filter(c=>c.owner!==b.owner);await save();return order;
   }
   throw new Error('Unknown action');
   }catch(e){state=snapshot;throw e;}
  });queue=run.catch(()=>{});return json(res,200,await run);
 }
 const routes={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};const asset=routes[url.pathname];if(!asset){res.writeHead(404);return res.end('Not found');}
 res.writeHead(200,{'content-type':asset.endsWith('.html')?'text/html':asset.endsWith('.css')?'text/css':'text/javascript'});res.end(await readFile(path.join(root,'public',asset)));
 }catch(e){json(res,400,{error:e.message});}
});
server.listen(Number(process.env.PORT||4317),process.env.HOST||'127.0.0.1',()=>console.log(`Known is ready at http://${process.env.HOST||'127.0.0.1'}:${process.env.PORT||4317} (${mode} commerce)`));
