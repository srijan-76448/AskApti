let quizData = { questions: [] };
let currentQuestionIndex = 0;
let correctAnswers = 0;
let startTime = null;
let timerInterval;
let questionStartTime;
let totalTimeTaken = 0;
let quizEnded = false;

const questionText = document.getElementById("question-text");
const optionsGrid = document.getElementById("options-grid");
const timerDisplay = document.getElementById("timer");
const liveScoreDisplay = document.getElementById("live-score");
const progressBar = document.getElementById("progress-bar");
const questionCountLabel = document.getElementById("question-count");

async function initAssessment() {
  try {
    // Fetch from relative path to questions.json
    const response = await fetch("./index.json");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    quizData = await response.json();
    renderQuestion();
  } catch (err) {
    questionText.textContent =
      "CRITICAL: Could not load questions.json. Ensure file exists in the same directory.";
    console.error("Fetch Error:", err);
  }
}

function launchTimer() {
  if (timerInterval) return;
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mm = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, "0");
    const ss = (elapsed % 60).toString().padStart(2, "0");
    timerDisplay.textContent = `${mm}:${ss}`;
    if (!quizEnded) calculatePerformance();
  }, 1000);
}

function calculatePerformance() {
  if (!startTime) return;
  const elapsed = (Date.now() - startTime) / 1000;
  const divisor = Math.max(1, currentQuestionIndex + 1);
  const avgTime = elapsed / divisor;
  const totalQuestions = quizData.questions.length;
  const accuracyFactor = correctAnswers / totalQuestions;
  const efficiencyMultiplier = Math.max(0.1, Math.min(2.0, 10 / avgTime));
  const liveCalc = (accuracyFactor * efficiencyMultiplier * 10).toFixed(1);
  liveScoreDisplay.textContent = Math.min(10.0, liveCalc);
}

function renderQuestion() {
  const q = quizData.questions[currentQuestionIndex];
  questionText.textContent = q.question;
  optionsGrid.innerHTML = "";
  questionStartTime = Date.now();

  const progressPct = (currentQuestionIndex / quizData.questions.length) * 100;
  progressBar.style.width = `${progressPct}%`;
  questionCountLabel.textContent = `Node: ${currentQuestionIndex + 1} / ${quizData.questions.length}`;

  q.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className =
      "option-btn w-full text-left p-4 rounded-xl border border-slate-700 bg-slate-800/30 hover:bg-slate-800 hover:border-slate-500 focus:outline-none";
    btn.textContent = opt;
    btn.onclick = () => handleSubmission(btn, opt, q.answer);
    optionsGrid.appendChild(btn);
  });
}

function handleSubmission(element, selected, correct) {
  if (!startTime) launchTimer();
  const latency = (Date.now() - questionStartTime) / 1000;

  const btns = optionsGrid.querySelectorAll(".option-btn");
  btns.forEach((b) => (b.disabled = true));
  element.classList.add("selected");

  if (selected === correct) correctAnswers++;
  totalTimeTaken += latency;
  calculatePerformance();

  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizData.questions.length) {
      renderQuestion();
    } else {
      terminateAssessment();
    }
  }, 150);
}

function terminateAssessment() {
  quizEnded = true;
  clearInterval(timerInterval);
  progressBar.style.width = "100%";

  setTimeout(() => {
    document.getElementById("quiz-screen").classList.add("hidden");
    document.getElementById("result-screen").classList.remove("hidden");
    const meanLatency = totalTimeTaken / quizData.questions.length;
    document.getElementById("final-score").textContent =
      liveScoreDisplay.textContent;
    document.getElementById("correct-count").textContent = correctAnswers;
    document.getElementById("avg-time").textContent =
      `${meanLatency.toFixed(2)}s`;
  }, 400);
}

window.onload = initAssessment;
