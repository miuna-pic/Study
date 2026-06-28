const allQuestions = window.QUIZ_DATA || [];
const storeKey = "xigai-quiz-record-v1";
const state = {
  pool: [], index: 0, answers: {}, submitted: {}, exam: false, showAnswers: false,
  records: JSON.parse(localStorage.getItem(storeKey) || "{}")
};
const $ = (id) => document.getElementById(id);
const els = {
  totalCount: $("totalCount"), doneCount: $("doneCount"), rightRate: $("rightRate"), wrongCount: $("wrongCount"), multiCount: $("multiCount"),
  modeSelect: $("modeSelect"), scopeSelect: $("scopeSelect"), shuffleToggle: $("shuffleToggle"), startBtn: $("startBtn"), resetBtn: $("resetBtn"),
  progressText: $("progressText"), questionTitle: $("questionTitle"), typeBadge: $("typeBadge"), optionList: $("optionList"), feedback: $("feedback"),
  prevBtn: $("prevBtn"), submitBtn: $("submitBtn"), nextBtn: $("nextBtn"), finishBtn: $("finishBtn"), resultBox: $("resultBox"),
  toggleAnswersBtn: $("toggleAnswersBtn"), answerSheet: $("answerSheet"), themeBtn: $("themeBtn")
};
function normalize(list) { return [...new Set(list)].sort().join(""); }
function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function saveRecords() { localStorage.setItem(storeKey, JSON.stringify(state.records)); }
function getSelected(qid) { return state.answers[qid] || []; }
function isCorrect(q, selected) { return normalize(selected) === normalize(q.answer.split("")); }
function currentQuestion() { return state.pool[state.index]; }
function updateStats() {
  const submittedIds = Object.keys(state.submitted);
  const right = submittedIds.filter(id => state.submitted[id]).length;
  els.totalCount.textContent = allQuestions.length;
  els.doneCount.textContent = submittedIds.length;
  els.rightRate.textContent = submittedIds.length ? Math.round(right / submittedIds.length * 100) + "%" : "0%";
  const wrongIds = Object.keys(state.records).filter(id => state.records[id]?.wrong);
  els.wrongCount.textContent = `错题 ${wrongIds.length}`;
  els.multiCount.textContent = `多选 ${allQuestions.filter(q => q.type === "multiple").length}`;
}
function buildPool() {
  const scope = els.scopeSelect.value;
  let pool = allQuestions;
  if (scope === "wrong") {
    const wrongIds = new Set(Object.keys(state.records).filter(id => state.records[id]?.wrong).map(Number));
    pool = allQuestions.filter(q => wrongIds.has(q.id));
  } else if (scope === "single") {
    pool = allQuestions.filter(q => q.type === "single");
  } else if (scope === "multiple") {
    pool = allQuestions.filter(q => q.type === "multiple");
  }
  return els.shuffleToggle.checked ? shuffle(pool) : [...pool];
}
function startQuiz() {
  state.pool = buildPool();
  state.index = 0;
  state.answers = {};
  state.submitted = {};
  state.exam = els.modeSelect.value === "exam";
  state.showAnswers = false;
  els.answerSheet.classList.add("hidden");
  els.finishBtn.classList.toggle("hidden", !state.exam);
  els.submitBtn.textContent = state.exam ? "保存本题" : "提交本题";
  if (!state.pool.length) {
    els.questionTitle.textContent = "当前范围没有题目";
    els.progressText.textContent = "请切换范围";
    els.typeBadge.textContent = "--";
    els.optionList.innerHTML = "";
    els.feedback.className = "feedback";
    els.feedback.textContent = "例如：错题本为空时，不能使用“只练错题”。";
    updateButtons(); updateStats(); return;
  }
  renderQuestion(); updateStats(); renderResult();
}
function renderQuestion() {
  const q = currentQuestion();
  if (!q) return;
  const selected = getSelected(q.id);
  const submitted = Object.prototype.hasOwnProperty.call(state.submitted, q.id);
  els.progressText.textContent = `第 ${state.index + 1} / ${state.pool.length} 题 · 原题号 ${q.id}`;
  els.questionTitle.textContent = q.displayQuestion;
  els.typeBadge.textContent = q.type === "multiple" ? "多选" : "单选";
  els.optionList.innerHTML = q.options.map(opt => {
    const checked = selected.includes(opt.key) ? "checked" : "";
    const inputType = q.type === "multiple" ? "checkbox" : "radio";
    let cls = "option" + (selected.includes(opt.key) ? " selected" : "");
    if (!state.exam && submitted) {
      if (q.answer.includes(opt.key)) cls += " correct";
      else if (selected.includes(opt.key)) cls += " wrong";
    }
    return `<label class="${cls}"><input type="${inputType}" name="option" value="${opt.key}" ${checked}><span class="key">${opt.key}</span><span>${escapeHtml(opt.text)}</span></label>`;
  }).join("");
  [...els.optionList.querySelectorAll("input")].forEach(input => input.addEventListener("change", onSelect));
  renderFeedback(); updateButtons();
}
function escapeHtml(text) {
  return text.replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch]));
}
function onSelect(e) {
  const q = currentQuestion();
  if (!q) return;
  if (q.type === "single") state.answers[q.id] = [e.target.value];
  else {
    const selected = [...els.optionList.querySelectorAll("input:checked")].map(i => i.value);
    state.answers[q.id] = selected;
  }
  renderQuestion();
}
function submitCurrent() {
  const q = currentQuestion();
  if (!q) return;
  const selected = getSelected(q.id);
  if (!selected.length) {
    els.feedback.className = "feedback bad";
    els.feedback.textContent = "请先选择答案。";
    return;
  }
  const correct = isCorrect(q, selected);
  state.submitted[q.id] = correct;
  state.records[q.id] = { wrong: !correct, last: normalize(selected), answer: q.answer, time: Date.now() };
  saveRecords();
  renderQuestion(); updateStats(); renderResult();
  if (state.exam && state.index < state.pool.length - 1) nextQuestion();
}
function renderFeedback() {
  const q = currentQuestion();
  const selected = getSelected(q.id);
  const submitted = q && Object.prototype.hasOwnProperty.call(state.submitted, q.id);
  if (!q || !submitted || state.exam) {
    els.feedback.className = "feedback hidden";
    els.feedback.textContent = "";
    return;
  }
  const correct = state.submitted[q.id];
  els.feedback.className = `feedback ${correct ? "ok" : "bad"}`;
  els.feedback.innerHTML = `${correct ? "答对了" : "答错了"}。你的答案：<b>${normalize(selected) || "未选"}</b>；正确答案：<b>${q.answer}</b>。`;
}
function nextQuestion() { if (state.index < state.pool.length - 1) { state.index++; renderQuestion(); } }
function prevQuestion() { if (state.index > 0) { state.index--; renderQuestion(); } }
function finishExam() {
  state.pool.forEach(q => {
    if (!Object.prototype.hasOwnProperty.call(state.submitted, q.id)) {
      const selected = getSelected(q.id);
      const correct = selected.length > 0 && isCorrect(q, selected);
      state.submitted[q.id] = correct;
      state.records[q.id] = { wrong: !correct, last: normalize(selected), answer: q.answer, time: Date.now() };
    }
  });
  saveRecords(); updateStats(); renderResult(true); renderAnswerSheet(true);
}
function renderResult(forceDetail = false) {
  const ids = Object.keys(state.submitted);
  if (!ids.length) {
    els.resultBox.textContent = "还没有提交记录。"; return;
  }
  const right = ids.filter(id => state.submitted[id]).length;
  const wrong = ids.length - right;
  const rate = Math.round(right / ids.length * 100);
  els.resultBox.innerHTML = `已提交 <b>${ids.length}</b> 题，正确 <b>${right}</b> 题，错误 <b>${wrong}</b> 题，正确率 <b>${rate}%</b>。${forceDetail ? "下方已展开本次答案明细。" : ""}`;
}
function renderAnswerSheet(show = state.showAnswers) {
  state.showAnswers = show;
  els.answerSheet.classList.toggle("hidden", !show);
  els.toggleAnswersBtn.textContent = show ? "隐藏全部答案" : "显示全部答案";
  if (!show) return;
  els.answerSheet.innerHTML = allQuestions.map(q => {
    const rec = state.records[q.id];
    const status = rec ? (rec.wrong ? "错题" : "正确") : "未做";
    return `<div class="answer-row"><strong>${q.id}</strong><span>${escapeHtml(q.displayQuestion)}</span><b>${q.answer} · ${status}</b></div>`;
  }).join("");
}
function updateButtons() {
  els.prevBtn.disabled = state.index <= 0;
  els.nextBtn.disabled = !state.pool.length || state.index >= state.pool.length - 1;
  els.submitBtn.disabled = !state.pool.length;
  els.finishBtn.disabled = !state.pool.length;
}
function resetRecords() {
  if (!confirm("确定清空本机答题记录和错题本吗？")) return;
  state.records = {}; state.submitted = {}; state.answers = {};
  saveRecords(); updateStats(); renderResult(); renderAnswerSheet(false); renderQuestion();
}
els.startBtn.addEventListener("click", startQuiz);
els.resetBtn.addEventListener("click", resetRecords);
els.submitBtn.addEventListener("click", submitCurrent);
els.nextBtn.addEventListener("click", nextQuestion);
els.prevBtn.addEventListener("click", prevQuestion);
els.finishBtn.addEventListener("click", finishExam);
els.toggleAnswersBtn.addEventListener("click", () => renderAnswerSheet(!state.showAnswers));
els.themeBtn.addEventListener("click", () => document.documentElement.classList.toggle("dark"));
updateStats();
