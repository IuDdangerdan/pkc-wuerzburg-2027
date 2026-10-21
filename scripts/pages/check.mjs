/** Checks the deployable output and the adapter boundary without a live backend. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const out=path.resolve('pages-dist');
const html=fs.readFileSync(path.join(out,'index.html'),'utf8');
assert(html.indexOf('runtime-adapter.js')<html.indexOf('src="bootstrap.js'));
for(const [,asset] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
 if(/^https?:/.test(asset)) continue;
 assert(!asset.startsWith('/'),`Project-relative path required: ${asset}`);
 assert(fs.existsSync(path.join(out,asset.split('?')[0])),`Missing asset: ${asset}`);
}
for(const filename of ['demo-data.json','demo-orga-data.json']){
 const data=JSON.parse(fs.readFileSync(path.join(out,filename)));
 assert(data.members.every(m=>m.id.startsWith('demo-')&&m.name.startsWith('Beispiel ')));
 assert(!data.settings.whatsappNumber);
 assert(!data.me.owner);
 for(const d of data.documents) assert(fs.existsSync(path.join(out,d.url)));
 for(const h of data.hotels) for(const l of h.links||[]) if(l.url.startsWith('documents/')) assert(fs.existsSync(path.join(out,l.url)));
}
for(const file of ['style.css','festival.css']) assert(!fs.readFileSync(path.join(out,file),'utf8').includes('url("/fonts/'));
const code=fs.readFileSync('scripts/pages/runtime-adapter.js','utf8');
let calls=0;
const context=vm.createContext({window:{PKC_FRONTEND_CONFIG:{mode:'demo'}},URL,URLSearchParams,location:{href:'https://example.test/project/',origin:'https://example.test',search:''},fetch:async()=>{calls++;throw Error('Unexpected network');}});
vm.runInContext(code,context);
await assert.rejects(vm.runInContext('post({action:"planning"})',context),/Vorschau/);
await assert.rejects(vm.runInContext('uploadDocument({})',context),/Vorschau/);
assert.equal(calls,0);
vm.runInContext('pagesDemo=false;pagesConfig={mode:"backend",apiPath:"https://foreign.test/api"}',context);
assert.throws(()=>vm.runInContext('pagesAPI()',context),/derselben Adresse/);
vm.runInContext('pagesConfig={mode:"backend",apiPath:"/festival-api/data"}',context);
assert.equal(vm.runInContext('pagesAPI().pathname',context),'/festival-api/data');
await assert.rejects(vm.runInContext('pagesResponse({status:401})',context),/anmelden/);
console.log('Pages checks passed: paths, fixtures, document links, write/upload guard and backend boundary.');
