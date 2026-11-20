import {personaRecords} from './seed.js';
export class SampleContextAdapter{
 source='sample';
 async retrieve({owner,query='',kind,savedPreferenceIds=[]}){
  const records=personaRecords(owner);const p=records.find(m=>m.type==='profile'),w=records.find(m=>m.type==='environment');const profile={...p.value,recordId:p.id,source:p.source,capturedAt:p.capturedAt},weather={...w.value,recordId:w.id,capturedAt:w.capturedAt};
  const found=records.filter(m=>['preference','ownership','event'].includes(m.type)&&(!query&&!kind||m.tags.some(t=>t===kind||query.toLowerCase().includes(t))||m.text.toLowerCase().includes(query.toLowerCase()))).map(m=>({...structuredClone(m),saved:m.saved||savedPreferenceIds.includes(m.id)}));
  return {profile,weather,memories:found,source:'sample'};
 }
}
