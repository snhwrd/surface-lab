const assert=require('node:assert/strict');
const {tutorialQuizzes,restoreLearningState,quizScore}=require('../web/quizzes.js');
assert.equal(tutorialQuizzes.length,7);
for(const questions of tutorialQuizzes){
  assert.equal(questions.length,5);assert.equal(new Set(questions.map(q=>q.q)).size,5);
  for(const q of questions){assert(q.q.length>0);assert(q.explain.length>0);assert.equal(q.answers.length,3);assert(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.answers.length);assert.equal(new Set(q.answers).size,3);}
  assert.equal(quizScore(questions,Array(5).fill(null)),0);
  const answers=questions.map(q=>q.correct);assert.equal(quizScore(questions,answers),5);
  for(let i=0;i<5;i++){const wrong=[...answers];wrong[i]=(wrong[i]+1)%3;assert.equal(quizScore(questions,wrong),4,'Every question independently gates a perfect score');}
}
assert.deepEqual(restoreLearningState({done:[0,2],last:2}),{done:[0,2],last:2,quizzes:{},steps:{}},'Legacy completions survive');
const corrupted=restoreLearningState({done:[0,0,7,-1,'1'],last:99,quizzes:{0:{answers:[0,999,-1,'2',null],checked:true}}});
assert.deepEqual(corrupted.done,[0]);assert.equal(corrupted.last,0);assert.deepEqual(corrupted.quizzes[0].answers,[0,null,null,null,null]);assert.equal(corrupted.quizzes[0].checked,false);
const saved={done:[1],last:0,steps:{},quizzes:{0:{answers:tutorialQuizzes[0].map(q=>q.correct),checked:true}}};assert.deepEqual(restoreLearningState(saved),saved,'Valid checked quizzes survive reload');
assert.deepEqual(restoreLearningState(null),{done:[],last:0,quizzes:{},steps:{}});
console.log('PASS: all 35 quiz questions, individual score gating, saved-answer validation and legacy progress migration');

const positions=restoreLearningState({steps:{0:6,1:7,2:-1,3:7,4:"2",5:Infinity}});
assert.deepEqual(positions.steps,{0:6,3:7},'Only valid numeric guide positions survive reload');

const previousCourse=restoreLearningState({done:[0,1,2,3,4,5],last:5});
assert.equal(previousCourse.done.length,6);assert(!previousCourse.done.includes(6));
const newCourse=restoreLearningState({done:[6],last:6,steps:{6:8}});
assert.equal(newCourse.last,6);assert.equal(newCourse.steps[6],8);
