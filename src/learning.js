export const learningTypes=['preference','ownership','event','filter_correction'];
export function validateLearning(r,owner){
 if(!r||r.owner!==owner||!learningTypes.includes(r.type)||r.approved!==true||typeof r.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(r.id)||typeof r.text!=='string'||!r.text.trim()||r.text.length>1500||typeof r.originalText!=='string'||r.originalText.length>2000||!r.threadId||!r.messageId||!/^\d{4}-\d{2}-\d{2}T/.test(r.capturedAt||''))throw new Error('Approve a source-backed memory for this profile before saving.');
 if(r.type==='filter_correction'&&(r.filterKey!=='rain'||r.autoApply!==false))throw new Error('Invalid filter correction.');
 return {id:r.id,owner,type:r.type,text:r.text.trim(),originalText:r.originalText,threadId:String(r.threadId).slice(0,100),messageId:String(r.messageId).slice(0,100),capturedAt:r.capturedAt,approved:true,authorized:true,saved:true,tags:Array.isArray(r.tags)?r.tags.filter(t=>['backpack','tote','jacket'].includes(t)):[],features:Array.isArray(r.features)?r.features.filter(f=>typeof f==='string'&&f.length<30):[],source:`Conversation · ${String(r.threadId).slice(0,100)} / ${String(r.messageId).slice(0,100)}`,...(r.type==='filter_correction'?{filterKey:'rain',autoApply:false}:{})};
}
export function suggestLearning(text,{owner,threadId,messageId,kind}){
 if(/\b(?:this time|this purchase|for now|for this|today only)\b/i.test(text))return [];
 let type;if(/\b(?:I prefer|I like|I always|remember that|my preference)\b/i.test(text))type='preference';else if(/\b(?:I own|I already have|I bought|my .+ broke)\b/i.test(text))type='ownership';else if(/\b(?:I am attending|I'm attending|my conference is|I have .+ on \d)\b/i.test(text))type='event';else return [];
 // A purchase-specific maximum price is not automatically made a lasting preference.
 if(/\b(?:under|below|max|budget)\s*\$?\d/i.test(text))return [];
 const features=[];if(/zip[- ]?top|zipper|zip closure/i.test(text))features.push('ziptop');if(/minimal/i.test(text))features.push('minimal');if(/washable|easy.clean/i.test(text))features.push('easyclean');if(/rain|water.resistan/i.test(text))features.push('rain');if(/organizat|compartment/i.test(text))features.push('organizer');
 return [{id:'learn-'+crypto.randomUUID(),owner,threadId,messageId,type,text:text.trim(),originalText:text,kind,tags:[kind],features,capturedAt:new Date().toISOString(),approved:false}];
}
export function mergeLearning(context,records=[]){
 const accepted=records.slice(-100).map(r=>{try{return validateLearning(r,context.owner);}catch{return null;}}).filter(r=>r&&(!context.kind||!r.tags.length||r.tags.includes(context.kind)));
 const known=new Set(context.memories.map(m=>m.id));return {...context,memories:[...context.memories,...accepted.filter(r=>!known.has(r.id))]};
}
