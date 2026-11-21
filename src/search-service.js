import {runSearch} from './run-search.js';
import {CatalogAgent} from './agents.js';
import {SuperlinkedRanker} from './superlinked.js';
import {contextAdapter} from './integrations.js';
export {intentSchema} from './intent-schema.js';
export async function searchRequest(input,{agent,cognee,ranker,env=process.env}={}){
 const provider=input?.provider||'builtin';
 if(provider!=='builtin'){agent ||= new CatalogAgent(provider,{env});ranker ||= new SuperlinkedRanker({env});}
 cognee ||= contextAdapter(env);
 return runSearch(input,{agent,cognee,ranker});
}
