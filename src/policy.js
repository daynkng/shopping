export function policyFor(context,{suppressions=[],filterOrigins={},explicitAdds=[],explicitRemoves=[]}={}){
 const suppressed=suppressions.filter(s=>s.owner===context.owner&&s.filterKey==='rain'&&s.autoApply===false).length>0||context.memories.some(m=>m.type==='filter_correction'&&m.filterKey==='rain'&&m.autoApply===false);
 const origins={...filterOrigins};
 let features=[...context.constraints.features];
 if(origins.rain==='inferred'&&suppressed){features=features.filter(f=>f!=='rain');delete origins.rain;}
 for(const f of explicitRemoves){features=features.filter(v=>v!==f);delete origins[f];}
 for(const f of explicitAdds){if(!features.includes(f))features.push(f);origins[f]='user';}
 const commute=context.profile.lifestyle.toLowerCase();const rainy=/rain/i.test(context.weather.conditions);
 const canInfer=context.kind==='backpack'&&rainy&&/bik|cycl/.test(commute)&&!suppressed&&!explicitRemoves.includes('rain');
 if(canInfer&&!features.includes('rain')){features.push('rain');origins.rain='inferred';}
 const c={...context.constraints,features};
 return {constraints:c,filterOrigins:origins,suppressed:!!suppressed};
}
export function enforcePolicy(constraints,policy,{explicitAdds=[],explicitRemoves=[]}={}){
 const out={...constraints,features:[...constraints.features]};
 if(policy.suppressed&&!explicitAdds.includes('rain')&&policy.filterOrigins.rain!=='user')out.features=out.features.filter(f=>f!=='rain');
 for(const f of explicitRemoves)out.features=out.features.filter(x=>x!==f);
 for(const f of explicitAdds)if(!out.features.includes(f))out.features.push(f);
 if(policy.filterOrigins.rain==='inferred'&&!policy.suppressed&&!explicitRemoves.includes('rain')&&!out.features.includes('rain'))out.features.push('rain');
 return out;
}
