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
