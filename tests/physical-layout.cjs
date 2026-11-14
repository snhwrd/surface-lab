const assert=require('node:assert/strict');
global.SurfaceCode=require('../web/lattice.js');
const {physicalLayoutGeometry}=require('../web/surface-view.js');
for(const d of [3,5,7,9]){
  const model=SurfaceCode.patch(d),before=JSON.stringify(model.checks),original=physicalLayoutGeometry(d),cardinal=physicalLayoutGeometry(d,true);
  for(const layout of [original,cardinal]){
    assert.equal(layout.data.length,d*d);assert.equal(layout.ancillas.length,d*d-1);
    for(const [x,y]of [...layout.data,...layout.ancillas]){assert(x>=28&&y>=28);assert(x<=layout.width-28&&y<=layout.height-28);}
  }
  model.checks.forEach((c,i)=>c.q.forEach(q=>{
    const [x,y]=cardinal.data[q],[ax,ay]=cardinal.ancillas[i];
    assert(Math.abs(x-ax)<1e-7||Math.abs(y-ay)<1e-7,'Every check link, including boundary links, is cardinal after rotation');
    const length=layout=>Math.hypot(layout.data[q][0]-layout.ancillas[i][0],layout.data[q][1]-layout.ancillas[i][1]);
    assert(Math.abs(length(original)-length(cardinal))<1e-7,'Rotation preserves link length');
  }));
  assert.equal(JSON.stringify(model.checks),before,'Layout changes never alter stabilizer supports');
  assert.deepEqual(physicalLayoutGeometry(d,false),original,'Returning to original orientation is exact');
}
console.log('PASS: cardinal links, unchanged connectivity and lengths, view bounds and reversible orientation at all distances');
