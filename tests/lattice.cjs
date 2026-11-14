const assert=require('node:assert/strict');
const code=require('../web/lattice.js');
const mask=set=>[...set].reduce((m,q)=>m|(1n<<BigInt(q)),0n);
const rankBasis=rows=>{const basis=new Map();for(let row of rows){while(row){const pivot=row.toString(2).length-1;if(basis.has(pivot))row^=basis.get(pivot);else{basis.set(pivot,row);break;}}}return basis;};
const inSpan=(row,basis)=>{while(row){const pivot=row.toString(2).length-1;if(!basis.has(pivot))return false;row^=basis.get(pivot);}return true;};
let seed=12345;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
for(const d of [3,5,7,9]){
  const model=code.patch(d),xs=model.checks.filter(c=>c.type==='X'),zs=model.checks.filter(c=>c.type==='Z');
  assert.equal(model.checks.length,d*d-1);
  assert.equal(xs.length,(d*d-1)/2);assert.equal(zs.length,xs.length);
  for(const type of ['X','Z']){
  const same=type==='X'?xs:zs;
  const basis=rankBasis(same.map(c=>mask(c.q)));assert.equal(basis.size,same.length);
  for(const x of xs)for(const z of zs)assert.equal(x.q.filter(q=>z.q.includes(q)).length%2,0,'Checks commute');
  const check=errors=>{const a=code.assess(model,errors,type);assert.deepEqual(code.syndrome(model,a.correction,type),a.syndrome);assert.equal(a.logicalFailure,!inSpan(mask(a.residual),basis),'Logical outcome must match independent stabilizer-span check');if(errors.size<=(d-1)/2)assert.equal(a.logicalFailure,false);return a;};
  assert.equal(check(new Set()).correction.size,0);
  for(let q=0;q<d*d;q++)assert.equal(check(new Set([q])).detected,true);
  for(const c of same){const a=check(new Set(c.q));assert.equal(a.detected,false);assert.equal(a.logicalFailure,false);}
  const logical=new Set(Array.from({length:d},(_,x)=>type==='X'?Math.floor(d/2)*d+x:x*d+Math.floor(d/2)));
  const a=check(logical);assert.equal(a.detected,false);assert.equal(a.logicalFailure,true);
  const chain=new Set([...logical].slice(0,(d+1)/2));assert.equal(check(chain).logicalFailure,true);assert.equal(check(chain).detected,true);
  for(let trial=0;trial<60;trial++){const errors=new Set();const size=trial<30?(d-1)/2:Math.floor(random()*d*d);while(errors.size<size)errors.add(Math.floor(random()*d*d));check(errors);}
  if(d===3){
    const minimum=new Map();for(let bits=0;bits<512;bits++){const e=new Set(Array.from({length:9},(_,q)=>q).filter(q=>(bits>>q)&1)),s=code.syndrome(model,e,type).join('');minimum.set(s,Math.min(minimum.get(s)??Infinity,e.size));}
    for(let bits=0;bits<512;bits++){const e=new Set(Array.from({length:9},(_,q)=>q).filter(q=>(bits>>q)&1)),a=check(e);assert.equal(a.correction.size,minimum.get(a.syndrome.join('')),'Exact minimum weight for every d=3 pattern');}
  }
  console.log(`PASS distance ${d}, ${type}: geometry, commuting checks, correction guarantees, logical errors and stabilizers`);
}
}

// Independently decode both components of mixed Pauli patterns, including Y.
for(const d of [3,5,7,9])for(let trial=0;trial<40;trial++){
  const model=code.patch(d),x=new Set(),z=new Set(),locations=new Set();
  while(locations.size<(d-1)/2)locations.add(Math.floor(random()*d*d));
  for(const q of locations){const pauli=Math.floor(random()*3);if(pauli!==1)x.add(q);if(pauli!==0)z.add(q);}
  assert.equal(code.assess(model,x).logicalFailure,false);
  assert.equal(code.assess(model,z,'Z').logicalFailure,false);
}
console.log('PASS mixed X/Z/Y errors within the guaranteed correction radius');
