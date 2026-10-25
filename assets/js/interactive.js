/* ============================================================
 * interactive.js —— 示例卡片与互动元件
 * 暴露：window.Interact
 * 自动增强：
 *   1) .example-card          → 复制 / 下载 .cpp / 显示输出 / 逐步执行 按钮
 *   2) .ex-steps (JSON)       → 逐步执行器（行高亮 + 变量表 + 控制台）
 *   3) .mem-data  (JSON)      → 内存可视化表格
 *   4) .widget-sort (JSON)    → 拖拽排序练习
 *   5) .widget-incdec         → 自增自减动画
 *   6) .checklist             → 自测清单打勾存档
 *   7) beforeprint            → 打印时展开全部输出与折叠块
 * ============================================================ */
(function () {
  "use strict";

  var Interact = {};

  /* ---------------- 复制到剪贴板（file:// 兼容回退） ---------------- */
  Interact.copyText = function (text, cb) {
    var done = function (ok) { if (cb) cb(ok); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { legacy(); });
    } else legacy();
    function legacy() {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        done(ok);
      } catch (e) { done(false); }
    }
  };

  function flashBtn(btn, okText) {
    if (!btn) return;
    var old = btn.textContent;
    btn.textContent = okText;
    btn.classList.add("toggled");
    setTimeout(function () { btn.textContent = old; btn.classList.remove("toggled"); }, 1200);
  }

  function download(filename, text) {
    var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 400);
  }
  Interact.download = download;

  /* ---------------- 示例卡片 ---------------- */
  function cardCodeText(card) {
    var code = card.querySelector("pre.ex-code code, .ex-code-wrap code");
    return code ? (code.getAttribute("data-raw") || code.textContent) : "";
  }

  function enhanceCard(card, idx) {
    if (card.getAttribute("data-enhanced") === "1") return;
    card.setAttribute("data-enhanced", "1");

    var pre = card.querySelector("pre.ex-code");
    if (!pre) return;
    var codeEl = pre.querySelector("code");
    var raw = (codeEl && (codeEl.getAttribute("data-raw") || codeEl.textContent)) || "";
    var titleEl = card.querySelector(".ex-title");
    var title = titleEl ? titleEl.textContent.trim() : ("example-" + idx);
    var cardId = card.id || ("example-" + idx);

    var bar = card.querySelector(".ex-btns");
    if (!bar) { bar = document.createElement("div"); bar.className = "ex-btns"; pre.parentNode.insertBefore(bar, pre.nextSibling); }

    // 复制
    var bCopy = document.createElement("button");
    bCopy.className = "btn btn-small"; bCopy.textContent = "📋 复制代码";
    bCopy.addEventListener("click", function () {
      Interact.copyText(raw, function (ok) { flashBtn(bCopy, ok ? "✅ 已复制" : "❌ 复制失败"); });
    });

    // 下载 .cpp
    var bDl = document.createElement("button");
    bDl.className = "btn btn-small"; bDl.textContent = "💾 下载 .cpp";
    bDl.addEventListener("click", function () {
      var banner = "// " + title + "\n// 来源：大学 C++ 离线助教（本地网页）\n\n";
      download(sanitizeFile(cardId) + ".cpp", banner + raw + (raw.endsWith("\n") ? "" : "\n"));
    });

    bar.appendChild(bCopy);
    bar.appendChild(bDl);

    // 显示/隐藏输出
    var out = card.querySelector(".ex-output");
    if (out) {
      out.hidden = true;
      var bOut = document.createElement("button");
      bOut.className = "btn btn-small"; bOut.textContent = "▶ 显示预期输出";
      bOut.addEventListener("click", function () {
        out.hidden = !out.hidden;
        bOut.textContent = out.hidden ? "▶ 显示预期输出" : "🔽 隐藏预期输出";
        bOut.classList.toggle("toggled", !out.hidden);
      });
      bar.appendChild(bOut);
      card._outBtn = bOut;
    }

    // 逐步执行
    var stepsEl = card.querySelector("script.ex-steps");
    if (stepsEl) {
      var bStep = document.createElement("button");
      bStep.className = "btn btn-small"; bStep.textContent = "🏃 逐步执行";
      bStep.addEventListener("click", function () { Interact.startStepper(card); });
      bar.appendChild(bStep);
    }
  }

  function sanitizeFile(s) {
    return String(s).replace(/[^\w.-]+/g, "_").slice(0, 60) || "code";
  }

  /* ---------------- 逐步执行器 ---------------- */
  Interact.startStepper = function (card) {
    // 已存在则聚焦
    var exist = card.querySelector(".stepper");
    if (exist) { exist.scrollIntoView({ behavior: "smooth", block: "nearest" }); return; }
    var stepsEl = card.querySelector("script.ex-steps");
    if (!stepsEl) return;
    var data;
    try { data = JSON.parse(stepsEl.textContent); }
    catch (e) {
      alert("步骤数据 JSON 解析失败：" + e.message);
      return;
    }
    var steps = data.steps || [];
    if (!steps.length) return;

    var pre = card.querySelector("pre.ex-code");
    var codeEl = pre.querySelector("code");

    var box = document.createElement("div");
    box.className = "stepper";
    box.innerHTML =
      '<div class="stepper-controls">' +
      '<button class="btn btn-small" data-act="first">⏮ 开头</button>' +
      '<button class="btn btn-small" data-act="prev">⬅ 上一步</button>' +
      '<button class="btn btn-small btn-primary" data-act="next">下一步 ➡</button>' +
      '<button class="btn btn-small" data-act="end">⏭ 末尾</button>' +
      '<button class="btn btn-small" data-act="close">✖ 关闭</button>' +
      '<span class="stepper-progress"></span>' +
      "</div>" +
      '<div class="stepper-note"></div>' +
      '<div class="stepper-grid">' +
      '<div class="stepper-code"></div>' +
      '<div class="stepper-vars"><h5>变量表（当前步快照）</h5><div class="vars-body"></div></div>' +
      '<div class="stepper-console"><h5>控制台输出</h5><pre class="console-out">（尚无输出）</pre></div>' +
      "</div>";
    pre.parentNode.insertBefore(box, pre.nextSibling);

    var pos = -1;
    var consoleLines = [];

    function render() {
      var step = pos >= 0 ? steps[pos] : null;
      // 行高亮
      codeEl.querySelectorAll(".ln").forEach(function (ln) {
        ln.classList.remove("cur-line", "done-line");
        var n = parseInt(ln.getAttribute("data-n"), 10);
        if (step && n === step.line) ln.classList.add("cur-line");
        else if (step && n < step.line) ln.classList.add("done-line");
      });
      box.querySelector(".stepper-progress").textContent =
        (pos + 1) + " / " + steps.length;
      box.querySelector(".stepper-note").textContent = step ? (step.note || "") : "点击「下一步」开始单步运行";
      // 变量表
      var varsBody = box.querySelector(".vars-body");
      if (!step || !step.vars || !Object.keys(step.vars).length) {
        varsBody.innerHTML = '<span class="muted small">（本步没有可显示的变量）</span>';
      } else {
        var html = '<table><tr><th>变量</th><th>值</th></tr>';
        Object.keys(step.vars).forEach(function (k) {
          html += "<tr><td>" + escHtml(k) + "</td><td>" + escHtml(step.vars[k]) + "</td></tr>";
        });
        varsBody.innerHTML = html + "</table>";
      }
      // 控制台
      var con = box.querySelector(".console-out");
      con.textContent = consoleLines.length ? consoleLines.join("\n") : "（尚无输出）";
      if (step && step.out) con.textContent = consoleLines.join("\n");
    }

    function escHtml(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

    function go(delta, abs) {
      if (typeof abs === "number") pos = abs;
      else pos = Math.max(-1, Math.min(steps.length - 1, pos + delta));
      var step = pos >= 0 ? steps[pos] : null;
      if (step && step.out) consoleLines.push(step.out);
      render();
      if (step && step.line) {
        var target = codeEl.querySelector('.ln[data-n="' + step.line + '"]');
        if (target) target.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }

    box.addEventListener("click", function (ev) {
      var act = ev.target.getAttribute && ev.target.getAttribute("data-act");
      if (!act) return;
      if (act === "next") {
        if (pos >= steps.length - 1) { flash(ev.target, "已到末尾"); return; }
        go(1);
      } else if (act === "prev") {
        if (pos >= 0 && steps[pos] && steps[pos].out) consoleLines.pop();
        go(-1);
      } else if (act === "first") {
        consoleLines = []; go(0, -1);
      } else if (act === "end") {
        for (var i = pos + 1; i < steps.length; i++) { if (steps[i].out) consoleLines.push(steps[i].out); }
        go(0, steps.length - 1);
      } else if (act === "close") {
        codeEl.querySelectorAll(".ln").forEach(function (ln) { ln.classList.remove("cur-line", "done-line"); });
        box.remove();
      }
    });

    function flash(btn, txt) {
      var old = btn.textContent; btn.textContent = txt;
      setTimeout(function () { btn.textContent = old; }, 900);
    }

    render();
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  /* ---------------- 内存可视化 ---------------- */
  function renderMemory(host) {
    if (host.getAttribute("data-rendered") === "1") return;
    host.setAttribute("data-rendered", "1");
    var dataEl = host.querySelector("script.mem-data");
    if (!dataEl) return;
    var data;
    try { data = JSON.parse(dataEl.textContent); }
    catch (e) { host.innerHTML = '<div class="warn">内存数据 JSON 解析失败：' + escHtml(e.message) + "</div>"; return; }
    var html = data.title ? '<div class="memviz-title">' + data.title + "</div>" : "";
    html += '<table class="mem-table"><tr><th>地址</th><th>内存单元</th><th>变量名</th><th>说明</th></tr>';
    (data.regions || []).forEach(function (r) {
      html += "<tr>" +
        '<td class="mem-addr">' + escHtml(r.addr || "?") + "</td>" +
        '<td class="mem-cell' + (r.freed ? " freed" : "") + '">' + escHtml(r.value === undefined ? "?" : r.value) + "</td>" +
        "<td>" + escHtml(r.name || "") + (r.type ? ' <span class="muted small">(' + escHtml(r.type) + ")</span>" : "") + "</td>" +
        '<td class="small">' + (r.note || "") + "</td></tr>";
    });
    html += "</table>";
    if (data.note) html += '<div class="mem-note">' + data.note + "</div>";
    host.innerHTML = html;
  }

  /* ---------------- 拖拽排序 ---------------- */
  function initSort(host) {
    if (host.getAttribute("data-rendered") === "1") return;
    host.setAttribute("data-rendered", "1");
    var dataEl = host.querySelector("script.sort-data");
    if (!dataEl) return;
    var data;
    try { data = JSON.parse(dataEl.textContent); }
    catch (e) { host.innerHTML = '<div class="warn">排序数据 JSON 解析失败：' + escHtml(e.message) + "</div>"; return; }
    var items = data.items || [];       // 正确顺序
    var order = Quiz.shuffle(items.map(function (_, i) { return i; }));

    var list = document.createElement("ol");
    list.className = "sort-list";

    function renderList() {
      list.innerHTML = "";
      order.forEach(function (origIdx, pos) {
        var li = document.createElement("li");
        li.className = "sort-item";
        li.draggable = true;
        li.setAttribute("data-pos", String(pos));
        li.innerHTML =
          '<span class="sort-num">' + (pos + 1) + '.</span>' +
          '<span class="sort-text">' + escHtml(items[origIdx]) + "</span>" +
          '<span style="margin-left:auto;display:flex;gap:4px">' +
          '<button class="btn btn-small sort-arrow-btn" data-dir="-1" title="上移">↑</button>' +
          '<button class="btn btn-small sort-arrow-btn" data-dir="1" title="下移">↓</button>' +
          "</span>";
        li.addEventListener("dragstart", function (ev) {
          li.classList.add("dragging");
          ev.dataTransfer.setData("text/plain", String(pos));
          ev.dataTransfer.effectAllowed = "move";
        });
        li.addEventListener("dragend", function () { li.classList.remove("dragging"); });
        li.addEventListener("dragover", function (ev) { ev.preventDefault(); });
        li.addEventListener("drop", function (ev) {
          ev.preventDefault();
          var from = parseInt(ev.dataTransfer.getData("text/plain"), 10);
          var to = parseInt(li.getAttribute("data-pos"), 10);
          if (isNaN(from) || from === to) return;
          var moved = order.splice(from, 1)[0];
          order.splice(to, 0, moved);
          renderList();
        });
        li.querySelector('[data-dir="-1"]').addEventListener("click", function () {
          if (pos > 0) { var t = order[pos - 1]; order[pos - 1] = order[pos]; order[pos] = t; renderList(); }
        });
        li.querySelector('[data-dir="1"]').addEventListener("click", function () {
          if (pos < order.length - 1) { var t = order[pos + 1]; order[pos + 1] = order[pos]; order[pos] = t; renderList(); }
        });
        list.appendChild(li);
      });
    }
    renderList();
    host.appendChild(list);

    var btns = document.createElement("div");
    btns.className = "sort-btns";
    var check = document.createElement("button");
    check.className = "btn btn-small btn-primary"; check.textContent = "✅ 检查顺序";
    check.addEventListener("click", function () {
      var ok = order.every(function (v, i) { return v === i; });
      fb.className = "quiz-feedback " + (ok ? "ok" : "bad");
      fb.innerHTML = ok
        ? "✔ 顺序正确！" + (data.explain ? '<div class="small">' + data.explain + "</div>" : "")
        : "✘ 顺序还不对，试着交换几行再检查。" + (data.hint ? '<div class="small">提示：' + data.hint + "</div>" : "");
    });
    var reset = document.createElement("button");
    reset.className = "btn btn-small"; reset.textContent = "🔀 重新打乱";
    reset.addEventListener("click", function () {
      order = Quiz.shuffle(items.map(function (_, i) { return i; }));
      fb.className = "quiz-feedback ok"; fb.textContent = "";
      fb.textContent = "已重新打乱，请拖动（或用 ↑↓）排列成正确顺序";
      fb.className = "";
      renderList();
    });
    btns.appendChild(check); btns.appendChild(reset);
    host.appendChild(btns);

    var fb = document.createElement("div");
    host.appendChild(fb);
  }

  /* ---------------- 自增自减动画 ---------------- */
  function initIncDec(host) {
    if (host.getAttribute("data-rendered") === "1") return;
    host.setAttribute("data-rendered", "1");
    var start = parseInt(host.getAttribute("data-start") || "5", 10);

    host.innerHTML =
      '<div class="incdec-stage">' +
      '<div class="incdec-var">i = <span class="iv-val">' + start + "</span></div>" +
      '<div class="incdec-phase">' +
      '<span class="phase-step" data-ph="1">① 求表达式的值（取 i 的当前值或自增后的值）</span>' +
      '<span class="phase-step" data-ph="2">② 修改 i（副作用：i = i + 1 或 i = i - 1）</span>' +
      "</div>" +
      '<div class="incdec-result">表达式值 = <span class="ir-val">—</span></div>' +
      "</div>" +
      '<div class="ex-btns" style="margin-top:8px">' +
      '<button class="btn btn-small btn-primary" data-op="++i">执行 ++i</button>' +
      '<button class="btn btn-small btn-primary" data-op="i++">执行 i++</button>' +
      '<button class="btn btn-small btn-primary" data-op="--i">执行 --i</button>' +
      '<button class="btn btn-small btn-primary" data-op="i--">执行 i--</button>' +
      '<button class="btn btn-small" data-op="reset">重置</button>' +
      "</div>" +
      '<div class="incdec-log"><div class="muted small">（执行记录）</div></div>';

    var val = start;
    var varEl = host.querySelector(".iv-val");
    var resEl = host.querySelector(".ir-val");
    var ph1 = host.querySelector('[data-ph="1"]');
    var ph2 = host.querySelector('[data-ph="2"]');
    var log = host.querySelector(".incdec-log");

    function setVal(v) { val = v; varEl.textContent = v; }
    function addLog(s) {
      var d = document.createElement("div");
      d.textContent = s;
      log.insertBefore(d, log.firstChild);
    }
    function run(op) {
      ph1.classList.remove("on"); ph2.classList.remove("on");
      var before = val, exprVal, act = op;
      if (op === "reset") { setVal(start); resEl.textContent = "—"; log.innerHTML = '<div class="muted small">（已重置）</div>'; return; }
      // ① 求值
      ph1.classList.add("on");
      var prefix = op.charAt(0) === "+" || op.charAt(0) === "-";
      exprVal = prefix ? (op === "++i" ? before + 1 : before - 1) : before;
      resEl.textContent = exprVal;
      setTimeout(function () {
        // ② 副作用
        ph2.classList.add("on");
        setVal(op === "++i" || op === "i++" ? before + 1 : before - 1);
        addLog('i=' + before + " 时执行 " + act + "：表达式值 = " + exprVal + "，执行后 i = " + val);
      }, 450);
    }
    host.querySelectorAll("[data-op]").forEach(function (b) {
      b.addEventListener("click", function () { run(b.getAttribute("data-op")); });
    });
  }

  /* ---------------- 自测清单 ----------------
     原生 checkbox，无需 JS。 */

  /* ---------------- 打印 ---------------- */
  var printState = null;
  window.addEventListener("beforeprint", function () {
    printState = [];
    document.querySelectorAll(".ex-output[hidden]").forEach(function (o) {
      printState.push(o); o.hidden = false;
    });
    document.querySelectorAll("details:not([open])").forEach(function (d) { d.setAttribute("open", ""); d.setAttribute("data-print-open", "1"); });
    document.querySelectorAll(".ex-btns").forEach(function (b) { b.style.display = "none"; });
  });
  window.addEventListener("afterprint", function () {
    if (printState) { printState.forEach(function (o) { o.hidden = true; }); printState = null; }
    document.querySelectorAll('[data-print-open]').forEach(function (d) { d.removeAttribute("open"); d.removeAttribute("data-print-open"); });
    document.querySelectorAll(".ex-btns").forEach(function (b) { b.style.display = ""; });
  });

  /* ---------------- 教师模式联动 ---------------- */
  Interact.showAllOutputs = function (show) {
    document.querySelectorAll(".example-card .ex-output").forEach(function (o) {
      if (show) {
        if (o.hidden) { o.hidden = false; o.setAttribute("data-forced", "1"); }
      } else if (o.getAttribute("data-forced") === "1") { o.hidden = true; o.removeAttribute("data-forced"); }
    });
    document.querySelectorAll(".example-card .ex-btns .btn").forEach(function (b) {
      if (/显示|隐藏/.test(b.textContent)) { b.textContent = show ? "🔽 隐藏预期输出" : "▶ 显示预期输出"; }
    });
  };
  Interact.toggleAllDetails = function (open, root) {
    var scope = root || document;
    scope.querySelectorAll("details").forEach(function (d) {
      if (open) d.setAttribute("open", ""); else d.removeAttribute("open");
    });
  };
  Interact.exportChapterCode = function (chapterName) {
    var cards = document.querySelectorAll(".example-card");
    var parts = [];
    cards.forEach(function (card, i) {
      var t = card.querySelector(".ex-title");
      parts.push("// =============================",
        "// 示例 " + (i + 1) + "：" + (t ? t.textContent.trim() : ""),
        "// =============================",
        cardCodeText(card), "");
    });
    download(sanitizeFile(chapterName || "chapter") + "-all-code.cpp",
      "// 章节：" + (chapterName || "chapter") + "\n// 导出自：大学 C++ 离线助教\n\n" + parts.join("\n"));
  };

  /* ---------------- 启动 ---------------- */
  function escHtml(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function init() {
    document.querySelectorAll(".example-card").forEach(enhanceCard);
    document.querySelectorAll(".memviz").forEach(renderMemory);
    document.querySelectorAll(".widget-sort").forEach(initSort);
    document.querySelectorAll(".widget-incdec").forEach(initIncDec);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.Interact = Interact;
})();
