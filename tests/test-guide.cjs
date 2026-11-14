const assert=require('node:assert/strict');
const {wilsonInterval}=require('../web/test-guide.js');
const close=(a,b)=>assert(Math.abs(a-b)<1e-6,`${a} differs from ${b}`);
const midpoint=wilsonInterval(50,100);close(midpoint[0],0.40382983);close(midpoint[1],0.59617017);
assert.equal(wilsonInterval(0,1000)[0],0);assert(wilsonInterval(0,1000)[1]>0.003);
assert.equal(wilsonInterval(1000,1000)[1],1);
for(const n of [1,10,100,10000])for(const k of [0,1,Math.floor(n/2),n]){
  const [low,high]=wilsonInterval(k,n),[mirrorLow,mirrorHigh]=wilsonInterval(n-k,n);
  assert(low>=0&&high<=1&&low<=k/n&&k/n<=high);close(low,1-mirrorHigh);close(high,1-mirrorLow);
}
for(const [k,n]of [[0,0],[-1,10],[11,10],[0.5,10],[1,2.5],[1,Infinity],[NaN,10]])assert.throws(()=>wilsonInterval(k,n));
assert(wilsonInterval(500,1000)[1]-wilsonInterval(500,1000)[0]<midpoint[1]-midpoint[0]);
console.log('PASS: Wilson reference values, zero/all-event boundaries, interval symmetry, sample-size behavior and invalid inputs');
