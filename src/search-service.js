import {catalog} from './catalog.js';
import {personas} from './seed.js';
import {category,emptyConstraints,validateConstraints,retrieveContext,rankCandidates} from './catalog-engine.js';
import {intentSchema} from './intent-schema.js';
import {CatalogAgent,agentDefinitions} from './agents.js';
import {SuperlinkedRanker} from './superlinked.js';
import {contextAdapter} from './integrations.js';
export {intentSchema};
const ids=catalog.map(p=>p.id);
const features=intentSchema.properties.preferredFeatures.items.enum;
export async function searchRequest(input,{agent,cognee,ranker}={}) {
 if(!input||!Object.hasOwn(personas,input.owner))throw new Error('Unknown persona.');
 if(input.provider&&!Object.hasOwn(agentDefinitions,input.provider))throw new Error('Unknown shopping agent.');
 agent ||= new CatalogAgent(input.provider||'openai');
 cognee ||= contextAdapter();
 ranker ||= new SuperlinkedRanker();
 const query=String(input.query||'').trim();if(!query||query.length>2000)throw new Error('Enter a shopping request of 1–2000 characters.');
 const messages=Array.isArray(input.messages)?input.messages.slice(-12).map(m=>({role:m.role==='assistant'?'assistant':'user',text:String(m.text||'').slice(0,2000)})):[];
 const kind=category(query,input.kind==='jacket'?'jacket':'backpack');
 const prior=validateConstraints(input.constraints||emptyConstraints(),ids);
 if(!Array.isArray(input.savedPreferenceIds||[])||(input.savedPreferenceIds||[]).some(id=>typeof id!=='string'))throw new Error('Invalid saved preferences.');
 const context=await retrieveContext({owner:input.owner,query,kind,constraints:prior,savedPreferenceIds:input.savedPreferenceIds||[]},cognee);
 const previousResultIds=Array.isArray(input.previousResultIds)?input.previousResultIds.filter(id=>ids.includes(id)).slice(0,6):[];
 const intent=await agent.discover(context,{messages:[...messages,{role:'user',text:query}],previousResultIds});
 if(!['backpack','jacket'].includes(intent.kind)||typeof intent.reply!=='string'||intent.reply.length>2000||!Array.isArray(intent.preferredFeatures)||intent.preferredFeatures.some(f=>!features.includes(f)))throw new Error('The agent returned an invalid shopping intent.');
 // Explicit category changes are scoped BEFORE discovery, so discovery cannot switch to an unscoped category.
 if(intent.kind!==kind)throw new Error('Please name the product category you would like to shop for.');
 const constraints=validateConstraints(intent.constraints,ids);
 if(intent.clarification!==null&&typeof intent.clarification!=='string')throw new Error('Invalid clarification.');
 if(intent.clarification){if(typeof intent.clarification!=='string'||intent.clarification.length>500)throw new Error('Invalid clarification.');return {reply:intent.clarification,clarification:true,kind,constraints,audit:{context,steps:[{stage:context.contextSource==='cognee'?'Cognee':'Sample context',execution:context.contextSource==='cognee'?'live':'sample'},{stage:(input.provider||'openai')+' discovery',execution:'live',clarification:true}]}};}
 const result=await rankCandidates({catalog,context,candidateIds:intent.candidateIds,constraints,preferredFeatures:intent.preferredFeatures,ranker});result.audit.steps[1]={...result.audit.steps[1],stage:(input.provider||'openai')+' discovery',execution:'live',query:String(intent.searchQuery||'').slice(0,1000)};
 return {...result,reply:result.products.length?intent.reply:'No catalog products fit those requirements. Would you like to adjust them?'};
}
