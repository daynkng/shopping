import {personaRecords} from '../src/seed.js';
import {CogneeAdapter} from '../src/cognee.js';
import {vendorJson,serverBase} from '../src/vendor-http.js';
const env=process.env;
if(!env.COGNEE_API_KEY)throw new Error('Set COGNEE_API_KEY and COGNEE_BASE_URL first.');
const base=serverBase(env.COGNEE_BASE_URL,'COGNEE_BASE_URL');const headers={'X-Api-Key':env.COGNEE_API_KEY,'Content-Type':'application/json'};
const listing=await vendorJson('Cognee',base+'/api/v1/datasets/',{headers});const datasets=Array.isArray(listing)?listing:listing.datasets;
if(!Array.isArray(datasets))throw new Error('Cognee returned an unreadable dataset list.');
const configured={...env};
for(const owner of ['maya','jordan']){
 const name=(env.COGNEE_DATASET_PREFIX||'known-demo')+'-'+owner;const key='COGNEE_'+owner.toUpperCase()+'_DATASET_ID';let id=env[key];
 if(!id){const found=datasets.find(d=>d.name===name);if(found)id=found.id;else{const created=await vendorJson('Cognee',base+'/api/v1/datasets/',{method:'POST',headers,body:JSON.stringify({name})});id=created.id||created.dataset?.id;}}
 if(!id)throw new Error('Cognee did not return a dataset ID.');configured[key]=id;console.log(key+'='+id);
}
if(configured.COGNEE_MAYA_DATASET_ID===configured.COGNEE_JORDAN_DATASET_ID)throw new Error('Persona datasets must be different.');
const adapter=new CogneeAdapter({env:configured});
for(const owner of ['maya','jordan']){
 for(const record of personaRecords(owner))await adapter.add(owner,record);
 await adapter.request(owner,'/api/v1/cognify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dataset_ids:[configured['COGNEE_'+owner.toUpperCase()+'_DATASET_ID']],run_in_background:true})});
 const deadline=Date.now()+180000;let ready=false;
 while(Date.now()<deadline){try{const data=await adapter.retrieve({owner,query:'preferences ownership upcoming conference',kind:null});if(data.memories.length>=5){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,3000));}
 if(!ready)throw new Error(owner+' is still indexing. Re-run setup:cognee later; identical records are safe to ingest again.');
 console.log(owner+' profile, weather and memory retrieval verified.');
}
console.log('Copy the dataset IDs above into Vercel and set CONTEXT_SOURCE=cognee to use them.');
