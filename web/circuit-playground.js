const circuitPlaygroundBase=typeof document==='undefined'?null:new URL('.',document.currentScript.src);
let circuitPlaygroundSession=null;
function disposeCircuitPlayground(){if(circuitPlaygroundSession){circuitPlaygroundSession.dispose();circuitPlaygroundSession=null;}}
function circuitPlaygroundPresets(){
  const {checks,layers}=latticeRoundSchedule(3),x=checks.filter(c=>c.type==='X').map(c=>c.ancilla),ancillas=checks.map(c=>c.ancilla);
  const memory='# Distance-3 patch from Build the 2D lattice. Raw measurement records.\n'+Array.from({length:9},(_,q)=>`QUBIT_COORDS(${q%3}, ${Math.floor(q/3)}) ${q}`).join('\n')+'\nR '+Array.from({length:17},(_,q)=>q).join(' ')+'\nREPEAT 3 {\n  H '+x.join(' ')+'\n'+layers.map(g=>'  TICK\n  CX '+g.flatMap(op=>[op.control,op.target]).join(' ')).join('\n')+'\n  TICK\n  H '+x.join(' ')+'\n  MR '+ancillas.join(' ')+'\n}\nM 0 1 2 3 4 5 6 7 8\n';
  return [
    {name:'First qubit: H then measure',text:'# Each shot starts with fresh qubits.\nR 0\nH 0\nM 0\n'},
    {name:'Bell pair',text:'# Outcomes should be 00 or 11, in measurement order.\nR 0 1\nH 0\nCX 0 1\nM 0 1\n'},
    {name:'Four-data Z check: inserted X',text:'# AZ0 checks data 1, 2, 4, 5. Qubit 9 is its standalone ancilla.\nR 1 2 4 5 9\nX 1\nCX 1 9 2 9 4 9 5 9\nM 9\n'},
    {name:'Four-data X check: inserted Z',text:'# AX0 checks data 0, 1, 3, 4. Qubit 9 is its standalone ancilla.\nR 0 1 3 4 9\nH 0 1 3 4 9\nZ 0\nCX 9 0 9 1 9 3 9 4\nH 9\nM 9\n'},
    {name:'Noisy bit flip',text:'# About 10% of shots produce a 1.\nR 0\nX_ERROR(0.1) 0\nM 0\n'},
    {name:'Distance-3 memory: three rounds',text:memory}
  ];
}
function circuitOutcomeCounts(rows){
  const counts=new Map();for(const row of rows)counts.set(row,(counts.get(row)||0)+1);
  return [...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
}
function renderCircuitPlayground(root, importedCircuit=null){
  disposeCircuitPlayground();const presets=circuitPlaygroundPresets();let initial=presets[1].text;
  try{const saved=localStorage.getItem('surface-lab-circuit-v1');if(saved!==null&&saved.length<=100000)initial=saved;}catch{}
  if(importedCircuit)initial=importedCircuit.text;
  root.innerHTML=`<div class="eyebrow">RUN STIM IN YOUR BROWSER</div><h1>Circuit playground.</h1><p>Edit a Stim circuit, inspect its diagram, and sample it using the real Stim engine compiled to WebAssembly. Computation stays in this browser.</p><section class="panel"><div class="labcontrols"><label>Start with an example<select id="circuitpreset"><option value="">Custom / saved circuit</option>${presets.map((p,i)=>`<option value="${i}">${p.name}</option>`).join('')}</select></label><label>Shots<input id="circuitshots" type="number" min="1" max="2000" step="1" value="256"></label><label>Seed<input id="circuitseed" type="number" min="0" max="4294967295" step="1" value="42"></label></div><div class="circuitviewtabs" role="tablist" aria-label="Circuit representation"><button class="outline" role="tab" id="stimtexttab" aria-selected="true" aria-controls="stimtextpanel" tabindex="0">Stim text</button><button class="outline" role="tab" id="stimdiagramtab" aria-selected="false" aria-controls="stimdiagrampanel" tabindex="-1">Circuit diagram</button></div><div id="stimtextpanel" role="tabpanel" aria-labelledby="stimtexttab"><label for="circuitsource">Stim circuit program</label><textarea id="circuitsource" spellcheck="false" autocapitalize="off" autocomplete="off" rows="14" maxlength="100000"></textarea><p class="tiny">Use Stim instructions, not Python. Edit this source, then switch to Circuit diagram or run it.</p></div><div id="stimdiagrampanel" role="tabpanel" aria-labelledby="stimdiagramtab" hidden><div class="controls"><button class="outline" id="diagramzoomout" aria-label="Zoom circuit diagram out">−</button><button class="outline" id="diagramfit">Fit diagram</button><button class="outline" id="diagramzoomin" aria-label="Zoom circuit diagram in">+</button></div><div class="nativecircuitdiagram" id="nativecircuitdiagram"><p>The diagram will appear after Stim loads.</p></div><p class="tiny">Native Stim timeline diagram. Switch to Stim text to edit. Wide circuits can be scrolled or zoomed.</p></div><div class="controls circuitruncontrols"><button class="primary" id="runcircuit">Run circuit</button><button class="outline" id="validatecircuit">Validate / update diagram</button><button class="outline" id="stopcircuit" disabled>Stop</button><button class="outline" id="downloadstim">Download .stim ↓</button></div><p id="circuitenginestatus" class="tiny" role="status">Loading the browser’s Stim engine…</p><div class="notice" id="circuitstatus" role="status" aria-live="polite">Your current text is used for both views.</div><p id="circuitmetadata" class="tiny"></p><p class="tiny">Limits: qubit indices 0–63; 1–2000 shots; at most 512 measurement bits per shot and 4000 expanded instructions. Long runs can be stopped. Results are raw measurement records, not detector events or decoded logical flips.</p></section><section class="panel circuitresults" id="circuitresults" hidden><h2>Measurement results</h2><p id="circuitresultsummary"></p><div class="notationtable"><table><thead><tr><th>Record bits</th><th>Count</th><th>Fraction</th></tr></thead><tbody id="circuithistogram"></tbody></table></div><p class="tiny">Bits are listed left to right in measurement-record order (m0, m1, …), not reversed qubit-number order. M, MR and other measurement instructions append results. The table shows the 20 most frequent records.</p><details><summary>First 20 shot records</summary><pre id="circuitrawpreview"></pre></details><button class="outline" id="downloadcircuitcsv">Download shot records .csv ↓</button></section>`;
  const source=root.querySelector('#circuitsource'),status=root.querySelector('#circuitstatus'),engineStatus=root.querySelector('#circuitenginestatus'),diagram=root.querySelector('#nativecircuitdiagram'),results=root.querySelector('#circuitresults');source.value=initial;if(importedCircuit){try{localStorage.setItem('surface-lab-circuit-v1',initial);}catch{}}
  let worker=null,ready=null,requestId=0,version=0,disposed=false,busy=false,timer=null,svgUrl=null,sampleRows=null,diagramWidth=800,zoom=null;
  const pending=new Map();
  function message(text,error=false){status.textContent=text;status.classList.toggle('circuiterror',error);}
  function save(){try{localStorage.setItem('surface-lab-circuit-v1',source.value);}catch{}}
  function setBusy(value){busy=value;for(const id of ['runcircuit','validatecircuit'])root.querySelector('#'+id).disabled=value;root.querySelector('#stopcircuit').disabled=!value;}
  function terminate(reason='Cancelled.'){
    if(worker)worker.terminate();worker=null;ready=null;
    for(const entry of pending.values()){clearTimeout(entry.timeout);entry.reject(new Error(reason));}pending.clear();
  }
  function call(action,data={}){
    if(!worker)return Promise.reject(new Error('Stim worker stopped. Run or validate to restart it.'));
    return new Promise((resolve,reject)=>{
      const id=++requestId;const timeout=setTimeout(()=>{terminate('Stopped after 30 seconds. Try fewer shots or a smaller circuit.');},30000);
      pending.set(id,{resolve,reject,timeout});worker.postMessage({id,action,...data});
    });
  }
  function ensureReady(){
    if(!ready){
      engineStatus.textContent='Loading Stim 1.16.0 WebAssembly…';
      worker=new Worker(new URL('stim-worker.js?v=20261114-wasm',circuitPlaygroundBase));
      worker.onmessage=event=>{const entry=pending.get(event.data.id);if(!entry)return;clearTimeout(entry.timeout);pending.delete(event.data.id);event.data.error?entry.reject(new Error(event.data.error)):entry.resolve(event.data.result);};
      worker.onerror=event=>{event.preventDefault();terminate('Could not load or run Stim WASM. Check the connection and try again.');};
      ready=call('ready').then(result=>{if(!disposed)engineStatus.textContent=result.version+' · running locally in a Web Worker';return result;});
      ready.catch(()=>{terminate('Could not initialize Stim WASM.');if(!disposed)engineStatus.textContent='Stim initialization failed. Validate or run to retry.';});
    }return ready;
  }
  function setDiagram(svg){
    if(svgUrl)URL.revokeObjectURL(svgUrl);
    const parsed=new DOMParser().parseFromString(svg,'image/svg+xml').documentElement;
    diagramWidth=parseFloat(parsed.getAttribute('width'))||Number((parsed.getAttribute('viewBox')||'0 0 800 400').split(/[ ,]+/)[2])||800;
    svgUrl=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));const img=document.createElement('img');img.src=svgUrl;img.alt='Stim circuit timeline for the current program';diagram.replaceChildren(img);applyZoom();
  }
  function applyZoom(){const img=diagram.querySelector('img');if(img)img.style.width=zoom===null?'100%':Math.max(150,diagramWidth*zoom)+'px';}
  async function inspect(text,revision){
    await ensureReady();if(disposed||revision!==version||!worker)return null;const result=await call('inspect',{text});if(disposed||revision!==version)return null;
    setDiagram(result.svg);root.querySelector('#circuitmetadata').textContent=`${result.qubits} qubit index slots (max index + 1) · ${result.measurements} measurements per shot · ${result.detectors} detector annotations · ${result.observables} logical observables`;
    return result;
  }
  async function validate(){
    if(busy||disposed)return;const revision=version,text=source.value;setBusy(true);message('Validating with Stim and drawing the circuit…');
    try{const result=await inspect(text,revision);if(result)message('Valid Stim circuit. Both views represent this same program.');}
    catch(error){if(!disposed&&revision===version){message(error.message,true);diagram.replaceChildren(Object.assign(document.createElement('p'),{textContent:'Correct the Stim text, then validate again.'}));}}
    finally{if(!disposed)setBusy(false);}
  }
  async function run(){
    if(busy||disposed)return;const shots=Number(root.querySelector('#circuitshots').value),seed=Number(root.querySelector('#circuitseed').value),text=source.value,revision=version;
    if(!Number.isInteger(shots)||shots<1||shots>2000){message('Choose 1 to 2000 whole-number shots.',true);return;}
    if(root.querySelector('#circuitseed').value===''||!Number.isInteger(seed)||seed<0||seed>4294967295){message('Use a whole-number seed from 0 to 4294967295.',true);return;}
    setBusy(true);results.hidden=true;sampleRows=null;message('Running Stim in your browser…');
    try{
      const info=await inspect(text,revision);if(!info)return;
      const sample=await call('sample',{text,shots,seed});if(disposed||revision!==version)return;
      sampleRows=sample.rows;const counts=circuitOutcomeCounts(sampleRows);
      root.querySelector('#circuithistogram').innerHTML=counts.slice(0,20).map(([bits,count])=>`<tr><td><code>${bits||'∅ (no measurements)'}</code></td><td>${count}</td><td>${(100*count/shots).toFixed(2)}%</td></tr>`).join('');
      root.querySelector('#circuitrawpreview').textContent=sampleRows.slice(0,20).map((bits,i)=>`shot ${i}: ${bits||'∅'}`).join('\n');
      root.querySelector('#circuitresultsummary').textContent=`${shots} fresh shots · ${sample.measurements} recorded bits per shot · seed ${seed} · ${counts.length} distinct record${counts.length===1?'':'s'}.`;
      results.hidden=false;message(info.measurements?'Run complete. Results below match the current Stim text.':'Run complete, but this circuit records no measurements. Add M or another measurement instruction to obtain bits.');
    }catch(error){if(!disposed&&revision===version)message(error.message,true);}
    finally{if(!disposed)setBusy(false);}
  }
  function switchView(mode){
    const textMode=mode==='text';root.querySelector('#stimtextpanel').hidden=!textMode;root.querySelector('#stimdiagrampanel').hidden=textMode;
    for(const [id,on]of [['stimtexttab',textMode],['stimdiagramtab',!textMode]]){const tab=root.querySelector('#'+id);tab.setAttribute('aria-selected',String(on));tab.tabIndex=on?0:-1;}
    if(!textMode&&!busy)validate();
  }
  source.oninput=()=>{version++;save();sampleRows=null;results.hidden=true;root.querySelector('#circuitmetadata').textContent='';diagram.replaceChildren(Object.assign(document.createElement('p'),{textContent:'Circuit changed. Validate to update this diagram.'}));message('Circuit edited. Validate or run to update the diagram and results.');clearTimeout(timer);};
  root.querySelector('#circuitpreset').onchange=event=>{if(event.target.value==='')return;source.value=presets[+event.target.value].text;source.oninput();if(!busy)validate();};
  root.querySelector('#stimtexttab').onclick=()=>switchView('text');root.querySelector('#stimdiagramtab').onclick=()=>switchView('diagram');
  root.querySelector('.circuitviewtabs').onkeydown=event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();const mode=event.key==='ArrowLeft'?'text':'diagram';switchView(mode);root.querySelector(mode==='text'?'#stimtexttab':'#stimdiagramtab').focus({preventScroll:true});}};
  root.querySelector('#runcircuit').onclick=run;root.querySelector('#validatecircuit').onclick=validate;
  root.querySelector('#stopcircuit').onclick=()=>{version++;terminate();setBusy(false);engineStatus.textContent='Stim worker stopped. Run or validate to restart it.';message('Cancelled. You can edit the circuit and run again.');};
  root.querySelector('#downloadstim').onclick=()=>download(source.value,'playground.stim');
  root.querySelector('#downloadcircuitcsv').onclick=()=>{if(!sampleRows)return;const width=sampleRows[0]?.length||0;const header=['shot',...Array.from({length:width},(_,i)=>'m'+i)].join(',');download(header+'\n'+sampleRows.map((bits,i)=>[i,...bits].join(',')).join('\n')+'\n','stim-shot-records.csv');};
  root.querySelector('#diagramfit').onclick=()=>{zoom=null;applyZoom();};root.querySelector('#diagramzoomin').onclick=()=>{zoom=Math.min(4,(zoom??1)*1.25);applyZoom();};root.querySelector('#diagramzoomout').onclick=()=>{zoom=Math.max(.25,(zoom??1)/1.25);applyZoom();};
  circuitPlaygroundSession={dispose(){disposed=true;clearTimeout(timer);terminate('Playground closed.');if(svgUrl)URL.revokeObjectURL(svgUrl);}};
  if(importedCircuit){const key=Object.keys(tutorialCircuits()).find(key=>tutorialCircuits()[key].text===importedCircuit.text);if(key){const links=document.createElement('section');links.className='panel';links.innerHTML=tutorialCircuitSourceLinks(key);root.append(links);}}
  validate();
}
if(typeof module!=='undefined')module.exports={circuitOutcomeCounts,circuitPlaygroundPresets};
