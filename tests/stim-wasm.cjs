const assert=require('node:assert/strict');
const create=require('../web/vendor/stim/stim_engine.js');
global.SurfaceCode=require('../web/lattice.js');
global.latticeRoundSchedule=require('../web/lattice-lesson.js').latticeRoundSchedule;
const {circuitPlaygroundPresets,circuitOutcomeCounts}=require('../web/circuit-playground.js');
(async()=>{
  const engine=await create();
  const sample=(text,shots=128,seed=42)=>{const out=engine.sampleCircuit(text,shots,seed);assert(!out.error,out.error);assert.equal(out.rows.length,shots);assert(out.rows.every(row=>row.length===out.measurements));return out.rows;};
  assert(sample('R 0\nM 0').every(row=>row==='0'));
  assert(sample('R 0\nX 0\nM 0').every(row=>row==='1'));
  assert(sample('R 0 1\nX 0\nM 1 0').every(row=>row==='01'),'Measurement record order is not reversed qubit order');
  const h=sample('R 0\nH 0\nM 0',1000);const ones=h.filter(row=>row==='1').length;assert(ones>350&&ones<650,'Real Hadamard sampling is balanced within broad statistical bounds');
  assert.deepEqual(sample('H 0\nM 0',100,99),sample('H 0\nM 0',100,99),'Same seed replays the same engine run');
  const bell=sample('R 0 1\nH 0\nCX 0 1\nM 0 1');assert(bell.every(row=>row==='00'||row==='11'));assert.equal(new Set(bell).size,2);
  assert(sample('R 0\nH 0\nM 0\nM 0\nMR 0\nM 0').every(row=>row[0]===row[1]&&row[1]===row[2]&&row[3]==='0'));
  assert(sample('REPEAT 2 {\n R 0\n X 0\n M 0\n}').every(row=>row==='11'));
  assert(sample('R 0 1\nH 0\nCX 0 1\nMPP X0*X1 Z0*Z1').every(row=>row==='00'));
  assert(sample('R 0 1\nH 0\nM 0\nCX rec[-1] 1\nM 1').every(row=>row[0]===row[1]));
  assert(sample('R 0\nX_ERROR(1) 0\nM 0').every(row=>row==='1'));
  const annotated=engine.inspectCircuit('R 0\nM 0\nDETECTOR rec[-1]\nOBSERVABLE_INCLUDE(0) rec[-1]');assert(!annotated.error,annotated.error);assert.equal(annotated.detectors,1);assert.equal(annotated.observables,1);assert(annotated.svg.includes('<svg'));assert.equal(annotated.measurements,1);
  assert(sample('R 0\nH 0',5).every(row=>row===''));
  for(const text of ['NOT_A_STIM_GATE 0','R 64','REPEAT 4001 {\n TICK\n}','M '+Array(513).fill(0).join(' '),'#'.repeat(100001),'X '+'0 '.repeat(32001),'CX sweep[0] 0'])assert(engine.inspectCircuit(text).error,`Expected a parser/resource error for ${text.slice(0,50)}`);
  assert(engine.sampleCircuit('M 0',0,42).error);assert(engine.sampleCircuit('M 0',2001,42).error);
  const presets=circuitPlaygroundPresets();assert.equal(presets.length,6);
  for(const preset of presets){const out=engine.inspectCircuit(preset.text);assert(!out.error,`${preset.name}: ${out.error}`);assert(out.svg.includes('<svg'));sample(preset.text,8);}
  for(const i of [2,3])assert(sample(presets[i].text,32).every(row=>row==='1'),'Surface parity examples detect inserted errors');
  for(const row of sample(presets[5].text,32)){assert.equal(row.length,33);assert.equal(row.slice(0,8),row.slice(8,16));assert.equal(row.slice(8,16),row.slice(16,24));assert.equal((+row[24]+ +row[27]+ +row[30])%2,0);}
  assert.deepEqual(circuitOutcomeCounts(['11','00','11']),[['11',2],['00',1]]);
  console.log('PASS: shipped Stim WASM parsing, native SVG, seeded quantum sampling, Bell/MPP/feedback/reset/repeat circuits, surface-code presets, record ordering and limits');
})().catch(error=>{console.error(error);process.exit(1);});
