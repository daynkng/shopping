import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import search from './api/search.js';
import config from './api/config.js';
import context from './api/context.js';
import preference from './api/preference.js';
import connectionTest from './api/connection-test.js';
const root=path.dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.json':'application/json'};
http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/api/search')return search(req,res);
 if(url.pathname==='/api/config')return config(req,res);
 if(url.pathname==='/api/context')return context(req,res);
 if(url.pathname==='/api/preference')return preference(req,res);
 if(url.pathname==='/api/connection-test')return connectionTest(req,res);
 try{
  const prefix=url.pathname.startsWith('/src/')?'': 'public';
  const relative=['/','/demo/maya','/demo/jordan'].includes(url.pathname.replace(/\/+$/,'')||'/')?'index.html':decodeURIComponent(url.pathname).replace(/^\//,'');
  const base=path.resolve(root,prefix),filename=path.resolve(base,relative);
  if(!filename.startsWith(base+path.sep)||(!prefix&&!url.pathname.startsWith('/src/')))throw new Error('Not found');
  const bytes=await readFile(filename);res.setHeader('Content-Type',types[path.extname(filename)]||'application/octet-stream');res.end(bytes);
 }catch{res.statusCode=404;res.end('Not found');}
}).listen(Number(process.env.PORT||4317),process.env.HOST||'127.0.0.1',()=>console.log(`Known is ready at http://${process.env.HOST||'127.0.0.1'}:${process.env.PORT||4317}`));
