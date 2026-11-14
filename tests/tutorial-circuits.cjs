const assert=require('node:assert/strict');
global.SurfaceCode=require('../web/lattice.js');
global.latticeRoundSchedule=require('../web/lattice-lesson.js').latticeRoundSchedule;
global.circuitPlaygroundPresets=require('../web/circuit-playground.js').circuitPlaygroundPresets;
const {tutorialCircuits,lessonCircuitKeys,tutorialCircuitSources}=require('../web/tutorial-circuits.js');
(async()=>{
  const engine=await require('../web/vendor/stim/stim_engine.js')(),circuits=tutorialCircuits();
  for(let lesson=0;lesson<6;lesson++)for(const key of lessonCircuitKeys(lesson))assert(circuits[key],`Missing lesson circuit ${key}`);
  for(const [key,{text}] of Object.entries(circuits)){
    assert(tutorialCircuitSources(key).length>0,`${key}: missing tutorial source`);
    const info=engine.inspectCircuit(text);assert(!info.error,`${key}: ${info.error}`);
    const sample=engine.sampleCircuit(text,16,42);assert(!sample.error,`${key}: ${sample.error}`);
    if(/^(parity-|bulk-)/.test(key))assert(sample.rows.every(row=>row===key.at(-1)),`${key}: error case has wrong parity`);
    if(key.startsWith('memory-')){assert.equal(info.observables,1);assert(info.detectors>0);}
  }
  const manual=engine.sampleCircuit(circuits.manual.text,32,42);
  assert.equal(manual.measurements,33);
  for(const row of manual.rows){assert.equal(row.slice(0,8),row.slice(8,16));assert.equal(row.slice(8,16),row.slice(16,24));assert.equal(Number(row[24])^Number(row[27])^Number(row[30]),0);}
  console.log('PASS: every tutorial circuit renders and samples in WASM; error cases, repeated checks, logical parity and annotations verified');
})().catch(error=>{console.error(error);process.exitCode=1;});
