import test from 'node:test';
import assert from 'node:assert/strict';
import search from '../api/search.js';
import config from '../api/config.js';
function response(){return {headers:{},statusCode:200,setHeader(k,v){this.headers[k]=v;},end(s){this.body=JSON.parse(s);}};}
test('Vercel handlers return JSON and reject wrong methods and cross-origin requests',async()=>{
 let res=response();await search({method:'GET',headers:{}},res);assert.equal(res.statusCode,405);assert(res.body.error);
 res=response();await search({method:'POST',headers:{origin:'https://other.example',host:'known.example','content-type':'application/json'},body:{}},res);assert.equal(res.statusCode,403);
 res=response();await search({method:'POST',headers:{'content-type':'application/json'},body:{owner:'other'}},res);assert.equal(res.statusCode,400);
 res=response();config({method:'GET'},res);assert.deepEqual(Object.keys(res.body.providers),['openai','claude','grok','cognee','superlinked']);assert(!JSON.stringify(res.body).includes('API_KEY'));
});
