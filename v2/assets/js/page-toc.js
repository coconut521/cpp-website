/* ============================================================
 * page-toc.js —— 悬浮页内目录
 * 暴露：window.PageToc
 * 行为：
 *   - 收集 main.container 里的 h2 小节标题（无 id 自动补 ptoc-N），
 *     在窗口左缘显示一枚竖排「目录」小按钮，点开为可滚动的目录面板。
 *   - 点击条目平滑滚动到对应小节；页面滚动时高亮当前小节（scrollspy）。
 *   - 小节不足 3 个、窗口窄于 1200px、投屏模式、打印时不显示。
 * 说明：请在页面脚本最后加载（动态内容生成后再收集标题）。
 * ============================================================ */
(function () {
  "use strict";

  var MIN_SECTIONS = 3;
  var SpyOffset = 120;        /* 顶栏高度 + 余量：标题越过此线即视为"已读到" */

  var box = null, panel = null, listEl = null;
  var headings = [], links = [];

  function collect() {
    var main = document.querySelector("main.container");
    if (!main) return;
    headings = Array.prototype.slice.call(main.querySelectorAll("h2")).filter(function (h) {
      return h.getClientRects().length > 0;   /* 排除隐藏小节（如折叠面板内的标题） */
    });
    headings.forEach(function (h, i) {
      if (!h.id) h.id = "ptoc-" + (i + 1);
    });
  }

  function build() {
    box = document.createElement("nav");
    box.className = "page-toc";
    box.setAttribute("aria-label", "本页目录");

    var tab = document.createElement("button");
    tab.className = "page-toc-tab";
    tab.type = "button";
    tab.textContent = "目录";
    tab.title = "展开 / 收起本页目录";

    panel = document.createElement("div");
    panel.className = "page-toc-panel";
    panel.innerHTML = '<div class="pt-title">📑 本页目录</div>';
    listEl = document.createElement("div");
    listEl.className = "pt-list";
    headings.forEach(function (h, i) {
      var a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent.replace(/\s+/g, " ").trim();
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        h.scrollIntoView({ behavior: "smooth", block: "start" });
        setActive(i);
        box.classList.remove("open");
      });
      links.push(a);
      listEl.appendChild(a);
    });
    panel.appendChild(listEl);

    tab.addEventListener("click", function () {
      box.classList.toggle("open");
      if (box.classList.contains("open")) spy();
    });
    box.appendChild(tab);
    box.appendChild(panel);
    document.body.appendChild(box);
  }

  function setActive(i) {
    links.forEach(function (a, k) { a.classList.toggle("cur", k === i); });
  }

  /* ---------- scrollspy：滚动时高亮当前小节 ---------- */
  function spy() {
    if (!headings.length) return;
    var cur = -1;
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].getBoundingClientRect().top <= SpyOffset) cur = i;
      else break;
    }
    /* 滚到底时强制点亮最后一节，避免末尾小节永远无法高亮 */
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      cur = headings.length - 1;
    }
    setActive(cur);
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { spy(); ticking = false; });
  }, { passive: true });

  /* ---------- 显示条件：小节数量 / 窗口宽度 / 投屏模式 ---------- */
  function refresh() {
    if (!box) return;
    var show = headings.length >= MIN_SECTIONS
      && window.innerWidth >= 1200
      && !document.body.classList.contains("present")
      && !document.body.classList.contains("v2-chapter")
      && !document.body.classList.contains("v2-special");
    box.classList.toggle("ready", show);
    if (!show) box.classList.remove("open");
  }
  window.addEventListener("resize", refresh);
  new MutationObserver(refresh).observe(document.body, { attributes: true, attributeFilter: ["class"] });

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && box && box.classList.contains("open")
        && !document.body.classList.contains("present")) {
      box.classList.remove("open");
    }
  });

  function init() {
    collect();
    if (headings.length < MIN_SECTIONS) return;
    build();
    refresh();
    spy();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.PageToc = {
    refresh: refresh,
    spy: spy
  };
})();
