const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {restoreLearningState}=require('../web/quizzes.js');
const files=['python-guide','stabilizer-guide','lattice-lesson','circuit-guide','decode-guide','test-guide','sinter-guide'];
const prefixes=['python','stabilizer','construction','circuit','decode','test','sinter'];
const renderers=['renderPythonGuide','renderStabilizerGuide','renderLatticeConstruction','renderCircuitGuide','renderDecodeGuide','renderTestGuide','renderSinterGuide'];
const stepNodes=['pythonguidestep','stabilizerguidestep','constructiontext','circuitguidestep','decodeguidestep','testguidestep','sinterguidestep'];
const support=fs.readFileSync(require.resolve('../web/tutorial-support.js'),'utf8');
for(let lesson=0;lesson<files.length;lesson++){
  const nodes=new Map();
  const node=key=>{
    if(!nodes.has(key))nodes.set(key,{innerHTML:'',textContent:'',value:'0',dataset:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},querySelector:k=>node(k),querySelectorAll:()=>[]});
    return nodes.get(key);
  };
  const count=lesson===6?9:lesson<3?7:8;
  const buttons=Array.from({length:count},(_,i)=>({...node('button'+i),dataset:{[prefixes[lesson]+'Step']:String(i)}}));
  const root={innerHTML:'',querySelector:k=>node(k),querySelectorAll:k=>k===`[data-${prefixes[lesson]}-step]`?buttons:[]};
  let storage,hash;
  const context={state:restoreLearningState({last:lesson,done:[0],steps:{[lesson]:1}}),save(){storage=JSON.stringify(context.state);},history:{replaceState(a,b,url){hash=url;}},escapeHTML:s=>s,lessons:files.map(title=>({title,code:'import stim'})),stabilizerComparison:()=>'',coherentParityLesson:()=>'',circuitFigure:()=>'',tutorialCircuitLinks:()=>'',tutorialStepCircuitLinks:()=>'',renderSurfaceCheck:()=>{},openLesson:()=>{},SurfaceCode:require('../web/lattice.js'),document:{getElementById:k=>node(k)}};
  context.latticeRoundSchedule=require('../web/lattice-lesson.js').latticeRoundSchedule;
  global.SurfaceCode=context.SurfaceCode;
  vm.createContext(context);vm.runInContext(support,context);
  vm.runInContext(fs.readFileSync(require.resolve('../web/'+files[lesson]+'.js'),'utf8'),context);
  context[renderers[lesson]](root);
  assert.match(node('#'+stepNodes[lesson]).innerHTML,/STEP 2 OF/,'Resume the saved step');
  if(lesson===6){
    assert.match(node('#sinterguidestep').innerHTML,/sinter-workflow-title/,'Workflow diagram appears in step 2');
    node('#sinterbudget').value='errors';buttons[5].onclick();
    assert.match(node('#sinterbudgetresult').textContent,/Error target/);
    node('#sinterbudget').value='shots';node('#sinterbudget').onchange();
    assert.match(node('#sinterbudgetresult').textContent,/Shot cap/);
    node('#sinterbudget').value='continue';node('#sinterbudget').onchange();
    assert.match(node('#sinterbudgetresult').textContent,/continue/);
  }
  buttons[count-1].onclick();
  assert.equal(hash,`#tutorial/${lesson+1}/${count}`);
  assert.equal(JSON.parse(storage).steps[lesson],count-1);
  context.state=restoreLearningState(JSON.parse(storage));
  context[renderers[lesson]](root);
  assert.match(node('#'+stepNodes[lesson]).innerHTML,new RegExp(`STEP ${count} OF ${count}`),'Reload retains position');
  vm.runInContext('tutorialReturnLink()',context);
  assert.match(node('tutorialreturn').innerHTML,new RegExp(`#tutorial/${lesson+1}/${count}`),'Tool return targets saved step');
  context.state=restoreLearningState(null);
  context[renderers[lesson]](root);
  assert.match(node('#'+stepNodes[lesson]).innerHTML,/STEP 1 OF/,'Reset removes the prior position');
}
// An explicit URL overrides the position saved in storage.
let selected,opened,scrolled=false;
const routeContext={location:{hash:'#tutorial/4/6'},tutorialStepCounts:[7,7,7,8,8,8,9],openLesson:i=>opened=i,document:{querySelector:selector=>({click(){selected=selector;}}),getElementById:()=>({scrollIntoView(){scrolled=true;}})}};
vm.createContext(routeContext);
const app=fs.readFileSync(require.resolve('../web/app.js'),'utf8');
vm.runInContext(app.slice(app.indexOf('function followTutorialStepLink(){'),app.indexOf("document.addEventListener('click',event=>{",app.indexOf('function followTutorialStepLink(){'))),routeContext);
routeContext.followTutorialStepLink();assert.equal(opened,3);assert.equal(selected,'[data-circuit-step="5"]');assert(scrolled);
routeContext.location.hash='#tutorial/7/9';routeContext.followTutorialStepLink();assert.equal(opened,6);assert.equal(selected,'[data-sinter-step="8"]');
opened=null;routeContext.location.hash='#tutorial/1/8';routeContext.followTutorialStepLink();assert.equal(opened,null,'Reject nonexistent steps');
const helpContext={};vm.createContext(helpContext);vm.runInContext(support,helpContext);
for(const [lesson,step,expected]of [[2,1,'dictionary'],[3,5,'reshape'],[4,6,'axis=1'],[5,1,'argparse'],[5,6,'DictWriter']])assert(helpContext.pythonHelp(lesson,step).includes(expected));
console.log('PASS: seven guides resume, persist and reset positions; return links, explicit URLs and contextual Python help');
