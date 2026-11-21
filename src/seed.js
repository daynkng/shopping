export const personas={
 maya:{id:'maya',name:'Maya',role:'The city commuter',description:'Design lead · Seattle · Bikes to work',initials:'ML',color:'#287968',city:'Seattle, Washington',lifestyle:'Bikes to work with a 16-inch laptop. Wants compact gear that works from commute to presentation.',weather:{scenarioDate:'2026-12-04',fahrenheit:46,celsius:8,conditions:'Rain and cool wind',source:'Sample weather scenario — not a forecast'},jacket:'A rain-aware, presentation-ready layer for a carry-on trip.'},
 jordan:{id:'jordan',name:'Jordan',role:'The everyday organizer',description:'Parent of two · Austin · School, work & family',initials:'JP',color:'#946442',city:'Austin, Texas',lifestyle:'Drives between school, work, and family activities. Carries snacks, water bottles, and everyday essentials.',weather:{scenarioDate:'2026-12-08',fahrenheit:75,celsius:24,conditions:'Mostly dry with warm afternoons',source:'Sample weather scenario — not a forecast'},jacket:'A lighter, washable layer for conference sessions and school visits.'}
};
const record=(owner,id,type,text,tags,features,source,saved=false)=>({owner,id,type,text,tags,features,source,authorized:true,saved,capturedAt:'2026-11-20'});
export const memories=[
 record('maya','m1','preference','Minimal styling and dark colors; protect my 16-inch work laptop.',['backpack','tote'],['minimal','laptop'],'Sample profile · work and style',true),
 record('maya','m2','preference','I bike to work in Seattle and prefer rain-resistant commuting gear.',['backpack','tote','jacket'],['rain'],'Sample profile · daily commute',true),
 record('maya','m3','ownership','My commuter bag has a broken zipper. I own a bulky hiking pack already.',['backpack'],['minimal'],'Sample ownership record'),
 record('maya','m4','event','Design Forward presentation on Dec 4–6 in Seattle; carry-on travel only.',['jacket','conference'],['smart','packable'],'Sample calendar event'),
 record('maya','m5','preference','Prefer polished, packable layers for presentations and dinner.',['jacket','conference'],['smart','packable'],'Sample wardrobe conversation'),
 record('jordan','j1','preference','Practical organization, washable materials, and room for family essentials.',['backpack','jacket'],['organizer','easyclean','roomy'],'Sample family shopping profile',true),
 record('jordan','j2','preference','Prefer lighter layers and roomy bags for driving between school and family activities in Austin.',['backpack','jacket'],['light','roomy'],'Sample lifestyle conversation',true),
 record('jordan','j3','ownership','My small daypack cannot fit snacks, bottles, and two children’s essentials.',['backpack'],['roomy'],'Sample ownership record'),
 record('jordan','j4','event','Education Summit on Dec 8–9 in Austin; school visits and outdoor breaks between sessions.',['jacket','conference'],['light','easyclean'],'Sample calendar event'),
 record('jordan','j5','preference','Comfortable, washable layers for warm afternoons and air-conditioned rooms.',['jacket','conference'],['easyclean','light'],'Sample wardrobe conversation'),
 {...record('jordan','private','preference','An unauthorized record must never be retrieved.',['backpack'],[],'Excluded dataset'),authorized:false}
];
export function personaRecords(owner){const p=personas[owner];if(!p)throw new Error('Unknown persona.');return [
 {owner,id:owner+'-profile',type:'profile',text:p.city+'. '+p.lifestyle,tags:['backpack','tote','jacket'],source:'Sample persona profile',authorized:true,capturedAt:'2026-11-20',value:{city:p.city,lifestyle:p.lifestyle}},
 {owner,id:owner+'-weather',type:'environment',text:`${p.weather.fahrenheit}°F / ${p.weather.celsius}°C; ${p.weather.conditions}. Sample scenario, not a forecast.`,tags:['backpack','tote','jacket'],source:p.weather.source,authorized:true,capturedAt:'2026-11-20',value:p.weather},
 ...memories.filter(m=>m.owner===owner&&m.authorized)
];}
