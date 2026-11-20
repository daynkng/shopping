import {CatalogAgent,agentDefinitions} from './agents.js';
import {SampleContextAdapter} from './sample-context.js';
import {CogneeAdapter} from './cognee.js';
import {SuperlinkedRanker} from './superlinked.js';
import {IntegrationError} from './vendor-http.js';
export function contextAdapter(env=process.env){const source=env.CONTEXT_SOURCE||'sample';if(!['sample','cognee'].includes(source))throw new IntegrationError('CONTEXT_SOURCE must be sample or cognee.');return source==='cognee'?new CogneeAdapter({env}):new SampleContextAdapter();}
export function connections(env=process.env){return {...Object.fromEntries(Object.entries(agentDefinitions).map(([key,d])=>[key,{configured:!!env[d.key],model:env[d.modelKey]||d.model}])),cognee:{configured:!!(env.COGNEE_API_KEY&&env.COGNEE_BASE_URL&&env.COGNEE_MAYA_DATASET_ID&&env.COGNEE_JORDAN_DATASET_ID),optional:(env.CONTEXT_SOURCE||'sample')==='sample'},superlinked:{configured:!!env.SUPERLINKED_API_KEY,model:env.SUPERLINKED_MODEL||'Qwen/Qwen3-Reranker-0.6B'}};}
export async function testConnection(integration,owner,{env=process.env,fetchImpl=fetch}={}){
 let result;if(Object.hasOwn(agentDefinitions,integration))result=await new CatalogAgent(integration,{env,fetchImpl}).test();
 else if(integration==='cognee')result=await new CogneeAdapter({env,fetchImpl}).test(owner);
 else if(integration==='superlinked')result=await new SuperlinkedRanker({env,fetchImpl}).test();
 else throw new IntegrationError('Unknown integration.',400);
 return {integration,ok:true,checkedAt:new Date().toISOString(),...result};
}
