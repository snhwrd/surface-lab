const assert=require('node:assert/strict');
global.SurfaceCode=require('../web/lattice.js');
const {latticeRoundSchedule}=require('../web/lattice-lesson.js');
for(const d of [3,5,7,9]){
  const {checks,layers}=latticeRoundSchedule(d),n=2*d*d-1;
  assert.equal(layers.length,4);
  const edges=new Set();
  layers.forEach(gates=>{
    const occupied=new Set();
    gates.forEach(g=>{
      for(const q of [g.control,g.target]){assert(!occupied.has(q),'A physical qubit cannot take two gates in one layer');occupied.add(q);}
      const c=checks[g.check];assert(c.q.includes(g.q));assert.equal(g.control,c.type==='X'?c.ancilla:g.q);assert.equal(g.target,c.type==='X'?g.q:c.ancilla);
      const key=`${g.check}:${g.q}`;assert(!edges.has(key));edges.add(key);
    });
  });
  assert.equal(edges.size,checks.reduce((s,c)=>s+c.q.length,0));
  // Heisenberg-propagate each measured Z backwards through the entire round.
  // It must become exactly the intended data generator times its own reset Z.
  for(const c of checks){
    const x=new Uint8Array(n),z=new Uint8Array(n);let sign=0;z[c.ancilla]=1;
    const h=q=>{sign^=x[q]&z[q];[x[q],z[q]]=[z[q],x[q]];};
    const cx=(a,b)=>{sign^=x[a]&z[b]&(x[b]^z[a]^1);x[b]^=x[a];z[a]^=z[b];};
    checks.filter(a=>a.type==='X').forEach(a=>h(a.ancilla));
    for(let layer=3;layer>=0;layer--)for(const g of [...layers[layer]].reverse())cx(g.control,g.target);
    checks.filter(a=>a.type==='X').forEach(a=>h(a.ancilla));
    const wantX=new Uint8Array(n),wantZ=new Uint8Array(n);wantZ[c.ancilla]=1;
    c.q.forEach(q=>{(c.type==='X'?wantX:wantZ)[q]=1;});
    assert.deepEqual(x,wantX,'Correct measured X support, with no extra ancilla terms');assert.deepEqual(z,wantZ,'Correct measured Z support, with no extra ancilla terms');assert.equal(sign,0,'Correct check sign');
    if(c.q.length===4){const last=layers.slice(2).flat().filter(g=>g.check===c.index).map(g=>g.q);assert.equal(last.length,2);assert.equal(c.type==='X'?last[0]%d:Math.floor(last[0]/d),c.type==='X'?last[1]%d:Math.floor(last[1]/d),'Bulk hook pair lies transverse to its logical string');}
  }
  console.log(`PASS distance ${d}: collision-free layers, exact check measurements, CNOT directions and bulk hook orientation`);
}
