(function () {
  "use strict";

  const data = window.ADHDScreenerData;
  const resultService = window.ADHDScreenerResult;
  const MOTION_DURATION = 620;
  const screens = Array.from(document.querySelectorAll(".screen"));
  const state = {
    name: "",
    answers: new Array(data.questions.length).fill(null),
    currentIndex: 0,
    result: null,
    date: null,
    isTransitioning: false
  };

  const elements = {
    nameForm: document.getElementById("name-form"),
    nameInput: document.getElementById("user-name"),
    nameError: document.getElementById("name-error"),
    quizFlowHeader: document.getElementById("quiz-flow-header"),
    processingActions: document.getElementById("processing-actions"),
    viewResultButton: document.getElementById("view-result-button"),
    questionCard: document.getElementById("question-card"),
    questionCounter: document.getElementById("question-counter"),
    progressTrack: document.querySelector(".progress-track"),
    progressBar: document.getElementById("progress-bar"),
    questionPart: document.getElementById("question-part"),
    questionText: document.getElementById("question-text"),
    answerOptions: document.getElementById("answer-options"),
    previousButton: document.getElementById("previous-button"),
    selectionStatus: document.getElementById("selection-status"),
    pdfButton: document.getElementById("pdf-button"),
    kakaoShareButton: document.getElementById("kakao-share-button")
  };

  function init() {
    createDotOrbits();
    bindEvents();
    runIntro();
  }

  function createDotOrbits() {
    const container = document.querySelector("[data-dot-orbit]");
    if (!container || container.children.length) return;
    const dotsPerRing = 108;
    const rings = Array.from({ length: 15 }, function (_, index) {
      return {
        count: dotsPerRing,
        radius: 17.8 + index * (29.2 / 14),
        radialPosition: index / 14
      };
    });

    rings.forEach(function (ring, ringIndex) {
      for (let index = 0; index < ring.count; index += 1) {
        const ringOffset = ringIndex * 0.0018;
        const clockwisePosition = (index / ring.count + ringOffset) % 1;
        const angle = (Math.PI * 2 * clockwisePosition) - Math.PI / 2;
        const dot = document.createElement("span");
        const radialEmphasis = 0.72 + Math.sin(Math.PI * ring.radialPosition) * 0.42;
        const bottomWave = circularPulse(clockwisePosition, 0.52, 0.15) * 6.7;
        const lowerLeftWave = circularPulse(clockwisePosition, 0.74, 0.075) * 4.6;
        const upperRightWave = circularPulse(clockwisePosition, 0.1, 0.065) * 3.8;
        const dotSize = Math.min(10.5, 1.35 + radialEmphasis * (bottomWave + lowerLeftWave + upperRightWave));
        const restingOpacity = 0.14 + (dotSize / 10.5) * 0.24;
        const waveDuration = 10.8 + ringIndex * 0.05;
        const staggeredWavePosition = (clockwisePosition + ringIndex * 0.0105) % 1;
        dot.className = "orbit-dot";
        dot.style.setProperty("--x", Math.cos(angle) * ring.radius + "%");
        dot.style.setProperty("--y", Math.sin(angle) * ring.radius + "%");
        dot.style.setProperty("--dot-size", dotSize.toFixed(2) + "px");
        dot.style.setProperty("--rest-opacity", restingOpacity.toFixed(3));
        dot.style.setProperty("--wave-duration", waveDuration.toFixed(2) + "s");
        dot.style.setProperty("--wave-delay", -((1 - staggeredWavePosition) * waveDuration) + "s");
        container.appendChild(dot);
      }
    });
  }

  function circularPulse(position, center, spread) {
    const directDistance = Math.abs(position - center);
    const distance = Math.min(directDistance, 1 - directDistance);
    return Math.exp(-(distance * distance) / (2 * spread * spread));
  }

  function bindEvents() {
    elements.nameForm.addEventListener("submit", handleNameSubmit);
    elements.nameInput.addEventListener("input", function () {
      elements.nameError.textContent = "";
      elements.nameInput.removeAttribute("aria-invalid");
    });
    document.getElementById("start-quiz-button").addEventListener("click", startQuiz);
    document.getElementById("continue-button").addEventListener("click", function () {
      showScreen("quiz-screen");
      renderQuestion();
    });
    document.getElementById("half-previous-button").addEventListener("click", function () {
      state.currentIndex = 8;
      showScreen("quiz-screen");
      renderQuestion();
    });
    elements.previousButton.addEventListener("click", previousQuestion);
    document.getElementById("restart-button").addEventListener("click", restartTest);
    elements.viewResultButton.addEventListener("click", openResultScreen);
    document.getElementById("view-ad-button").addEventListener("click", function () {
      showScreen("ad-screen");
    });
    document.getElementById("ad-result-button").addEventListener("click", openResultScreen);
    elements.pdfButton.addEventListener("click", function () {
      resultService.downloadResultPdf(getResultPayload());
    });
    elements.kakaoShareButton.addEventListener("click", function () {
      resultService.shareResult(getResultPayload());
    });
  }

  async function runIntro() {
    const message = document.getElementById("intro-message");
    const messages = ["안녕하세요.", "성인 ADHD 자가검사입니다.", "방문해주셔서 감사합니다."];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    await wait(reduceMotion ? 80 : 700);

    for (const text of messages) {
      message.textContent = text;
      message.classList.add("is-visible");
      await wait(reduceMotion ? 180 : 1350);
      message.classList.remove("is-visible");
      await wait(reduceMotion ? 30 : MOTION_DURATION);
    }
    showScreen("name-screen");
  }

  function handleNameSubmit(event) {
    event.preventDefault();
    const name = elements.nameInput.value.trim();
    if (!name) {
      elements.nameError.textContent = "검사 결과에 표시할 이름을 입력해주세요.";
      elements.nameInput.setAttribute("aria-invalid", "true");
      elements.nameInput.focus();
      return;
    }
    state.name = name;
    sessionStorage.setItem("adhd-screener-name", name);
    showScreen("guide-screen");
  }

  function startQuiz() {
    state.currentIndex = 0;
    showScreen("quiz-screen");
    renderQuestion();
  }

  function renderQuestion() {
    elements.questionCard.classList.remove("is-entering", "is-leaving");
    window.scrollTo({ top: 0, behavior: "auto" });
    const question = data.questions[state.currentIndex];
    const count = state.currentIndex + 1;
    elements.questionCounter.textContent = String(count).padStart(2, "0") + " / 18";
    elements.progressTrack.setAttribute("aria-valuenow", String(count));
    elements.progressBar.style.width = count / data.questions.length * 100 + "%";
    elements.questionPart.textContent = "PART " + question.part;
    elements.questionText.textContent = question.text;
    const isFirstQuestion = state.currentIndex === 0;
    elements.previousButton.hidden = false;
    elements.previousButton.disabled = isFirstQuestion;
    elements.previousButton.classList.toggle("is-placeholder", isFirstQuestion);
    elements.previousButton.setAttribute("aria-hidden", String(isFirstQuestion));
    renderAnswerOptions();

    requestAnimationFrame(function () {
      window.scrollTo({ top: 0, behavior: "auto" });
      elements.questionCard.classList.add("is-entering");
      window.setTimeout(function () { elements.questionCard.classList.remove("is-entering"); }, MOTION_DURATION);
    });
  }

  function renderAnswerOptions() {
    elements.answerOptions.replaceChildren();
    data.answerOptions.forEach(function (option) {
      const button = document.createElement("button");
      const marker = document.createElement("span");
      const label = document.createElement("span");
      button.type = "button";
      button.className = "answer-button";
      button.dataset.value = option.value;
      button.setAttribute("aria-pressed", String(state.answers[state.currentIndex] === option.value));
      if (state.answers[state.currentIndex] === option.value) button.classList.add("is-selected");
      marker.className = "answer-marker";
      marker.setAttribute("aria-hidden", "true");
      label.textContent = option.label;
      button.append(marker, label);
      button.addEventListener("click", function () { selectAnswer(option.value, button); });
      elements.answerOptions.appendChild(button);
    });
  }

  function selectAnswer(value, selectedButton) {
    if (state.isTransitioning) return;
    state.isTransitioning = true;
    state.answers[state.currentIndex] = value;
    elements.answerOptions.querySelectorAll("button").forEach(function (button) {
      const selected = button === selectedButton;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
      button.disabled = true;
    });
    elements.selectionStatus.textContent = data.answerOptions[value].label + " 선택됨";

    window.setTimeout(function () {
      elements.questionCard.classList.add("is-leaving");
      window.setTimeout(advanceAfterAnswer, MOTION_DURATION);
    }, 260);
  }

  function advanceAfterAnswer() {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    if (state.currentIndex === 8) {
      state.currentIndex = 9;
      state.isTransitioning = false;
      showScreen("half-screen");
      return;
    }
    if (state.currentIndex === data.questions.length - 1) {
      state.isTransitioning = false;
      completeQuiz();
      return;
    }
    state.currentIndex += 1;
    state.isTransitioning = false;
    renderQuestion();
  }

  function previousQuestion() {
    if (state.isTransitioning || state.currentIndex === 0) return;
    state.currentIndex -= 1;
    renderQuestion();
  }

  async function completeQuiz() {
    state.date = new Date();
    state.result = resultService.calculateResult(state.answers, data.questions);
    const message = document.getElementById("processing-message");
    document.getElementById("completed-user-name").textContent = state.name;
    message.textContent = "";
    message.classList.remove("is-visible");
    elements.processingActions.hidden = true;
    elements.processingActions.classList.remove("is-visible");
    showScreen("processing-screen");

    await showProcessingMessage(message, "검사가 완료되었습니다.", 1700, true);
    await showProcessingMessage(message, "응답을 취합해서 리포트를 생성 중입니다.", 10000, true);
    await showProcessingMessage(message, "ADHD 결과 해석 리포트가 완성되었습니다.", 1500, true);

    elements.processingActions.hidden = false;
    requestAnimationFrame(function () {
      elements.processingActions.classList.add("is-visible");
      elements.viewResultButton.focus({ preventScroll: true });
    });
  }

  function openResultScreen() {
    const payload = getResultPayload();
    resultService.renderResult(payload);
    showScreen("result-screen");
    resultService.prepareResultPdf(payload);
  }

  async function showProcessingMessage(element, text, holdDuration, fadeOut) {
    element.textContent = text;
    element.classList.add("is-visible");
    await wait(MOTION_DURATION);
    await wait(holdDuration);
    if (!fadeOut) return;
    element.classList.remove("is-visible");
    await wait(MOTION_DURATION);
  }

  function getResultPayload() {
    return {
      name: state.name,
      answers: state.answers.slice(),
      result: state.result,
      date: state.date
    };
  }

  function restartTest() {
    state.answers.fill(null);
    state.currentIndex = 0;
    state.result = null;
    state.date = null;
    state.isTransitioning = false;
    sessionStorage.removeItem("adhd-screener-name");
    elements.nameInput.value = "";
    document.getElementById("action-status").textContent = "";
    elements.processingActions.hidden = true;
    elements.processingActions.classList.remove("is-visible");
    showScreen("name-screen");
  }

  function showScreen(id) {
    const isQuizFlow = id === "quiz-screen" || id === "half-screen";
    elements.quizFlowHeader.hidden = !isQuizFlow;
    elements.quizFlowHeader.setAttribute("aria-hidden", String(!isQuizFlow));
    screens.forEach(function (screen) {
      const active = screen.id === id;
      screen.classList.toggle("is-active", active);
      screen.hidden = !active;
    });
    const next = document.getElementById(id);
    window.scrollTo({ top: 0, behavior: "auto" });
    window.setTimeout(function () {
      next.focus({ preventScroll: true });
      if (id === "name-screen") elements.nameInput.focus({ preventScroll: true });
    }, 60);
  }

  function wait(duration) {
    return new Promise(function (resolve) { window.setTimeout(resolve, duration); });
  }

  init();
})();
