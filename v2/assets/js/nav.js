/* ============================================================
 * v2 nav.js —— 编辑部式顶栏 / 课程抽屉 / 页脚 / 翻页
 * 仍然暴露 window.SiteUI（主题、字号），供旧脚本与页面复用。
 * file:// 兼容：IIFE + 全局，无模块、无请求。
 * ============================================================ */
(function () {
  "use strict";

  var path = decodeURIComponent(location.pathname);
  var prefix = /\/chapters\/[^/]*$/.test(path) ? "../" : "";
  var here = path.split("/").pop() || "index.html";
  var inChapter = /\/chapters\/[^/]*$/.test(path);

  var THEME_ORDER = ["light", "dark", "auto"];
  var THEME_LABEL = { light: "亮色", dark: "暗色", auto: "跟随系统" };

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function icon(name) {
    return window.V2_ICONS && window.V2_ICONS[name] ? window.V2_ICONS[name] : "";
  }
  function storedTheme() {
    return window.SiteTheme ? window.SiteTheme.stored() : "light";
  }
  function nextTheme(mode) {
    return THEME_ORDER[(THEME_ORDER.indexOf(mode) + 1) % THEME_ORDER.length];
  }
  function applyFont(scale) {
    document.documentElement.style.fontSize = (16 * scale) + "px";
  }
  function refreshThemeBtn() {
    var btn = document.querySelector("[data-role=theme-btn]");
    if (!btn) return;
    var mode = storedTheme();
    var eff = window.SiteTheme ? window.SiteTheme.effective(mode) : "light";
    btn.innerHTML = icon("theme") + '<span class="v2-action-label">' + THEME_LABEL[mode] + "</span>";
    btn.title = mode === "auto"
      ? "跟随系统深浅色（当前为" + (eff === "dark" ? "暗色" : "亮色") + "）；点击切换到亮色"
      : "当前" + THEME_LABEL[mode] + "；点击切换到 " + THEME_LABEL[nextTheme(mode)];
  }

  window.SiteUI = {
    toggleTheme: function () {
      var next = nextTheme(storedTheme());
      try { localStorage.setItem("cppcourse.theme", next); } catch (e) {}
      if (window.SiteTheme) window.SiteTheme.apply();
      refreshThemeBtn();
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
    var html =
      '<a class="v2-skip" href="#v2-main">跳到正文</a>' +
      '<div class="header-inner v2-header-inner">' +
        '<a class="brand v2-brand" href="' + prefix + 'index.html">' +
          '<span class="logo v2-logo">C++</span>' +
          '<span class="v2-brand-text"><b>大学 C++ 离线助教</b><small>OFFLINE · v2</small></span>' +
        "</a>" +
        '<nav class="header-nav v2-header-nav" aria-label="主导航">' +
          '<a href="' + prefix + 'index.html"' + (here === "index.html" ? ' class="active"' : "") + '>首页</a>' +
          '<button type="button" class="v2-nav-btn" data-v2-chapters>课程 <span class="v2-nav-caret">▾</span></button>' +
          '<a href="' + prefix + 'errors.html"' + (here === "errors.html" ? ' class="active"' : "") + '>错误</a>' +
          '<a href="' + prefix + 'cheatsheets.html"' + (here === "cheatsheets.html" ? ' class="active"' : "") + '>速查</a>' +
          '<a href="' + prefix + 'sorting.html"' + (here === "sorting.html" ? ' class="active"' : "") + '>排序</a>' +
          '<a href="' + prefix + 'exam-pitfalls.html"' + (here === "exam-pitfalls.html" ? ' class="active"' : "") + '>易错</a>' +
        "</nav>" +
        '<div class="header-actions v2-header-actions">' +
          '<button class="v2-palette-btn" type="button" data-v2-palette title="搜索全站（Ctrl+K）">' +
            icon("search") + '<span>搜索</span><kbd>Ctrl K</kbd>' +
          "</button>" +
          '<button class="icon-btn v2-icon-btn" data-role="font-minus" title="减小字号" aria-label="减小字号">A−</button>' +
          '<button class="icon-btn v2-icon-btn" data-role="font-plus" title="增大字号" aria-label="增大字号">A+</button>' +
          '<button class="icon-btn v2-icon-btn" data-role="theme-btn" title="切换主题"></button>' +
        "</div>" +
        '<button class="v2-menu-btn" type="button" data-v2-menu aria-label="打开菜单">' + icon("menu") + "</button>" +
      "</div>";

    var header = document.createElement("header");
    header.className = "site-header v2-site-header";
    header.innerHTML = html;
    document.body.insertBefore(header, document.body.firstChild);

    header.querySelector('[data-role=theme-btn]').addEventListener("click", window.SiteUI.toggleTheme);
    header.querySelector('[data-role=font-minus]').addEventListener("click", function () { window.SiteUI.fontStep(-1); });
    header.querySelector('[data-role=font-plus]').addEventListener("click", function () { window.SiteUI.fontStep(1); });
    header.querySelector('[data-v2-chapters]').addEventListener("click", function () { openDrawer(); });
    header.querySelector('[data-v2-menu]').addEventListener("click", function () {
      header.classList.toggle("nav-open");
    });
    refreshThemeBtn();
  }

  /* ---------- 课程抽屉 ---------- */
  function openDrawer() {
    var box = document.getElementById("v2-chapter-drawer");
    if (!box) return;
    box.classList.add("open");
    box.setAttribute("aria-hidden", "false");
    var first = box.querySelector("a, button");
    if (first) first.focus();
  }
  function closeDrawer() {
    var box = document.getElementById("v2-chapter-drawer");
    if (!box) return;
    box.classList.remove("open");
    box.setAttribute("aria-hidden", "true");
  }
  function buildDrawer() {
    var toc = window.COURSE_TOC || [];
    var specials = window.SPECIAL_PAGES || [];
    var html = '<div class="v2-drawer-panel" role="dialog" aria-modal="true" aria-label="课程目录">' +
      '<div class="v2-drawer-head"><span class="v2-kicker">COURSE INDEX</span>' +
      '<button type="button" class="v2-drawer-close" data-v2-drawer-close aria-label="关闭">' + icon("close") + "</button></div>" +
      '<div class="v2-drawer-grid">' +
      '<div class="v2-drawer-col"><h3>12 章主线</h3>';
    toc.forEach(function (c, i) {
      html += '<a class="v2-drawer-item" href="' + prefix + c.file + '">' +
        '<span class="v2-drawer-no">' + String(i + 1).padStart(2, "0") + "</span>" +
        '<span><b>' + esc(c.title) + "</b><small>" + esc(c.desc) + "</small></span></a>";
    });
    html += '</div><div class="v2-drawer-col"><h3>专题支线</h3>';
    specials.forEach(function (s) {
      if (!s.file) return;
      html += '<a class="v2-drawer-item" href="' + prefix + s.file + '">' +
        '<span class="v2-drawer-no">' + esc(s.id.slice(0, 2).toUpperCase()) + "</span>" +
        '<span><b>' + esc(s.title) + "</b><small>" + esc(s.desc) + "</small></span></a>";
    });
    html += '</div></div></div>';
    var box = document.createElement("div");
    box.id = "v2-chapter-drawer";
    box.className = "v2-drawer";
    box.setAttribute("aria-hidden", "true");
    box.innerHTML = html;
    document.body.appendChild(box);
    box.addEventListener("click", function (ev) {
      if (ev.target === box || ev.target.closest("[data-v2-drawer-close]")) closeDrawer();
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && box.classList.contains("open")) closeDrawer();
    });
  }

  /* ---------- 页脚 ---------- */
  function buildFooter() {
    var f = document.createElement("footer");
    f.className = "site-footer v2-footer";
    f.innerHTML =
      '<div class="v2-footer-inner">' +
        '<div><b>大学 C++ 离线助教 · v2</b><br><span class="small">纯本地静态页面，双击 index.html 即可使用，无需联网。</span></div>' +
        '<div class="small">示例输出为预置教学结果；真实编译请在本地使用 g++ / MSVC。<br>' +
        '<span class="copyright">© 2026 小椰子 · 保留所有权利</span></div>' +
      "</div>";
    document.body.appendChild(f);
  }

  /* ---------- 章节翻页 ---------- */
  function buildPager() {
    if (!inChapter) return;
    var toc = window.COURSE_TOC || [];
    var idx = -1;
    for (var i = 0; i < toc.length; i++) {
      if (toc[i].file && toc[i].file.split("/").pop() === here) { idx = i; break; }
    }
    if (idx === -1) return;
    var prev = toc[idx - 1], next = toc[idx + 1];
    var pager = document.createElement("nav");
    pager.className = "pager v2-pager";
    pager.setAttribute("aria-label", "章节翻页");
    pager.innerHTML =
      (prev ? '<a class="v2-pager-link" href="' + prefix + prev.file + '"><span class="v2-pager-dir">← 上一章</span><b>' + esc(prev.title) + "</b></a>" : '<span class="v2-pager-link is-empty"></span>') +
      '<a class="v2-pager-link v2-pager-index" href="' + prefix + 'index.html#v2-map"><span class="v2-pager-dir">返回</span><b>学习地图</b></a>' +
      (next ? '<a class="v2-pager-link" href="' + prefix + next.file + '"><span class="v2-pager-dir">下一章 →</span><b>' + esc(next.title) + "</b></a>" : '<span class="v2-pager-link is-empty"></span>');
    document.body.appendChild(pager);
  }

  function init() {
    buildHeader();
    buildDrawer();
    buildFooter();
    buildPager();
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onMq = function () { refreshThemeBtn(); };
      if (mq.addEventListener) mq.addEventListener("change", onMq);
      else if (mq.addListener) mq.addListener(onMq);
    }
    window.addEventListener("storage", function (e) {
      if (e.key === "cppcourse.theme") {
        if (window.SiteTheme) window.SiteTheme.apply();
        refreshThemeBtn();
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
