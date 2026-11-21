const allowed=new Set(['shopping_search_requested','filter_auto_applied','auto_filter_removed','filter_suppression_saved','shopping_results_displayed','ranking_explanation_viewed','product_added_to_cart','filter_changed','memory_approved','memory_dismissed','memory_synchronized']);
export function track(state,eventType,{owner,threadId,properties={},dedupe}={}){
 if(!allowed.has(eventType))return;state.events||=[];if(dedupe&&state.events.some(e=>e.dedupe===dedupe))return;
 // Explicit allowlist prevents keys and conversation/context text entering analytics.
 const safe=Object.fromEntries(Object.entries(properties).filter(([k])=>['filterKey','productId','memoryId','resultCount','kind','scope','action','source','resultId'].includes(k)));
 state.events.push({id:crypto.randomUUID(),event_type:eventType,timestamp:new Date().toISOString(),user_id:owner,thread_id:threadId,properties:safe,...(dedupe?{dedupe}:{})});
}
