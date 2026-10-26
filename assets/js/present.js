/* ============================================================
 * present.js —— 投屏演示模式（课堂逐屏展示）
 * 暴露：window.Present
 * 进入：右上角「🖥 投屏」按钮 / 快捷键 Ctrl+Alt+P / 地址栏 ?present=1
 * 退出：Esc / HUD「✖ 退出」/ 再次 Ctrl+Alt+P
 * 翻页：← → ↑ ↓ PageUp PageDown 空格 Home End（焦点在输入框时不拦截）
 * 原理：进入时把 main.container 的直接子元素按小节边界
 *       （h2 或 .section-head）分组为"屏"，给元素打上 data-pslide /
 *       .p-cur 标记，用 CSS 逐屏显示——不移动、不克隆任何 DOM。
 * 全屏：按钮进入时尝试全屏（需要用户手势，失败自动退回普通投屏）。
 * 字号：进入时整体放大 1.15 倍，退出恢复原字号。
 * ============================================================ */
(function () {
  "use strict";

  var SCALE = 1.15;
  var slides = [];          // 每屏一个元素数组
  var cur = 0;
  var prevFont = "";
  var fsRequested = false;
  var numEl = null;

  /* ---------- 分屏 ---------- */
  function isBoundary(el) {
    if (el.tagName === "H2") return true;
    return !!(el.classList && el.classList.contains("section-head"));
  }

  function collect() {
    var main = document.querySelector("main.container");
    if (!main) return [];
    var groups = [];
    var group = [];
    Array.prototype.forEach.call(main.children, function (el) {
      if (el.tagName === "SCRIPT" || el.hasAttribute("hidden")) return;
      if (isBoundary(el) && group.length) { groups.push(group); group = []; }
      group.push(el);
    });
    if (group.length) groups.push(group);
    return groups;
  }

  function applyMarks() {
    var main = document.querySelector("main.container");
    if (!main) return;
    Array.prototype.forEach.call(main.children, function (el) {
      el.removeAttribute("data-pslide");
      el.classList.remove("p-cur");
    });
    slides.forEach(function (group, gi) {
      group.forEach(function (el) {
        el.setAttribute("data-pslide", String(gi));
        if (gi === cur) el.classList.add("p-cur");
      });
    });
  }

  function show() {
    applyMarks();
    if (numEl) numEl.textContent = "第 " + (cur + 1) + " / " + slides.length + " 屏";
    window.scrollTo(0, 0);
  }

  function go(delta, abs) {
    if (!slides.length) return;
    cur = (typeof abs === "number") ? abs : cur + delta;
    cur = Math.max(0, Math.min(slides.length - 1, cur));
    show();
  }

  /* ---------- 进入 / 退出 ---------- */
  function enter(tryFullscreen) {
    if (document.body.classList.contains("present")) return;
    slides = collect();
    if (!slides.length) return;
    /* 收起可能遮挡画面的浮层 */
    document.querySelectorAll(".weak-panel.open, .teacher-panel.open").forEach(function (p) {
      p.classList.remove("open");
    });
    prevFont = document.documentElement.style.fontSize;
    var base = parseFloat(prevFont) / 16 || 1;
    document.documentElement.style.fontSize = (16 * base * SCALE) + "px";
    document.body.classList.add("present");
    cur = 0;
    show();
    if (tryFullscreen && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen()
        .then(function () { fsRequested = true; })
        .catch(function () { fsRequested = false; });
    }
  }

  function exit() {
    if (!document.body.classList.contains("present")) return;
    document.body.classList.remove("present");
    var main = document.querySelector("main.container");
    if (main) {
      Array.prototype.forEach.call(main.children, function (el) {
        el.removeAttribute("data-pslide");
        el.classList.remove("p-cur");
      });
    }
    document.documentElement.style.fontSize = prevFont;
    slides = [];
    cur = 0;
    if (fsRequested && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
    fsRequested = false;
  }

  function toggle(tryFullscreen) {
    if (document.body.classList.contains("present")) exit();
    else enter(tryFullscreen);
  }

  /* ---------- HUD ---------- */
  function buildHud() {
    var hud = document.createElement("div");
    hud.className = "present-hud";
    hud.innerHTML =
      '<button class="btn btn-small" data-ph="prev" title="上一屏（←）">⬅</button>' +
      '<span class="ph-num"></span>' +
      '<button class="btn btn-small" data-ph="next" title="下一屏（→ / 空格）">➡</button>' +
      '<button class="btn btn-small" data-ph="fs" title="进入 / 退出全屏">⛶</button>' +
      '<button class="btn btn-small" data-ph="exit" title="退出投屏（Esc）">✖ 退出</button>';
    hud.addEventListener("click", function (ev) {
      var b = ev.target.closest ? ev.target.closest("[data-ph]") : null;
      if (!b) return;
      var act = b.getAttribute("data-ph");
      if (act === "prev") go(-1);
      else if (act === "next") go(1);
      else if (act === "fs") {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(function () {});
          fsRequested = false;
        } else if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen()
            .then(function () { fsRequested = true; })
            .catch(function () {});
        }
      } else if (act === "exit") exit();
    });
    document.body.appendChild(hud);
    numEl = hud.querySelector(".ph-num");
  }

  /* ---------- 顶栏按钮 ---------- */
  function injectBtn() {
    var actions = document.querySelector(".site-header .header-actions");
    if (!actions || document.querySelector("[data-role=present-btn]")) return;
    var btn = document.createElement("button");
    btn.className = "icon-btn";
    btn.setAttribute("data-role", "present-btn");
    btn.title = "投屏演示模式：把本页逐屏投影到课堂（Ctrl+Alt+P）";
    btn.textContent = "🖥 投屏";
    btn.addEventListener("click", function () { enter(true); });
    actions.appendChild(btn);
  }

  /* ---------- 键盘 ---------- */
  document.addEventListener("keydown", function (ev) {
    if (ev.ctrlKey && ev.altKey && (ev.key === "p" || ev.key === "P")) {
      ev.preventDefault();
      toggle(true);
      return;
    }
    if (!document.body.classList.contains("present")) return;
    var t = ev.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
    var handled = true;
    switch (ev.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
      case " ":
        go(1); break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
        go(-1); break;
      case "Home": go(0, 0); break;
      case "End": go(0, slides.length - 1); break;
      case "Escape":
        /* Esc 一律彻底退出投屏（全屏由浏览器一并退出），避免"以为已退出
           实际还在投屏"的困惑 */
        exit(); break;
      default: handled = false;
    }
    if (handled) ev.preventDefault();
  });

  function init() {
    buildHud();
    injectBtn();
    var q = new URLSearchParams(location.search).get("present");
    if (q === "1") enter(false);   /* 无用户手势，不尝试全屏 */
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  /* 从往返缓存（前进/后退）恢复的页面可能残留投屏状态：
     非 ?present=1 进入的一律自动复位，保证普通浏览回到原始宽度 */
  window.addEventListener("pageshow", function (ev) {
    if (!ev.persisted) return;
    var viaUrl = new URLSearchParams(location.search).get("present") === "1";
    if (!viaUrl && document.body.classList.contains("present")) exit();
  });

  window.Present = {
    enter: function (fs) { enter(fs !== false); },
    exit: exit,
    toggle: function (fs) { toggle(fs !== false); }
  };
})();
