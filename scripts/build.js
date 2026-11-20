import {mkdir,rm,cp,readdir,readFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});await cp('public','dist',{recursive:true});
await mkdir('dist/src',{recursive:true});
// Explicit allowlist: no server modules or credentials enter the browser bundle.
for(const file of ['seed.js','catalog.js','sample-context.js','catalog-engine.js'])await cp('src/'+file,'dist/src/'+file);
console.log('Built Known static client into dist; api/ is deployed as Vercel Functions.');
