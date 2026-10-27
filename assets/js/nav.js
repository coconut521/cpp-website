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

  /* ---------- 主题（三态：light / dark / auto 跟随系统）与字号 ----------
   * 判定逻辑的唯一来源是 theme-init.js（head 内同步加载，暴露 window.SiteTheme）；
   * 此处只负责循环切换与按钮文案。 */
  var THEME_ORDER = ["light", "dark", "auto"];
  var THEME_LABEL = { light: "☀️ 亮色", dark: "🌙 暗色", auto: "💻 跟随系统" };
  function applyFont(scale) {
    document.documentElement.style.fontSize = (16 * scale) + "px";
  }
  function storedTheme() {
    return window.SiteTheme ? window.SiteTheme.stored() : "light";
  }
  function nextTheme(mode) {
    return THEME_ORDER[(THEME_ORDER.indexOf(mode) + 1) % THEME_ORDER.length];
  }
  function refreshThemeBtn() {
    var btn = document.querySelector("[data-role=theme-btn]");
    if (!btn) return;
    var mode = storedTheme();
    var eff = window.SiteTheme ? window.SiteTheme.effective(mode) : "light";
    btn.textContent = THEME_LABEL[mode];
    btn.title = mode === "auto"
      ? "跟随系统深浅色（当前为" + (eff === "dark" ? "暗色" : "亮色") + "）；点击切换到 ☀️ 亮色"
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

    var html =
      '<div class="header-inner">' +
      '<a class="brand" href="' + prefix + 'index.html"><span class="logo">C++</span>大学 C++ 离线助教</a>' +
      '<nav class="header-nav">' + nav + '</nav>' +
      '<div class="header-actions">' +
      '<button class="icon-btn" data-role="font-minus" title="减小字号">A－</button>' +
      '<button class="icon-btn" data-role="font-plus" title="增大字号">A＋</button>' +
      '<button class="icon-btn" data-role="theme-btn"></button>' +
      '</div></div>';

    var header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML = html;
    document.body.insertBefore(header, document.body.firstChild);

    header.querySelector('[data-role=theme-btn]').addEventListener("click", window.SiteUI.toggleTheme);
    header.querySelector('[data-role=font-minus]').addEventListener("click", function () { window.SiteUI.fontStep(-1); });
    header.querySelector('[data-role=font-plus]').addEventListener("click", function () { window.SiteUI.fontStep(1); });
    refreshThemeBtn();
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

  /* ---------- v2 测试版提示 ---------- */
  function buildV2Banner() {
    var dismissed = false;
    try { dismissed = localStorage.getItem("cppcourse.v2banner") === "1"; } catch (e) {}
    if (dismissed) return;
    var bannerPrefix = /\/chapters\/[^/]*$/.test(path) || /\/templates\/[^/]*$/.test(path) ? "../" : "";
    var banner = document.createElement("div");
    banner.className = "v2-test-banner";
    banner.setAttribute("role", "status");
    banner.innerHTML =
      '<span class="v2-test-label">🧪 v2 测试版</span>' +
      '<span class="v2-test-text">界面重构、学习地图与实验台动画已上线。</span>' +
      '<a class="v2-test-link" href="' + bannerPrefix + 'v2/index.html" target="_blank" rel="noopener">打开 v2 体验 →</a>' +
      '<button class="v2-test-close" type="button" aria-label="关闭 v2 提示">×</button>';
    document.body.insertBefore(banner, document.body.firstChild);
    banner.querySelector(".v2-test-close").addEventListener("click", function () {
      try { localStorage.setItem("cppcourse.v2banner", "1"); } catch (e) {}
      banner.remove();
    });
  }

  function init() {
    buildHeader();
    buildV2Banner();
    buildFooter();
    buildPager();
    /* 系统深浅色切换时（跟随系统模式）同步按钮文案 */
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onMq = function () { refreshThemeBtn(); };
      if (mq.addEventListener) mq.addEventListener("change", onMq);
      else if (mq.addListener) mq.addListener(onMq);
    }
    /* 其他标签页改了主题时同步 */
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
