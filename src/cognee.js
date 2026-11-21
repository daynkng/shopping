import {vendorJson,serverBase,IntegrationError} from './vendor-http.js';
const TYPES=['preference','ownership','event','profile','environment','filter_correction'];
export function extractRecords(payload){
 const found=[];
 function parse(text){let start=0;while((start=text.indexOf('KNOWN_RECORD:',start))>=0){start+=13;const first=text.indexOf('{',start);if(first<0)break;let depth=0,quote=false,escape=false;for(let i=first;i<text.length;i++){const c=text[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quote=false;}else if(c==='"')quote=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){try{found.push(JSON.parse(text.slice(first,i+1)));}catch{}start=i+1;break;}if(i===text.length-1)start=text.length;}if(first>=start&&start<text.length)start=first+1;}}
 function walk(v){if(typeof v==='string')parse(v);else if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object'){if(v.id&&v.owner&&v.type&&v.source)found.push(v);for(const value of Object.values(v))walk(value);}}
 walk(payload);return found;
}
export class CogneeAdapter{
 source='cognee';
 constructor({env=process.env,fetchImpl=fetch}={}){this.env=env;this.fetch=fetchImpl;}
 config(owner){const id=this.env['COGNEE_'+owner.toUpperCase()+'_DATASET_ID'];if(!['maya','jordan'].includes(owner)||!id)throw new IntegrationError(`Configure the ${owner} Cognee dataset first.`);if(!this.env.COGNEE_API_KEY)throw new IntegrationError('Connect Cognee in Settings first.');const other=this.env['COGNEE_'+(owner==='maya'?'JORDAN':'MAYA')+'_DATASET_ID'];if(id===other)throw new IntegrationError('Each persona needs a separate Cognee dataset.');return {id,base:serverBase(this.env.COGNEE_BASE_URL,'COGNEE_BASE_URL'),headers:{'X-Api-Key':this.env.COGNEE_API_KEY}};}
 async request(owner,path,options={}){const c=this.config(owner);return vendorJson('Cognee',c.base+path,{...options,headers:{...c.headers,...options.headers}},this.fetch);}
 async retrieve({owner,query='',kind,savedPreferenceIds=[]}){
  const {id}=this.config(owner);
  const questions=[`Home city lifestyle commute and sample weather scenario for ${owner}`,`${query||'preferences ownership upcoming events'} ${kind||''} personal preferences ownership events`];
  const responses=await Promise.all(questions.map(query=>this.request(owner,'/api/v1/search',{method:'POST',headers:{'Content-Type':'application/json'},timeoutMs:12000,body:JSON.stringify({query,searchType:'CHUNKS',datasetIds:[id],topK:20})})));
  const byId=new Map();for(const r of responses.flatMap(extractRecords)){if(r.owner!==owner||r.authorized!==true||!TYPES.includes(r.type)||typeof r.id!=='string'||typeof r.text!=='string'||typeof r.source!=='string'||!r.source||!r.capturedAt||!Array.isArray(r.tags))continue;const prior=byId.get(r.id);byId.set(r.id,{...r,features:Array.isArray(r.features)?r.features.filter(f=>typeof f==='string'):[],saved:!!(r.saved||prior?.saved),retrievedFrom:{service:'Cognee',datasetId:id}});}
  const records=[...byId.values()],p=records.find(r=>r.type==='profile'),w=records.find(r=>r.type==='environment');const profile=p?{...p.value,recordId:p.id,source:p.source,capturedAt:p.capturedAt,retrievedFrom:p.retrievedFrom}:null,weather=w?{...w.value,recordId:w.id,capturedAt:w.capturedAt,retrievedFrom:w.retrievedFrom}:null;
  if(typeof profile?.city!=='string'||typeof profile?.lifestyle!=='string'||!Number.isFinite(weather?.fahrenheit)||!Number.isFinite(weather?.celsius)||!weather?.scenarioDate||!weather?.source)throw new IntegrationError('Cognee has no source-backed persona profile and weather records yet. Check the selected datasets and indexing in Settings.');
  const memories=records.filter(r=>['preference','ownership','event','filter_correction'].includes(r.type)&&(!kind||r.tags.includes(kind)||r.tags.some(t=>query.toLowerCase().includes(t))));
  return {profile,weather,memories,source:'cognee'};
 }
 async add(owner,record,filename=record.id+'.txt'){
  const {id}=this.config(owner);const form=new FormData();form.append('datasetId',id);form.append('data',new Blob(['KNOWN_RECORD:'+JSON.stringify(record)],{type:'text/plain'}),filename);
  return this.request(owner,'/api/v1/add',{method:'POST',body:form,timeoutMs:25000});
 }
 async savePreference(owner,memoryId){const result=await this.retrieve({owner,query:memoryId});const memory=result.memories.find(m=>m.id===memoryId);if(!memory||memory.type!=='preference')throw new IntegrationError('Retrieve an authorized preference before saving it.',400);const {retrievedFrom,...record}=memory;await this.add(owner,{...record,saved:true},memoryId+'-saved.txt');const {id}=this.config(owner);await this.request(owner,'/api/v1/cognify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dataset_ids:[id],run_in_background:true})});return {accepted:true,indexing:true,memoryId};}
 async test(owner){await this.retrieve({owner,query:'preferences'});return {detail:`Retrieved source-backed ${owner} records.`};}
}
