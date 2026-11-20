import {memories as seeds} from './seed.js';
export class MockCogneeAdapter {
  async retrieve({owner,query,kind,savedPreferenceIds=[]}) {
    const words=query.toLowerCase();
    return seeds.filter(m=>m.owner===owner&&m.authorized&&['preference','ownership','event'].includes(m.type)&&m.tags.some(t=>t===kind||words.includes(t)))
      .map(m=>({...structuredClone(m),saved:m.saved||savedPreferenceIds.includes(m.id)}));
  }
}
