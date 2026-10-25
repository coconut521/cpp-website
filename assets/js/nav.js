/* ============================================================
 * nav.js —— 顶栏 / 底栏 / 上一章下一章 / 主题与字号切换
 * 依赖：toc.js（COURSE_TOC, SPECIAL_PAGES）
 * 页面无需手写头部：本脚本自动插入；章节页自动生成翻页导航。
 * ============================================================ */
(function () {
  "use strict";

  /* ---------- 相对路径前缀 ---------- */
  var path = decodeURIComponent(location.pathname);
  var prefix = "";                    // 当前页到站点根目录的相对前缀
  var m = path.match(/\/chapters\/[^/]*$/);
  if (m) prefix = "../";
  var here = path.split("/").pop() || "index.html";

  /* ---------- 主题 / 字号（与 head 内联脚本一致，双保险） ---------- */
  function applyTheme(t) {
    if (t) document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  }
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }
  function applyFont(scale) {
    document.documentElement.style.fontSize = (16 * scale) + "px";
  }
  window.SiteUI = {
    toggleTheme: function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem("cppcourse.theme", next); } catch (e) {}
      var btn = document.querySelector("[data-role=theme-btn]");
      if (btn) btn.textContent = next === "dark" ? "🌙 暗色" : "☀️ 亮色";
    },
    fontStep: function (dir) {
      var cur = parseFloat(document.documentElement.style.fontSize) / 16 || 1;
      var next = Math.min(1.4, Math.max(0.8, Math.round((cur + dir * 0.1) * 10) / 10));
      applyFont(next);
      try { localStorage.setItem("cppcourse.fontscale", String(next)); } catch (e) {}
    }
  };

  /* ---------- 顶栏 ---------- */
  function buildHeader() {
    var inChapter = !!m;
    var specials = (window.SPECIAL_PAGES || []);
    function sp(id) {
      for (var i = 0; i < specials.length; i++) if (specials[i].id === id) return specials[i];
      return null;
    }
    var nav = "";
    nav += '<a href="' + prefix + 'index.html" class="' + (here === "index.html" ? "active" : "") + '">首页</a>';
    var e = sp("errors"), c = sp("cheatsheets"), s = sp("sorting"), p = sp("exam-pitfalls");
    if (e) nav += '<a href="' + prefix + e.file + '" class="' + (here === e.file ? "active" : "") + '">错误博物馆</a>';
    if (c) nav += '<a href="' + prefix + c.file + '" class="' + (here === c.file ? "active" : "") + '">速查表</a>';
    if (s) nav += '<a href="' + prefix + s.file + '" class="' + (here === s.file ? "active" : "") + '">排序专题</a>';
    if (p) nav += '<a href="' + prefix + p.file + '" class="' + (here === p.file ? "active" : "") + '">易错点</a>';
    nav += '<a href="' + prefix + 'index.html#toc">目录</a>';

    var themeInit = currentTheme() === "dark" ? "🌙 暗色" : "☀️ 亮色";
    var html =
      '<div class="header-inner">' +
      '<a class="brand" href="' + prefix + 'index.html"><span class="logo">C++</span>大学 C++ 离线助教</a>' +
      '<nav class="header-nav">' + nav + '</nav>' +
      '<div class="header-actions">' +
      '<button class="icon-btn" data-role="font-minus" title="减小字号">A－</button>' +
      '<button class="icon-btn" data-role="font-plus" title="增大字号">A＋</button>' +
      '<button class="icon-btn" data-role="theme-btn" title="切换亮色/暗色主题">' + themeInit + '</button>' +
      '</div></div>';

    var header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML = html;
    document.body.insertBefore(header, document.body.firstChild);

    header.querySelector('[data-role=theme-btn]').addEventListener("click", window.SiteUI.toggleTheme);
    header.querySelector('[data-role=font-minus]').addEventListener("click", function () { window.SiteUI.fontStep(-1); });
    header.querySelector('[data-role=font-plus]').addEventListener("click", function () { window.SiteUI.fontStep(1); });
  }

  /* ---------- 底栏 ---------- */
  function buildFooter() {
    var f = document.createElement("footer");
    f.className = "site-footer";
    f.innerHTML =
      '大学 C++ 离线助教 · 纯本地静态页面，双击 index.html 即可使用，无需联网<br>' +
      '<span class="small">示例运行为教学模拟或预置输出；真实编译请在本地使用 g++ / MSVC / VS Code 等工具。' +
      '教案模板见 <a href="' + prefix + 'templates/chapter-template.html">templates/chapter-template.html</a></span>' +
      '<br><span class="small copyright">© 2026 小椰子 · 保留所有权利</span>';
    document.body.appendChild(f);
  }

  /* ---------- 章节翻页 ---------- */
  function buildPager() {
    if (!m) return;                                   // 仅章节页
    var toc = window.COURSE_TOC || [];
    var idx = -1;
    for (var i = 0; i < toc.length; i++) {
      if (toc[i].file && toc[i].file.split("/").pop() === here) { idx = i; break; }
    }
    if (idx === -1) return;
    var prev = toc[idx - 1], next = toc[idx + 1], cur = toc[idx];
    var pager = document.createElement("nav");
    pager.className = "pager";
    pager.innerHTML =
      (prev ? '<a class="btn" href="' + prefix + prev.file + '">⬅ 上一章：' + prev.title + '</a>'
            : '<span class="btn" style="visibility:hidden">占位</span>') +
      '<a class="btn" href="' + prefix + 'index.html#toc">📑 返回总目录</a>' +
      (next ? '<a class="btn" href="' + prefix + next.file + '">下一章：' + next.title + ' ➡</a>'
            : '<span class="btn" style="visibility:hidden">占位</span>');
    document.body.appendChild(pager);
  }

  function init() {
    try {
      var t = null; try { t = localStorage.getItem("cppcourse.theme"); } catch (e) {}
      applyTheme(t);
      var fs = null; try { fs = parseFloat(localStorage.getItem("cppcourse.fontscale")); } catch (e) {}
      if (fs) applyFont(fs);
    } catch (e) {}
    buildHeader();
    buildFooter();
    buildPager();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
