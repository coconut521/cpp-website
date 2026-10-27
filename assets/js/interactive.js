/* ============================================================
 * interactive.js —— 示例卡片与互动元件
 * 暴露：window.Interact
 * 自动增强：
 *   1) .example-card          → 复制 / 下载 .cpp / 显示输出 / 逐步执行 按钮
 *   2) .ex-steps (JSON)       → 逐步执行器（行高亮 + 变量表 + 控制台；
 *                                可选：▶ 自动播放与速度档、调用栈侧栏 step.stack、
 *                                柱状图 vars["a[]"] 与 step.cmp / step.pivot 高亮）
 *   3) .mem-data  (JSON)      → 内存可视化表格
 *   4) .widget-sort (JSON)    → 拖拽排序练习
 *   4b) .widget-parsons (JSON)→ Parsons 问题：打乱代码行拖回正确程序
 *   4c) .widget-ptrviz (JSON) → 指针/引用 SVG 箭头图（指向、置空、悬空分步演示）
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

    // 在线运行（轻量启发式通过才显示）
    if (cppLikelyRunnable(raw)) {
      var bRun = document.createElement("button");
      bRun.className = "btn btn-small"; bRun.textContent = "▶ 在线运行";
      bRun.addEventListener("click", function () { Interact.runCard(card); });
      bar.appendChild(bRun);
    }
  }

  function sanitizeFile(s) {
    return String(s).replace(/[^\w.-]+/g, "_").slice(0, 60) || "code";
  }

  /* ---------------- 在线运行（WASM 子集解释器） ----------------
     按钮在 enhanceCard 里按轻量启发式添加；点击时按需注入
     cpp-run.js，再按协议加载 wasm（https 分离文件 / file 内嵌版）。 */
  function cppLikelyRunnable(code) {
    if (typeof window.CppRun !== "undefined" && window.CppRun.canRun) {
      return window.CppRun.canRun(code);
    }
    if (typeof code !== "string" || code.length === 0 || code.length > 20000) return false;
    if (!/int\s+main\s*\(/.test(code)) return false;
    if (/\bclass\b|\bstruct\b|\btemplate\b|\bvector\b|\bstd::string\b|\bstring\s+\w+|\bcin\b|\bprintf\b|\bnew\b|\bdelete\b|\btry\b|\bthrow\b|\bswitch\b|->|for\s*\([^;]*:[^;]*\)/.test(code)) return false;
    return true;
  }

  var cppRunLoading = false;

  Interact.runCard = function (card) {
    var box = card.querySelector(".run-box");
    if (box) { box.scrollIntoView({ behavior: "smooth", block: "nearest" }); return; }
    box = document.createElement("div");
    box.className = "run-box";
    box.innerHTML = '<div class="run-head">⏳ 正在准备运行器…</div>';
    var bar = card.querySelector(".ex-btns");
    if (bar) bar.parentNode.insertBefore(box, bar.nextSibling);
    else card.appendChild(box);

    function loadEngine(cb) {
      if (window.CppRun) { cb(); return; }
      if (cppRunLoading) { var t = setInterval(function () { if (window.CppRun) { clearInterval(t); cb(); } }, 80); return; }
      cppRunLoading = true;
      var s = document.createElement("script");
      s.src = (/\/chapters\//.test(decodeURIComponent(location.pathname)) ? "../" : "") + "assets/js/cpp-run.js";
      s.onload = function () { cb(); };
      s.onerror = function () {
        box.querySelector(".run-head").textContent = "❌ 无法加载运行器（assets/js/cpp-run.js）";
      };
      document.head.appendChild(s);
    }

    loadEngine(function () {
      window.CppRun.ensure(function (ok) {
        var head = box.querySelector(".run-head");
        if (!ok) {
          head.textContent = "❌ 运行器加载失败：" + (window.CppRun ? window.CppRun.failReason : "未知原因");
          return;
        }
        var codeEl = card.querySelector("pre.ex-code code, .ex-code-wrap code");
        var raw = codeEl ? (codeEl.getAttribute("data-raw") || codeEl.textContent) : "";
        var r = window.CppRun.run(raw);
        var html = '<div class="run-head">▶ 在线运行结果</div>';
        html += '<pre class="run-out">' + escHtml(r.out.length ? r.out : "（无输出）") + "</pre>";
        if (r.warn) {
          r.warn.split("\n").forEach(function (w) {
            html += '<div class="run-warn">⚠ ' + escHtml(w) + "</div>";
          });
        }
        if (!r.ok) {
          html += '<div class="run-err">✖ ' + escHtml(r.err) + "</div>";
        }
        html += '<div class="run-note">教学子集解释器：只覆盖课程常用语法；未定义行为会在发生处停止并说明。输出与真实编译器可能存在细节差异。</div>';
        box.innerHTML = html;
        box.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    });
  };

  /* ---------------- 逐步执行器 ----------------
     可选数据字段（都是增强，缺省不影响原有行为）：
       step.stack : 字符串数组，调用栈快照（首元素=栈底，末元素=当前帧）
       step.vars  : 键名以 "[]" 结尾且值为空格分隔数字的项 → 自动渲染柱状图
       step.cmp   : 本步正在比较的下标数组（柱子标橙色）
       step.pivot : 基准下标（柱子标红色） */
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

    var hasStack = steps.some(function (s) { return s && Array.isArray(s.stack) && s.stack.length > 0; });

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
      '<button class="btn btn-small" data-act="play" title="自动播放：按选定速度逐步前进">▶ 自动</button>' +
      '<select class="stepper-speed" data-act="speed" title="自动播放速度">' +
      '<option value="2000">慢</option>' +
      '<option value="1000" selected>中</option>' +
      '<option value="450">快</option>' +
      "</select>" +
      '<button class="btn btn-small" data-act="close">✖ 关闭</button>' +
      '<span class="stepper-progress"></span>' +
      "</div>" +
      '<div class="stepper-note"></div>' +
      '<div class="stepper-grid">' +
      '<div class="stepper-bars" hidden><canvas></canvas></div>' +
      '<div class="stepper-code"></div>' +
      '<div class="stepper-vars"><h5>变量表（当前步快照）</h5><div class="vars-body"></div></div>' +
      (hasStack ? '<div class="stepper-stack"><h5>调用栈（底 → 顶）</h5><div class="stk-body"></div></div>' : "") +
      '<div class="stepper-console"><h5>控制台输出</h5><pre class="console-out">（尚无输出）</pre></div>' +
      "</div>";
    if (hasStack) box.classList.add("has-stack");
    pre.parentNode.insertBefore(box, pre.nextSibling);

    var pos = -1;
    var consoleLines = [];

    /* ---------- 自动播放 ---------- */
    var playing = false;
    var playTimer = null;
    var playMs = 1000;
    function stopPlay() {
      playing = false;
      if (playTimer) { clearInterval(playTimer); playTimer = null; }
      var b = box.querySelector('[data-act="play"]');
      if (b) { b.textContent = "▶ 自动"; b.classList.remove("toggled"); }
    }
    function setPlaying(on) {
      stopPlay();
      if (!on) return;
      playing = true;
      playMs = parseInt(box.querySelector(".stepper-speed").value, 10) || 1000;
      playTimer = setInterval(function () {
        if (pos >= steps.length - 1) { stopPlay(); return; }
        go(1);
      }, playMs);
      var b = box.querySelector('[data-act="play"]');
      if (b) { b.textContent = "⏸ 暂停"; b.classList.add("toggled"); }
      go(1);
    }

    /* ---------- 柱状图（数据驱动：vars 里键名以 [] 结尾的数字序列） ---------- */
    function stepArr(step) {
      if (!step || !step.vars) return null;
      var keys = Object.keys(step.vars);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (k.slice(-2) !== "[]") continue;
        var parts = String(step.vars[k]).trim().split(/\s+/);
        var vals = [];
        var ok = parts.length > 0;
        for (var j = 0; j < parts.length; j++) {
          var v = parseFloat(parts[j]);
          if (isNaN(v)) { ok = false; break; }
          vals.push(v);
        }
        if (ok && vals.length) return vals;
      }
      return null;
    }
    var barLast = null;      // 上一次的数组值（用于本步未改动时灰显 + 补间动画起点）
    var barRaf = null;
    function cssVar(name, fallback) {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    }
    function drawBars(vals, stale) {
      var wrap = box.querySelector(".stepper-bars");
      var cv = wrap && wrap.querySelector("canvas");
      if (!cv) return;
      var dpr = window.devicePixelRatio || 1;
      var w = cv.clientWidth || wrap.clientWidth - 28;
      var h = cv.clientHeight || 150;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      }
      var ctx = cv.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      var step = pos >= 0 ? steps[pos] : null;
      var cmp = (step && step.cmp) || [];
      var pivot = (step && typeof step.pivot === "number") ? step.pivot : -1;
      var max = 1;
      for (var i = 0; i < vals.length; i++) if (vals[i] > max) max = vals[i];
      var n = vals.length;
      var gap = n > 24 ? 2 : 6;
      var barW = Math.max(6, (w - gap * (n - 1) - 8) / n);
      var baseY = h - 18;
      var plotH = baseY - 22;
      var cBar = cssVar("--primary", "#7e0c6e");
      var cCmp = cssVar("--warn", "#b45309");
      var cPivot = cssVar("--danger", "#dc2626");
      var cText = cssVar("--text-muted", "#6b5d70");
      if (stale) ctx.globalAlpha = 0.4;
      for (var i2 = 0; i2 < n; i2++) {
        var bh = Math.max(2, vals[i2] / max * plotH);
        var x = 4 + i2 * (barW + gap);
        var y = baseY - bh;
        ctx.fillStyle = (i2 === pivot) ? cPivot : (cmp.indexOf(i2) !== -1 ? cCmp : cBar);
        ctx.fillRect(x, y, barW, bh);
        ctx.fillStyle = cText;
        ctx.font = "11px " + cssVar("--font-mono", "monospace");
        ctx.textAlign = "center";
        if (barW >= 18) ctx.fillText(String(vals[i2]), x + barW / 2, y - 4);
        if (n <= 20) ctx.fillText(String(i2), x + barW / 2, baseY + 12);
      }
      ctx.globalAlpha = 1;
    }
    function renderBars() {
      var wrap = box.querySelector(".stepper-bars");
      if (!wrap) return;
      var step = pos >= 0 ? steps[pos] : null;
      var vals = stepArr(step);
      if (vals) {
        barLast = vals;
        wrap.hidden = false;
        if (barRaf) cancelAnimationFrame(barRaf);
        var from = barPrevVals ? barPrevVals.slice() : vals.slice();
        var t0 = null;
        var dur = 180;
        function anim(ts) {
          if (t0 === null) t0 = ts;
          var k = Math.min(1, (ts - t0) / dur);
          var cur = vals.map(function (v, i) { return from[i] + (v - from[i]) * k; });
          drawBars(cur, false);
          if (k < 1) barRaf = requestAnimationFrame(anim);
        }
        barRaf = requestAnimationFrame(anim);
        barPrevVals = vals.slice();
      } else if (barLast) {
        /* 本步没有数组：保留上一步的数组，灰显提示“本步未改动数组” */
        wrap.hidden = false;
        drawBars(barLast, true);
        barPrevVals = barLast.slice();
      } else {
        wrap.hidden = true;
      }
    }
    var barPrevVals = null;

    /* ---------- 调用栈 ---------- */
    function renderStack(step) {
      var el = box.querySelector(".stk-body");
      if (!el) return;
      var fr = (step && Array.isArray(step.stack)) ? step.stack : [];
      if (!fr.length) {
        el.innerHTML = '<span class="muted small">（空栈）</span>';
        return;
      }
      var html = "";
      for (var i = 0; i < fr.length; i++) {
        html += '<div class="stk-frame' + (i === fr.length - 1 ? " stk-top" : "") + '">' +
          escHtml(String(fr[i])) + "</div>";
      }
      el.innerHTML = html;
    }

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
      // 增强：调用栈 + 柱状图
      renderStack(step);
      renderBars();
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
        stopPlay();
        if (pos >= 0 && steps[pos] && steps[pos].out) consoleLines.pop();
        go(-1);
      } else if (act === "first") {
        stopPlay();
        consoleLines = []; go(0, -1);
      } else if (act === "end") {
        stopPlay();
        for (var i = pos + 1; i < steps.length; i++) { if (steps[i].out) consoleLines.push(steps[i].out); }
        go(0, steps.length - 1);
      } else if (act === "play") {
        setPlaying(!playing);
      } else if (act === "close") {
        stopPlay();
        if (barRaf) cancelAnimationFrame(barRaf);
        window.removeEventListener("resize", onResize);
        codeEl.querySelectorAll(".ln").forEach(function (ln) { ln.classList.remove("cur-line", "done-line"); });
        box.remove();
      }
    });
    /* 播放中改速度：立即按新速度重启计时 */
    box.addEventListener("change", function (ev) {
      if (ev.target.classList && ev.target.classList.contains("stepper-speed") && playing) setPlaying(true);
    });
    /* 窗口尺寸变化时重绘柱状图（关闭时解绑） */
    function onResize() {
      if (document.body.contains(box) && barLast) drawBars(barLast, false);
    }
    window.addEventListener("resize", onResize);

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

  /* ---------------- Parsons 问题：拖拽组代码 ----------------
     数据（script.parsons-data，JSON）：
       items   正确顺序的代码行（字符串数组，引擎渲染时转义）
       hint    可选提示
       explain 可选：检查正确后展示的解析
     交互：从「代码块」拖入「程序区」组出正确程序；
     程序区内可拖动排序 / ↑↓ 微调 / ✕ 放回；「检查顺序」逐行判分。 */
  function initParsons(host) {
    if (host.getAttribute("data-rendered") === "1") return;
    host.setAttribute("data-rendered", "1");
    var dataEl = host.querySelector("script.parsons-data");
    if (!dataEl) return;
    var data;
    try { data = JSON.parse(dataEl.textContent); }
    catch (e) { host.innerHTML = '<div class="warn">Parsons 数据 JSON 解析失败：' + escHtml(e.message) + "</div>"; return; }
    var items = data.items || [];
    if (!items.length) return;

    var shuffled = Quiz
      ? Quiz.shuffle(items.map(function (_, i) { return i; }))
      : items.map(function (_, i) { return i; }).reverse();
    var target = [];          // 程序区：物品下标，按当前顺序

    host.innerHTML =
      '<div class="parsons-title">' + escHtml(data.title || "把代码行拖回正确顺序") + "</div>" +
      '<div class="parsons-cols">' +
      '<div class="parsons-col"><h5>🧩 代码块（打乱）<span class="parsons-count"></span></h5>' +
      '<ol class="parsons-pool"></ol></div>' +
      '<div class="parsons-col"><h5>📦 程序区（按正确顺序排列）<span class="parsons-count"></span></h5>' +
      '<ol class="parsons-target"></ol></div>' +
      "</div>" +
      '<div class="sort-btns">' +
      '<button class="btn btn-small btn-primary" data-pa="check">✅ 检查顺序</button>' +
      '<button class="btn btn-small" data-pa="reset">🔀 重新打乱</button>' +
      "</div>" +
      '<div class="quiz-feedback"></div>';

    var poolEl = host.querySelector(".parsons-pool");
    var targetEl = host.querySelector(".parsons-target");
    var fb = host.querySelector(".quiz-feedback");

    function codeLine(text) {
      return '<code class="parsons-code">' + escHtml(text) + "</code>";
    }

    function render() {
      poolEl.innerHTML = "";
      targetEl.innerHTML = "";
      var inTarget = {};
      target.forEach(function (i) { inTarget[i] = true; });
      shuffled.forEach(function (idx) {
        if (inTarget[idx]) return;
        var li = document.createElement("li");
        li.className = "parsons-item";
        li.draggable = true;
        li.setAttribute("data-idx", String(idx));
        li.innerHTML = codeLine(items[idx]);
        li.addEventListener("dragstart", function (ev) {
          li.classList.add("dragging");
          ev.dataTransfer.setData("text/plain", "pool:" + idx);
          ev.dataTransfer.effectAllowed = "move";
        });
        li.addEventListener("dragend", function () { li.classList.remove("dragging"); });
        poolEl.appendChild(li);
      });
      target.forEach(function (idx, pos) {
        var li = document.createElement("li");
        li.className = "parsons-item in-target";
        li.draggable = true;
        li.setAttribute("data-pos", String(pos));
        li.innerHTML =
          '<span class="sort-num">' + (pos + 1) + '.</span>' + codeLine(items[idx]) +
          '<span class="parsons-btns">' +
          '<button class="btn btn-small sort-arrow-btn" data-dir="-1" title="上移">↑</button>' +
          '<button class="btn btn-small sort-arrow-btn" data-dir="1" title="下移">↓</button>' +
          '<button class="btn btn-small sort-arrow-btn" data-out="1" title="放回代码块">✕</button>' +
          "</span>";
        li.addEventListener("dragstart", function (ev) {
          li.classList.add("dragging");
          ev.dataTransfer.setData("text/plain", "target:" + pos);
          ev.dataTransfer.effectAllowed = "move";
        });
        li.addEventListener("dragend", function () { li.classList.remove("dragging"); });
        /* 放到这一行上 = 插到该行之前 */
        li.addEventListener("dragover", function (ev) { ev.preventDefault(); });
        li.addEventListener("drop", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          var d = String(ev.dataTransfer.getData("text/plain") || "");
          if (d.indexOf("pool:") === 0) {
            moveToTarget(parseInt(d.slice(5), 10), pos);
          } else if (d.indexOf("target:") === 0) {
            var from = parseInt(d.slice(7), 10);
            if (!isNaN(from) && from !== pos) {
              var m = target.splice(from, 1)[0];
              target.splice(from < pos ? pos - 1 : pos, 0, m);
              render();
            }
          }
        });
        targetEl.appendChild(li);
      });
      host.querySelectorAll(".parsons-count").forEach(function (c) {
        c.textContent = "（" + target.length + " / " + items.length + " 行）";
      });
    }

    function moveToTarget(idx, atPos) {
      var t = target.indexOf(idx);
      if (t !== -1) target.splice(t, 1);
      if (typeof atPos === "number") target.splice(Math.max(0, Math.min(target.length, atPos)), 0, idx);
      else target.push(idx);
      render();
    }
    function backToPool(idx) {
      var t = target.indexOf(idx);
      if (t !== -1) target.splice(t, 1);
      render();
    }

    /* 拖到程序区空白处：追加到末尾（放到具体行上则插到该行前，见行级 drop） */
    targetEl.addEventListener("dragover", function (ev) { ev.preventDefault(); });
    targetEl.addEventListener("drop", function (ev) {
      ev.preventDefault();
      var d = String(ev.dataTransfer.getData("text/plain") || "");
      if (d.indexOf("pool:") === 0) {
        moveToTarget(parseInt(d.slice(5), 10), target.length);
      } else if (d.indexOf("target:") === 0) {
        var from = parseInt(d.slice(7), 10);
        if (!isNaN(from)) { var moved = target.splice(from, 1)[0]; target.push(moved); render(); }
      }
    });
    targetEl.addEventListener("click", function (ev) {
      var li = ev.target.closest ? ev.target.closest(".parsons-item") : null;
      if (!li) return;
      var pos = parseInt(li.getAttribute("data-pos"), 10);
      if (isNaN(pos)) return;
      var dir = ev.target.getAttribute && ev.target.getAttribute("data-dir");
      var out = ev.target.getAttribute && ev.target.getAttribute("data-out");
      if (dir === "-1" && pos > 0) { var t1 = target[pos - 1]; target[pos - 1] = target[pos]; target[pos] = t1; render(); }
      else if (dir === "1" && pos < target.length - 1) { var t2 = target[pos + 1]; target[pos + 1] = target[pos]; target[pos] = t2; render(); }
      else if (out) { backToPool(target[pos]); }
    });

    poolEl.addEventListener("dragover", function (ev) { ev.preventDefault(); });
    poolEl.addEventListener("drop", function (ev) {
      ev.preventDefault();
      var d = String(ev.dataTransfer.getData("text/plain") || "");
      if (d.indexOf("target:") === 0) {
        var from = parseInt(d.slice(7), 10);
        if (!isNaN(from)) backToPool(target[from]);
      }
    });

    host.querySelector('[data-pa="check"]').addEventListener("click", function () {
      var ok = target.length === items.length && target.every(function (v, i) { return v === i; });
      fb.className = "quiz-feedback " + (ok ? "ok" : "bad");
      if (ok) {
        fb.innerHTML = "✔ 程序正确！" + (data.explain ? '<div class="small">' + data.explain + "</div>" : "");
      } else if (target.length < items.length) {
        fb.innerHTML = "✘ 还有 " + (items.length - target.length) + " 行没放进程序区。" +
          (data.hint ? '<div class="small">提示：' + data.hint + "</div>" : "");
      } else {
        /* 逐行给出第一个错误位置 */
        var firstBad = -1;
        for (var i = 0; i < target.length; i++) { if (target[i] !== i) { firstBad = i; break; } }
        fb.innerHTML = "✘ 顺序还不对：从第 " + (firstBad + 1) + " 行开始就错了。" +
          (data.hint ? '<div class="small">提示：' + data.hint + "</div>" : "");
      }
    });
    host.querySelector('[data-pa="reset"]').addEventListener("click", function () {
      shuffled = Quiz
        ? Quiz.shuffle(items.map(function (_, i) { return i; }))
        : items.map(function (_, i) { return i; }).reverse();
      target = [];
      fb.className = "";
      fb.textContent = "已重新打乱，把代码行拖入右侧程序区";
      render();
    });

    render();
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

  /* ---------------- 指针/引用 SVG 箭头图 ----------------
     数据（script.ptrviz-data，JSON）：
       vars  变量盒：[{ name, type, value? }, ...]（横向排列，>6 个自动换行）
       frames 每步状态：
         ptrs   { 指针名: 目标变量名 | "null" }（缺省的指针本步不画箭头）
         freed  本步已销毁的变量名数组（盒子画删除线、指向它的箭头变红虚线）
         note   本步讲解（纯文本）
     交互：⏮ 上一步 / 下一步 ⏭ 逐步切换，箭头端点用 rAF 补间动画过渡。 */
  function initPtrviz(host) {
    if (host.getAttribute("data-rendered") === "1") return;
    host.setAttribute("data-rendered", "1");
    var dataEl = host.querySelector("script.ptrviz-data");
    if (!dataEl) return;
    var data;
    try { data = JSON.parse(dataEl.textContent); }
    catch (e) { host.innerHTML = '<div class="warn">指针图数据 JSON 解析失败：' + escHtml(e.message) + "</div>"; return; }
    var vars = data.vars || [];
    var steps = data.frames || [];   /* 字段名用 frames：避开校验器对 ex-steps 的 steps/line 检查 */
    if (!vars.length || !steps.length) return;

    host.innerHTML =
      '<div class="ptrviz-title">' + escHtml(data.title || "指针指向图") + "</div>" +
      '<div class="ptrviz-canvas"><svg></svg></div>' +
      '<div class="ptrviz-controls">' +
      '<button class="btn btn-small" data-pv="first">⏮</button>' +
      '<button class="btn btn-small" data-pv="prev">⬅ 上一步</button>' +
      '<span class="ptrviz-progress"></span>' +
      '<button class="btn btn-small btn-primary" data-pv="next">下一步 ➡</button>' +
      '<button class="btn btn-small" data-pv="end">⏭</button>' +
      "</div>" +
      '<div class="ptrviz-note"></div>';

    var svg = host.querySelector("svg");
    var noteEl = host.querySelector(".ptrviz-note");
    var progEl = host.querySelector(".ptrviz-progress");
    var cur = 0;
    var raf = null;

    var BOX_W = 96, BOX_H = 52, GAP = 22, PAD = 10, ROW_H = 86;
    var HEADROOM = 104;              /* 箭头在盒子上方走线需要的净空 */
    var perRow = Math.min(vars.length, 6);
    var rows = Math.ceil(vars.length / 6);
    var W = Math.max(320, perRow * (BOX_W + GAP) - GAP + PAD * 2);
    var H = PAD + HEADROOM + rows * ROW_H + 46;   /* 底部留 ∅ 徽标的悬挂空间 */

    function boxRect(i) {
      var row = Math.floor(i / 6), col = i % 6;
      return { x: PAD + col * (BOX_W + GAP), y: PAD + HEADROOM + row * ROW_H };
    }
    var idxByName = {};
    vars.forEach(function (v, i) { idxByName[v.name] = i; });

    var svgNS = "http://www.w3.org/2000/svg";
    function el(tag, attrs) {
      var n = document.createElementNS(svgNS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      return n;
    }

    function drawStatic() {
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.setAttribute("width", "100%");
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var defs = el("defs", {});
      var mk = el("marker", { id: "pv-arrow", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" });
      mk.appendChild(el("path", { d: "M 0 0 L 10 5 L 0 10 z", "class": "pv-mk-normal" }));
      var mkBad = el("marker", { id: "pv-arrow-bad", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" });
      mkBad.appendChild(el("path", { d: "M 0 0 L 10 5 L 0 10 z", "class": "pv-mk-bad" }));
      defs.appendChild(mk); defs.appendChild(mkBad);
      svg.appendChild(defs);

      vars.forEach(function (v, i) {
        var r = boxRect(i);
        var g = el("g", {});
        g.appendChild(el("rect", { x: r.x, y: r.y, width: BOX_W, height: BOX_H, rx: 8,
          class: "pv-box" + (String(v.type || "").indexOf("*") !== -1 ? " pv-box-ptr" : "") }));
        var name = el("text", { x: r.x + 10, y: r.y + 20, class: "pv-name" });
        name.textContent = v.name;
        g.appendChild(name);
        var sub = el("text", { x: r.x + 10, y: r.y + 38, class: "pv-sub" });
        sub.textContent = (v.type || "") + (v.value !== undefined && v.value !== "" ? " = " + v.value : "");
        g.appendChild(sub);
        svg.appendChild(g);
      });
      /* 箭头层（每步重建） */
      svg.appendChild(el("g", { class: "pv-arrows" }));
      /* nullptr 徽标层 */
      svg.appendChild(el("g", { class: "pv-nulls" }));
    }

    function arrowPath(x1, y1, x2, y2) {
      /* 从指针盒顶部出发，弧线走在盒子上方净空里，落回目标盒顶部；
         抬升量随水平距离增大，避免长箭头压到中间的盒子 */
      var lift = Math.min(96, 34 + Math.abs(x2 - x1) * 0.22);
      var c1y = y1 - lift, c2y = y2 - lift;
      return "M " + x1 + " " + y1 +
        " C " + x1 + " " + c1y + ", " + x2 + " " + c2y + ", " + x2 + " " + (y2 - 3);
    }

    function stepState(si) {
      var s = steps[si] || {};
      return { ptrs: s.ptrs || {}, freed: s.freed || [] };
    }

    function render() {
      var st = stepState(cur);
      progEl.textContent = (cur + 1) + " / " + steps.length;
      noteEl.textContent = steps[cur] && steps[cur].note ? steps[cur].note : "";
      /* 盒子状态：freed 加删除线类 */
      vars.forEach(function (v, i) {
        var box = svg.querySelectorAll(".pv-box")[i];
        if (box) box.classList.toggle("pv-freed", st.freed.indexOf(v.name) !== -1);
      });

      var arrowsG = svg.querySelector(".pv-arrows");
      var nullsG = svg.querySelector(".pv-nulls");
      while (arrowsG.firstChild) arrowsG.removeChild(arrowsG.firstChild);
      while (nullsG.firstChild) nullsG.removeChild(nullsG.firstChild);

      var targets = [];
      Object.keys(st.ptrs).forEach(function (pname) {
        var pi = idxByName[pname];
        if (pi === undefined) return;
        var from = boxRect(pi);
        var x1 = from.x + BOX_W / 2, y1 = from.y;          /* 指针盒顶部出发 */
        var tgt = st.ptrs[pname];
        if (tgt === "null") {
          var badge = el("g", { class: "pv-null-badge" });
          badge.appendChild(el("circle", { cx: x1, cy: from.y + BOX_H + 26, r: 12, class: "pv-null-circle" }));
          var t = el("text", { x: x1, y: from.y + BOX_H + 30, class: "pv-null-text" });
          t.textContent = "∅";
          badge.appendChild(t);
          nullsG.appendChild(badge);
          targets.push({ x1: x1, y1: from.y + BOX_H, x2: x1, y2: from.y + BOX_H + 14, bad: false });
          return;
        }
        var ti = idxByName[tgt];
        if (ti === undefined) return;
        var to = boxRect(ti);
        var bad = st.freed.indexOf(tgt) !== -1;
        targets.push({ x1: x1, y1: y1, x2: to.x + BOX_W / 2, y2: to.y, bad: bad });
      });

      targets.forEach(function (t) {
        var p = el("path", {
          d: arrowPath(t.x1, t.y1, t.x2, t.y2),
          class: "pv-arrow" + (t.bad ? " pv-arrow-bad" : ""),
          "marker-end": t.bad ? "url(#pv-arrow-bad)" : "url(#pv-arrow)"
        });
        arrowsG.appendChild(p);
      });

      /* 箭头生长动画：从起点向终点展开（stroke-dashoffset 过渡）；
         悬空虚线箭头不做生长动画——内联 dasharray 会覆盖虚线图案 */
      arrowsG.querySelectorAll(".pv-arrow").forEach(function (p) {
        if (p.classList.contains("pv-arrow-bad")) return;
        try {
          var len = p.getTotalLength();
          p.style.strokeDasharray = len;
          p.style.strokeDashoffset = len;
          p.getBoundingClientRect();      /* 强制布局后再清零，触发过渡 */
          p.style.transition = "stroke-dashoffset .35s ease";
          p.style.strokeDashoffset = "0";
        } catch (e) { /* getTotalLength 不可用时直接显示 */ }
      });
    }

    host.addEventListener("click", function (ev) {
      var act = ev.target.getAttribute && ev.target.getAttribute("data-pv");
      if (!act) return;
      if (act === "prev") cur = Math.max(0, cur - 1);
      else if (act === "next") cur = Math.min(steps.length - 1, cur + 1);
      else if (act === "first") cur = 0;
      else if (act === "end") cur = steps.length - 1;
      else return;
      if (raf) cancelAnimationFrame(raf);
      render();
    });

    drawStatic();
    render();
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
    document.querySelectorAll(".widget-parsons").forEach(initParsons);
    document.querySelectorAll(".widget-ptrviz").forEach(initPtrviz);
    document.querySelectorAll(".widget-incdec").forEach(initIncDec);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.Interact = Interact;
})();
