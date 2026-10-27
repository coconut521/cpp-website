/* ============================================================
 * teacher.js —— 教师模式
 * 启用方式（满足任一即启用，状态存 localStorage）：
 *   1) 页面右上角「🧑‍🏫 教师」开关（由本脚本注入）
 *   2) URL 参数  ?teacher=1（?teacher=0 关闭）
 *   3) 快捷键 Ctrl + Alt + T
 * 启用后 body 增加 .teacher 类，页面中 .teacher-only / .teacher-only-note
 * 元素自动显示；右下角出现浮动面板，提供：
 *   - 显示/隐藏所有答案与解析
 *   - 展开/折叠所有报错和修复（details + .error-item）
 *   - 显示/隐藏所有示例输出
 *   - 导出本章全部 .cpp 代码
 *   - 生成新章节 HTML 模板（下载）
 * ============================================================ */
(function () {
  "use strict";

  var STORE = "cppcourse.teacher";

  function isEnabled() {
    var q = new URLSearchParams(location.search).get("teacher");
    if (q === "1") { set(true); return true; }
    if (q === "0") { set(false); return false; }
    try { return localStorage.getItem(STORE) === "1"; } catch (e) { return false; }
  }
  function set(on) { try { localStorage.setItem(STORE, on ? "1" : "0"); } catch (e) {} }

  function apply(on) {
    document.body.classList.toggle("teacher", on);
    var btn = document.getElementById("teacher-toggle");
    if (btn) btn.classList.toggle("active", on);
    var fab = document.getElementById("teacher-fab");
    if (fab) fab.style.display = on ? "block" : "none";
    if (!on) {
      var panel = document.getElementById("teacher-panel");
      if (panel) panel.classList.remove("open");
      document.body.classList.remove("teacher-show-answers");
    }
  }

  /* ---------- 新章节模板内容 ---------- */
  function templateHTML() {
    var boot = '(function(){try{var t=localStorage.getItem("cppcourse.theme");if(t)document.documentElement.setAttribute("data-theme",t);var f=parseFloat(localStorage.getItem("cppcourse.fontscale"));if(f>0)document.documentElement.style.fontSize=(16*f)+"px";}catch(e){}})();';
    var js = ["highlight.js", "toc.js", "nav.js", "quiz.js", "interactive.js", "teacher.js", "mastery.js", "bughunt-data.js", "bug-hunt.js", "present.js"]
      .map(function (n) { return '<script src="../assets/js/' + n + '"><\/script>'; }).join("\n");
    return "<!DOCTYPE html>\n" +
"<html lang=\"zh-CN\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n<title>第N章 章节标题 | 大学C++离线助教</title>\n" +
"<script>" + boot + "<\/script>\n" +
"<link rel=\"stylesheet\" href=\"../assets/css/style.css\">\n</head>\n<body>\n<main class=\"container chapter\">\n\n" +
"  <p class=\"crumbs\"><a href=\"../index.html\">首页</a> / <a href=\"../index.html#toc\">章节目录</a> / 第N章</p>\n\n" +
"  <section class=\"card objectives\">\n    <h2 style=\"margin-top:0\">🎯 学习目标</h2>\n    <ul><li>学完本章，你能够 ……</li></ul>\n    <p class=\"small muted\">前置知识：<a href=\"ch01-variables.html\">第1章</a></p>\n  </section>\n\n" +
"  <!-- 正文：小节 + 示例卡片 + 互动元件，完整写法见 templates/authoring-guide.md -->\n\n" +
"  <h2>常见错误</h2>\n  <div class=\"warn\">…</div>\n  <div class=\"ub-warning\">…</div>\n\n" +
"  <h2>C++ 标准差异</h2>\n  <div class=\"std-diff\">…</div>\n\n" +
"  <h2>本章小结</h2>\n  <div class=\"keypoint\">…</div>\n\n" +
"  <h2>✅ 自测清单</h2>\n  <ul class=\"checklist\" data-chapter=\"chNN\">\n    <li><label><input type=\"checkbox\" data-check-id=\"chNN-c1\"><span>…</span></label></li>\n  </ul>\n\n" +
"  <section class=\"quiz\" data-source=\"chNN\">\n    <script type=\"application/json\" class=\"quiz-data\">{ \"title\": \"随堂测验\", \"questions\": [] }<\/script>\n  </section>\n\n" +
"</main>\n\n" + js + "\n</body>\n</html>\n";
  }

  /* ---------- 面板 ---------- */
  function buildPanel() {
    var panel = document.createElement("div");
    panel.id = "teacher-panel";
    panel.className = "teacher-panel";
    panel.innerHTML =
      "<h3>🧑‍🏫 教师模式</h3>" +
      "<div class='tp-group'>" +
      "<button class='btn' data-t='answers'>👁 显示 / 隐藏所有答案与解析</button>" +
      "<button class='btn' data-t='outputs'>▶ 显示 / 隐藏所有示例输出</button>" +
      "<button class='btn' data-t='details'>📂 展开 / 折叠所有报错·修复·折叠块</button>" +
      "</div><div class='tp-group'>" +
      "<button class='btn' data-t='exam'>📑 随机组卷（跨章题库）</button>" +
      "<button class='btn' data-t='export'>💾 导出本章全部 .cpp 代码</button>" +
      "<button class='btn' data-t='template'>📝 生成新章节 HTML 模板（下载）</button>" +
      "</div><div id='tp-extra'></div>" +
      "<p class='small muted'>提示：也可用 ?teacher=1 或快捷键 Ctrl+Alt+T 开关。关闭教师模式不影响浏览。</p>";

    panel.addEventListener("click", function (ev) {
      var t = ev.target.getAttribute && ev.target.getAttribute("data-t");
      if (!t) return;
      var extra = panel.querySelector("#tp-extra");
      if (t === "answers") {
        var show = !document.body.classList.contains("teacher-show-answers");
        document.body.classList.toggle("teacher-show-answers", show);
        if (show) document.querySelectorAll("details.fold-answer").forEach(function (d) { d.setAttribute("open", ""); });
      } else if (t === "exam") {
        panel.classList.remove("open");
        openExamBuilder();
      } else if (t === "outputs") {
        // 按当前强制显示状态切换所有示例输出
        document.querySelectorAll(".example-card .ex-output").forEach(function (o) {
          var forced = o.getAttribute("data-forced") === "1";
          if (forced) { o.hidden = true; o.removeAttribute("data-forced"); }
          else { o.hidden = false; o.setAttribute("data-forced", "1"); }
        });
        document.querySelectorAll(".example-card .ex-btns .btn").forEach(function (b) {
          var o = b.closest(".example-card");
          var out = o && o.querySelector(".ex-output");
          if (out) b.textContent = out.hidden ? "▶ 显示预期输出" : "🔽 隐藏预期输出";
        });
      } else if (t === "details") {
        var anyClosed = Array.prototype.some.call(document.querySelectorAll("details"), function (d) { return !d.hasAttribute("open"); });
        if (window.Interact) window.Interact.toggleAllDetails(anyClosed);
        document.querySelectorAll(".error-item").forEach(function (el) { el.classList.toggle("open", anyClosed); });
      } else if (t === "export") {
        if (window.Interact) window.Interact.exportChapterCode(document.title.split("|")[0].trim() || "chapter");
        else alert("interactive.js 未加载");
      } else if (t === "template") {
        if (window.Interact) window.Interact.download("chapter-template-new.html", templateHTML());
      }
    });
    document.body.appendChild(panel);

    var fab = document.createElement("button");
    fab.id = "teacher-fab";
    fab.textContent = "🧑‍🏫 教师";
    fab.addEventListener("click", function () { panel.classList.toggle("open"); });
    document.body.appendChild(fab);

    // 顶栏开关
    var actions = document.querySelector(".site-header .header-actions");
    if (actions) {
      var btn = document.createElement("button");
      btn.id = "teacher-toggle";
      btn.className = "icon-btn";
      btn.textContent = "🧑‍🏫 教师";
      btn.addEventListener("click", function () {
        var on = !document.body.classList.contains("teacher");
        set(on); apply(on);
        if (on) { panel.classList.add("open"); }
      });
      actions.appendChild(btn);
    }
  }

  /* ---------- 随机组卷 ----------
     题源：quizbank-data.js（QUIZBANK_DATA）+ pitfalls-data.js 内嵌 quiz +
     bughunt-data.js（找错题）。三个数据文件按需动态注入 <script>（file:// 可用）。
     生成 → 全屏试卷浮层；「打印」走 @media print 专用规则（只打印浮层）；
     「答案页」切换为答案视图，可单独打印。 */
  var EXAM_KEYMAP = {
    "quizbank-data.js": "QUIZBANK_DATA",
    "pitfalls-data.js": "PITFALLS_DATA",
    "bughunt-data.js": "BUGHUNT_DATA"
  };
  function examPrefix() {
    return /\/chapters\//.test(decodeURIComponent(location.pathname)) ? "../" : "";
  }
  function ensureExamData(cb) {
    var need = Object.keys(EXAM_KEYMAP).filter(function (n) { return !window[EXAM_KEYMAP[n]]; });
    if (!need.length) { cb(true); return; }
    var left = need.length, failed = [];
    need.forEach(function (n) {
      var s = document.createElement("script");
      s.src = examPrefix() + "assets/js/" + n;
      s.onload = s.onerror = function (ev) {
        if (ev && ev.type === "error") failed.push(n);
        if (--left === 0) cb(failed.length === 0);
      };
      document.head.appendChild(s);
    });
  }

  function buildExamPool() {
    var pool = [];
    (window.QUIZBANK_DATA || []).forEach(function (q) {
      pool.push({ id: q.id, ch: q.ch, type: q.type, q: q.q, options: q.options, answer: q.answer,
        explain: q.explain, difficulty: q.difficulty || "medium", tags: q.tags || [], src: "题库" });
    });
    (window.PITFALLS_DATA || []).forEach(function (p) {
      (p.quiz || []).forEach(function (q, i) {
        pool.push({ id: p.id + "-q" + (i + 1), ch: (p.related && p.related[0]) || null, type: q.type, q: q.q,
          options: q.options, answer: q.answer, ci: q.ci, explain: q.explain,
          difficulty: q.difficulty || p.difficulty || "medium", tags: p.tags || [], src: "易错点" });
      });
    });
    (window.BUGHUNT_DATA || []).forEach(function (b) {
      pool.push({ id: b.id, ch: b.ch, type: "bughunt", title: b.title, code: b.code, bugLine: b.bugLine,
        kind: b.kind, why: b.why, difficulty: b.difficulty || "medium", tags: [], src: "找Bug" });
    });
    return pool;
  }

  var EXAM_TYPE_LABEL = { mcq: "选择", tf: "判断", fill: "填空", code: "代码", mfill: "多空", bughunt: "找错" };
  var EXAM_DIFF_LABEL = { easy: "简单", medium: "中等", hard: "困难" };
  var EXAM_KIND_LABEL = { compile: "编译错误", logic: "逻辑错误", ub: "未定义行为" };

  function examEsc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  function examAnswerText(item) {
    if (item.type === "mcq") return String.fromCharCode(65 + item.answer) + ". " + examEsc(item.options[item.answer]);
    if (item.type === "tf") return item.answer ? "正确" : "错误";
    if (item.type === "bughunt") {
      return "第 " + item.bugLine + " 行（" + (EXAM_KIND_LABEL[item.kind] || item.kind) + "）" +
        (item.why ? "：" + item.why : "");
    }
    var list = Array.isArray(item.answer) ? item.answer : [item.answer];
    return list.map(function (a) { return "<code>" + examEsc(a) + "</code>"; }).join(" 或 ");
  }

  function examRenderItem(item, no, forAnswer) {
    var badges = '<span class="exam-badge">' + (EXAM_TYPE_LABEL[item.type] || item.type) + "</span>" +
      '<span class="exam-badge d-' + item.difficulty + '">' + (EXAM_DIFF_LABEL[item.difficulty] || item.difficulty) + "</span>" +
      (item.ch ? '<span class="exam-badge muted">' + examEsc(item.ch) + "</span>" : "");
    var html = '<div class="exam-item"><div class="exam-item-head"><span class="exam-no">' + no + '.</span>' + badges + "</div>";
    if (item.type === "bughunt") {
      html += '<div class="exam-q">' + examEsc(item.title) + "：找出有问题的那一行</div>";
      var src = item.code.join("\n");
      html += '<pre class="exam-code">' +
        (window.CppLight ? window.CppLight.highlight(src) : examEsc(src)) + "</pre>";
      if (forAnswer) {
        html += '<div class="exam-answer"><b>答案：</b>' + examAnswerText(item) + "</div>";
      } else {
        html += '<div class="exam-blank">有问题的行号：第 ________ 行</div>';
      }
    } else {
      html += '<div class="exam-q">' + item.q + "</div>";
      if (item.type === "mcq") {
        html += '<div class="exam-options">';
        item.options.forEach(function (opt, oi) {
          html += '<div class="exam-option">' + String.fromCharCode(65 + oi) + ". " +
            (forAnswer && oi === item.answer ? '<span class="exam-correct">' : "") +
            examEsc(opt) +
            (forAnswer && oi === item.answer ? "</span>" : "") + "</div>";
        });
        html += "</div>";
      } else if (item.type === "tf") {
        html += '<div class="exam-tf">（&nbsp;&nbsp;&nbsp;&nbsp;）正确&nbsp;&nbsp;&nbsp;&nbsp;（&nbsp;&nbsp;&nbsp;&nbsp;）错误</div>';
      } else if (item.type === "mfill") {
        html += '<pre class="exam-code">' + examEsc(item.code) + "</pre>";
      }
      if (forAnswer) {
        html += '<div class="exam-answer"><b>答案：</b>' + examAnswerText(item) +
          (item.explain ? '<div class="exam-explain">' + item.explain + "</div>" : "") + "</div>";
      } else {
        html += '<div class="exam-blank">答：________________________________________</div>';
      }
    }
    return html + "</div>";
  }

  var examPool = [];
  var examMode = "config";   /* config | paper | answers */

  function examClose() {
    var ov = document.getElementById("exam-overlay");
    if (ov) ov.remove();
    document.body.classList.remove("exam-open");
  }

  function examToolbarButtons() {
    return '<button class="btn btn-small" data-exam="config">⚙ 重新配置</button>' +
      (examMode === "answers"
        ? '<button class="btn btn-small" data-exam="paper">📝 回到试卷</button>'
        : '<button class="btn btn-small" data-exam="answers">📄 答案页</button>') +
      '<button class="btn btn-small btn-primary" data-exam="print">🖨 打印本页</button>' +
      '<button class="btn btn-small" data-exam="close">✖ 关闭</button>';
  }

  function examShow(mode) {
    examMode = mode;
    var ov = document.getElementById("exam-overlay");
    if (!ov) return;
    var body = ov.querySelector(".exam-body");
    if (mode === "config") {
      ov.querySelector(".exam-toolbar").innerHTML =
        '<b>📑 随机组卷</b>' + examToolbarButtons().replace('data-exam="config"', 'data-exam="close" hidden');
      body.innerHTML = examConfigHtml();
      body.querySelector(".exam-go").addEventListener("click", examGenerate);
      return;
    }
    ov.querySelector(".exam-toolbar").innerHTML =
      '<b>📑 随机组卷（' + examPool.length + " 题）</b>" + examToolbarButtons();
    var html = "";
    if (mode === "paper") {
      html += '<div class="exam-paper-head"><h2>大学 C++ 随堂练习卷</h2>' +
        '<div class="exam-meta">班级__________　姓名__________　得分__________</div>' +
        '<div class="exam-meta small muted">共 ' + examPool.length + " 题 · 生成于 " + new Date().toLocaleDateString() + "</div></div>";
      examPool.forEach(function (item, i) { html += examRenderItem(item, i + 1, false); });
    } else {
      html += '<div class="exam-paper-head"><h2>答案页（共 ' + examPool.length + " 题）</h2></div>";
      examPool.forEach(function (item, i) { html += examRenderItem(item, i + 1, true); });
    }
    body.innerHTML = html;
  }

  function examConfigHtml() {
    var chOptions = '<option value="all">全部章节</option>';
    (window.COURSE_TOC || []).forEach(function (c) {
      chOptions += '<option value="' + c.id + '">' + examEsc(c.title) + "</option>";
    });
    return '<div class="exam-config">' +
      "<h3>组卷设置</h3>" +
      "<label>题数 <select id='exam-n'><option>5</option><option selected>10</option><option>15</option><option>20</option></select></label>" +
      "<label>难度 <select id='exam-diff'><option value='all'>全部</option><option value='easy'>简单</option><option value='medium'>中等</option><option value='hard'>困难</option></select></label>" +
      "<label>题型 <select id='exam-type'><option value='all'>全部</option><option value='mcq'>选择</option><option value='tf'>判断</option><option value='fill'>填空</option><option value='code'>代码</option><option value='mfill'>多空填空</option><option value='bughunt'>找错</option></select></label>" +
      "<label>范围 <select id='exam-ch'>" + chOptions + "</select></label>" +
      "<div class='exam-config-tip small muted'>题源：跨章题库 + 易错点小题 + 找错题。池中题不足时按实际数量出卷。</div>" +
      "<button class='btn btn-primary exam-go'>📑 生成试卷</button>" +
      "</div>";
  }

  function examGenerate() {
    var ov = document.getElementById("exam-overlay");
    var n = parseInt(ov.querySelector("#exam-n").value, 10) || 10;
    var diff = ov.querySelector("#exam-diff").value;
    var type = ov.querySelector("#exam-type").value;
    var ch = ov.querySelector("#exam-ch").value;
    var pool = buildExamPool().filter(function (item) {
      if (diff !== "all" && item.difficulty !== diff) return false;
      if (type !== "all" && item.type !== type) return false;
      if (ch !== "all" && item.ch !== ch) return false;
      return true;
    });
    /* 打乱后取 N 题，再按章节排序让卷面按章分组 */
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    examPool = pool.slice(0, n).sort(function (a, b) {
      return (a.ch || "").localeCompare(b.ch || "") || (a.type || "").localeCompare(b.type || "");
    });
    examShow("paper");
  }

  function openExamBuilder() {
    ensureExamData(function (ok) {
      if (!ok) { alert("题库数据加载失败：请确认 assets/js 下的 quizbank / pitfalls / bughunt 数据文件完整。"); return; }
      if (document.getElementById("exam-overlay")) return;
      var ov = document.createElement("div");
      ov.id = "exam-overlay";
      ov.className = "exam-overlay";
      ov.innerHTML = '<div class="exam-toolbar"></div><div class="exam-body"></div>';
      document.body.appendChild(ov);
      document.body.classList.add("exam-open");
      ov.addEventListener("click", function (ev) {
        var act = ev.target.getAttribute && ev.target.getAttribute("data-exam");
        if (!act) return;
        if (act === "close") examClose();
        else if (act === "print") window.print();
        else if (act === "config") examShow("config");
        else if (act === "paper") examShow("paper");
        else if (act === "answers") examShow("answers");
      });
      examShow("config");
    });
  }

  function init() {
    var on = isEnabled();
    buildPanel();
    apply(on);
    document.addEventListener("keydown", function (ev) {
      if (ev.ctrlKey && ev.altKey && (ev.key === "t" || ev.key === "T")) {
        ev.preventDefault();
        var next = !document.body.classList.contains("teacher");
        set(next); apply(next);
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
