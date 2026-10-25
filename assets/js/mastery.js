/* ============================================================
 * mastery.js —— 知识点掌握标记（会/不会）+ 导航栏「不会清单」
 * 可标记条目：各章「学习目标」与「自测清单」的 li（章节页自动改造：
 * 清单原有 checkbox 由本脚本移除并替换为「会/不会」标记按钮）。
 * 存储：localStorage["cppcourse.mastery"] =
 *   { [条目id]: { s: "yes"|"no", t: 条目文本, c: 章节id, ct: 章节标题, k: "obj"|"chk" } }
 * 「不会」条目汇总在导航栏「🎯 不会清单」下拉面板中，可点击跳回章节。
 * 依赖：toc.js（COURSE_TOC）、nav.js（先生成顶栏）。纯本地，file:// 可用。
 * ============================================================ */
(function () {
  "use strict";

  var KEY = "cppcourse.mastery";
  var live = [];            // 当前页已改造条目 [{ id, li, byes, bno, text, kind, chap }]
  var panel = null;
  var panelOpen = false;

  function load() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || "{}");
      return (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
    } catch (e) { return {}; }
  }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }

  var here = decodeURIComponent(location.pathname).split("/").pop() || "index.html";
  var prefix = /\/chapters\/[^/]*$/.test(decodeURIComponent(location.pathname)) ? "../" : "";

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function norm(s) { return String(s).replace(/\s+/g, " ").trim(); }
  function tocById(id) {
    var toc = window.COURSE_TOC || [];
    for (var i = 0; i < toc.length; i++) if (toc[i].id === id) return toc[i];
    return null;
  }
  function currentChapter() {
    var toc = window.COURSE_TOC || [];
    for (var i = 0; i < toc.length; i++)
      if (toc[i].file && toc[i].file.split("/").pop() === here) return { id: toc[i].id, title: toc[i].title };
    return null;
  }
  function chapFromEl(el) {
    var root = el.closest("[data-chapter]");
    var id = root ? root.getAttribute("data-chapter") : null;
    if (!id) return currentChapter();
    var t = tocById(id);
    return { id: id, title: t ? t.title : id };
  }

  /* ---------- 条目标记 ---------- */
  function applyState(entry) {
    var st = load()[entry.id];
    var s = st ? st.s : null;
    entry.li.classList.toggle("mk-yes", s === "yes");
    entry.li.classList.toggle("mk-no", s === "no");
    entry.byes.classList.toggle("on", s === "yes");
    entry.bno.classList.toggle("on", s === "no");
  }

  function setMark(entry, s) {
    var all = load();
    if (s === null) delete all[entry.id];
    else all[entry.id] = { s: s, t: entry.text, c: entry.chap.id, ct: entry.chap.title, k: entry.kind };
    save(all);
    document.dispatchEvent(new CustomEvent("mastery-changed"));
  }

  function buildChips(li, id, kind, chap, text) {
    var chips = document.createElement("span");
    chips.className = "mk-chips";
    function mkBtn(label, mk) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "mk-btn";
      b.setAttribute("data-mk", mk);
      b.textContent = label;
      b.title = mk === "yes" ? "标记：已掌握" : "标记：还不会（收进导航栏「不会清单」）";
      b.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var cur = load()[id];
        setMark(entry, (cur && cur.s === mk) ? null : mk);   // 再点一次取消标记
      });
      return b;
    }
    var byes = mkBtn("会", "yes");
    var bno = mkBtn("不会", "no");
    chips.appendChild(byes);
    chips.appendChild(bno);
    var entry = { id: id, li: li, byes: byes, bno: bno, text: text, kind: kind, chap: chap };
    li.appendChild(chips);
    applyState(entry);
    live.push(entry);
  }

  function transform() {
    var chap = currentChapter();
    if (!chap) return;

    /* 学习目标：section.objectives（或含「学习目标」标题的 section）下的 li */
    var obj = document.querySelector("section.objectives");
    if (!obj) {
      var hs = document.querySelectorAll("h2");
      for (var i = 0; i < hs.length; i++) {
        if (hs[i].textContent.indexOf("学习目标") !== -1) { obj = hs[i].closest("section"); break; }
      }
    }
    if (obj) {
      var n = 0;
      obj.querySelectorAll("li").forEach(function (li) {
        if (li.querySelector(".mk-chips")) return;
        n++;
        buildChips(li, chap.id + "-obj-" + n, "obj", chap, norm(li.textContent));
      });
    }

    /* 自测清单：沿用 data-check-id 作为条目 id */
    document.querySelectorAll("ul.checklist").forEach(function (ul) {
      var ch = chapFromEl(ul) || chap;
      var idx = 0;
      ul.querySelectorAll("li").forEach(function (li) {
        if (li.querySelector(".mk-chips")) return;
        idx++;
        var input = li.querySelector("input[data-check-id]");
        var id = input ? input.getAttribute("data-check-id") : (ch.id + "-chk-" + idx);
        if (input) input.remove();
        var span = li.querySelector("span");
        buildChips(li, id, "chk", ch, norm(span ? span.textContent : li.textContent));
      });
    });
  }

  /* ---------- 导航栏「不会清单」 ---------- */
  function weakEntries() {
    var all = load(), out = [];
    for (var id in all) {
      if (all[id] && all[id].s === "no") {
        var e = { id: id };
        for (var k in all[id]) e[k] = all[id][k];
        out.push(e);
      }
    }
    return out;
  }

  function refreshBadge() {
    var b = document.getElementById("weak-badge");
    if (!b) return;
    var n = weakEntries().length;
    b.textContent = String(n);
    b.hidden = n === 0;
  }

  function renderPanel() {
    var list = weakEntries();
    var groups = {};
    var order = [];
    list.forEach(function (e) {
      if (!groups[e.c]) { groups[e.c] = { title: e.ct || e.c, items: [] }; order.push(e.c); }
      groups[e.c].items.push(e);
    });
    var html;
    if (!list.length) {
      html = '<p class="weak-empty">还没有标记任何「不会」的知识点。<br>到各章的「学习目标」和「自测清单」里，点条目旁的「不会」即可收进这里。</p>';
    } else {
      html = order.map(function (cid) {
        var g = groups[cid];
        var t = tocById(cid);
        var href = t ? prefix + t.file : "#";
        var rows = g.items.map(function (e) {
          return '<div class="weak-item"><span class="wi-text">' + esc(e.t) + '</span>' +
            '<button class="wi-x" data-mk-id="' + esc(e.id) + '" title="取消「不会」标记">✕</button></div>';
        }).join("");
        return '<div class="weak-group"><div class="wg-title"><a href="' + esc(href) + '">' + esc(g.title) + '</a></div>' + rows + '</div>';
      }).join("");
    }
    panel.innerHTML = '<h3>🎯 不会的知识点（' + list.length + '）</h3>' + html +
      '<div class="weak-foot">' +
      (list.length ? '<button class="btn btn-small btn-danger" id="weak-clear">清空全部</button>' : "") +
      '<button class="btn btn-small" id="weak-close">关闭</button></div>';

    panel.querySelectorAll(".wi-x").forEach(function (b) {
      b.addEventListener("click", function () {
        var all = load();
        delete all[b.getAttribute("data-mk-id")];
        save(all);
        document.dispatchEvent(new CustomEvent("mastery-changed"));
      });
    });
    var clearBtn = panel.querySelector("#weak-clear");
    if (clearBtn) clearBtn.addEventListener("click", function () {
      if (!window.confirm("确定清空全部「不会」标记吗？")) return;
      save({});
      document.dispatchEvent(new CustomEvent("mastery-changed"));
    });
    panel.querySelector("#weak-close").addEventListener("click", function () { setOpen(false); });
  }

  function setOpen(v) {
    panelOpen = v;
    panel.classList.toggle("open", v);
    if (v) renderPanel();
  }

  function injectNav() {
    var actions = document.querySelector(".header-actions");
    if (!actions) return;
    var btn = document.createElement("button");
    btn.className = "icon-btn weak-btn";
    btn.id = "weak-btn";
    btn.title = "汇总各章标记为「不会」的知识点";
    btn.innerHTML = '🎯 不会清单 <span class="weak-badge" id="weak-badge" hidden>0</span>';
    actions.appendChild(btn);

    panel = document.createElement("div");
    panel.className = "weak-panel";
    panel.id = "weak-panel";
    document.body.appendChild(panel);

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!panelOpen);
    });
    document.addEventListener("click", function (e) {
      if (panelOpen && !panel.contains(e.target) && !btn.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panelOpen) setOpen(false);
    });
    document.addEventListener("mastery-changed", function () {
      refreshBadge();
      live.forEach(applyState);
      if (panelOpen) renderPanel();
    });
    window.addEventListener("storage", function (e) {
      if (e.key === KEY) {
        refreshBadge();
        live.forEach(applyState);
        if (panelOpen) renderPanel();
      }
    });
    refreshBadge();
  }

  function init() {
    injectNav();
    transform();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
