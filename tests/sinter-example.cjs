const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const {sinterGuideExample,sinterBudgetStatus}=require('../web/sinter-guide.js');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'surface-lab-sinter-'));
const python=path.resolve(__dirname,'../.venv/bin/python');
const script=path.join(dir,'tutorial_7.py'),csv=path.join(dir,'results.csv'),plot=path.join(dir,'rates.png');
fs.writeFileSync(script,sinterGuideExample().complete);
function run(shots,withPlot=false){
  const args=[script,'--workers','2','--max-shots',String(shots),'--max-errors','1000','--output',csv];
  if(withPlot)args.push('--plot',plot);
  const result=spawnSync(python,args,{encoding:'utf8',timeout:60000});
  assert.equal(result.status,0,result.stderr||result.error?.message);
  assert(result.stdout.includes('Noiseless detector/observable checks passed'));
  const rows=[...result.stdout.matchAll(/shots=(\d+), discards=(\d+), errors=(\d+), rate_per_experiment=/g)];
  assert.equal(rows.length,6);
  for(const row of rows){assert.equal(Number(row[1]),shots);assert.equal(Number(row[2]),0);assert(Number(row[3])<=shots);}
}
run(40,true);
const initial=fs.readFileSync(csv,'utf8');
assert(initial.includes('strong_id')&&initial.includes('json_metadata'));
assert.equal(fs.readFileSync(plot).subarray(0,8).toString('hex'),'89504e470d0a1a0a');
run(40);assert.equal(fs.readFileSync(csv,'utf8'),initial,'Completed budgets must reuse saved stats');
run(80);assert.notEqual(fs.readFileSync(csv,'utf8'),initial,'Larger budgets extend the CSV');
const checkedIn=path.resolve(__dirname,'../examples/collect_with_sinter.py');
const compare=spawnSync(python,['-c','import ast, pathlib, sys; assert ast.dump(ast.parse(pathlib.Path(sys.argv[1]).read_text())) == ast.dump(ast.parse(pathlib.Path(sys.argv[2]).read_text()))',script,checkedIn],{encoding:'utf8'});
assert.equal(compare.status,0,compare.stderr);
assert.match(sinterBudgetStatus(8000,100,10000,100),/Error target/);
assert.match(sinterBudgetStatus(10000,12,10000,100),/Shot cap/);
assert.match(sinterBudgetStatus(3000,9,10000,100),/continue/);
console.log('PASS: downloadable Sinter script, two-worker collection, CSV resume and extension, optional PNG, and stopping decisions');
