const tutorialQuizzes=[
  [
    {q:'In the Python list qubits = [0, 1, 2], what is qubits[0]?',answers:['0, the first element','1, because counting starts at one','The entire list'],correct:0,explain:'Python list indices start at zero. The first element here is the integer 0.'},
    {q:'Starting from |0⟩, what does H prepare?',answers:['Always |1⟩','|+⟩ = (|0⟩ + |1⟩)/√2','A classical record containing both bits'],correct:1,explain:'H maps |0⟩ to |+⟩. A subsequent Z measurement has equal probabilities for 0 and 1.'},
    {q:'What does one Z measurement of one qubit record?',answers:['The complete quantum state','Both 0 and 1 in the same record','One classical bit: 0 or 1'],correct:2,explain:'A measurement records one outcome. Repeated shots estimate its probability distribution; one outcome does not reveal a full state.'},
    {q:'For a circuit with one M instruction, what shape has sample(shots=100)?',answers:['(100, 1): shots by recorded measurements','(1, 100): one shot with 100 qubits','(100, 100): one new qubit per shot'],correct:0,explain:'Each row is a fresh shot and each column is a recorded measurement. One recorded measurement gives one column.'},
    {q:'After H then M, must 10 shots contain exactly five 0s and five 1s?',answers:['Yes, quantum probabilities fix the exact counts','No; each is equally likely, but finite samples fluctuate','No; H always gives the bit 1'],correct:1,explain:'Equal probabilities do not force equal counts in a finite sample. Changing the shot count or seed can change the observed counts.'}
  ],
  [
    {q:'What does g|ψ⟩ = |ψ⟩ say?',answers:['g measures every physical data qubit separately','|ψ⟩ has check value −1 under g','g stabilizes |ψ⟩: the state has eigenvalue +1'],correct:2,explain:'A stabilizer leaves every state in its +1 eigenspace unchanged.'},
    {q:'Which single-qubit error anticommutes with a Z check touching that qubit?',answers:['X','Z','I'],correct:0,explain:'X and Z anticommute. An X component on an odd number of supported qubits flips a Z-check sign.'},
    {q:'In these ancilla circuits, which check value corresponds to measurement bit 1?',answers:['+1','−1','The number of data qubits'],correct:1,explain:'The convention is eigenvalue (−1)^bit: bit 0 means +1; bit 1 means −1.'},
    {q:'How does the bulk surface-code check differ from the two-data-qubit example?',answers:['It requires measuring each data qubit directly','It uses four data qubits and four separate logical qubits','It measures a four-data-qubit joint parity with one ancilla'],correct:2,explain:'A weight-4 generator touches four data qubits. One ancilla can gather that joint parity without separately reading the data.'},
    {q:'What is the Pauli weight of X and Z combined on the same physical qubit?',answers:['1: it is Y up to a global phase','2: count the X and Z symbols separately','0: X and Z always cancel'],correct:0,explain:'Weight counts distinct qubits with non-identity factors. X and Z on one qubit combine into Y up to phase, so that qubit counts once.'}
  ],
  [
    {q:'How many data qubits form a rotated distance-3 patch?',answers:['3','9','17'],correct:1,explain:'There are d² data qubits: 3² = 9. Seventeen includes the eight dedicated check ancillas in our implementation.'},
    {q:'How many independent check generators are used in this nine-data-qubit patch?',answers:['9','4','8'],correct:2,explain:'Eight independent generators on nine data qubits leave one logical qubit, k = 9 − 8.'},
    {q:'What are the weights of its bulk and boundary checks?',answers:['Bulk 4; boundary 2','Bulk 2; boundary 4','Every check has weight 9'],correct:0,explain:'Bulk checks touch four data qubits; the chosen boundary checks touch two. Ancillas are not included in this weight.'},
    {q:'What is necessary when measuring all parity checks?',answers:['Always finish all X checks before starting any Z check','Coordinate the CNOT layers even though the generators commute','Reset and measure all data before each round'],correct:1,explain:'The ideal generators commute, but the ancilla circuits share data and need a valid CNOT schedule. Record order is a separate convention.'},
    {q:'For an X-check circuit in our schedule, which qubits control the CNOTs?',answers:['The data, with the X ancilla as target','The Z ancillas, with X ancillas as targets','The X ancilla, with supported data as targets'],correct:2,explain:'Prepare the X ancilla in |+⟩ and use it as control. For a Z check, data instead control CNOTs into its ancilla.'}
  ],
  [
    {q:'What should be reset every round of the memory experiment?',answers:['The ancillas after readout, while preserving the data','Every data qubit, to erase its errors','Neither data nor ancillas'],correct:0,explain:'MR reads and resets ancillas. Resetting data inside each round would erase the stored memory.'},
    {q:'What does a TICK instruction mean in these examples?',answers:['Apply a physical quantum gate to every qubit','Mark a time-layer boundary; it does not itself add a gate or noise','Measure and reset all ancillas'],correct:1,explain:'TICK is a timing annotation. H and CX are gates; MR performs measurement and reset.'},
    {q:'Why can a first-round X-check bit be 1 in the noiseless logical-Z experiment?',answers:['The decoder has already failed','Every check must start with a random physical error','The Z-basis data initialization did not fix the X-check baseline'],correct:2,explain:'Initializing data in |0⟩ fixes Z checks, but the first X-check measurements establish their own possibly random signs.'},
    {q:'How many raw measurement bits are in one manual three-round shot?',answers:['33: 3 × 8 ancilla readings plus 9 final data readings','24: only one bit per detector','17: one bit per physical qubit regardless of rounds'],correct:0,explain:'The manual circuit records eight ancillas per round, then measures nine data qubits once at the end: 24 + 9 = 33.'},
    {q:'Why use the generated annotated circuit for detector sampling and decoding?',answers:['It makes every raw measurement deterministic','It includes detector parities and a tracked logical observable','It avoids the need to specify a noise model'],correct:1,explain:'DETECTOR and OBSERVABLE_INCLUDE define how to turn measurements into detection events and logical readout. They do not remove the noise.'}
  ],
  [
    {q:'Which array should be passed to matching.decode_batch in this tutorial?',answers:['The simulation’s known actual logical flips','The failures counted after checking answers','The detection-event array, dets'],correct:2,explain:'The decoder gets detection events. The simulation’s actual logical flips are kept separate for evaluation.'},
    {q:'What counts as a logical decoding failure for a shot?',answers:['A predicted logical flip differs from its actual flip','Any detector event occurs','Any actual logical flip occurs, even when predicted correctly'],correct:0,explain:'A failed prediction is a mismatch with the tracked actual observable flip. A correctly predicted flip can be handled in the logical frame.'},
    {q:'What do the 24 columns of dets represent in this experiment?',answers:['24 separate physical ancilla qubits','Detector relations spanning rounds and boundaries','24 decoder guesses for the same logical bit'],correct:1,explain:'A detector is a defined measurement parity. Detector columns include time and boundary relations, not one column per physical ancilla.'},
    {q:'What does decode_batch return in the shown API call?',answers:['The unique actual physical error on every qubit','A replacement noise-free quantum circuit','Predicted flips of the tracked logical observables'],correct:2,explain:'Here the output has one logical-flip prediction per shot. It is not a physical correction-qubit list.'},
    {q:'What does failures / shots estimate in this logical-Z memory experiment?',answers:['Its tracked logical decoding failure probability per complete experiment','The probability of an error on each physical gate','The complete error channel of any encoded quantum state'],correct:0,explain:'The estimate is per full memory experiment and for its tracked observable. It is not automatically per round or a full logical-channel benchmark.'}
  ],
  [
    {q:'What rate is estimated by 12 failures in 10,000 shots?',answers:['0.12','0.0012','12'],correct:1,explain:'Divide the failure count by the shot count: 12 / 10000 = 0.0012, or 0.12%.'},
    {q:'What can zero failures in 1,000 shots establish?',answers:['The true failure probability is exactly zero','The code works at every noise rate','The failure probability is uncertain; an approximate 95% upper bound is 0.003'],correct:2,explain:'With zero events, the rule-of-three bound is approximately 3 / shots. Finite samples cannot prove a zero probability.'},
    {q:'What information is needed for a useful distance comparison?',answers:['A consistent noise definition, stated round counts, shot counts and uncertainty','Only the distance labels','Only the faster runtime'],correct:0,explain:'Distance alone is insufficient. Changes in rounds, noise assumptions or sampling can alter the observed rates.'},
    {q:'Does a larger distance guarantee a lower measured failure rate in every small experiment?',answers:['Yes, regardless of noise or sampling','No; the noise regime and finite-sample uncertainty matter','Yes, provided there is at least one detector event'],correct:1,explain:'Larger distance can suppress logical errors below threshold, but not in every regime or every finite sample.'},
    {q:'What is a sound way to investigate a threshold?',answers:['Declare it after one noiseless run','Use one distance and ignore uncertainty','Compare multiple distances across noise rates with enough samples and uncertainty estimates'],correct:2,explain:'Threshold behavior concerns scaling with distance and noise. A small isolated experiment is not enough to establish it.'}
  ]
];
function restoreLearningState(saved){
  const result={done:[],last:0,quizzes:{}};
  if(!saved||typeof saved!=='object')return result;
  if(Array.isArray(saved.done))result.done=[...new Set(saved.done.filter(i=>Number.isInteger(i)&&i>=0&&i<6))];
  if(Number.isInteger(saved.last)&&saved.last>=0&&saved.last<6)result.last=saved.last;
  tutorialQuizzes.forEach((questions,i)=>{
    const quiz=saved.quizzes?.[i];if(!quiz||!Array.isArray(quiz.answers))return;
    const answers=questions.map((q,j)=>Number.isInteger(quiz.answers[j])&&quiz.answers[j]>=0&&quiz.answers[j]<q.answers.length?quiz.answers[j]:null);
    result.quizzes[i]={answers,checked:quiz.checked===true&&answers.every(a=>a!==null)};
  });return result;
}
function quizScore(questions,answers){return questions.reduce((n,q,i)=>n+Number(answers[i]===q.correct),0);}
function renderTutorialQuiz(root,lessonIndex){
  const questions=tutorialQuizzes[lessonIndex];
  state.quizzes??={};const quiz=state.quizzes[lessonIndex]??={answers:Array(questions.length).fill(null),checked:false};
  root.innerHTML=`<div class="eyebrow">TUTORIAL QUIZ · 5 QUESTIONS</div><h2>Check your understanding</h2><p>Choose one answer for each question, then check your answers. Get all five correct to complete this tutorial. You can retry as often as you like.</p>${state.done.includes(lessonIndex)?'<p class="notice">Your previous completion is saved. You can review the new quiz without losing it.</p>':''}<div class="quizquestions">${questions.map((q,i)=>`<fieldset class="quizquestion" aria-describedby="quizfeedback-${i}"><legend>${i+1}. ${escapeHTML(q.q)}</legend>${q.answers.map((answer,j)=>`<label class="quizchoice"><input type="radio" name="quiz-${lessonIndex}-${i}" value="${j}" data-quiz-question="${i}" ${quiz.answers[i]===j?'checked':''}><span>${String.fromCharCode(65+j)}. ${escapeHTML(answer)}</span></label>`).join('')}<p class="quizfeedback" id="quizfeedback-${i}"></p></fieldset>`).join('')}</div><button class="outline" id="checkquiz">Check answers</button><div class="feedback" id="quizsummary" role="status" aria-live="polite"></div><button class="primary" id="complete" disabled>Answer all five correctly to continue</button><p class="tiny">Answers and tutorial progress are saved in this browser. Revisit a tutorial to review them.</p>`;
  function refresh(){
    const score=quizScore(questions,quiz.answers),answered=quiz.answers.filter(a=>a!==null).length,passed=quiz.checked&&score===questions.length;
    questions.forEach((q,i)=>{
      const feedback=root.querySelector(`#quizfeedback-${i}`),selected=quiz.answers[i];
      feedback.textContent=!quiz.checked?'':selected===null?'Choose an answer.':selected===q.correct?'Correct. '+q.explain:'Try again. '+q.explain;
      feedback.classList.toggle('quizwrong',quiz.checked&&selected!==q.correct);feedback.classList.toggle('quizright',quiz.checked&&selected===q.correct);
    });
    root.querySelector('#quizsummary').textContent=quiz.checked?`${score} of 5 correct. ${passed?'Quiz passed. You can now complete this tutorial.':'Review the feedback, change your answers and check again.'}`:`${answered} of 5 questions answered. Check your answers when ready.`;
    root.querySelector('#complete').disabled=!passed;root.querySelector('#complete').textContent=passed?(state.done.includes(lessonIndex)?'Continue →':'Mark complete & continue →'):'Answer all five correctly to continue';
  }
  root.querySelectorAll('[data-quiz-question]').forEach(input=>input.onchange=()=>{quiz.answers[+input.dataset.quizQuestion]=+input.value;quiz.checked=false;save();refresh();});
  root.querySelector('#checkquiz').onclick=()=>{quiz.checked=true;save();refresh();};
  root.querySelector('#complete').onclick=()=>{
    if(!quiz.checked||quizScore(questions,quiz.answers)!==questions.length)return;
    if(!state.done.includes(lessonIndex))state.done.push(lessonIndex);save();update();lessonIndex<5?openLesson(lessonIndex+1):view('progress');
  };refresh();
}
if(typeof module!=='undefined')module.exports={tutorialQuizzes,restoreLearningState,quizScore};
