export class MockSuperlinkedAdapter {
  async rank(products,context,{constraints=context.constraints,preferredFeatures=[]}={}) {
    const wanted=context.memories.flatMap(m=>m.features||[]);
    return products.map(p=>{
      const evidence=context.memories.filter(m=>m.features?.some(f=>p.features.includes(f))).map(m=>({memoryId:m.id,type:m.type,text:m.text,source:m.source,matchedFeatures:m.features.filter(f=>p.features.includes(f))}));
      const matched=wanted.filter(f=>p.features.includes(f)).length;
      const eventFit=context.memories.some(m=>m.type==='event'&&m.features.includes('smart'))&&p.features.includes('smart')?14:0;
      const soft=preferredFeatures.filter(f=>p.features.includes(f)).length;
      const value=constraints.sort==='price'?Math.max(0,25-p.price/20):0;
      const light=constraints.sort==='weight'&&p.weightGrams?Math.max(0,30-p.weightGrams/70):0;
      return {...p,score:Math.min(99,Math.round(45+matched*7+soft*10+eventFit+value+light)),evidence};
    }).sort((a,b)=>constraints.sort==='price'?a.price-b.price:constraints.sort==='weight'?(a.weightGrams??Infinity)-(b.weightGrams??Infinity):b.score-a.score||a.price-b.price);
  }
}
