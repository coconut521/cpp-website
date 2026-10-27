/* ============================================================
 * v2-home.js —— 首页：学习地图 + 继续学习 + 弱项/错题入口
 * 依赖：COURSE_TOC、SPECIAL_PAGES、各 data 文件、v2-config
 * file:// 兼容。
 * ============================================================ */
(function () {
  "use strict";

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function icon(name) { return window.V2_ICONS && window.V2_ICONS[name] ? window.V2_ICONS[name] : ""; }
  function storeGet(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function toc() { return window.COURSE_TOC || []; }
  var SHORT = {
    ch01: "变量", ch02: "运算符", ch03: "控制流", ch04: "函数",
    ch05: "指针", ch06: "数组", ch07: "类", ch08: "继承",
    ch09: "移动语义", ch10: "模板 / STL", ch11: "异常", ch12: "Lambda"
  };
  function shortTitle(title, id) {
    if (id && SHORT[id]) return SHORT[id];
    return String(title || "").replace(/^第\s*\d+\s*章\s*/, "");
  }

  function progress() {
    var done = storeGet("cppcourse.progress", []);
    if (!Array.isArray(done)) done = [];
    return done;
  }
  function weakList() {
    var all = storeGet("cppcourse.mastery", {});
    if (!all || typeof all !== "object" || Array.isArray(all)) return [];
    return Object.keys(all).map(function (id) {
      var v = all[id];
      return v && v.s === "no" ? { id: id, text: v.t, ch: v.c, ct: v.ct } : null;
    }).filter(Boolean);
  }
  function lastVisit() {
    var last = storeGet("cppcourse.last", null);
    if (last && last.id) return last;
    return null;
  }

  /* ---------- 继续学习 ---------- */
  function renderContinue() {
    var box = $("#v2-continue");
    if (!box) return;
    var list = toc();
    var done = progress();
    var last = lastVisit();
    var current = null;
    if (last) {
      for (var i = 0; i < list.length; i++) if (list[i].id === last.id) current = list[i];
    }
    if (!current) {
      for (var j = 0; j < list.length; j++) {
        if (done.indexOf(list[j].id) === -1) { current = list[j]; break; }
      }
    }
    if (!current) current = list[list.length - 1] || null;
    var idx = current ? list.indexOf(current) : 0;
    var pct = list.length ? Math.round(done.length / list.length * 100) : 0;
    var weak = weakList();
    var next = null;
    if (current && idx < list.length - 1) next = list[idx + 1];

    box.innerHTML =
      '<div class="v2-continue-head"><span class="v2-kicker">PICK UP WHERE YOU LEFT OFF</span><span class="v2-continue-time">' + (last ? "上次打开" : "建议从这里开始") + "</span></div>" +
      '<div class="v2-continue-main">' +
        '<div class="v2-ring" style="--pct:' + pct + '"><span>' + pct + "<small>%</small></span></div>" +
        '<div class="v2-continue-copy">' +
          '<div class="v2-continue-no">CHAPTER ' + String(idx + 1).padStart(2, "0") + "</div>" +
          "<h2>" + esc(current ? current.title : "课程目录") + "</h2>" +
          '<p>' + esc(current ? current.desc : "从第一章开始。") + "</p>" +
          '<div class="v2-continue-actions">' +
            (current ? '<a class="v2-btn v2-btn-primary" href="' + esc(current.file) + '">继续学习 ' + icon("arrow") + "</a>" : "") +
            (next ? '<a class="v2-btn v2-btn-ghost" href="' + esc(next.file) + '">下一站：' + esc(shortTitle(next.title, next.id)) + "</a>" : "") +
          "</div>" +
        "</div>" +
      "</div>" +
      '<div class="v2-continue-foot">' +
        '<div><b>' + done.length + "</b><span>已学完</span></div>" +
        '<div><b>' + weak.length + "</b><span>弱项</span></div>" +
        '<div><b>' + list.length + "</b><span>章节</span></div>" +
        '<button type="button" class="v2-link-btn" data-v2-open-weak>查看弱项</button>' +
        '<button type="button" class="v2-link-btn" data-v2-reset-progress>重置进度</button>' +
      "</div>";
    var wb = box.querySelector("[data-v2-open-weak]");
    if (wb) wb.addEventListener("click", function () {
      var b = document.getElementById("weak-btn");
      if (b) b.click();
      else location.href = "index.html#v2-dashboard";
    });
    var reset = box.querySelector("[data-v2-reset-progress]");
    if (reset) reset.addEventListener("click", function () {
      if (!confirm("确定清除全部「已学完」标记吗？")) return;
      try { localStorage.removeItem("cppcourse.progress"); } catch (e) {}
      renderContinue();
      renderRoute();
    });
  }

  /* ---------- 学习地图 ---------- */
  function renderRoute() {
    var box = $("#v2-route");
    if (!box) return;
    var list = toc();
    var done = progress();
    var last = lastVisit();
    var currentId = last ? last.id : null;
    if (!currentId) {
      for (var i = 0; i < list.length; i++) {
        if (done.indexOf(list[i].id) === -1) { currentId = list[i].id; break; }
      }
    }
    var pct = list.length ? Math.min(100, done.length / list.length * 100) : 0;
    box.innerHTML =
      '<div class="v2-route-line"><span class="v2-route-fill" style="width:' + pct + '%"></span></div>' +
      '<div class="v2-route-stops">' +
      list.map(function (c, i) {
        var isDone = done.indexOf(c.id) !== -1;
        var isCurrent = c.id === currentId;
        return '<a class="v2-stop' + (isDone ? " done" : "") + (isCurrent ? " current" : "") + '" href="' + esc(c.file) + '" title="' + esc(c.desc) + '">' +
          '<span class="v2-stop-dot">' + (isDone ? icon("check") : String(i + 1).padStart(2, "0")) + "</span>" +
          '<span class="v2-stop-label">' + esc(shortTitle(c.title, c.id)) + "</span>" +
          '<span class="v2-stop-meta">' + (isDone ? "已学完" : (isCurrent ? "继续" : "未开始")) + "</span>" +
          "</a>";
      }).join("") +
      "</div>";
  }

  /* ---------- 专题支线 ---------- */
  function renderSpecials() {
    var box = $("#v2-specials");
    if (!box) return;
    var specials = (window.SPECIAL_PAGES || []).filter(function (s) { return s.file; });
    var icons = ["bug", "card", "grid", "mine"];
    box.innerHTML = specials.map(function (s, i) {
      return '<a class="v2-quest" href="' + esc(s.file) + '">' +
        '<div class="v2-quest-top"><span class="v2-quest-no">SIDE ' + String(i + 1).padStart(2, "0") + "</span>" +
          '<span class="v2-quest-icon">' + icon(icons[i] || "route") + "</span></div>" +
        "<h3>" + esc(s.title) + "</h3>" +
        "<p>" + esc(s.desc) + "</p>" +
        '<span class="v2-quest-arrow">进入支线 ' + icon("arrow") + "</span>" +
        "</a>";
    }).join("");
  }

  /* ---------- 弱项 / 错题 ---------- */
  function renderWeakPanel() {
    var box = $("#v2-weak");
    if (!box) return;
    var weak = weakList();
    var top = weak.slice(0, 4);
    box.innerHTML =
      '<div class="v2-panel-head"><span class="v2-kicker">WEAK POINTS</span><span class="v2-panel-count">' + weak.length + "</span></div>" +
      "<h3>弱项与错题入口</h3>" +
      (top.length ? '<ul class="v2-weak-list">' + top.map(function (w) {
        return '<li><a href="' + esc(chapterHref(w.ch)) + '">' + esc(w.text || "未命名知识点") + "</a><span>" + esc(w.ct || w.ch) + "</span></li>";
      }).join("") + "</ul>" : '<p class="v2-panel-empty">还没有标记「不会」。在各章学习目标或自测清单里点「不会」，这里会汇总。</p>') +
      '<div class="v2-panel-actions">' +
        '<button type="button" class="v2-btn v2-btn-small" data-v2-open-weak>打开不会清单</button>' +
        '<a class="v2-btn v2-btn-small v2-btn-ghost" href="exam-pitfalls.html">去易错雷区</a>' +
        '<a class="v2-btn v2-btn-small v2-btn-ghost" href="exam-pitfalls.html#bughunt">去找错案件板</a>' +
      "</div>";
    var b = box.querySelector("[data-v2-open-weak]");
    if (b) b.addEventListener("click", function () {
      var wb = document.getElementById("weak-btn");
      if (wb) wb.click();
    });
  }
  function chapterHref(id) {
    var list = toc();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].file;
    return "index.html#v2-map";
  }

  /* ---------- 最近更新 ---------- */
  function renderRecent() {
    var box = $("#v2-recent");
    if (!box) return;
    var list = (window.SITE_UPDATES || []).slice(0, 6);
    box.innerHTML =
      '<div class="v2-panel-head"><span class="v2-kicker">RECENT</span><span class="v2-panel-count">' + list.length + "</span></div>" +
      "<h3>最近更新</h3>" +
      '<p class="v2-panel-sub">网站功能、界面与体验</p>' +
      '<ul class="v2-update-list">' + list.map(function (u) {
        var href = u.hrefV2 || u.href || "index.html#v2-map";
        return '<li><div class="v2-update-meta"><span class="v2-update-date">' + esc(u.date) + '</span><span class="v2-update-tag">' + esc(u.tag) + "</span></div>" +
          '<a href="' + esc(href) + '">' + esc(u.title) + "</a>" +
          '<span class="v2-update-desc">' + esc(u.desc) + "</span></li>";
      }).join("") + "</ul>" +
      '<div class="v2-panel-actions"><a class="v2-btn v2-btn-small v2-btn-ghost" href="index.html#v2-map">查看学习地图</a></div>';
  }

  /* ---------- 统计 ---------- */
  function renderStats() {
    var box = $("#v2-stats");
    if (!box) return;
    var stats = [
      { n: toc().length, label: "章主线" },
      { n: (window.ERRORS_DATA || []).length, label: "条报错标本" },
      { n: (window.CHEATSHEETS_DATA || []).length, label: "张速查卡" },
      { n: (window.PITFALLS_DATA || []).length, label: "个易错雷区" }
    ];
    box.innerHTML = stats.map(function (s) {
      return '<div><b>' + s.n + "</b><span>" + s.label + "</span></div>";
    }).join("");
  }

  function init() {
    renderContinue();
    renderRoute();
    renderSpecials();
    renderWeakPanel();
    renderRecent();
    renderStats();
    var search = $("#v2-search");
    if (search) {
      search.innerHTML =
        '<div class="v2-panel-head"><span class="v2-kicker">SEARCH ALL</span><span class="v2-panel-count">Ctrl K</span></div>' +
        "<h3>全站搜索</h3>" +
        '<p class="v2-panel-empty">章节、报错原文、速查条目、易错点、术语，一次搜完。</p>' +
        '<button type="button" class="v2-search-big" data-v2-palette>' + icon("search") + '<span>搜索全站…</span><kbd>Ctrl K</kbd></button>';
    }
  }

  window.V2Home = { init: init };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
