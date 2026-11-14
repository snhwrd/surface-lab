let physicalCardinalGrid=false;
function physicalLayoutGeometry(d,cardinal=false){
  const model=SurfaceCode.patch(d),center=(d-1)/2,spacing=100,padding=48;
  const points=Array.from({length:d*d},(_,q)=>[q%d,Math.floor(q/d)]);
  const ancillas=model.checks.map(c=>{
    let x=c.q.reduce((sum,q)=>sum+q%d,0)/c.q.length,y=c.q.reduce((sum,q)=>sum+Math.floor(q/d),0)/c.q.length;
    if(c.q.length===2){if(c.type==='Z')y+=y===0?-.5:.5;else x+=x===0?-.5:.5;}
    return [x,y];
  });
  const rotate=([x,y])=>{x-=center;y-=center;return cardinal?[(x-y)*Math.SQRT1_2*spacing,(x+y)*Math.SQRT1_2*spacing]:[x*spacing,y*spacing];};
  const rotated=[...points,...ancillas].map(rotate),xs=rotated.map(p=>p[0]),ys=rotated.map(p=>p[1]),minX=Math.min(...xs),minY=Math.min(...ys);
  const normalized=rotated.map(([x,y])=>[x-minX+padding,y-minY+padding]);
  return {data:normalized.slice(0,d*d),ancillas:normalized.slice(d*d),width:Math.max(...xs)-minX+2*padding,height:Math.max(...ys)-minY+2*padding};
}
function renderSurfaceView(root,{distance=3,xErrors=new Set(),zErrors=new Set()}={}){
  const physicalDistance=distance;
  root.innerHTML=`<p>Inspect data and ancilla roles. Select a check for its CNOT directions, or a data qubit for its neighboring checks. Switch off this view to insert errors.</p><div class="labcontrols"><label>Inspect a check<select id="physicalcheck"></select></label><button class="outline" id="physicalrotate" aria-pressed="false">Align links N/S/E/W ↻</button></div><p class="tiny" id="physicalorientation" role="status"></p><p id="physicalcounts"></p><div class="physicallegend"><span>○ D: data</span><span>◇ AX: X-check ancilla</span><span>□ AZ: Z-check ancilla</span></div><div class="physicalviewport" id="physicaldiagram"></div><p class="tiny">Labels identify physical qubits: D0 is data qubit 0; AX0 and AZ0 are different ancillas. Highlighted arrows show CNOT control → target for the selected check. Swipe to explore a large patch.</p><div id="physicaldetails" class="physicaldetails" aria-live="polite"></div><p class="tiny">This view assumes one dedicated ancilla per generator. Positions and arrows explain connectivity, not a hardware layout or simultaneous gate schedule. A complete round needs a validated CNOT schedule because checks share data qubits. Reset and measure the ancillas each round; preserve the data.</p>`;
  let selectedCheck=0,selectedData=null,checks=[];
  const checkSelect=root.querySelector('#physicalcheck'),diagram=root.querySelector('#physicaldiagram'),details=root.querySelector('#physicaldetails');
  function configure(){
    const counts={X:0,Z:0};checks=SurfaceCode.patch(physicalDistance).checks.map((c,i)=>({...c,index:i,name:`A${c.type}${counts[c.type]++}`}));
    checkSelect.innerHTML='<option value="">Choose a check</option>'+checks.map(c=>`<option value="${c.index}">${c.name} · ${c.type} check on ${c.q.map(q=>'D'+q).join(', ')}</option>`).join('');
    root.querySelector('#physicalcounts').textContent=`Distance ${physicalDistance}: ${physicalDistance**2} data + ${counts.X} X-check ancillas + ${counts.Z} Z-check ancillas = ${2*physicalDistance**2-1} physical qubits for 1 logical qubit.`;
  }
  function draw(focusKind=null,focusIndex=null){
    const saved={x:scrollX,y:scrollY,left:diagram.scrollLeft},d=physicalDistance;
    const geometry=physicalLayoutGeometry(d,physicalCardinalGrid),xy=q=>geometry.data[q],axy=c=>geometry.ancillas[c.index];
    const rotateButton=root.querySelector('#physicalrotate');rotateButton.setAttribute('aria-pressed',String(physicalCardinalGrid));rotateButton.textContent=physicalCardinalGrid?'Return to original grid ↶':'Align links N/S/E/W ↻';
    root.querySelector('#physicalorientation').textContent=physicalCardinalGrid?'Cardinal view: links run north/south/east/west on screen. Labels stay upright. This rotates only the drawing; check supports, error patterns and gate order are unchanged.':'Original view: data rows and columns are horizontal/vertical; check links are diagonal. Rotate 45° to align the links N/S/E/W.';
    const selected=selectedData===null?checks[selectedCheck]:null;
    const linked=selectedData===null?[selected]:checks.filter(c=>c.q.includes(selectedData));
    const activeChecks=new Set(linked.map(c=>c.index)),activeData=new Set(selected?selected.q:selectedData===null?[]:[selectedData]);
    let svg=`<svg viewBox="0 0 ${geometry.width} ${geometry.height}" style="width:max(100%,${d===3?0:d*90}px)" role="group" aria-label="Distance ${d} patch with labeled data and check ancillas, ${physicalCardinalGrid?'north south east west links':'original orientation'}"><defs><marker id="physicalarrow" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z" fill="#007c78"/></marker></defs>`;
    checks.forEach(c=>{
      const [ax,ay]=axy(c),active=activeChecks.has(c.index);
      c.q.forEach(q=>{
        const [dx,dy]=xy(q),length=Math.hypot(dx-ax,dy-ay),ux=(dx-ax)/length,uy=(dy-ay)/length;
        const start=c.type==='X'?[ax+ux*25,ay+uy*25]:[dx-ux*27,dy-uy*27];
        const end=c.type==='X'?[dx-ux*29,dy-uy*29]:[ax+ux*27,ay+uy*27];
        svg+=`<line x1="${start[0]}" y1="${start[1]}" x2="${end[0]}" y2="${end[1]}" stroke="${active?'#007c78':'#c8d7d4'}" stroke-width="${active?3:1}" ${active&&selected?'marker-end="url(#physicalarrow)"':''}/>`;
      });
    });
    for(let q=0;q<d*d;q++){
      const [x,y]=xy(q),active=activeData.has(q),error=xErrors.has(q)?(zErrors.has(q)?'Y':'X'):(zErrors.has(q)?'Z':'');
      svg+=`<g tabindex="0" role="button" aria-pressed="${selectedData===q}" aria-label="D${q}, data qubit ${q}, inspect its neighboring checks" data-physical-data="${q}"><circle cx="${x}" cy="${y}" r="24" fill="${error==='Y'?'#e5d9f4':error==='Z'?'#d9e9f8':error==='X'?'#f8dfcd':active?'#e0efea':'white'}" stroke="${active?'#007c78':'#73818a'}" stroke-width="${active?3:2}"/><text x="${x}" y="${y}" text-anchor="middle" font-size="13" fill="#192a32">D${q}${error?' · '+error:''}</text><text x="${x}" y="${y+13}" text-anchor="middle" font-size="8" fill="#53666f">DATA</text></g>`;
    }
    checks.forEach(c=>{
      const [x,y]=axy(c),active=activeChecks.has(c.index),fill=c.type==='X'?'#c4e2d6':'#c4dcec';
      svg+=`<g tabindex="0" role="button" aria-pressed="${selectedCheck===c.index&&selectedData===null}" aria-label="${c.name}, ${c.type}-check ancilla measuring ${c.q.map(q=>'D'+q).join(', ')}" data-physical-check="${c.index}">${c.type==='X'?`<path d="M${x} ${y-28}L${x+28} ${y}L${x} ${y+28}L${x-28} ${y}Z"`:`<rect x="${x-24}" y="${y-24}" width="48" height="48" rx="5"`} fill="${fill}" stroke="${active?'#007c78':'#617d85'}" stroke-width="${active?3:1.5}"/><text x="${x}" y="${y}" text-anchor="middle" font-size="12" fill="#192a32">${c.name}</text><text x="${x}" y="${y+12}" text-anchor="middle" font-size="7" fill="#35464e">${c.type} CHECK</text></g>`;
    });
    if(physicalCardinalGrid){const cx=geometry.width-30,cy=30;svg+=`<g aria-label="Screen compass: north up, east right"><path d="M${cx} ${cy-12}v24 M${cx-12} ${cy}h24" stroke="#73818a"/><text x="${cx}" y="${cy-16}" text-anchor="middle" font-size="9" fill="#53666f">N</text><text x="${cx+18}" y="${cy+3}" text-anchor="middle" font-size="9" fill="#53666f">E</text><text x="${cx}" y="${cy+23}" text-anchor="middle" font-size="9" fill="#53666f">S</text><text x="${cx-18}" y="${cy+3}" text-anchor="middle" font-size="9" fill="#53666f">W</text></g>`;}
    diagram.innerHTML=svg+'</svg>';checkSelect.value=selectedData===null?String(selectedCheck):'';
    if(selected){
      const c=selected,isX=c.type==='X';
      details.innerHTML=`<h2>${c.name}: ${c.type}-check ancilla</h2><div class="equation">g = ${c.q.map(q=>`${c.type}<sub>${q}</sub>`).join(' ')}<br>Support: ${c.q.map(q=>'D'+q).join(', ')} · weight ${c.q.length}</div><p><strong>Ancilla role:</strong> ${isX?'CNOT control':'CNOT target'}. <strong>Data role:</strong> ${isX?'CNOT targets':'CNOT controls'}. ${c.q.length===2?'This is a weight-2 boundary check.':'This is a weight-4 bulk check.'}</p><ol><li>Reset ${c.name} to |0⟩.${isX?' Apply H to prepare |+⟩.':''}</li><li>${isX?'Use the ancilla as control':'Use each data qubit as control'} for ${c.q.length} CNOTs: ${c.q.map(q=>isX?`${c.name} → D${q}`:`D${q} → ${c.name}`).join('; ')}.</li><li>${isX?'Apply H to the ancilla, then measure it in Z (equivalent to X-basis measurement).':'Measure the ancilla in Z.'} Bit 0 means check value +1; bit 1 means −1.</li></ol><p>This ${c.type} check detects ${isX?'Z (phase-flip)':'X (bit-flip)'} components on its support when their overlap is odd. Y contributes to both kinds of checks. The listed interactions describe this one check; their order within a full round must follow a valid schedule.</p>`;
    }else{
      details.innerHTML=`<h2>D${selectedData}: data qubit</h2><p>Stores part of the encoded state. Current inserted error: ${xErrors.has(selectedData)?(zErrors.has(selectedData)?'Y (X and Z)':'X'):zErrors.has(selectedData)?'Z':'none'}. It participates in ${linked.length} checks. Its gate role depends on the check: control for Z checks, target for X checks.</p><div class="physicalchecklist">${linked.map(c=>`<button class="outline" data-inspect-check="${c.index}">${c.name}: ${c.type} check · data is ${c.type==='Z'?'control':'target'}</button>`).join('')}</div><p>An X on D${selectedData} flips its adjacent Z checks. A Z flips its adjacent X checks. Click one of the listed ancillas to see all of that check’s data qubits.</p>`;
    }
    diagram.querySelectorAll('[data-physical-data],[data-physical-check]').forEach(el=>{
      const activate=()=>{if(el.dataset.physicalData!==undefined){selectedData=+el.dataset.physicalData;draw('data',selectedData);}else{selectedCheck=+el.dataset.physicalCheck;selectedData=null;draw('check',selectedCheck);}};
      el.onclick=activate;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}};
    });
    details.querySelectorAll('[data-inspect-check]').forEach(el=>el.onclick=()=>{selectedCheck=+el.dataset.inspectCheck;selectedData=null;draw('check',selectedCheck);});
    if(focusKind)diagram.querySelector(`[data-physical-${focusKind}="${focusIndex}"]`).focus({preventScroll:true});
    diagram.scrollLeft=saved.left;window.scrollTo({left:saved.x,top:saved.y,behavior:'instant'});
  }
  checkSelect.onchange=e=>{if(e.target.value==='')return;selectedCheck=+e.target.value;selectedData=null;draw();};
  root.querySelector('#physicalrotate').onclick=()=>{physicalCardinalGrid=!physicalCardinalGrid;draw();root.querySelector('#physicalrotate').focus({preventScroll:true});};
  configure();draw();
}

if(typeof module!=='undefined')module.exports={physicalLayoutGeometry};
