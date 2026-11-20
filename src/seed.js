export const personas = {
 maya: {id:'maya',name:'Maya',role:'The city commuter',description:'Design lead · Seattle · Commutes by bike',initials:'ML',color:'#287968'},
 jordan: {id:'jordan',name:'Jordan',role:'The everyday organizer',description:'Parent of two · Portland · Always on the move',initials:'JP',color:'#946442'}
};
const m=(owner,id,type,text,tags,source,extra={})=>({owner,id,type,text,tags,source,authorized:true,...extra});
export const memories = [
 m('maya','m1','preference','Minimal design, dark colors, and a protected 16-inch laptop sleeve.',['backpack','minimal','laptop'],'Style preferences · Nov 12',{features:['minimal','laptop'],saved:true}),
 m('maya','m2','preference','I bike to work in Seattle, so rain protection matters.',['backpack','jacket','rain'],'Commute conversation · Nov 14',{features:['rain'],saved:true}),
 m('maya','m3','ownership','My old commuter bag has a broken zipper; I already own a bulky hiking pack.',['backpack'],'Purchase history · Oct 8',{features:['minimal']}),
 m('maya','m4','event','Design Forward conference, Dec 4–6. Presenting on stage, traveling with carry-on only.',['jacket','conference'],'Calendar · Design Forward',{features:['smart','packable'],date:'2026-12-04'}),
 m('maya','m5','preference','Prefer wrinkle-resistant layers that work for a presentation and dinner.',['jacket','conference'],'Travel notes · Nov 16',{features:['smart','packable'],saved:false}),
 m('jordan','j1','preference','Easy-clean materials and separate compartments for family essentials.',['backpack','organizer'],'Family shopping notes · Nov 9',{features:['organizer','easyclean'],saved:true}),
 m('jordan','j2','preference','Keep things practical and affordable. I like lightweight, roomy bags.',['backpack'],'Shopping chat · Nov 11',{features:['roomy','light'],saved:true}),
 m('jordan','j3','ownership','I own a small daypack that cannot fit snacks and two water bottles.',['backpack'],'Ownership review · Nov 10',{features:['roomy']}),
 m('jordan','j4','event','Education Summit, Dec 8–9. School visits and outdoor activities between sessions.',['jacket','conference'],'Calendar · Education Summit',{features:['rain','easyclean'],date:'2026-12-08'}),
 m('jordan','j5','preference','Washable, comfortable layers for all-day movement.',['jacket','conference'],'Wardrobe conversation · Nov 15',{features:['easyclean','light'],saved:false}),
 m('jordan','private','preference','Private medical note', ['backpack'],'Private dataset',{authorized:false,features:[]})
];
const p=(id,name,kind,price,features,color,desc,stock=10)=>({id,variantId:id+'-standard',name,kind,price,currency:'USD',features,color,description:desc,stock,size:kind==='jacket'?'M':'One size',url:'https://example.com/products/'+id,merchant:'Known Demo Supply'});
export const products=[
 p('metro','Metro Commuter','backpack',119,['minimal','laptop','rain'],'#344940','A streamlined 22L pack. Weather-resistant shell, padded 16-inch laptop sleeve.'),
 p('family','Day Together Organizer','backpack',109,['organizer','easyclean','roomy'],'#c18c55','28L of everyday possibility. Wipe-clean lining, bottle pockets, thoughtful compartments.'),
 p('everyday','Everyday Light','backpack',79,['light','minimal'],'#a0b1b9','A lighter way to go. An uncomplicated 18L companion for your daily essentials.'),
 p('trail','Trail Weekender','backpack',159,['rain','roomy'],'#8d7660','A rugged 35L outdoor bag. Outside the initial budget.'),
 p('soldout','City Shell','backpack',99,['minimal','laptop','rain'],'#606676','A limited edition commuter pack.',0),
 p('studio','Studio Travel Blazer','jacket',139,['smart','packable','minimal'],'#484e60','Soft tailoring, wrinkle-resistant fabric, and a carry-on friendly fold.'),
 p('field','Field Day Jacket','jacket',99,['rain','easyclean','light'],'#8f9e73','A washable weather-resistant layer for busy days and outdoor breaks.'),
 p('classic','Everywhere Overshirt','jacket',89,['minimal','easyclean'],'#b4a08b','A versatile cotton layer for a relaxed conference wardrobe.')
];
export function newState(){return {version:1,memories:structuredClone(memories),threads:[],cart:[],orders:[],audits:[]};}
