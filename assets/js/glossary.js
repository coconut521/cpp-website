/* ============================================================
 * glossary.js —— 术语悬停解释
 * 暴露：window.Glossary
 * 数据：assets/js/glossary-data.js（window.GLOSSARY_DATA，字段见该文件头）
 * 行为：
 *   - 扫描 main 内的正文文本节点，把术语的首次出现包成
 *     <span class="term">（带 href 时包成 <a class="term">），
 *     悬停 / 聚焦弹出解释气泡，点击跳转对应章节。
 *   - 每个术语每页只标注一次，避免满屏虚线。
 *   - 代码块（pre/code）、链接、按钮、标题 h1、掌握标记等内部不标注；
 *     英文别名（UB / RAII / lambda…）按整词匹配，避免误伤 public 之类。
 *   - 长术语优先匹配：「纯虚函数」不会被拆成「虚函数」。
 * 说明：本脚本应最后加载（页面动态内容生成后再扫描）。
 * ============================================================ */
(function () {
  "use strict";

  var DATA = window.GLOSSARY_DATA || [];
  var SKIP_CLOSEST = "pre, code, kbd, a, button, h1, .term, .term-tip, .mk-chips, .bh-teacher-answer, [data-no-gloss]";

  /* ---------- 匹配表：术语与别名合并，长者优先 ---------- */
  var needles = [];
  DATA.forEach(function (g, gi) {
    var texts = [g.term].concat(g.aliases || []);
    texts.forEach(function (t) {
      if (t) needles.push({ text: String(t), gi: gi });
    });
  });
  needles.sort(function (a, b) { return b.text.length - a.text.length; });
  var placed = {};   /* 已标注术语 -> true（每页一次） */

  function isAlnum(c) { return /[A-Za-z0-9_]/.test(c); }

  /* 英文词需要整词匹配：前后不能还是字母数字 */
  function boundaryOk(text, start, len) {
    var matched = text.slice(start, start + len);
    var before = start > 0 ? text.charAt(start - 1) : "";
    var after = start + len < text.length ? text.charAt(start + len) : "";
    if (isAlnum(matched.charAt(0)) && isAlnum(before)) return false;
    if (isAlnum(matched.charAt(matched.length - 1)) && isAlnum(after)) return false;
    return true;
  }

  function overlaps(start, end, consumed) {
    for (var i = 0; i < consumed.length; i++) {
      if (start < consumed[i][1] && end > consumed[i][0]) return true;
    }
    return false;
  }

  /* ---------- 单个文本节点：找出并包裹本节点内的术语 ---------- */
  function wrapNode(node) {
    var text = node.data;
    var lower = text.toLowerCase();
    var found = [];
    var consumed = [];
    for (var i = 0; i < needles.length; i++) {
      var en = needles[i];
      var key = DATA[en.gi].term;
      if (placed[key]) continue;
      var nl = en.text.toLowerCase();
      var pos = 0;
      while ((pos = lower.indexOf(nl, pos)) !== -1) {
        var end = pos + nl.length;
        if (!overlaps(pos, end, consumed) && boundaryOk(lower, pos, nl.length)) {
          found.push({ start: pos, end: end, en: en });
          consumed.push([pos, end]);
          placed[key] = true;
          break;
        }
        pos = pos + 1;
      }
    }
    if (!found.length) return;
    found.sort(function (a, b) { return a.start - b.start; });

    var frag = document.createDocumentFragment();
    var last = 0;
    found.forEach(function (f) {
      if (f.start > last) frag.appendChild(document.createTextNode(text.slice(last, f.start)));
      var g = DATA[f.en.gi];
      var el = document.createElement(g.href ? "a" : "span");
      el.className = "term";
      el.setAttribute("data-glossary", String(f.en.gi));
      if (g.href) el.href = glossPrefix() + g.href;
      else el.tabIndex = 0;
      el.textContent = text.slice(f.start, f.end);
      frag.appendChild(el);
      last = f.end;
    });
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }

  /* ---------- 遍历正文文本节点 ---------- */
  function glossPrefix() {
    return /\/chapters\/[^/]*$/.test(decodeURIComponent(location.pathname)) ? "../" : "";
  }

  function scan(root) {
    if (!DATA.length) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var p = node.parentNode;
        if (!p || !node.data.trim()) return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest(SKIP_CLOSEST)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(wrapNode);
  }

  /* ---------- 气泡 ---------- */
  var tip = null;
  var hideTimer = null;

  function ensureTip() {
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "term-tip";
      tip.hidden = true;
      tip.setAttribute("role", "tooltip");
      document.body.appendChild(tip);
    }
    return tip;
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function showTip(el) {
    var g = DATA[+el.getAttribute("data-glossary")];
    if (!g) return;
    clearTimeout(hideTimer);
    var t = ensureTip();
    t.innerHTML =
      '<div class="tt-term">' + esc(g.term) + "</div>" +
      '<div class="tt-body">' + g.detail + "</div>" +
      (g.href ? '<div class="tt-more">点击查看章节讲解 →</div>' : "");
    t.hidden = false;
    /* 定位：术语下方居中，越界时上翻、贴边收拢 */
    var r = el.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var left = r.left + r.width / 2 - t.offsetWidth / 2;
    left = Math.max(8, Math.min(left, vw - t.offsetWidth - 8));
    var top = r.bottom + 8;
    if (top + t.offsetHeight > window.innerHeight - 8 && r.top - t.offsetHeight - 8 > 0) {
      top = r.top - t.offsetHeight - 8;
    }
    t.style.left = Math.round(left + window.scrollX) + "px";
    t.style.top = Math.round(top + window.scrollY) + "px";
  }

  function hideTip() {
    clearTimeout(hideTimer);
    if (tip) tip.hidden = true;
  }
  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideTip, 150);
  }

  /* ---------- 事件 ---------- */
  function bindEvents() {
    document.addEventListener("mouseover", function (ev) {
      var el = ev.target.closest ? ev.target.closest(".term") : null;
      if (el) showTip(el);
      else if (tip && !tip.hidden && !tip.contains(ev.target)) scheduleHide();
    });
    document.addEventListener("mouseout", function (ev) {
      if (ev.target.closest && ev.target.closest(".term")) scheduleHide();
    });
    document.addEventListener("focusin", function (ev) {
      var el = ev.target.closest ? ev.target.closest(".term") : null;
      if (el) showTip(el);
    });
    document.addEventListener("focusout", function (ev) {
      if (ev.target.closest && ev.target.closest(".term")) scheduleHide();
    });
    document.addEventListener("click", function (ev) {
      if (ev.target.closest && !ev.target.closest(".term") && !ev.target.closest(".term-tip")) hideTip();
    });
    window.addEventListener("scroll", hideTip, { passive: true });
    window.addEventListener("resize", hideTip);
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && tip && !tip.hidden && !document.body.classList.contains("present")) hideTip();
    });
  }

  /* ---------- 启动 ---------- */
  function init() {
    var main = document.querySelector("main.container");
    if (!main) return;
    scan(main);
    bindEvents();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.Glossary = {
    rescan: function (root) { scan(root || document.querySelector("main.container")); },
    hideTip: hideTip
  };
})();
