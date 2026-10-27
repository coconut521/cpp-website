/* ============================================================
 * v2-core.js —— v2 页面骨架与共享交互
 *   - 章节：封面 / 正文 + 边注实验台 / Listing 工具栏 / 阅读进度
 *   - 专题：标本墙 / 卡盒 / 雷区 / 赛道 / 案件板
 *   - 全站：Ctrl+K 命令面板、课程抽屉联动、最近学习记录
 * 依赖：toc.js、v2-config.js、普通 DOM；file:// 兼容。
 * ============================================================ */
(function () {
  "use strict";

  var PATH = decodeURIComponent(location.pathname);
  var PREFIX = /\/chapters\/[^/]*$/.test(PATH) ? "../" : "";
  var HERE = PATH.split("/").pop() || "index.html";
  var CHAPTER_FILE = PATH.match(/\/chapters\/([^/]+)\.html$/);
  var CHAPTER_ID = CHAPTER_FILE ? CHAPTER_FILE[1].slice(0, 4) : null;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function storeGet(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function storeSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function icon(name) { return window.V2_ICONS && window.V2_ICONS[name] ? window.V2_ICONS[name] : ""; }
  function toc() { return window.COURSE_TOC || []; }
  function tocById(id) {
    var list = toc();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function chapterIndex(id) {
    var list = toc();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return i;
    return -1;
  }
  function pageTitle() { return document.title.split("|")[0].trim(); }
  function config() { return window.V2_CONFIG || { chapters: {}, specials: {} }; }

  /* ============================================================
   * 1. 章节页：封面
   * ============================================================ */
  function buildCover(main, cfg) {
    var h1 = $("header h1", main) || $("h1", main);
    if (!h1) return null;
    var header = h1.closest("header");
    var lede = header ? $("p", header) : null;
    var objectives = $("section.objectives", main);
    var chapterNo = CHAPTER_ID ? parseInt(CHAPTER_ID.slice(2), 10) : 1;
    var tocItem = tocById(CHAPTER_ID);
    var title = h1.textContent.trim();
    var textLen = main.textContent.replace(/\s+/g, " ").length;
    var minutes = Math.max(4, Math.round(textLen / 420));
    var cards = $$("pre.ex-code", main).length;
    var steps = $$(".ex-steps", main).length;
    var prev = chapterIndex(CHAPTER_ID) > 0 ? toc()[chapterIndex(CHAPTER_ID) - 1] : null;
    var next = chapterIndex(CHAPTER_ID) >= 0 && chapterIndex(CHAPTER_ID) < toc().length - 1 ? toc()[chapterIndex(CHAPTER_ID) + 1] : null;

    var cover = document.createElement("section");
    cover.className = "v2-cover";
    cover.id = "v2-cover";
    cover.innerHTML =
      '<div class="v2-cover-kicker"><span>CHAPTER ' + String(chapterNo).padStart(2, "0") + "</span><span class=\"v2-cover-rule\"></span><span>" + esc(cfg.label || "") + "</span></div>" +
      '<div class="v2-cover-grid">' +
        '<div class="v2-cover-number" aria-hidden="true">' + String(chapterNo).padStart(2, "0") + "</div>" +
        '<div class="v2-cover-copy">' +
          "<h1>" + esc(title) + "</h1>" +
          '<p class="v2-cover-lede">' + (lede ? lede.innerHTML : (tocItem ? esc(tocItem.desc) : "")) + "</p>" +
          '<div class="v2-cover-meta">' +
            '<span>' + icon("book") + "约 " + minutes + " 分钟</span>" +
            '<span>' + icon("code") + cards + " 个 Listing</span>" +
            '<span>' + icon("timeline") + steps + " 组分步</span>" +
            '<span>' + icon("route") + "第 " + (chapterIndex(CHAPTER_ID) + 1) + " / " + toc().length + " 站</span>" +
          "</div>" +
          '<div class="v2-cover-actions">' +
            '<a class="v2-btn v2-btn-primary" href="#v2-start">开始阅读 ' + icon("arrow") + "</a>" +
            '<button class="v2-btn" type="button" data-v2-jump-lab>' + icon("spark") + "打开实验台</button>" +
            '<button class="v2-btn v2-btn-ghost" type="button" data-v2-print>' + icon("print") + "打印 / PDF</button>" +
            '<button class="v2-btn v2-btn-ghost" type="button" data-v2-done>' + icon("check") + "<span>标记已学完</span></button>" +
          "</div>" +
          '<div class="v2-cover-pager">' +
            (prev ? '<a href="' + PREFIX + prev.file + '">← ' + esc(prev.title) + "</a>" : "<span></span>") +
            (next ? '<a href="' + PREFIX + next.file + '">' + esc(next.title) + " →</a>" : "<span></span>") +
          "</div>" +
        "</div>" +
      "</div>";

    if (objectives) {
      objectives.classList.add("v2-cover-objectives");
      var objBox = document.createElement("div");
      objBox.className = "v2-cover-objectives-wrap";
      objBox.innerHTML = '<div class="v2-cover-obj-head"><span class="v2-kicker">LEARNING OBJECTIVES</span><span class="v2-cover-obj-hint">学完本章，你能够</span></div>';
      objBox.appendChild(objectives);
      cover.appendChild(objBox);
    }

    if (header) header.remove();
    var crumbs = $("p.crumbs", main);
    if (crumbs) crumbs.remove();
    main.insertBefore(cover, main.firstChild);
    cover.querySelector("[data-v2-print]").addEventListener("click", function () { window.print(); });
    cover.querySelector("[data-v2-jump-lab]").addEventListener("click", function () {
      var target = $(".v2-inspector") || $("[data-v2-lab-anchor]") || $(".example-card");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    initDoneButton(cover.querySelector("[data-v2-done]"));
    return cover;
  }

  function initDoneButton(btn) {
    if (!btn || !CHAPTER_ID) return;
    function isDone() {
      var list = storeGet("cppcourse.progress", []);
      return Array.isArray(list) && list.indexOf(CHAPTER_ID) !== -1;
    }
    function sync() {
      var on = isDone();
      btn.classList.toggle("is-done", on);
      var span = btn.querySelector("span") || btn;
      span.textContent = on ? "已学完" : "标记已学完";
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
    btn.addEventListener("click", function () {
      var list = storeGet("cppcourse.progress", []);
      if (!Array.isArray(list)) list = [];
      var i = list.indexOf(CHAPTER_ID);
      if (i === -1) list.push(CHAPTER_ID); else list.splice(i, 1);
      storeSet("cppcourse.progress", list);
      sync();
      document.dispatchEvent(new CustomEvent("v2-progress-changed"));
    });
    sync();
  }

  /* ============================================================
   * 2. 章节页：边注 / 实验台
   * ============================================================ */
  function buildRail(main, cfg, cover) {
    var allH2 = $$("h2", main);
    var sectionH2 = allH2.filter(function (h) { return !h.closest(".v2-cover"); });
    sectionH2.forEach(function (h, i) {
      if (!h.id) h.id = "v2-sec-" + (i + 1);
      h.setAttribute("data-v2-sec", String(i + 1).padStart(2, "0"));
    });

    var notes = (cfg.notes || []).filter(function (n) {
      var target = allH2[n.section];
      return target && !target.closest(".v2-cover");
    });

    var rail = document.createElement("div");
    rail.className = "v2-rail";
    rail.setAttribute("aria-label", "边注与实验台");
    rail.innerHTML =
      '<div class="v2-rail-inner">' +
        '<div class="v2-rail-head"><span class="v2-kicker">MARGIN / LAB</span><span class="v2-rail-dot"></span></div>' +
        '<div class="v2-rail-lab" data-v2-lab-card>' +
          '<div class="v2-rail-lab-q">' + (cfg.demo ? esc(cfg.demo.question) : "本章以逐行执行器为主：打开任一示例的「逐步执行」，看变量和输出。") + "</div>" +
          '<div class="v2-rail-lab-meta">' + (cfg.demo ? engineLabel(cfg.demo.engine) : "STEPPER") + "</div>" +
          '<button class="v2-rail-lab-btn" type="button" data-v2-jump-lab>' + icon("spark") + "跳到本章实验台</button>" +
        "</div>" +
        '<nav class="v2-rail-toc" aria-label="本页小节"><div class="v2-rail-title">' + icon("route") + "本页路线</div>" +
          sectionH2.map(function (h, i) {
            return '<a href="#' + h.id + '" data-v2-toc="' + i + '"><span>' + String(i + 1).padStart(2, "0") + "</span>" + esc(h.textContent.replace(/^\d+\.\s*/, "")) + "</a>";
          }).join("") +
        "</nav>" +
        '<div class="v2-rail-notes"><div class="v2-rail-title">' + icon("card") + "边注</div>" +
          (notes.length ? notes.map(function (n, i) {
            return '<div class="v2-rail-note" data-v2-note="' + i + '">' +
              '<div class="v2-rail-note-kicker">' + esc(n.kicker) + "</div>" +
              "<b>" + esc(n.title) + "</b><p>" + n.body + "</p></div>";
          }).join("") : '<p class="v2-rail-empty">本章的边注正在整理。先看右侧的路线和实验台。</p>') +
        "</div>" +
        '<div class="v2-rail-tools">' +
          '<button type="button" data-v2-print>' + icon("print") + "打印</button>" +
          '<button type="button" data-v2-present>' + icon("play") + "投屏</button>" +
          '<button type="button" data-v2-weak>' + icon("mine") + "弱项</button>" +
          '<button type="button" data-v2-palette>' + icon("search") + "搜索</button>" +
          '<a href="#v2-cover">↑ 回到封面</a>' +
        "</div>" +
      "</div>";

    if (cover && cover.nextSibling) main.insertBefore(rail, cover.nextSibling);
    else main.appendChild(rail);

    rail.querySelector("[data-v2-jump-lab]").addEventListener("click", function () {
      var target = $(".v2-inspector") || $(".example-card");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    rail.querySelector("[data-v2-print]").addEventListener("click", function () { window.print(); });
    rail.querySelector("[data-v2-present]").addEventListener("click", function () {
      if (window.Present && window.Present.enter) window.Present.enter(true);
      else document.dispatchEvent(new KeyboardEvent("keydown", { key: "P", ctrlKey: true, altKey: true }));
    });
    rail.querySelector("[data-v2-weak]").addEventListener("click", function () {
      if (window.Mastery && window.Mastery.open) window.Mastery.open();
      else {
        var b = document.getElementById("weak-btn");
        if (b) b.click();
      }
    });
    rail.querySelector("[data-v2-palette]").addEventListener("click", function () { openPalette(); });

    /* 边注点击 → 对应小节 */
    rail.querySelectorAll(".v2-rail-note").forEach(function (el) {
      el.addEventListener("click", function () {
        var n = notes[parseInt(el.getAttribute("data-v2-note"), 10)];
        var target = n ? allH2[n.section] : null;
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    initSpy(rail, sectionH2, notes, allH2);
    return rail;
  }

  function engineLabel(kind) {
    return ({ memory: "MEMORY", stack: "CALL STACK", timeline: "TIMELINE", scene: "SCENE", grid: "GRID", bars: "BARS" })[kind] || "LAB";
  }

  function initSpy(rail, sectionH2, notes, allH2) {
    var links = $$(".v2-rail-toc a", rail);
    var noteEls = $$(".v2-rail-note", rail);
    var noteBySection = {};
    notes.forEach(function (n, i) {
      var target = allH2[n.section];
      var idx = target ? sectionH2.indexOf(target) : -1;
      if (idx >= 0) noteBySection[idx] = i;
    });
    var ticking = false;

    function update() {
      var cur = -1;
      for (var i = 0; i < sectionH2.length; i++) {
        if (sectionH2[i].getBoundingClientRect().top <= 140) cur = i;
        else break;
      }
      links.forEach(function (a, i) { a.classList.toggle("cur", i === cur); });
      var noteIdx = cur >= 0 && noteBySection[cur] != null ? noteBySection[cur] : -1;
      noteEls.forEach(function (el, i) {
        el.classList.toggle("cur", i === noteIdx);
        el.classList.toggle("dim", noteIdx !== -1 && i !== noteIdx);
      });
      var current = cur >= 0 ? sectionH2[cur] : null;
      var lab = rail.querySelector("[data-v2-lab-card]");
      if (lab) lab.classList.toggle("is-stuck", !!current);
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { update(); ticking = false; });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ============================================================
   * 3. 章节页：Listing 工具栏 + 输出终端
   * ============================================================ */
  function upgradeListings(main, label) {
    var chapterNo = CHAPTER_ID ? parseInt(CHAPTER_ID.slice(2), 10) : 1;
    var prefix = label || String(chapterNo).padStart(2, "0");
    $$(".example-card", main).forEach(function (card, i) {
      if (card.getAttribute("data-v2-listing") === "1") return;
      var pre = $("pre.ex-code", card);
      if (!pre) return;
      card.setAttribute("data-v2-listing", "1");
      var code = $("code", pre);
      var raw = code ? (code.getAttribute("data-raw") || code.textContent) : "";
      var lines = raw ? raw.split(/\n/).length : 0;
      var listing = document.createElement("div");
      listing.className = "v2-listing";
      listing.innerHTML =
        '<div class="v2-listing-head">' +
          '<div class="v2-listing-id">LISTING ' + prefix + "." + (i + 1) + "</div>" +
          '<div class="v2-listing-file">main.cpp</div>' +
          '<div class="v2-listing-meta">' + lines + " 行 · C++17</div>" +
          '<div class="v2-listing-tools"></div>' +
        "</div>" +
        '<div class="v2-listing-body"></div>';
      pre.parentNode.insertBefore(listing, pre);
      listing.querySelector(".v2-listing-body").appendChild(pre);

      var btns = $(".ex-btns", card);
      if (btns) {
        btns.classList.add("v2-listing-toolbar");
        var tools = listing.querySelector(".v2-listing-tools");
        tools.appendChild(btns);
      }

      var out = $(".ex-output", card);
      if (out) {
        out.classList.add("v2-terminal");
        var bar = document.createElement("div");
        bar.className = "v2-terminal-bar";
        bar.innerHTML = '<span class="v2-terminal-dots"><i></i><i></i><i></i></span><span class="v2-terminal-label">OUTPUT / 预期输出</span>';
        out.insertBefore(bar, out.firstChild);
        listing.appendChild(out);
      }
    });
  }

  /* ============================================================
   * 4. 章节页：阅读进度 + 最近学习
   * ============================================================ */
  function initProgressRibbon() {
    var bar = document.createElement("div");
    bar.className = "v2-reading-progress";
    bar.innerHTML = '<span></span>';
    document.body.appendChild(bar);
    var fill = bar.querySelector("span");
    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      fill.style.transform = "scaleX(" + pct + ")";
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function rememberVisit(cfg) {
    if (!CHAPTER_ID) return;
    var item = tocById(CHAPTER_ID);
    if (!item) return;
    storeSet("cppcourse.last", { id: CHAPTER_ID, title: item.title, file: item.file, ts: Date.now() });
  }

  /* ============================================================
   * 5. 专题页隐喻
   * ============================================================ */
  function specialHead(key, count) {
    var info = config().specials[key] || {};
    var el = document.createElement("section");
    el.className = "v2-special-head";
    el.innerHTML =
      '<div class="v2-special-kicker">' + esc(info.kicker || "SPECIAL") + "</div>" +
      '<div class="v2-special-title-row"><h1>' + esc(info.title || pageTitle()) + '</h1><span class="v2-special-stamp">' + (count != null ? count : "—") + " 件</span></div>" +
      '<p class="v2-special-lead">' + esc(info.lead || "") + "</p>";
    return el;
  }

  function insertSpecialHead(main, key, count) {
    var oldHeader = $("header", main);
    var head = specialHead(key, count);
    if (oldHeader) {
      oldHeader.parentNode.insertBefore(head, oldHeader);
      oldHeader.remove();
    } else {
      main.insertBefore(head, main.firstChild);
    }
    var crumbs = $("p.crumbs", main);
    if (crumbs) crumbs.remove();
    return head;
  }

  function initErrorsPage(main) {
    var data = window.ERRORS_DATA || [];
    insertSpecialHead(main, "errors", data.length);
    var list = document.getElementById("list");
    if (list) {
      list.classList.add("v2-specimen-wall");
      function markSpecimens() {
        $$(".error-item", list).forEach(function (el, i) {
          if (el.getAttribute("data-v2-specimen") === "1") return;
          el.setAttribute("data-v2-specimen", "1");
          var head = $(".err-head", el);
          if (head && !$(".v2-specimen-no", head)) {
            var no = document.createElement("span");
            no.className = "v2-specimen-no";
            no.textContent = "E-" + String(i + 1).padStart(3, "0");
            head.insertBefore(no, head.firstChild);
          }
        });
      }
      markSpecimens();
      var obs = new MutationObserver(markSpecimens);
      obs.observe(list, { childList: true });
    }
  }

  function wrapTables(root) {
    $$("table.data-table, table.sheet-table", root).forEach(function (t) {
      if (t.parentNode && t.parentNode.classList && t.parentNode.classList.contains("v2-table-wrap")) return;
      var wrap = document.createElement("div");
      wrap.className = "v2-table-wrap";
      t.parentNode.insertBefore(wrap, t);
      wrap.appendChild(t);
    });
  }

  function initCheatsheetsPage(main) {
    var data = window.CHEATSHEETS_DATA || [];
    insertSpecialHead(main, "cheatsheets", data.length);
    var list = document.getElementById("list");
    if (list) {
      list.classList.add("v2-card-box");
      wrapTables(list);
      new MutationObserver(function () { wrapTables(list); }).observe(list, { childList: true, subtree: true });
    }
    var filter = $(".filter-bar");
    if (filter) filter.classList.add("v2-card-catalog");
  }

  function initPitfallsPage(main) {
    var data = window.PITFALLS_DATA || [];
    insertSpecialHead(main, "exam-pitfalls", data.length);
    var list = document.getElementById("list");
    if (list) list.classList.add("v2-minefield");
    var bh = document.getElementById("bughunt");
    if (bh) {
      bh.classList.add("v2-case-board");
      var h2 = $("h2", bh);
      if (h2) h2.textContent = "找错案件板";
      var list = document.getElementById("list");
      if (list && list.parentNode) list.parentNode.insertBefore(bh, list.nextSibling);
    }
    var practice = document.getElementById("practice");
    if (practice) practice.classList.add("v2-practice");
  }

  function initSortingPage(main) {
    var data = window.SORTING_DATA || [];
    var head = insertSpecialHead(main, "sorting", data.length || 7);
    upgradeListings(main, "SORT");
    wrapTables(main);
    var intro = head || $("p.crumbs");
    var race = document.createElement("section");
    race.className = "v2-race";
    race.innerHTML =
      '<div class="v2-race-head"><span class="v2-kicker">STARTING GRID</span>' +
      '<h2>七条赛道，同一组数据</h2>' +
      '<p>每条赛道通往一个算法；复杂度是赛制，稳定性是规则。点击赛道进入对应示例。</p></div>' +
      '<div class="v2-race-lanes"></div>';
    var lanes = race.querySelector(".v2-race-lanes");
    var rows = [
      { id: "sort-ex-01", no: "01", name: "冒泡", best: "O(n)", avg: "O(n²)", stable: true, tone: "slow" },
      { id: "sort-ex-02", no: "02", name: "选择", best: "O(n²)", avg: "O(n²)", stable: false, tone: "slow" },
      { id: "sort-ex-03", no: "03", name: "插入", best: "O(n)", avg: "O(n²)", stable: true, tone: "fast" },
      { id: "sort-ex-04", no: "04", name: "希尔", best: "≈O(n)", avg: "≈O(n^1.3)", stable: false, tone: "mid" },
      { id: "sort-ex-05", no: "05", name: "快排", best: "O(n log n)", avg: "O(n log n)", stable: false, tone: "fast" },
      { id: "sort-ex-06", no: "06", name: "归并", best: "O(n log n)", avg: "O(n log n)", stable: true, tone: "fast" },
      { id: "sort-ex-07", no: "07", name: "堆排", best: "O(n log n)", avg: "O(n log n)", stable: false, tone: "fast" }
    ];
    rows.forEach(function (r) {
      var a = document.createElement("a");
      a.className = "v2-race-lane " + r.tone;
      a.href = "#" + r.id;
      a.innerHTML =
        '<span class="v2-race-no">' + r.no + "</span>" +
        '<span class="v2-race-name">' + r.name + "</span>" +
        '<span class="v2-race-track"><i></i></span>' +
        '<span class="v2-race-badge">' + r.avg + "</span>" +
        '<span class="v2-race-badge ' + (r.stable ? "is-ok" : "is-warn") + '">' + (r.stable ? "稳定" : "不稳定") + "</span>";
      lanes.appendChild(a);
    });
    intro.parentNode.insertBefore(race, intro.nextSibling);
  }

  function initSpecialPage() {
    var main = $("main.container");
    if (!main) return;
    document.body.classList.add("v2-special");
    main.classList.add("v2-special-main");
    main.id = "v2-main";
    if (HERE === "errors.html") initErrorsPage(main);
    else if (HERE === "cheatsheets.html") initCheatsheetsPage(main);
    else if (HERE === "exam-pitfalls.html") initPitfallsPage(main);
    else if (HERE === "sorting.html") initSortingPage(main);
  }

  /* ============================================================
   * 6. 命令面板
   * ============================================================ */
  var palette = null, paletteInput = null, paletteList = null, paletteItems = [], paletteIndex = 0;
  var CORPUS_DATA = [
    ["errors-data.js", "ERRORS_DATA"],
    ["cheatsheets-data.js", "CHEATSHEETS_DATA"],
    ["pitfalls-data.js", "PITFALLS_DATA"],
    ["bughunt-data.js", "BUGHUNT_DATA"],
    ["glossary-data.js", "GLOSSARY_DATA"]
  ];
  var corpusLoaded = false, corpusLoading = false, corpusWaiters = [];

  function ensureCorpusData(cb) {
    if (corpusLoaded) { cb(); return; }
    if (cb) corpusWaiters.push(cb);
    if (corpusLoading) return;
    corpusLoading = true;
    var missing = CORPUS_DATA.filter(function (pair) { return !window[pair[1]]; });
    if (!missing.length) {
      corpusLoaded = true; corpusLoading = false;
      var waiters = corpusWaiters.slice(); corpusWaiters.length = 0;
      waiters.forEach(function (fn) { try { fn(); } catch (e) {} });
      return;
    }
    var left = missing.length;
    missing.forEach(function (pair) {
      var s = document.createElement("script");
      s.src = PREFIX + "assets/js/" + pair[0];
      s.onload = s.onerror = function () {
        if (--left === 0) {
          corpusLoaded = true; corpusLoading = false;
          var list = corpusWaiters.slice(); corpusWaiters.length = 0;
          list.forEach(function (fn) { try { fn(); } catch (e) {} });
        }
      };
      document.head.appendChild(s);
    });
  }

  function buildCorpus() {
    var out = [];
    function add(kind, title, text, href, run) {
      out.push({ kind: kind, title: title, text: text, href: href, run: run });
    }
    toc().forEach(function (c) {
      add("章节", c.title, (c.title + " " + c.desc + " " + (c.keywords || []).join(" ")).toLowerCase(), PREFIX + c.file);
    });
    (window.SPECIAL_PAGES || []).forEach(function (s) {
      if (!s.file) return;
      add("专题", s.title, (s.title + " " + s.desc).toLowerCase(), PREFIX + s.file);
    });
    (window.ERRORS_DATA || []).forEach(function (d) {
      add("错误", d.title, (d.title + " " + d.message + " " + d.cause).toLowerCase(), PREFIX + "errors.html#" + d.id);
    });
    (window.CHEATSHEETS_DATA || []).forEach(function (s) {
      var t = s.title + " " + (s.desc || "");
      if (s.rows) t += " " + s.rows.flat().join(" ");
      if (s.items) t += " " + s.items.map(function (i) { return i.code + " " + i.desc; }).join(" ");
      add("速查", s.title, t.toLowerCase(), PREFIX + "cheatsheets.html#" + s.id);
    });
    (window.PITFALLS_DATA || []).forEach(function (p) {
      add("易错", p.title, (p.title + " " + (p.tags || []).join(" ") + " " + p.why).toLowerCase(), PREFIX + "exam-pitfalls.html#" + p.id);
    });
    (window.BUGHUNT_DATA || []).forEach(function (b) {
      add("找错", b.title, (b.title + " " + b.code.join(" ")).toLowerCase(), PREFIX + "exam-pitfalls.html#" + b.id);
    });
    (window.GLOSSARY_DATA || []).forEach(function (g) {
      if (!g.href) return;
      add("术语", g.term, (g.term + " " + (g.aliases || []).join(" ")).toLowerCase(), PREFIX + g.href);
    });
    $$("main h2").forEach(function (h) {
      if (!h.id || h.closest(".v2-cover")) return;
      add("本页", h.textContent.replace(/^\d+\.\s*/, ""), h.textContent.toLowerCase(), "#" + h.id);
    });
    add("动作", "切换主题", "theme dark light auto 主题 深浅色", null, function () { window.SiteUI.toggleTheme(); });
    add("动作", "打印 / 导出 PDF", "print pdf 打印", null, function () { window.print(); });
    add("动作", "进入投屏模式", "present 投屏 投影", null, function () {
      if (window.Present) window.Present.enter(true);
      else document.dispatchEvent(new KeyboardEvent("keydown", { key: "P", ctrlKey: true, altKey: true }));
    });
    add("动作", "打开不会清单", "weak mastery 弱项 不会", null, function () {
      var b = document.getElementById("weak-btn");
      if (b) b.click();
    });
    add("动作", "教师模式", "teacher 教师 答案", null, function () {
      var b = document.getElementById("teacher-toggle");
      if (b) b.click();
    });
    return out;
  }

  function buildPalette() {
    if (palette) return;
    palette = document.createElement("div");
    palette.className = "v2-palette";
    palette.setAttribute("aria-hidden", "true");
    palette.innerHTML =
      '<div class="v2-palette-panel" role="dialog" aria-modal="true" aria-label="全站搜索">' +
        '<div class="v2-palette-search">' + icon("search") +
          '<input type="search" autocomplete="off" placeholder="搜索章节、报错、速查、易错、术语…" aria-label="搜索全站">' +
          '<kbd>Esc</kbd>' +
        "</div>" +
        '<div class="v2-palette-results" role="listbox"></div>' +
        '<div class="v2-palette-foot"><span>↑ ↓ 选择</span><span>Enter 打开</span><span>Ctrl K 关闭</span></div>' +
      "</div>";
    document.body.appendChild(palette);
    paletteInput = palette.querySelector("input");
    paletteList = palette.querySelector(".v2-palette-results");
    palette.addEventListener("click", function (ev) {
      if (ev.target === palette) closePalette();
    });
    paletteInput.addEventListener("input", function () { renderPalette(paletteInput.value); });
    paletteInput.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowDown") { ev.preventDefault(); movePalette(1); }
      else if (ev.key === "ArrowUp") { ev.preventDefault(); movePalette(-1); }
      else if (ev.key === "Enter") { ev.preventDefault(); choosePalette(paletteIndex); }
      else if (ev.key === "Escape") { ev.preventDefault(); closePalette(); }
    });
  }

  function openPalette() {
    buildPalette();
    palette.classList.add("open");
    palette.setAttribute("aria-hidden", "false");
    paletteInput.value = "";
    if (!corpusLoaded) {
      paletteList.innerHTML = '<div class="v2-palette-empty">正在加载全站索引…</div>';
      ensureCorpusData(function () { renderPalette(paletteInput.value); });
    } else {
      renderPalette("");
    }
    setTimeout(function () { paletteInput.focus(); }, 20);
  }
  function closePalette() {
    if (!palette) return;
    palette.classList.remove("open");
    palette.setAttribute("aria-hidden", "true");
  }
  function renderPalette(q) {
    var corpus = buildCorpus();
    var kw = String(q || "").trim().toLowerCase();
    var hits = corpus.filter(function (item) {
      return !kw || item.title.toLowerCase().indexOf(kw) !== -1 || item.text.indexOf(kw) !== -1;
    });
    if (kw) {
      hits.sort(function (a, b) {
        var ai = a.title.toLowerCase().indexOf(kw), bi = b.title.toLowerCase().indexOf(kw);
        if (ai !== -1 && bi === -1) return -1;
        if (ai === -1 && bi !== -1) return 1;
        return 0;
      });
    }
    paletteItems = hits.slice(0, 40);
    paletteIndex = 0;
    paletteList.innerHTML = paletteItems.length ? paletteItems.map(function (item, i) {
      return '<button type="button" class="v2-palette-item' + (i === 0 ? " cur" : "") + '" data-i="' + i + '" role="option">' +
        '<span class="v2-palette-kind">' + esc(item.kind) + "</span>" +
        '<span class="v2-palette-title">' + esc(item.title) + "</span>" +
        "</button>";
    }).join("") : '<div class="v2-palette-empty">没有匹配内容。试试“指针”“UB”“vector”。</div>';
    paletteList.querySelectorAll(".v2-palette-item").forEach(function (el) {
      el.addEventListener("click", function () { choosePalette(parseInt(el.getAttribute("data-i"), 10)); });
    });
  }
  function movePalette(d) {
    if (!paletteItems.length) return;
    paletteIndex = (paletteIndex + d + paletteItems.length) % paletteItems.length;
    paletteList.querySelectorAll(".v2-palette-item").forEach(function (el, i) {
      el.classList.toggle("cur", i === paletteIndex);
      if (i === paletteIndex) el.scrollIntoView({ block: "nearest" });
    });
  }
  function choosePalette(i) {
    var item = paletteItems[i];
    if (!item) return;
    closePalette();
    if (item.run) item.run();
    else if (item.href) location.href = item.href;
  }
  function initPalette() {
    document.addEventListener("click", function (ev) {
      var trigger = ev.target.closest && ev.target.closest("[data-v2-palette]");
      if (trigger) { ev.preventDefault(); openPalette(); }
    });
    document.addEventListener("keydown", function (ev) {
      var typing = ev.target && (ev.target.tagName === "INPUT" || ev.target.tagName === "TEXTAREA" || ev.target.isContentEditable);
      var isK = (ev.key === "k" || ev.key === "K") && (ev.ctrlKey || ev.metaKey);
      if (isK) {
        ev.preventDefault();
        if (palette && palette.classList.contains("open")) closePalette();
        else openPalette();
        return;
      }
      if (ev.key === "Escape" && palette && palette.classList.contains("open")) { closePalette(); return; }
      if (ev.key === "/" && !typing && !(palette && palette.classList.contains("open"))) { ev.preventDefault(); openPalette(); }
    });
  }

  /* ============================================================
   * 7. 启动
   * ============================================================ */
  function initChapterPage() {
    var main = $("main.container");
    if (!main) return;
    document.body.classList.add("v2-chapter");
    main.classList.add("v2-chapter-main");
    main.id = "v2-main";
    var cfg = (config().chapters || {})[CHAPTER_ID] || { notes: [], demo: null };
    var cover = buildCover(main, cfg);
    buildRail(main, cfg, cover);
    upgradeListings(main, CHAPTER_ID ? String(parseInt(CHAPTER_ID.slice(2), 10)).padStart(2, "0") : "00");
    wrapTables(main);
    initProgressRibbon();
    rememberVisit(cfg);
    var start = $(".v2-cover ~ h2") || $("h2", main);
    if (start && !start.id) start.id = "v2-start";
    if (start && !document.getElementById("v2-start")) start.id = "v2-start";
    document.body.setAttribute("data-v2-chapter", CHAPTER_ID || "");
  }

  function polishHeaderButtons() {
    var teacher = document.getElementById("teacher-toggle");
    if (teacher) {
      teacher.innerHTML = icon("book");
      teacher.title = "教师模式";
      teacher.setAttribute("aria-label", "教师模式");
    }
    var present = document.querySelector("[data-role=present-btn]");
    if (present) {
      present.innerHTML = icon("play");
      present.title = "投屏演示模式";
      present.setAttribute("aria-label", "投屏演示模式");
    }
    var weak = document.getElementById("weak-btn");
    if (weak) {
      var badge = weak.querySelector("#weak-badge");
      weak.innerHTML = icon("mine");
      if (badge) weak.appendChild(badge);
      weak.title = "汇总各章标记为「不会」的知识点";
      weak.setAttribute("aria-label", "不会清单");
    }
  }

  function init() {
    var main = $("main.container");
    if (main && !main.id) main.id = "v2-main";
    if (CHAPTER_ID && main && main.classList.contains("chapter")) initChapterPage();
    else if (HERE === "errors.html" || HERE === "cheatsheets.html" || HERE === "exam-pitfalls.html" || HERE === "sorting.html") initSpecialPage();
    polishHeaderButtons();
    initPalette();
  }

  window.V2Core = {
    openPalette: openPalette,
    closePalette: closePalette,
    chapterId: CHAPTER_ID,
    prefix: PREFIX
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
