const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../dist'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const [,src]of html.matchAll(/<script[^>]+src="([^"]+)"/g)){
  assert(!src.startsWith('/')&&!/^[a-z]+:/i.test(src),'Site scripts must resolve relative to a project subpath');
  assert(fs.existsSync(path.join(root,src.split('?')[0])),`Missing built script ${src}`);
}
for(const file of ['stim-worker.js','vendor/stim/stim_engine.js','vendor/stim/stim_engine.wasm','vendor/stim/LICENSE-Stim.txt','vendor/stim/BUILD.json'])assert(fs.existsSync(path.join(root,file)),`Missing Pages asset ${file}`);
const wasm=fs.readFileSync(path.join(root,'vendor/stim/stim_engine.wasm'));assert.equal(wasm.subarray(0,4).toString('hex'),'0061736d');assert(wasm.length>10000);
for(const file of ['circuit-playground.js','stim-worker.js']){const text=fs.readFileSync(path.join(root,file),'utf8');assert(!/https?:\/\/(?:localhost|127\.0\.0\.1|xps-server)/.test(text),'Runtime must not depend on a local server');}
assert.equal(JSON.parse(fs.readFileSync(path.join(root,'vendor/stim/BUILD.json'),'utf8')).version,'1.16.0');
console.log('PASS: complete static Pages artifact, relative script paths, bundled WASM and license, no local backend dependency');
