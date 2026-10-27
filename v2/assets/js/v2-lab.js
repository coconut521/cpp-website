/* ============================================================
 * v2-lab.js —— 实验台 / 检查器动画引擎
 *   engine: memory | stack | timeline | scene | grid | bars
 *   数据：V2_CONFIG.chapters[ch].demo
 *   驱动：优先复用示例卡已有的 ex-steps（代码行、输出、note），
 *         demo.frames 只描述“每一步的画面状态”，避免重复维护文案。
 *   规则：默认不自动播放；单步 / 暂停；打印时自动落到最终帧。
 * file:// 兼容；无外部依赖。
 * ============================================================ */
(function () {
  "use strict";

  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var UID = 0;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function icon(name) { return window.V2_ICONS && window.V2_ICONS[name] ? window.V2_ICONS[name] : ""; }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function parseSteps(card) {
    var el = $("script.ex-steps", card);
    if (!el) return null;
    try { return JSON.parse(el.textContent).steps || []; }
    catch (e) { return null; }
  }
  function parseBars(step) {
    if (!step || !step.vars) return null;
    var keys = Object.keys(step.vars);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].slice(-2) !== "[]") continue;
      var parts = String(step.vars[keys[i]]).trim().split(/\s+/);
      var out = [];
      for (var j = 0; j < parts.length; j++) {
        var v = parseFloat(parts[j]);
        if (isNaN(v)) return null;
        out.push(v);
      }
      return out.length ? out : null;
    }
    return null;
  }
  function framesFor(demo, steps) {
    if (demo.useStepStack) {
      return steps.map(function (s) {
        return {
          frames: (s.stack || []).map(function (name, i) {
            return { name: name, locals: i === (s.stack || []).length - 1 && s.vars ? Object.keys(s.vars).map(function (k) { return k + " = " + s.vars[k]; }) : [] };
          }),
          note: s.note || ""
        };
      });
    }
    if (demo.useStepBars) {
      var lastBars = [];
      return steps.map(function (s) {
        var b = parseBars(s);
        if (b) lastBars = b;
        return {
          bars: lastBars.slice(),
          cmp: s.cmp || [],
          pivot: typeof s.pivot === "number" ? s.pivot : -1,
          note: s.note || ""
        };
      });
    }
    return demo.frames || [];
  }

  /* ============================================================
   * 渲染器
   * ============================================================ */
  function renderMemory(host, frame) {
    var regions = frame.regions || [];
    var html = '<div class="v2-mem">';
    regions.forEach(function (region) {
      html += '<div class="v2-mem-region"><div class="v2-mem-label">' + esc(region.label || "内存") + "</div>";
      html += '<div class="v2-mem-cells">';
      (region.cells || []).forEach(function (c) {
        html += '<div class="v2-mem-cell ' + esc(c.state || "") + '">' +
          '<div class="v2-mem-top"><b>' + esc(c.name) + "</b><span>" + esc(c.type || "") + "</span></div>" +
          '<div class="v2-mem-value">' + esc(c.value == null ? "?" : c.value) + "</div>" +
          '<div class="v2-mem-foot">' + esc(c.size || "") + (c.addr ? " · " + esc(c.addr) : "") + "</div>" +
          "</div>";
      });
      if (!(region.cells || []).length) html += '<div class="v2-mem-empty">（已销毁）</div>';
      html += "</div></div>";
    });
    html += "</div>";
    host.innerHTML = html;
  }

  function renderStack(host, frame) {
    var frames = frame.frames || [];
    var html = '<div class="v2-stack">';
    if (!frames.length) html += '<div class="v2-mem-empty">（空栈）</div>';
    frames.forEach(function (f, i) {
      var top = i === frames.length - 1;
      html += '<div class="v2-stack-frame' + (top ? " top" : "") + '">' +
        '<div class="v2-stack-name">' + esc(f.name) + (top ? '<span class="v2-stack-top">TOP</span>' : "") + "</div>" +
        ((f.locals || []).length ? '<div class="v2-stack-locals">' + f.locals.map(function (l) {
          return '<span>' + esc(l) + "</span>";
        }).join("") + "</div>" : "") +
        "</div>";
    });
    html += "</div>";
    host.innerHTML = html;
  }

  function renderTimeline(host, frame) {
    var events = frame.events || [];
    var html = '<div class="v2-timeline">';
    events.forEach(function (e, i) {
      html += '<div class="v2-timeline-event ' + esc(e.state || "") + '">' +
        '<span class="v2-timeline-no">' + String(i + 1).padStart(2, "0") + "</span>" +
        '<span class="v2-timeline-body"><b>' + esc(e.label) + "</b><small>" + esc(e.desc || "") + "</small></span>" +
        "</div>";
    });
    html += "</div>";
    host.innerHTML = html;
  }

  function renderGrid(host, frame) {
    var rows = frame.rows || [];
    var cols = rows.length ? rows[0].length : 0;
    var base = frame.base || "0x1000";
    var html = '<div class="v2-grid-wrap"><div class="v2-grid" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr))">';
    rows.forEach(function (row, r) {
      row.forEach(function (val, c) {
        var active = frame.active && frame.active[0] === r && frame.active[1] === c;
        var offset = (r * cols + c) * 4;
        html += '<div class="v2-grid-cell' + (active ? " active" : "") + '">' +
          '<span class="v2-grid-val">' + esc(val) + "</span>" +
          '<span class="v2-grid-addr">+' + offset + "</span>" +
          "</div>";
      });
    });
    html += '</div><div class="v2-grid-caption">行主序：m[i][j] 的地址 = ' + esc(base) + " + (i × " + cols + " + j) × sizeof(int)</div></div>";
    host.innerHTML = html;
  }

  function renderBars(host, frame) {
    var bars = frame.bars || [];
    var max = 1;
    bars.forEach(function (v) { if (v > max) max = v; });
    var html = '<div class="v2-bars">';
    bars.forEach(function (v, i) {
      var h = Math.max(4, Math.round(v / max * 100));
      var cls = "";
      if (frame.pivot === i) cls = " pivot";
      else if ((frame.cmp || []).indexOf(i) !== -1) cls = " cmp";
      html += '<div class="v2-bar-col' + cls + '">' +
        '<span class="v2-bar-val">' + esc(v) + "</span>" +
        '<i style="height:' + h + '%"></i>' +
        '<span class="v2-bar-idx">' + i + "</span>" +
        "</div>";
    });
    html += "</div>";
    host.innerHTML = html;
  }

  function renderScene(host, frame) {
    var boxes = frame.boxes || [];
    var arrows = frame.arrows || [];
    var cols = frame.cols || Math.min(4, Math.max(1, boxes.length));
    var rows = Math.ceil(boxes.length / cols) || 1;
    var BW = 128, BH = 58, GX = 44, GY = 46, PAD = 16, TOP = 62;
    var W = Math.max(360, cols * (BW + GX) - GX + PAD * 2);
    var H = TOP + rows * (BH + GY) - GY + PAD + 36;
    var uid = "s" + (++UID);
    var pos = {};
    boxes.forEach(function (b, i) {
      var r = Math.floor(i / cols), c = i % cols;
      pos[b.id] = { x: PAD + c * (BW + GX), y: TOP + r * (BH + GY) };
    });
    var svg = '<svg class="v2-scene-svg" viewBox="0 0 ' + W + " " + H + '" width="100%" role="img">' +
      '<defs>' +
        '<marker id="v2a-' + uid + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" class="v2-scene-mk"/></marker>' +
        '<marker id="v2b-' + uid + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" class="v2-scene-mk bad"/></marker>' +
      "</defs>";
    boxes.forEach(function (b) {
      var p = pos[b.id];
      if (!p) return;
      svg += '<g class="v2-scene-box ' + esc(b.cls || "") + '">' +
        '<rect x="' + p.x + '" y="' + p.y + '" width="' + BW + '" height="' + BH + '" rx="8"/>' +
        '<text class="v2-scene-label" x="' + (p.x + 12) + '" y="' + (p.y + 24) + '">' + esc(b.label) + "</text>" +
        '<text class="v2-scene-sub" x="' + (p.x + 12) + '" y="' + (p.y + 43) + '">' + esc(b.sub || "") + "</text>" +
        "</g>";
    });
    arrows.forEach(function (a) {
      var from = pos[a.from], to = pos[a.to];
      if (!from || !to) return;
      var x1 = from.x + BW / 2, y1 = from.y;
      var x2 = to.x + BW / 2, y2 = to.y;
      var lift = Math.min(96, 30 + Math.abs(x2 - x1) * 0.18);
      var d = "M " + x1 + " " + y1 + " C " + x1 + " " + (y1 - lift) + ", " + x2 + " " + (y2 - lift) + ", " + x2 + " " + (y2 - 4);
      var bad = (a.cls || "").indexOf("bad") !== -1;
      svg += '<path class="v2-scene-arrow' + (bad ? " bad" : "") + '" d="' + d + '" marker-end="url(#v2' + (bad ? "b" : "a") + "-" + uid + ')"/>';
      if (a.label) {
        svg += '<text class="v2-scene-arrow-label' + (bad ? " bad" : "") + '" x="' + ((x1 + x2) / 2) + '" y="' + (Math.min(y1, y2) - lift * 0.72) + '" text-anchor="middle">' + esc(a.label) + "</text>";
      }
    });
    svg += "</svg>";
    host.innerHTML = svg;
    /* 箭头生长动画 */
    if (!REDUCED) {
      host.querySelectorAll(".v2-scene-arrow").forEach(function (p) {
        try {
          var len = p.getTotalLength();
          p.style.strokeDasharray = len;
          p.style.strokeDashoffset = len;
          p.getBoundingClientRect();
          p.style.transition = "stroke-dashoffset .32s ease";
          p.style.strokeDashoffset = "0";
        } catch (e) {}
      });
    }
  }

  /* ============================================================
   * 检查器
   * ============================================================ */
  function mountInspector(card, demo) {
    if (!card || card.getAttribute("data-v2-inspector") === "1") return;
    card.setAttribute("data-v2-inspector", "1");
    card.setAttribute("data-v2-lab-anchor", "1");
    var steps = parseSteps(card);
    if (!steps || !steps.length) return;
    var frames = framesFor(demo, steps);
    if (!frames.length) return;
    var engine = demo.engine || "memory";
    var listing = $(".v2-listing", card);
    var anchor = listing || $("pre.ex-code", card);
    if (!anchor) return;

    var box = document.createElement("div");
    box.className = "v2-inspector" + (REDUCED ? " reduce-motion" : "");
    box.setAttribute("data-engine", engine);
    box.innerHTML =
      '<div class="v2-inspector-head">' +
        '<div class="v2-inspector-copy">' +
          '<div class="v2-inspector-kicker">EXPLAINER / ' + esc(engine.toUpperCase()) + "</div>" +
          '<div class="v2-inspector-question">' + esc(demo.question || "这一步发生了什么？") + "</div>" +
        "</div>" +
        '<div class="v2-inspector-controls" role="group" aria-label="实验台控制">' +
          '<button type="button" data-lab="first" aria-label="开头">' + icon("first") + "</button>" +
          '<button type="button" data-lab="prev" aria-label="上一步">' + icon("prev") + "</button>" +
          '<button type="button" class="primary" data-lab="next" aria-label="下一步">下一步 ' + icon("next") + "</button>" +
          '<button type="button" data-lab="play" aria-label="自动播放">' + icon("play") + "<span>自动</span></button>" +
          '<select data-lab="speed" aria-label="播放速度"><option value="2200">慢</option><option value="1200" selected>中</option><option value="650">快</option></select>' +
          '<button type="button" data-lab="end" aria-label="末尾">' + icon("last") + "</button>" +
          '<span class="v2-inspector-count" data-lab="count">1 / ' + steps.length + "</span>" +
        "</div>" +
      "</div>" +
      '<div class="v2-inspector-grid">' +
        '<div class="v2-inspector-code"></div>' +
        '<div class="v2-inspector-viz"></div>' +
      "</div>" +
      '<div class="v2-inspector-note"></div>' +
      '<div class="v2-inspector-out"><div class="v2-inspector-out-head"><span class="v2-terminal-dots"><i></i><i></i><i></i></span>OUTPUT / 累计输出</div><pre></pre></div>';

    anchor.parentNode.insertBefore(box, anchor.nextSibling);

    var codeSrc = $("pre.ex-code code", card);
    var codeHost = box.querySelector(".v2-inspector-code");
    if (codeSrc) {
      var clone = codeSrc.cloneNode(true);
      clone.removeAttribute("data-raw");
      codeHost.appendChild(clone);
    }
    var vizHost = box.querySelector(".v2-inspector-viz");
    var noteEl = box.querySelector(".v2-inspector-note");
    var outEl = box.querySelector(".v2-inspector-out pre");
    var countEl = box.querySelector('[data-lab="count"]');
    var playBtn = box.querySelector('[data-lab="play"]');
    var speedEl = box.querySelector('[data-lab="speed"]');
    if (REDUCED) {
      playBtn.disabled = true;
      playBtn.title = "系统已开启「减少动效」；请使用单步按钮";
    }
    var pos = 0;
    var timer = null;
    var playing = false;
    var interacted = false;

    function renderCode(step) {
      if (!codeSrc) return;
      codeHost.querySelectorAll(".ln").forEach(function (ln) {
        ln.classList.remove("cur-line", "done-line");
        var n = parseInt(ln.getAttribute("data-n"), 10);
        if (step && n === step.line) ln.classList.add("cur-line");
        else if (step && n < step.line) ln.classList.add("done-line");
      });
      var target = codeHost.querySelector('.ln[data-n="' + (step && step.line) + '"]');
      if (target && interacted && !REDUCED) target.scrollIntoView({ block: "nearest" });
    }
    function renderOutput() {
      var lines = [];
      for (var i = 0; i <= pos; i++) if (steps[i] && steps[i].out) lines.push(steps[i].out);
      outEl.textContent = lines.length ? lines.join("\n") : "（尚无输出）";
    }
    function renderViz(frame) {
      try {
        if (engine === "memory") renderMemory(vizHost, frame);
        else if (engine === "stack") renderStack(vizHost, frame);
        else if (engine === "timeline") renderTimeline(vizHost, frame);
        else if (engine === "grid") renderGrid(vizHost, frame);
        else if (engine === "bars") renderBars(vizHost, frame);
        else renderScene(vizHost, frame);
      } catch (e) {
        vizHost.innerHTML = '<div class="v2-lab-error">图解数据渲染失败：' + esc(e.message) + "</div>";
      }
    }
    function render() {
      var step = steps[pos] || null;
      var frame = frames[Math.min(pos, frames.length - 1)] || {};
      renderCode(step);
      renderViz(frame);
      noteEl.textContent = (step && step.note) || frame.note || "";
      noteEl.classList.toggle("empty", !noteEl.textContent);
      renderOutput();
      countEl.textContent = (pos + 1) + " / " + steps.length;
    }
    function go(delta, abs) {
      pos = typeof abs === "number" ? abs : pos + delta;
      pos = clamp(pos, 0, steps.length - 1);
      render();
    }
    function stop() {
      playing = false;
      if (timer) { clearInterval(timer); timer = null; }
      playBtn.classList.remove("playing");
      playBtn.innerHTML = icon("play") + "<span>自动</span>";
    }
    function play() {
      if (REDUCED) return;
      if (playing) { stop(); return; }
      playing = true;
      var ms = parseInt(speedEl.value, 10) || 1200;
      playBtn.classList.add("playing");
      playBtn.innerHTML = icon("pause") + "<span>暂停</span>";
      timer = setInterval(function () {
        if (pos >= steps.length - 1) { stop(); return; }
        go(1);
      }, ms);
    }

    box.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-lab]");
      if (!b) return;
      interacted = true;
      var act = b.getAttribute("data-lab");
      if (act === "first") { stop(); go(0, 0); }
      else if (act === "prev") { stop(); go(-1); }
      else if (act === "next") { stop(); go(1); }
      else if (act === "end") { stop(); go(0, steps.length - 1); }
      else if (act === "play") { play(); }
    });
    speedEl.addEventListener("change", function () {
      if (playing) { stop(); play(); }
    });

    /* 打印：落到最终帧，打印后恢复 */
    var beforePrintPos = null;
    window.addEventListener("beforeprint", function () {
      beforePrintPos = pos;
      stop();
      pos = steps.length - 1;
      render();
    });
    window.addEventListener("afterprint", function () {
      if (beforePrintPos != null) { pos = beforePrintPos; beforePrintPos = null; render(); }
    });

    render();
  }

  /* ============================================================
   * 启动
   * ============================================================ */
  function init() {
    var m = location.pathname.match(/\/chapters\/([^/]+)\.html$/);
    var file = location.pathname.split("/").pop();
    var id = m ? m[1].slice(0, 4) : (file === "sorting.html" ? "sorting" : null);
    if (!id) return;
    var cfg = (window.V2_CONFIG && window.V2_CONFIG.chapters && window.V2_CONFIG.chapters[id]) || {};
    var demo = cfg.demo;
    if (!demo) return;
    var card = document.getElementById(demo.cardId);
    if (!card) return;
    mountInspector(card, demo);
  }

  window.V2Lab = { mountInspector: mountInspector };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
