import {catalog} from './catalog.js';
export const featureWords={waterproof:'waterproof',rain:'(?:water[- ]resistant|rain[- ]resistant|rain protection)',laptop:'(?:laptop sleeve|laptop protection)',ziptop:'(?:zip[- ]top|zipper|zip closure)',smart:'(?:formal|tailored|polished)',easyclean:'(?:washable|easy[- ]clean)',roomy:'(?:roomy|spacious|large capacity)',organizer:'(?:organized|organised|compartments)',packable:'packable',minimal:'minimal(?:ist)?',light:'lightweight'};
export function parseQuery(query,context,{previousResultIds=[]}={}){
 const q=query.trim().toLowerCase();const c=structuredClone(context.constraints),adds=[],removes=[],preferred=[];let recognized=false;
 if(context.kind==='jacket'&&/conference|presentation|blazer|sportcoat/.test(q)&&!/casual|informal/.test(q)){if(!c.features.includes('smart'))c.features.push('smart');adds.push('smart');recognized=true;}
 const budget=q.match(/(?:under|below|up to|max(?:imum)?(?: price)?|budget(?: of)?)\s*\$?\s*(\d+(?:\.\d+)?)/);if(budget&&!/^\s*(?:g\b|grams?\b|kg\b|inch)/.test(q.slice(budget.index+budget[0].length))){c.budget=Number(budget[1]);recognized=true;}
 if(/(?:remove|clear|ignore|without|no) (?:the |my )?(?:budget|price limit)/.test(q)){c.budget=null;recognized=true;}
 for(const [feature,words] of Object.entries(featureWords)){
  const re=new RegExp('\\b'+words+'\\b','i');if(!re.test(q))continue;recognized=true;
  if(new RegExp('(?:not|no|without|remove|drop|don.t need|don.t want|no need for) (?:the |a |to be )?'+words,'i').test(q)){c.features=c.features.filter(f=>f!==feature);removes.push(feature);}
  else if((/\bi (?:prefer|like)\b/.test(q)||['smart','light','minimal','roomy','organizer'].includes(feature))&&!new RegExp('(?:only|must|need|require) .{0,20}'+words,'i').test(q)){preferred.push(feature);}
  else{if(!c.features.includes(feature))c.features.push(feature);adds.push(feature);}
 }
 if(/\bcheaper|less expensive|lowest price|affordable\b/.test(q)){c.sort='price';recognized=true;}
 if(/\blighter|lightest\b/.test(q)){c.sort='weight';recognized=true;}
 const laptop=q.match(/(\d+(?:\.\d+)?)\s*[- ]?inch\s*(?:work )?laptop/);if(laptop){c.minLaptopInches=Number(laptop[1]);recognized=true;}
 else if(/fits? my laptop|laptop still fits|still fits my/.test(q)){const n=(context.profile.lifestyle+' '+context.memories.map(m=>m.text).join(' ')).match(/(\d+)[- ]inch/);if(n)c.minLaptopInches=Number(n[1]);else return {clarification:'What size laptop should it fit?'};recognized=true;}
 const size=q.match(/\bsize\s+(xxl|xs|xl|s|m|l)\b/);if(size){c.size=size[1].toUpperCase();recognized=true;}
 const weight=q.match(/(?:under|below|less than)\s*(\d+)\s*(?:g|grams)\b/);if(weight){c.maxWeightGrams=Number(weight[1]);recognized=true;}
 for(const color of ['black','navy','blue','green','red','white','grey','gray','brown','olive','pink'])if(new RegExp('\\b'+color+'\\b').test(q)){recognized=true;if(new RegExp('(?:not|no|remove|without) (?:the )?'+color).test(q)){if(c.color===color)c.color=null;}else c.color=color;}
 if(/(?:any|remove|clear|no) (?:the )?color/.test(q)){c.color=null;recognized=true;}
 if(/(?:remove|clear|any) (?:the )?size/.test(q)){c.size=null;recognized=true;}
 if(/(?:remove|clear) (?:all )?filters/.test(q)){c.features=[];c.budget=null;c.color=null;c.size=null;c.minLaptopInches=null;c.maxWeightGrams=null;removes.push(...Object.keys(featureWords));recognized=true;}
 const order=q.match(/\b(first|second|third|fourth|1st|2nd|3rd|4th)\b/);let ref;
 if(order){const index={first:0,'1st':0,second:1,'2nd':1,third:2,'3rd':2,fourth:3,'4th':3}[order[1]];ref=catalog.find(p=>p.id===previousResultIds[index]);if(!ref)return {clarification:'Which product do you mean? Search first, then refer to a result.'};recognized=true;}
 let candidates=catalog.filter(p=>p.kind===context.kind);
 if(/alternative|different (?:one|option)|something else/.test(q)){recognized=true;if(!previousResultIds.length)return {clarification:'Which product would you like an alternative to?'};c.excludeIds=[...new Set([...c.excludeIds,...(ref?[ref.id]:previousResultIds)])];}
 if(/cheaper|less expensive/.test(q)&&previousResultIds.length){const baseline=ref||catalog.find(p=>p.id===previousResultIds[0]);if(baseline&&candidates.some(p=>p.price<baseline.price))candidates=candidates.filter(p=>p.price<baseline.price);}
 if(/backpack|rucksack|tote|bag|jacket|blazer|coat|conference|find|options|show|selected filters|refresh|prefer|already (?:own|have)|i own|i bought|remember that|attending/i.test(q))recognized=true;
 if(!recognized)return {clarification:'I can help with backpacks, work totes, or jackets. Try a budget, color, laptop size, or a different style.'};
 return {kind:context.kind,reply:'Here are your updated options.',clarification:null,searchQuery:query,preferredFeatures:preferred,constraints:c,candidateIds:candidates.map(p=>p.id),explicitAdds:adds,explicitRemoves:removes};
}
export class BuiltinAgent{async discover(context,previous){return parseQuery(context.query,context,previous);}}
export class BuiltinRanker{
 name="Built-in";
 async rank(products,context,{constraints=context.constraints,preferredFeatures=[]}={}){
  const wanted=context.memories.flatMap(m=>m.features||[]),rainy=/rain/i.test(context.weather.conditions);
  return products.map(p=>{const evidence=context.memories.filter(m=>m.features?.some(f=>p.features.includes(f))).map(m=>({memoryId:m.id,type:m.type,text:m.text,source:m.source,matchedFeatures:m.features.filter(f=>p.features.includes(f))}));
   const fit=wanted.filter(f=>p.features.includes(f)).length;const soft=preferredFeatures.filter(f=>p.features.includes(f)).length;
   const eventFit=context.kind==='jacket'&&p.features.includes('smart')&&context.memories.some(m=>m.type==='event'&&/present/i.test(m.text))?20:0;
   const weatherFit=rainy&&p.features.includes('rain')?4:!rainy&&p.features.includes('light')?4:0;
   const laptop=(context.profile.lifestyle+' '+context.memories.map(m=>m.text).join(' ')).match(/(\d+)[- ]inch/);const deviceFit=laptop&&p.laptopInches>=Number(laptop[1])?15:0;
   const score=fit*7+soft*30+eventFit+weatherFit+deviceFit;
   return {...p,score,evidence,ranking:{service:'Built-in',method:'Catalog attribute matching',scoredAt:new Date().toISOString()}};
  }).sort((a,b)=>constraints.sort==='price'?a.price-b.price:constraints.sort==='weight'?(a.weightGrams??Infinity)-(b.weightGrams??Infinity)||b.score-a.score:b.score-a.score||a.price-b.price);
 }
}
