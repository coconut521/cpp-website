/* ============================================================
 * quiz.js —— 选择题 / 判断题 / 填空题 / 代码填空 测验引擎
 * 暴露：window.Quiz
 * 用法（页面内写好结构即可，引擎自动渲染）：
 *   <section class="quiz" data-source="ch01">
 *     <script type="application/json" class="quiz-data">{ "questions":[ ... ] }</script>
 *   </section>
 * 题型：
 *   mcq  : { type:"mcq", q:"题干", options:["A","B","C","D"], answer:2, explain:"解析" }
 *   tf   : { type:"tf",  q:"题干", answer:true, explain:"解析" }
 *   fill : { type:"fill",q:"题干", answer:["2"," 2 "], explain:"解析", ci:false }
 *   code : { type:"code",q:"题干（含 ____ 空位）", answer:"n++", explain:"解析" }
 * fill/code 的 answer 可为字符串（唯一答案）或数组（多个可接受答案）；
 * 默认区分大小写且先去首尾空格；ci:true 表示不区分大小写。
 * ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function stripHtml(s) { return String(s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); }

  function shuffle(arr) {
    var a = arr.slice(0);
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function normAns(s) {
    return String(s === null || s === undefined ? "" : s).trim().replace(/\s+/g, " ");
  }

  function checkFill(q, input) {
    var ans = q.answer;
    var list = Array.isArray(ans) ? ans : [ans];
    var given = normAns(input);
    if (!given) return false;
    for (var i = 0; i < list.length; i++) {
      if (q.ci) {
        if (normAns(list[i]).toLowerCase() === given.toLowerCase()) return true;
      } else if (normAns(list[i]) === given) return true;
    }
    return false;
  }

  function answerText(q) {
    if (q.type === "mcq") {
      var opt = q.options && q.options[q.answer];
      return opt === undefined ? "?" : String.fromCharCode(65 + q.answer) + ". " + esc(opt);
    }
    if (q.type === "tf") return q.answer ? "正确" : "错误";
    var list = Array.isArray(q.answer) ? q.answer : [q.answer];
    return list.map(function (a) { return "<code>" + esc(a) + "</code>"; }).join(" 或 ");
  }

  /* 构建单个题目的卡片 DOM（含全部事件监听） */
  function buildQuestionCard(source, q, qi, qs, summary) {
    var qid = q.id || ("q" + (qi + 1));
    var card = document.createElement("div");
    card.className = "quiz-q";

    var qText = document.createElement("div");
    qText.className = "q-text";
    qText.innerHTML = '<span class="q-no">' + (qi + 1) + '.</span>' + q.q;
    card.appendChild(qText);

    var chosen = -1;

    function makeFeedback() {
      var fb = card.querySelector(".quiz-feedback");
      if (!fb) { fb = document.createElement("div"); card.appendChild(fb); }
      return fb;
    }
    function showFeedback(ok, withAnswer) {
      var fb = makeFeedback();
      fb.className = "quiz-feedback " + (ok ? "ok" : "bad");
      fb.innerHTML =
        '<span class="fb-title">' + (ok ? "✔ 回答正确" : "✘ 回答错误") + "</span>" +
        (withAnswer ? '<div class="small">正确答案：' + answerText(q) + "</div>" : "") +
        (q.explain ? '<div class="fb-explain">' + q.explain + "</div>" : "");
    }
    function record(ok, your) {
      summary.refresh();
    }

    var submitBtn = document.createElement("button");

    if (q.type === "mcq" || q.type === "tf") {
      var opts = q.type === "mcq" ? q.options : ["正确", "错误"];
      var wrap = document.createElement("div");
      wrap.className = "quiz-options";
      opts.forEach(function (optText, oi) {
        var label = document.createElement("label");
        var input = document.createElement("input");
        input.type = "radio";
        input.name = source + "-" + qi + "-" + Math.random().toString(36).slice(2, 7);
        input.value = String(oi);
        label.appendChild(input);
        var span = document.createElement("span");
        span.innerHTML = q.type === "mcq" ? "<b>" + String.fromCharCode(65 + oi) + ".</b> " + optText : optText;
        label.appendChild(span);
        label.addEventListener("click", function (ev) {
          if (ev.target.tagName !== "INPUT") { input.checked = true; }
          chosen = oi;
          wrap.querySelectorAll("label").forEach(function (l) { l.classList.remove("chosen"); });
          label.classList.add("chosen");
        });
        wrap.appendChild(label);
      });
      card.appendChild(wrap);

      submitBtn.className = "btn btn-primary btn-small";
      submitBtn.textContent = "提交答案";
      submitBtn.addEventListener("click", function () {
        if (chosen < 0) { alert("请先选择一个答案"); return; }
        var ok = q.type === "mcq" ? chosen === q.answer : (chosen === 0) === !!q.answer;
        var rightIdx = q.type === "mcq" ? q.answer : (q.answer ? 0 : 1);
        wrap.querySelectorAll("label").forEach(function (l, li) {
          l.classList.remove("chosen");
          if (li === rightIdx) l.classList.add("correct");
          else if (li === chosen && !ok) l.classList.add("wrong");
        });
        submitBtn.disabled = true;
        showFeedback(ok, !ok);
        record(ok, q.type === "mcq" ? String.fromCharCode(65 + chosen) + ". " + opts[chosen] : opts[chosen]);
      });
    } else { // fill / code
      var inputWrap = document.createElement("div");
      inputWrap.className = "quiz-input";
      var input = document.createElement("input");
      input.type = "text";
      input.placeholder = q.placeholder || (q.type === "code" ? "填写代码片段（不要输入多余空格）" : "填写答案");
      input.setAttribute("autocomplete", "off");
      input.setAttribute("spellcheck", "false");
      if (q.type === "code") input.style.fontFamily = "var(--font-mono)";
      inputWrap.appendChild(input);
      card.appendChild(inputWrap);

      submitBtn.className = "btn btn-primary btn-small";
      submitBtn.textContent = "提交答案";
      submitBtn.addEventListener("click", function () {
        var ok = checkFill(q, input.value);
        input.disabled = true;
        input.style.borderColor = ok ? "var(--accent)" : "var(--danger)";
        submitBtn.disabled = true;
        showFeedback(ok, !ok);
        record(ok, input.value);
      });
      input.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" && !submitBtn.disabled) submitBtn.click();
      });
    }

    var actions = document.createElement("div");
    actions.className = "quiz-actions";
    actions.appendChild(submitBtn);

    var resetBtn = document.createElement("button");
    resetBtn.className = "btn btn-small";
    resetBtn.textContent = "重做本题";
    resetBtn.addEventListener("click", function () {
      var fresh = buildQuestionCard(source, q, qi, qs, summary);
      block.insertBefore(fresh, card.nextSibling);
      card.remove();
    });
    actions.appendChild(resetBtn);

    var ta = document.createElement("div");
    ta.className = "quiz-teacher-answer";
    ta.innerHTML = "【教师】答案：" + answerText(q) + (q.explain ? " · " + stripHtml(q.explain) : "");
    actions.appendChild(ta);

    card.appendChild(actions);
    return card;
  }

  /* 渲染单个 .quiz 块 */
  function renderQuizBlock(block) {
    if (block.getAttribute("data-rendered") === "1") return;
    block.setAttribute("data-rendered", "1");
    var dataEl = block.querySelector("script.quiz-data");
    if (!dataEl) return;
    var data;
    try { data = JSON.parse(dataEl.textContent); }
    catch (e) {
      block.innerHTML = '<div class="warn">测验数据 JSON 解析失败：' + esc(e.message) + "</div>";
      return;
    }
    var source = block.getAttribute("data-source") || "quiz";
    var title = data.title || "本节自测";
    var head = document.createElement("h3");
    head.textContent = title;
    block.insertBefore(head, dataEl);

    var qs = data.questions || [];
    var sumWrap = document.createElement("div");
    sumWrap.className = "quiz-summary-wrap quiz-summary muted";
    sumWrap.textContent = "已答 0 / " + qs.length + " 题";
    var summary = {
      refresh: function () {
        var done = block.querySelectorAll(".quiz-feedback"), right = block.querySelectorAll(".quiz-feedback.ok");
        sumWrap.textContent = "已答 " + done.length + " / " + qs.length + " 题，答对 " + right.length + " 题";
      }
    };

    qs.forEach(function (q, qi) {
      block.appendChild(buildQuestionCard(source, q, qi, qs, summary));
    });

    block.appendChild(sumWrap);
  }

  function renderAll(root) {
    var scope = root || document;
    var blocks = scope.querySelectorAll(".quiz");
    for (var i = 0; i < blocks.length; i++) renderQuizBlock(blocks[i]);
  }

  window.Quiz = {
    renderAll: renderAll,
    shuffle: shuffle,
    _renderOne: renderQuizBlock
  };
  document.addEventListener("DOMContentLoaded", function () { renderAll(document); });
})();
