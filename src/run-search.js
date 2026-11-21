import {catalog} from './catalog.js';
import {personas} from './seed.js';
import {category,emptyConstraints,validateConstraints,retrieveContext,rankCandidates} from './catalog-engine.js';
import {intentSchema} from './intent-schema.js';
import {SampleContextAdapter} from './sample-context.js';
import {BuiltinAgent,BuiltinRanker,parseQuery} from './builtin.js';
import {mergeLearning} from './learning.js';
import {policyFor,enforcePolicy} from './policy.js';
const ids=catalog.map(p=>p.id),features=intentSchema.properties.preferredFeatures.items.enum;
export async function runSearch(input,{agent,cognee,ranker}={}){
 if(!input||!Object.hasOwn(personas,input.owner))throw new Error('Unknown profile.');
 const provider=input.provider||'builtin';if(!['builtin','openai','claude','grok'].includes(provider))throw new Error('Unknown shopping agent.');
 agent ||= provider==='builtin'?new BuiltinAgent():null;cognee ||= new SampleContextAdapter();ranker ||= provider==='builtin'?new BuiltinRanker():null;if(!agent||!ranker)throw new Error('Connect the selected services in Settings.');
 const query=String(input.query||'').trim();if(!query||query.length>2000)throw new Error('Enter a shopping request of 1–2000 characters.');
 const messages=Array.isArray(input.messages)?input.messages.slice(-12).map(m=>({role:m.role==='assistant'?'assistant':'user',text:String(m.text||'').slice(0,2000)})):[];
 const kind=category(query,['backpack','tote','jacket'].includes(input.kind)?input.kind:'backpack');
 let prior=validateConstraints(input.constraints||emptyConstraints(),ids);if(input.kind&&kind!==input.kind)prior=emptyConstraints();
 const data=await retrieveContext({owner:input.owner,query,kind,constraints:prior,savedPreferenceIds:Array.isArray(input.savedPreferenceIds)?input.savedPreferenceIds:[]},cognee);
 let context=mergeLearning(data,Array.isArray(input.learning)?input.learning:[]);
 const previousResultIds=Array.isArray(input.previousResultIds)?input.previousResultIds.filter(id=>ids.includes(id)).slice(0,8):[];
 const interpretation=parseQuery(query,context,{previousResultIds});
 const patch=input.filterPatch;
 let explicitAdds=interpretation.explicitAdds||[],explicitRemoves=interpretation.explicitRemoves||[];
 if(patch){const next=validateConstraints({...prior,...patch},ids);explicitAdds=next.features.filter(f=>!prior.features.includes(f));explicitRemoves=prior.features.filter(f=>!next.features.includes(f));context={...context,constraints:next};}
 const policy=policyFor(context,{suppressions:Array.isArray(input.suppressions)?input.suppressions:[],filterOrigins:input.filterOrigins||{},explicitAdds,explicitRemoves});
 context={...context,constraints:policy.constraints,feedback:{suppressions:input.suppressions||[],filterOrigins:policy.filterOrigins}};
 const intent=await agent.discover(context,{messages:[...messages,{role:'user',text:query}],previousResultIds});
 if(intent.clarification){if(typeof intent.clarification!=='string'||intent.clarification.length>500)throw new Error('Invalid clarification.');return {reply:intent.clarification,clarification:true,kind,constraints:prior,filterOrigins:policy.filterOrigins,audit:{context,steps:[{stage:context.contextSource,execution:context.contextSource==='sample'?'sample':'live'},{stage:provider,execution:provider==='builtin'?'local':'live',clarification:true}]}};}
 if(intent.kind!==kind||typeof intent.reply!=='string'||intent.reply.length>2000||!Array.isArray(intent.preferredFeatures)||intent.preferredFeatures.some(f=>!features.includes(f)))throw new Error('The agent returned an invalid shopping intent.');
 let constraints=validateConstraints(intent.constraints,ids);if(patch)constraints=validateConstraints({...constraints,...patch},ids);
 constraints=enforcePolicy(constraints,policy,{explicitAdds,explicitRemoves});
 const result=await rankCandidates({catalog,context,candidateIds:intent.candidateIds,constraints,preferredFeatures:intent.preferredFeatures,ranker});result.audit.steps[1]={...result.audit.steps[1],stage:provider==='builtin'?'Built-in catalog search':provider+' discovery',execution:provider==='builtin'?'local':'live',query:String(intent.searchQuery||query).slice(0,1000)};
 const origins=Object.fromEntries(constraints.features.map(f=>[f,policy.filterOrigins[f]||'user']));
 return {...result,filterOrigins:origins,candidateCount:result.audit.steps[2].eligibleIds.length,reply:result.products.length?(provider==='builtin'?kind==='tote'?'Work totes that fit your day.':kind==='jacket'?'Layers for your next chapter.':'A few finds for your everyday.':intent.reply):'No products fit those requirements. Try removing a filter or adjusting the budget.'};
}
