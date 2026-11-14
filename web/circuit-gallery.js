const circuitGalleryBase=typeof document==='undefined'?null:new URL('.',document.currentScript.src);
let circuitGallerySession=null;
function disposeCircuitGallery(){if(circuitGallerySession){circuitGallerySession.dispose();circuitGallerySession=null;}}
function renderCircuitGallery(root){
  disposeCircuitGallery();
  const circuits=tutorialCircuits(),entries=Object.entries(circuits).sort(([a],[b])=>Number(a.startsWith('memory-'))-Number(b.startsWith('memory-')));
  root.innerHTML=`<div class="eyebrow">FOLLOW THE GATES</div><h1>Circuit diagrams.</h1><p>Every circuit linked from the tutorials, including both error cases, the construction stages, and the distance/noise comparisons. Read time from left to right. Open any circuit in the playground to edit it or run measurement samples.</p><p class="tiny">${entries.length} circuits · native Stim timeline diagrams · swipe wide diagrams horizontally</p>`+entries.map(([key,c])=>`<section class="panel circuitcard" data-gallery-circuit="${key}"><h2>${escapeHTML(c.name)}</h2><div class="nativecircuitdiagram gallerydiagram" role="status"><p>Loading circuit diagram…</p></div><div class="controls"><a class="outline" href="#circuit-playground/${key}" data-tutorial-circuit="${key}">Open in circuit playground →</a><button class="outline" data-gallery-download="${key}">Download .stim ↓</button></div><details><summary>Stim instructions</summary><pre>${escapeHTML(c.text)}</pre></details></section>`).join('');
  root.querySelectorAll('[data-gallery-download]').forEach(b=>b.onclick=()=>download(circuits[b.dataset.galleryDownload].text,b.dataset.galleryDownload+'.stim'));
  let disposed=false,worker=null,timeout=null,index=0;const urls=[];
  const cards=[...root.querySelectorAll('[data-gallery-circuit]')];
  function fail(message){if(disposed)return;clearTimeout(timeout);worker?.terminate();worker=null;for(let i=index;i<cards.length;i++)cards[i].querySelector('.gallerydiagram').textContent=message+' You can still open this circuit in the playground.';}
  function next(){
    if(disposed||index>=entries.length){worker?.terminate();worker=null;return;}
    const [key,c]=entries[index];
    timeout=setTimeout(()=>fail('Diagram loading timed out. Refresh to retry.'),30000);
    worker.postMessage({id:key,action:'inspect',text:c.text});
  }
  circuitGallerySession={dispose(){disposed=true;clearTimeout(timeout);worker?.terminate();for(const url of urls)URL.revokeObjectURL(url);}};
  try{
    worker=new Worker(new URL('stim-worker.js?v=20261114-wasm',circuitGalleryBase));
    worker.onerror=event=>{event.preventDefault();fail('Could not load the Stim diagram engine.');};
    worker.onmessage=event=>{
      if(disposed)return;clearTimeout(timeout);
      const card=cards[index],target=card.querySelector('.gallerydiagram');
      if(event.data.error)target.textContent='Could not draw this circuit: '+event.data.error;
      else{
        const url=URL.createObjectURL(new Blob([event.data.result.svg],{type:'image/svg+xml'}));urls.push(url);
        const img=document.createElement('img');img.src=url;img.alt=entries[index][1].name+' — Stim circuit timeline';img.loading='lazy';target.replaceChildren(img);
      }
      index++;next();
    };
    next();
  }catch{fail('Could not start the Stim diagram engine.');}
}
