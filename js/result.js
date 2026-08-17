(function () {
  "use strict";

  let preparedPdf = null;
  let pdfPreparation = null;

  function calculateResult(answers, questions) {
    const positiveAnswers = questions.map(function (question, index) {
      return Number(answers[index]) >= question.threshold;
    });
    const partAPositiveCount = positiveAnswers.slice(0, 6).filter(Boolean).length;
    const partBPositiveCount = positiveAnswers.slice(6).filter(Boolean).length;

    return {
      positiveAnswers: positiveAnswers,
      partAPositiveCount: partAPositiveCount,
      partBPositiveCount: partBPositiveCount,
      totalPositiveCount: positiveAnswers.filter(Boolean).length,
      screenPositive: partAPositiveCount >= 4
    };
  }

  function formatDate(date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join(".");
  }

  const interpretationByPartA = {
    minimal: {
      title: "핵심 선별 기준에는 해당하지 않았습니다",
      paragraphs: [
        "Part A에서는 6개 핵심 선별 항목 중 {partA}개 항목이 기준에 해당했습니다. 현재 응답에서는 ADHD와 관련된 핵심 증상이 비교적 적게 확인되었으며, ASRS-v1.1의 핵심 선별 기준에는 해당하지 않습니다.",
        "집중이 흐트러지거나 해야 할 일을 미루는 경험, 약속이나 일정을 놓치는 경험은 누구에게나 일시적으로 나타날 수 있습니다. 특히 피로, 수면 부족, 스트레스, 긴장도가 높은 시기에는 평소보다 집중력이 떨어지거나 일을 정리하는 데 어려움을 느낄 수 있습니다.",
        "이번 응답에서는 이러한 경험이 핵심 선별 기준에 이를 정도로 폭넓게 확인되지는 않았습니다. 현재의 집중과 행동 패턴이 전반적으로 큰 어려움을 시사하는 결과는 아니지만, 일상에서 느끼는 불편함이 있다면 그 경험 자체를 가볍게 넘길 필요는 없습니다.",
        "Part B에서는 12개 추가 증상 항목 중 {partB}개 항목이 기준에 해당했습니다. Part B는 ADHD와 관련될 수 있는 다양한 증상 경험의 범위를 살펴보기 위한 참고 정보이며, 해당 개수만으로 ADHD 여부나 증상의 중증도를 판단하지 않습니다.",
        "또한 선별 기준에 해당하지 않는다는 결과만으로 ADHD를 완전히 배제할 수는 없습니다. 실제 진단에서는 현재의 증상뿐만 아니라 어린 시절부터 비슷한 어려움이 있었는지, 학업·업무·대인관계 등 여러 생활 영역에 지속적인 영향을 주고 있는지를 함께 살펴봅니다.",
        "현재 결과와 관계없이 집중이나 실행의 어려움이 반복되고 있고, 그로 인해 일상생활에서 불편함을 느끼고 있다면 정신건강의학과 등 의료기관에서 전문적인 평가를 받아보는 것을 고려할 수 있습니다."
      ]
    },
    some: {
      title: "일부 ADHD 관련 특성이 확인되었습니다",
      paragraphs: [
        "Part A에서는 6개 핵심 선별 항목 중 {partA}개 항목이 기준에 해당했습니다. 일부 핵심 항목에서 ADHD와 관련될 수 있는 경험이 확인되었지만, 현재 응답은 ASRS-v1.1의 핵심 선별 기준인 4개 이상에는 해당하지 않습니다.",
        "집중을 유지하거나 해야 할 일을 계획대로 시작하는 과정, 약속이나 일정을 기억하는 과정에서 때때로 어려움을 경험하고 있을 수 있습니다. 이러한 경험이 모든 상황에서 나타나는 것은 아니더라도, 특정한 환경이나 반복적인 업무, 집중이 오래 필요한 상황에서 더 두드러질 수 있습니다.",
        "해야 할 일을 알고 있어도 시작이 늦어지거나, 집중하려는 순간 생각의 흐름을 놓치는 경험이 때때로 나타날 수 있습니다. 스스로는 충분히 알고 있고 노력하고 있는데도 같은 어려움이 반복된다면, 단순한 습관만의 문제는 아닐 수 있습니다.",
        "Part B에서는 12개 추가 증상 항목 중 {partB}개 항목이 기준에 해당했습니다. 이는 현재 경험하고 있는 증상의 범위를 살펴보기 위한 참고 정보이며, Part B 자체에는 별도의 공식 선별 기준이나 중증도 기준이 없습니다.",
        "현재 결과만으로 ADHD를 진단할 수는 없으며, 반대로 핵심 선별 기준에 해당하지 않았다는 이유만으로 모든 가능성을 배제할 수도 없습니다. 실제 평가에서는 증상이 언제부터 나타났는지, 여러 상황에서 반복되는지, 학업이나 업무 수행에 얼마나 영향을 주는지를 종합적으로 확인합니다.",
        "이러한 경험이 일시적인 불편함을 넘어 반복적으로 나타나거나, 일정 관리·업무 수행·학업·대인관계 등 일상생활에 영향을 주고 있다면 전문적인 평가를 통해 현재의 어려움을 보다 구체적으로 살펴보는 것이 도움이 될 수 있습니다."
      ]
    },
    threshold: {
      title: "추가적인 확인이 권장되는 응답 패턴입니다",
      paragraphs: [
        "Part A에서는 6개 핵심 선별 항목 중 4개 항목이 기준에 해당했습니다. 이는 ASRS-v1.1의 핵심 선별 기준에 해당하는 응답 패턴입니다.",
        "집중을 지속하는 과정, 해야 할 일을 계획하고 시작하는 과정, 여러 일을 순서대로 정리하고 마무리하는 과정 또는 행동을 조절하는 과정에서 ADHD와 관련될 수 있는 경험이 현재 일상에서 반복되고 있을 가능성이 있습니다.",
        "이러한 어려움은 상황에 따라 다르게 나타날 수 있습니다. 관심이 많은 일에는 오랫동안 몰입할 수 있지만 반복적이거나 부담스러운 일에서는 집중을 유지하기 어렵거나, 해야 할 일을 알고 있음에도 시작과 마무리가 늦어지는 형태로 경험될 수 있습니다.",
        "반복되는 어려움에는 단순한 의지의 문제만이 아니라, 나에게 맞는 집중과 행동의 방식을 이해할 필요가 있다는 신호가 담겨 있을 수 있습니다. 계속 노력해왔음에도 비슷한 상황이 되풀이되었다면, 그 경험이 왜 반복되는지를 구체적으로 살펴볼 가치가 있습니다.",
        "Part B에서는 12개 추가 증상 항목 중 {partB}개 항목이 기준에 해당했습니다. 이 값은 추가적으로 경험하고 있는 증상의 범위를 보여주는 참고 정보이며, Part B의 개수 자체가 ADHD의 중증도나 진단 여부를 의미하지는 않습니다.",
        "이번 결과는 ADHD 진단을 의미하지 않습니다. 실제 ADHD 진단에서는 현재의 증상뿐 아니라 아동기부터 유사한 특성이 있었는지, 여러 환경에서 증상이 나타나는지, 그리고 이러한 특성이 실제 생활 기능에 어느 정도 영향을 주고 있는지를 함께 평가합니다.",
        "현재 경험하고 있는 어려움이 학업·업무·일정 관리·대인관계 또는 일상생활에 반복적으로 영향을 주고 있다면 정신건강의학과 등 의료기관에서 보다 전문적인 평가를 받아보는 것을 권합니다."
      ]
    },
    high: {
      title: "여러 핵심 항목에서 관련 증상이 확인되었습니다",
      paragraphs: [
        "Part A에서는 6개 핵심 선별 항목 중 5개 항목이 기준에 해당했습니다. ASRS-v1.1의 핵심 선별 기준을 충족하며, 여러 핵심 영역에서 ADHD와 관련될 수 있는 경험이 비교적 폭넓게 보고되었습니다.",
        "집중 유지, 계획과 실행, 일정 관리, 해야 할 일을 시작하거나 마무리하는 과정, 충동 조절 또는 활동성과 관련된 어려움이 여러 상황에서 반복적으로 나타나고 있을 가능성이 있습니다.",
        "이러한 특성은 단순히 집중을 못 하는 모습으로만 나타나지 않습니다. 해야 할 일을 계속 미루다가 마감 직전에 몰아서 처리하거나, 여러 일을 동시에 시작하지만 마무리가 어려운 경험, 중요한 일정이나 물건을 반복적으로 놓치는 모습 등 다양한 방식으로 일상에 영향을 줄 수 있습니다.",
        "애써 집중하려 해도 반복해서 흐름을 놓쳤다면, 그 경험을 단순한 습관이나 의지 부족으로만 넘기기보다 원인을 구체적으로 살펴볼 가치가 있습니다. 같은 어려움을 여러 번 경험했다면 그 반복에는 일정한 패턴이 있을 수 있습니다.",
        "Part B에서는 12개 추가 증상 항목 중 {partB}개 항목이 기준에 해당했습니다. 이 수치는 현재 경험하고 있는 추가적인 증상의 범위를 보여주는 참고 정보이며, 해당 숫자만으로 증상의 심각도를 판단하거나 ADHD를 진단하지 않습니다.",
        "정확한 진단은 현재 나타나는 증상뿐 아니라 어린 시절부터 비슷한 특성이 존재했는지, 학교·가정·직장 등 여러 환경에서 같은 어려움이 나타나는지, 그리고 그로 인해 실제 생활 기능에 어느 정도의 어려움이 발생하는지를 종합적으로 평가하여 이루어집니다.",
        "현재의 어려움이 반복되고 있거나 스스로 조절하기 어렵다고 느끼는 경우에는 검사 결과를 하나의 참고자료로 활용하여 정신건강의학과 등 의료기관에서 전문적인 평가를 받아보는 것을 권합니다."
      ]
    },
    all: {
      title: "모든 핵심 선별 항목에서 관련 증상이 확인되었습니다",
      paragraphs: [
        "Part A의 6개 핵심 선별 항목 모두가 기준에 해당했습니다. 집중, 계획, 실행, 기억, 행동 조절 및 활동성과 관련된 핵심 증상이 여러 영역에서 확인된 응답 결과입니다.",
        "현재 일상에서 해야 할 일을 알고 있음에도 시작하거나 마무리하는 과정이 어렵거나, 여러 일을 체계적으로 관리하는 데 반복적인 부담을 느끼고 있을 가능성이 있습니다. 또한 상황에 따라 집중이 쉽게 흐트러지거나, 가만히 있어야 하는 상황에서 불편함을 느끼는 등의 경험도 함께 나타날 수 있습니다.",
        "이러한 특성이 오랫동안 반복되었다면 스스로 이를 성격이나 습관, 의지의 문제로 설명해왔을 수도 있습니다. 그러나 유사한 어려움이 여러 환경에서 지속되고 실제 생활에 영향을 주고 있다면 그 원인을 보다 정확히 확인해보는 과정이 중요할 수 있습니다.",
        "오랫동안 반복되어 온 어려움이 있다면, 그것을 혼자 설명하거나 감당하기보다 현재의 경험을 정확히 이해해보는 과정이 도움이 될 수 있습니다. 지금까지 반복되어 온 불편함을 하나의 패턴으로 바라보는 것부터가 현재 상태를 이해하는 출발점이 될 수 있습니다.",
        "Part B에서는 12개 추가 증상 항목 중 {partB}개 항목이 기준에 해당했습니다. Part B의 개수는 진단이나 중증도를 결정하는 기준은 아니지만, 현재 함께 나타나고 있는 추가적인 증상 경험의 범위를 살펴보는 참고자료로 사용할 수 있습니다.",
        "이번 결과만으로 ADHD를 확정할 수는 없습니다. ADHD의 정확한 진단은 현재의 증상뿐 아니라 아동기부터의 증상 이력, 여러 생활환경에서의 지속성, 실제 기능 저하의 정도, 그리고 다른 원인에 의해 비슷한 증상이 나타나는 것은 아닌지를 함께 평가하여 이루어집니다.",
        "증상이 학업·업무·일정 관리·대인관계 또는 일상생활에 지속적으로 영향을 주고 있다면 검사 결과를 참고자료로 활용하여 정신건강의학과 등 의료기관에서 전문적인 평가를 받아보는 것을 권합니다."
      ]
    }
  };

  function getInterpretationType(partA) {
    if (partA <= 1) return "minimal";
    if (partA <= 3) return "some";
    if (partA === 4) return "threshold";
    if (partA === 5) return "high";
    return "all";
  }

  function getPartAInterpretation(partA, partB) {
    const interpretation = interpretationByPartA[getInterpretationType(partA)];
    const insertScores = function (text) {
      return text
        .replace("{partA}", String(partA))
        .replace("{partB}", String(partB));
    };

    return {
      title: interpretation.title,
      paragraphs: interpretation.paragraphs.map(insertScores)
    };
  }

  function renderParagraphs(containerId, paragraphs) {
    const container = document.getElementById(containerId);
    container.replaceChildren();
    paragraphs.forEach(function (text) {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      container.appendChild(paragraph);
    });
  }

  function renderResult(payload) {
    const result = payload.result;
    const answers = payload.answers;
    const name = payload.name;
    const options = window.ADHDScreenerData.answerOptions;

    document.getElementById("result-name").textContent = name;
    document.getElementById("result-date").textContent = formatDate(payload.date);
    document.getElementById("answers-meta").textContent = name + "님의 문항별 응답 결과";
    document.getElementById("part-a-score").textContent = result.partAPositiveCount;
    document.getElementById("part-a-summary").textContent = "6개 핵심 선별 항목 중 " + result.partAPositiveCount + "개 항목이 기준에 해당합니다.";
    document.getElementById("score-ring-label").textContent = result.partAPositiveCount + "/6";
    document.getElementById("part-b-score").textContent = result.partBPositiveCount;
    document.getElementById("part-b-summary").textContent = "12개 추가 증상 항목 중 " + result.partBPositiveCount + "개 항목에서 기준에 해당하는 응답이 확인되었습니다.";

    const ring = document.getElementById("score-ring-value");
    const circumference = 2 * Math.PI * 48;
    ring.style.strokeDasharray = String(circumference);
    ring.style.strokeDashoffset = String(circumference * (1 - result.partAPositiveCount / 6));
    const partBRing = document.getElementById("part-b-ring-value");
    partBRing.style.strokeDasharray = String(circumference);
    partBRing.style.strokeDashoffset = String(circumference * (1 - result.partBPositiveCount / 12));
    document.getElementById("part-b-ring-label").textContent = result.partBPositiveCount + "/12";

    const interpretation = getPartAInterpretation(result.partAPositiveCount, result.partBPositiveCount);
    document.getElementById("interpretation-heading").textContent = interpretation.title;
    renderParagraphs("interpretation-copy", interpretation.paragraphs);

    setSummary("summary-a", "summary-a-bar", result.partAPositiveCount, 6);
    setSummary("summary-b", "summary-b-bar", result.partBPositiveCount, 12);
    setSummary("summary-total", "summary-total-bar", result.totalPositiveCount, 18);

    const list = document.getElementById("answers-list");
    list.replaceChildren();
    window.ADHDScreenerData.questions.forEach(function (question, index) {
      const item = document.createElement("li");
      const number = document.createElement("span");
      const questionText = document.createElement("span");
      const answer = document.createElement("strong");
      number.textContent = String(question.id).padStart(2, "0");
      questionText.textContent = question.text;
      answer.textContent = options[answers[index]].label;
      item.append(number, questionText, answer);
      list.appendChild(item);
    });
  }

  function setSummary(valueId, barId, value, total) {
    document.getElementById(valueId).textContent = value;
    document.getElementById(barId).style.width = (value / total) * 100 + "%";
  }

  function safeFilename(value) {
    return value.replace(/[\\/:*?"<>|]/g, "_").trim() || "검사자";
  }

  function getPdfKey(payload) {
    return [
      payload.name,
      payload.date instanceof Date ? payload.date.getTime() : "",
      payload.answers.join(","),
      payload.result.partAPositiveCount,
      payload.result.partBPositiveCount
    ].join("|");
  }

  function getPdfFilename(payload) {
    return safeFilename(payload.name) + "_ADHD_자가검사_결과.pdf";
  }

  async function buildResultPdfFile(payload) {
    const report = document.getElementById("report-content");
    const staging = document.createElement("div");
    const reportClone = report.cloneNode(true);
    reportClone.removeAttribute("id");
    reportClone.classList.add("pdf-mode");
    staging.setAttribute("aria-hidden", "true");
    Object.assign(staging.style, {
      position: "fixed",
      zIndex: "-1000",
      top: "0",
      left: "0",
      width: "880px",
      height: "1px",
      overflow: "visible",
      pointerEvents: "none"
    });
    staging.appendChild(reportClone);
    document.body.appendChild(staging);

    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      await new Promise(function (resolve) { window.setTimeout(resolve, 80); });
      const reportPages = Array.from(reportClone.querySelectorAll("[data-pdf-page]"));
      const pdf = new window.jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const pageWidth = 210;
      const pageHeight = 297;

      for (let index = 0; index < reportPages.length; index += 1) {
        const page = reportPages[index];
        const canvas = await window.html2canvas(page, {
          backgroundColor: "#ffffff",
          scale: 1.6,
          useCORS: true,
          logging: false,
          width: page.scrollWidth,
          height: page.scrollHeight,
          windowWidth: page.scrollWidth
        });
        if (index > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.94), "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
      }
      return new File([pdf.output("blob")], getPdfFilename(payload), { type: "application/pdf" });
    } finally {
      staging.remove();
    }
  }

  function prepareResultPdf(payload) {
    const key = getPdfKey(payload);
    const status = document.getElementById("action-status");
    const button = document.getElementById("kakao-share-button");
    const label = document.getElementById("kakao-share-label");

    if (preparedPdf && preparedPdf.key === key) return Promise.resolve(preparedPdf.file);
    if (pdfPreparation && pdfPreparation.key === key) return pdfPreparation.promise;

    if (!window.html2canvas || !window.jspdf || !window.jspdf.jsPDF || typeof File !== "function") {
      button.disabled = false;
      button.setAttribute("aria-busy", "false");
      label.textContent = "카카오톡으로 PDF 리포트 공유하기";
      status.textContent = "PDF 도구를 불러오지 못했습니다. 페이지를 새로고침해 주세요.";
      return Promise.resolve(null);
    }

    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    label.textContent = "공유용 PDF 준비 중…";
    status.textContent = "공유할 3페이지 PDF 리포트를 준비하고 있습니다…";

    const promise = buildResultPdfFile(payload)
      .then(function (file) {
        preparedPdf = { key: key, file: file };
        label.textContent = "카카오톡으로 PDF 리포트 공유하기";
        status.textContent = "PDF 리포트 공유 준비가 완료되었습니다.";
        return file;
      })
      .catch(function (error) {
        console.error(error);
        label.textContent = "카카오톡으로 PDF 리포트 공유하기";
        status.textContent = "공유용 PDF를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.";
        return null;
      })
      .finally(function () {
        button.disabled = false;
        button.setAttribute("aria-busy", "false");
        if (pdfPreparation && pdfPreparation.promise === promise) pdfPreparation = null;
      });

    pdfPreparation = { key: key, promise: promise };
    return promise;
  }

  function downloadPdfFile(file) {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  async function downloadResultPdf(payload) {
    const status = document.getElementById("action-status");
    const button = document.getElementById("pdf-button");
    button.disabled = true;
    status.textContent = "PDF 리포트를 준비하고 있습니다…";

    try {
      const file = await prepareResultPdf(payload);
      if (!file) {
        status.textContent = "PDF 생성에 실패해 브라우저 인쇄 창을 열었습니다.";
        window.print();
        return;
      }
      downloadPdfFile(file);
      status.textContent = "PDF 리포트를 다운로드했습니다.";
    } finally {
      button.disabled = false;
    }
  }

  function canSharePdf(file) {
    if (!navigator.share) return false;
    if (!navigator.canShare) return true;
    try {
      return navigator.canShare({ files: [file] });
    } catch (error) {
      return false;
    }
  }

  async function shareResult(payload) {
    const status = document.getElementById("action-status");
    const button = document.getElementById("kakao-share-button");
    const key = getPdfKey(payload);
    const file = preparedPdf && preparedPdf.key === key ? preparedPdf.file : null;

    button.disabled = true;
    try {
      if (!file) {
        status.textContent = "PDF가 아직 준비되지 않았습니다. 잠시 후 다시 눌러 주세요.";
        prepareResultPdf(payload);
        return;
      }

      if (canSharePdf(file)) {
        status.textContent = "공유 창에서 카카오톡을 선택해 주세요.";
        await navigator.share({
          title: "TRACE 성인 ADHD 자가검사 결과",
          text: payload.name + "님의 3페이지 PDF 리포트입니다.",
          files: [file]
        });
        status.textContent = "PDF 리포트 공유를 완료했습니다.";
        return;
      }

      downloadPdfFile(file);
      status.textContent = "이 브라우저는 파일 공유를 지원하지 않아 PDF를 다운로드했습니다. 카카오톡에 파일을 첨부해 주세요.";
    } catch (error) {
      if (error && error.name === "AbortError") {
        status.textContent = "공유를 취소했습니다.";
        return;
      }

      console.error(error);
      downloadPdfFile(file);
      status.textContent = "파일 공유를 열지 못해 PDF를 다운로드했습니다. 카카오톡에 파일을 첨부해 주세요.";
    } finally {
      if (!pdfPreparation || pdfPreparation.key !== key) button.disabled = false;
    }
  }

  window.ADHDScreenerResult = Object.freeze({
    calculateResult: calculateResult,
    renderResult: renderResult,
    prepareResultPdf: prepareResultPdf,
    downloadResultPdf: downloadResultPdf,
    shareResult: shareResult
  });
})();
