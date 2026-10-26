/* ============================================================
 * bug-hunt.js —— 「火眼金睛」找 Bug 练习引擎
 * 暴露：window.BugHunt
 * 用法一（章节页自动）：引入本脚本 + bughunt-data.js 后，
 *   若当前章在数据里有练习，会在随堂测验前自动插入一节
 *   「🔥 火眼金睛：本章找错」（页面已有 .bug-hunt 块时不重复插入）。
 * 用法二（手动）：在任意页面写
 *   <section class="bug-hunt" data-ch="ch01"></section>
 *   data-ch 为章节 id（对应 toc.js 的 COURSE_TOC），省略或 "all"
 *   表示全部；加 data-shuffle="1" 时提供「打乱顺序」按钮。
 * 题目数据：assets/js/bughunt-data.js（window.BUGHUNT_DATA），
 *   字段说明见该文件头注释。
 * 玩法：点击认为有问题的那一行 → 「提交判断」→ 立即判分并给出解析。
 * 依赖：highlight.js（代码高亮）、quiz.js（打乱顺序用 shuffle，可缺省）。
 * ============================================================ */
(function () {
  "use strict";

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function stripHtml(s) { return String(s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); }

  var KIND_TAG = {
    compile: { cls: "tag red", text: "编译错误" },
    logic: { cls: "tag amber", text: "逻辑错误" },
    ub: { cls: "tag purple", text: "未定义行为" }
  };

  function tocById(id) {
    var toc = window.COURSE_TOC || [];
    for (var i = 0; i < toc.length; i++) if (toc[i].id === id) return toc[i];
    return null;
  }

  function itemsFor(ch) {
    var data = window.BUGHUNT_DATA || [];
    if (!ch || ch === "all") return data.slice();
    return data.filter(function (d) { return d.ch === ch; });
  }

  /* ---------- 单题卡片（含全部事件监听） ---------- */
  function buildCard(item, no, onResult) {
    var card = document.createElement("article");
    card.className = "bh-card";
    if (item.id) card.id = item.id;

    var kind = KIND_TAG[item.kind] || KIND_TAG.logic;
    var chap = tocById(item.ch);
    var head = document.createElement("div");
    head.className = "bh-head";
    head.innerHTML =
      '<span class="bh-no">' + no + '.</span>' +
      '<span class="bh-title">' + esc(item.title) + "</span>" +
      '<span class="' + kind.cls + '">' + kind.text + "</span>" +
      (chap ? '<span class="badge">' + esc(chap.title) + "</span>" : "");
    card.appendChild(head);

    var pre = document.createElement("pre");
    pre.className = "bh-code";
    var codeEl = document.createElement("code");
    codeEl.className = "cpp";
    var src = item.code.join("\n");
    codeEl.innerHTML = window.CppLight ? window.CppLight.highlight(src) : esc(src);
    pre.appendChild(codeEl);
    card.appendChild(pre);

    var sel = -1;
    var judged = false;

    function clearSel() {
      codeEl.querySelectorAll(".ln.bh-sel").forEach(function (ln) { ln.classList.remove("bh-sel"); });
    }
    codeEl.addEventListener("click", function (ev) {
      if (judged) return;
      var ln = ev.target.closest ? ev.target.closest(".ln") : null;
      if (!ln) return;
      var n = parseInt(ln.getAttribute("data-n"), 10);
      if (isNaN(n)) return;
      clearSel();
      ln.classList.add("bh-sel");
      sel = n;
    });

    var fb = document.createElement("div");
    fb.className = "bh-feedback";

    var actions = document.createElement("div");
    actions.className = "bh-actions";

    var submit = document.createElement("button");
    submit.className = "btn btn-small btn-primary";
    submit.textContent = "提交判断";
    submit.addEventListener("click", function () {
      if (judged) return;
      if (sel < 0) { alert("请先点击你认为有问题的那一行"); return; }
      judged = true;
      var ok = sel === item.bugLine;
      var lnSel = codeEl.querySelector('.ln[data-n="' + sel + '"]');
      var lnBug = codeEl.querySelector('.ln[data-n="' + item.bugLine + '"]');
      if (ok) {
        if (lnSel) lnSel.classList.add("bh-hit");
        fb.className = "bh-feedback show ok";
        fb.innerHTML = "✔ 判断正确！就是第 " + item.bugLine + " 行。" +
          (item.why ? '<div class="bh-why">' + item.why + "</div>" : "");
      } else {
        if (lnSel) lnSel.classList.add("bh-miss");
        if (lnBug) lnBug.classList.add("bh-hit");
        fb.className = "bh-feedback show bad";
        fb.innerHTML = "✘ 你选的是第 " + sel + " 行，问题出在第 " + item.bugLine + " 行。" +
          (item.why ? '<div class="bh-why">' + item.why + "</div>" : "");
      }
      codeEl.classList.add("bh-done");
      submit.disabled = true;
      if (onResult) onResult();
    });
    actions.appendChild(submit);

    var redo = document.createElement("button");
    redo.className = "btn btn-small";
    redo.textContent = "重做本题";
    redo.addEventListener("click", function () {
      if (!card.parentNode) return;   // 防御重复触发：卡片已被上一次点击替换时直接忽略
      var fresh = buildCard(item, no, onResult);
      card.parentNode.insertBefore(fresh, card.nextSibling);
      card.remove();
      if (onResult) onResult();
    });
    actions.appendChild(redo);

    if (item.hint) {
      var hintBox = document.createElement("div");
      hintBox.className = "bh-hint";
      hintBox.innerHTML = "💡 " + item.hint;   /* 提示为原始 HTML（尖括号写实体），与 why 一致 */
      var hintBtn = document.createElement("button");
      hintBtn.className = "btn btn-small";
      hintBtn.textContent = "💡 提示";
      hintBtn.addEventListener("click", function () {
        var show = hintBox.classList.toggle("show");
        hintBtn.classList.toggle("toggled", show);
      });
      actions.appendChild(hintBtn);
      card.appendChild(hintBox);
    }

    var ta = document.createElement("div");
    ta.className = "bh-teacher-answer";
    ta.innerHTML = "【教师】第 " + item.bugLine + " 行（" + kind.text + "）：" + (item.why ? stripHtml(item.why) : "");

    card.appendChild(actions);
    card.appendChild(fb);
    card.appendChild(ta);
    return card;
  }

  /* ---------- 渲染一个 .bug-hunt 块 ---------- */
  function renderBlock(block) {
    var ch = block.getAttribute("data-ch") || "all";
    var items = itemsFor(ch);
    block.setAttribute("data-rendered", "1");
    block.innerHTML = "";

    if (!items.length) {
      block.innerHTML = '<p class="muted small">（暂无找错练习）</p>';
      return;
    }

    function refreshSummary() {
      var sum = block.querySelector(".bh-summary");
      if (!sum) return;
      var total = block.querySelectorAll(".bh-card").length;
      var done = block.querySelectorAll(".bh-feedback.show").length;
      var right = block.querySelectorAll(".bh-feedback.ok").length;
      sum.textContent = "已判断 " + done + " / " + total + " 题，答对 " + right + " 题";
    }
    items.forEach(function (item, i) {
      block.appendChild(buildCard(item, i + 1, refreshSummary));
    });

    if (block.getAttribute("data-shuffle") === "1") {
      var bar = document.createElement("div");
      bar.className = "bh-actions";
      var sh = document.createElement("button");
      sh.className = "btn btn-small";
      sh.textContent = "🔀 打乱顺序";
      sh.addEventListener("click", function () {
        /* 现查现排：不能用渲染时缓存的 cards 数组——
           「重做本题」会替换节点，缓存里的旧节点插回会形成重复卡片 */
        var current = Array.prototype.slice.call(block.querySelectorAll(".bh-card"));
        var order = window.Quiz ? window.Quiz.shuffle(current) : current.reverse();
        var sum = block.querySelector(".bh-summary");
        order.forEach(function (c) { block.insertBefore(c, sum); });
      });
      bar.appendChild(sh);
      block.insertBefore(bar, block.firstChild);
    }

    var sumWrap = document.createElement("div");
    sumWrap.className = "bh-summary muted";
    block.appendChild(sumWrap);
    refreshSummary();
  }

  /* ---------- 章节页自动插入 ----------
     仅 /chapters/ 下的页面生效；当前章在数据里有练习、
     且页面没有手写 .bug-hunt 块时，在随堂测验前插入一节。 */
  function autoInsert() {
    if (!/\/chapters\//.test(decodeURIComponent(location.pathname))) return;
    var main = document.querySelector("main.container");
    if (!main || main.querySelector(".bug-hunt")) return;
    var here = decodeURIComponent(location.pathname).split("/").pop();
    var toc = window.COURSE_TOC || [];
    var ch = null;
    for (var i = 0; i < toc.length; i++) {
      if (toc[i].file && toc[i].file.split("/").pop() === here) { ch = toc[i].id; break; }
    }
    if (!ch || !itemsFor(ch).length) return;

    var h2 = document.createElement("h2");
    h2.textContent = "🔥 火眼金睛：本章找错";
    var sec = document.createElement("section");
    sec.className = "bug-hunt";
    sec.setAttribute("data-ch", ch);

    var quiz = main.querySelector("section.quiz");
    if (quiz && quiz.parentNode === main) {
      main.insertBefore(h2, quiz);
      main.insertBefore(sec, quiz);
    } else {
      main.appendChild(h2);
      main.appendChild(sec);
    }
  }

  function renderAll(root) {
    var scope = root || document;
    var blocks = scope.querySelectorAll(".bug-hunt");
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i].getAttribute("data-rendered") !== "1") renderBlock(blocks[i]);
    }
  }

  function init() {
    autoInsert();
    renderAll(document);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.BugHunt = {
    renderAll: renderAll,
    renderOne: renderBlock,
    itemsFor: itemsFor
  };
})();
