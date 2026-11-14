/* Rotated CSS patches and independent exact minimum-weight X/Z decoding with perfect checks. */
const SurfaceCode = (() => {
  const cache = new Map();
  const parity = n => {let p=0; for (;n;n&=n-1) p^=1; return p;};
  const weight = n => {let w=0; for (;n;n&=n-1) w++; return w;};
  function patch(d) {
    if (![3,5,7,9].includes(d)) throw new Error('Choose distance 3, 5, 7, or 9.');
    if (cache.has(d)) return cache.get(d);
    const checks=[];
    for(let y=0;y<d-1;y++) for(let x=0;x<d-1;x++)
      checks.push({type:(x+y)%2?'Z':'X',q:[y*d+x,y*d+x+1,(y+1)*d+x,(y+1)*d+x+1],x:x+.5,y:y+.5});
    for(let x=0;x<d-1;x++) checks.push({type:'Z',q:x%2?[(d-1)*d+x,(d-1)*d+x+1]:[x,x+1],x:x+.5,y:x%2?d-.65:-.35});
    for(let y=0;y<d-1;y++) checks.push({type:'X',q:y%2?[y*d,(y+1)*d]:[y*d+d-1,(y+1)*d+d-1],x:y%2?-.35:d-.65,y:y+.5});
    const signatures=[0,1].map(offset=>Array.from({length:1<<d},(_,mask)=>{
      let s=0,k=0; for(let x=offset;x<d-1;x+=2) s|=parity((mask>>x)&3)<<k++; return s;
    }));
    const groups=signatures.map(sig=>{const g=Array.from({length:1<<((d-1)/2)},()=>[]);sig.forEach((s,m)=>g[s].push(m));return g;});
    const model={d,checks,signatures,groups,weights:Array.from({length:1<<d},(_,m)=>weight(m))};
    cache.set(d,model); return model;
  }
  function syndrome(model,errors,type='X') {return model.checks.filter(c=>c.type===(type==='X'?'Z':'X')).map(c=>c.q.reduce((p,q)=>p^Number(errors.has(q)),0));}
  function logicalParity(d,errors,type='X') {let p=0;for(let i=0;i<d;i++)p^=Number(errors.has(type==='X'?i*d:i));return p;}
  const rotate=(d,q)=>(q%d)*d+d-1-Math.floor(q/d);
  const unrotate=(d,q)=>(d-1-q%d)*d+Math.floor(q/d);
  function decode(model,syndromeBits,type='X') {
    if(type==='Z'){
      const key=q=>[...q].sort((a,b)=>a-b).join(',');
      const x=model.checks.filter(c=>c.type==='X');
      if(syndromeBits.length!==x.length || syndromeBits.some(v=>v!==0&&v!==1))throw new Error('Invalid syndrome.');
      const rotated=new Map(x.map((c,i)=>[key(c.q.map(q=>rotate(model.d,q))),syndromeBits[i]]));
      const bits=model.checks.filter(c=>c.type==='Z').map(c=>rotated.get(key(c.q)));
      return new Set([...decode(model,bits)].map(q=>unrotate(model.d,q)));
    }
    if(type!=='X')throw new Error('Error type must be X or Z.');
    const {d,checks,signatures,groups,weights}=model, n=1<<d, inf=30000;
    const z=checks.filter(c=>c.type==='Z');
    if(syndromeBits.length!==z.length || syndromeBits.some(v=>v!==0&&v!==1)) throw new Error('Invalid syndrome.');
    const values=new Map(z.map((c,i)=>[c.q.join(','),syndromeBits[i]]));
    const rowSyndrome=(row,offset,boundary=false)=>{
      let sig=0,k=0;for(let x=offset;x<d-1;x+=2){const q=boundary?[row*d+x,row*d+x+1]:[row*d+x,row*d+x+1,(row+1)*d+x,(row+1)*d+x+1];sig|=values.get(q.join(','))<<k++;}return sig;
    };
    let costs=new Int16Array(n*2).fill(inf);
    const back=Array.from({length:d},()=>new Int16Array(n*2).fill(-1));
    const top=rowSyndrome(0,0,true),bottom=rowSyndrome(d-1,1,true);
    for(let m=0;m<n;m++)if(signatures[0][m]===top)costs[m*2+(m&1)]=weights[m];
    for(let row=1;row<d;row++){
      const next=new Int16Array(n*2).fill(inf),offset=row%2,need=rowSyndrome(row-1,offset);
      for(let state=0;state<costs.length;state++)if(costs[state]<inf){
        const previous=state>>1,logical=state&1;
        for(const m of groups[offset][need^signatures[offset][previous]]){
          if(row===d-1&&signatures[1][m]!==bottom)continue;
          const target=m*2+(logical^(m&1)),cost=costs[state]+weights[m];
          if(cost<next[target]){next[target]=cost;back[row][target]=state;}
        }
      }
      costs=next;
    }
    let best=-1;for(let state=0;state<costs.length;state++)if(best<0||costs[state]<costs[best])best=state;
    if(costs[best]===inf)throw new Error('No correction found.');
    const correction=new Set();let state=best;
    for(let row=d-1;row>=0;row--){const m=state>>1;for(let x=0;x<d;x++)if((m>>x)&1)correction.add(row*d+x);state=back[row][state];}
    return correction;
  }
  function assess(model,errors,type='X') {
    const bits=syndrome(model,errors,type),correction=decode(model,bits,type),residual=new Set(errors);
    correction.forEach(q=>residual.has(q)?residual.delete(q):residual.add(q));
    return {syndrome:bits,correction,residual,detected:bits.some(Boolean),logicalFailure:logicalParity(model.d,residual,type)===1,guaranteed:errors.size<=(model.d-1)/2};
  }
  return {patch,syndrome,decode,assess,logicalParity};
})();
if(typeof module!=='undefined')module.exports=SurfaceCode;
