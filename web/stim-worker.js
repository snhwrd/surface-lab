/* Runs only self-hosted Stim WASM; no user-supplied JavaScript is evaluated. */
let modulePromise;
function stimModule(){
  if(!modulePromise)modulePromise=(async()=>{
    importScripts(new URL('vendor/stim/stim_engine.js',self.location.href).href);
    return createStimWasm({locateFile:path=>new URL('vendor/stim/'+path,self.location.href).href});
  })();return modulePromise;
}
self.onmessage=async event=>{
  const {id,action,text,shots,seed}=event.data;
  try{
    const engine=await stimModule();let result;
    if(action==='ready')result={version:'Stim 1.16.0 · WebAssembly'};
    else{
      if(typeof text!=='string'||text.length>100000)throw new Error('Use at most 100 KB of Stim circuit text.');
      if(action==='inspect')result=engine.inspectCircuit(text);
      else if(action==='sample'){
        if(!Number.isInteger(shots)||shots<1||shots>2000)throw new Error('Choose 1 to 2000 shots.');
        if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw new Error('Use a whole-number seed from 0 to 4294967295.');
        result=engine.sampleCircuit(text,shots,seed);
      }else throw new Error('Unknown circuit action.');
    }
    if(result.error)throw new Error(result.error);
    self.postMessage({id,result});
  }catch(error){self.postMessage({id,error:error?.message||String(error)});}
};
