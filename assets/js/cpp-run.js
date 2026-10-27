/* ============================================================
 * cpp-run.js —— 教学用 C++ 子集解释器的加载与运行入口
 * 暴露：window.CppRun
 *
 * 双协议加载（按当前页面协议自动选择）：
 *   - https:/http: → fetch 分离的 assets/wasm/cpprun.wasm（可独立缓存，快）
 *   - file:         → 注入 cpprun-wasm-embed.js（base64 内嵌版，绕开
 *                     file:// 的 fetch 限制），失败时 https 也回退到此
 * WASM 编译源：tools/cpprun-src/interpreter.ts（AssemblyScript），
 * 测试：node tools/test-cpprun.mjs。构建：npx asc … + node tools/gen-embed.mjs
 *
 * API：
 *   CppRun.ensure(cb)      按需加载后端，cb(ok)
 *   CppRun.canRun(code)    轻量启发式：是否值得给出「在线运行」按钮
 *   CppRun.run(code)       → { ok, out, err, warn }（同步， Interpreter 内有步数上限）
 * 本文件按需由 interactive.js 动态注入（file:// 下动态 <script> 可用）。
 * ============================================================ */
(function () {
  "use strict";

  var instance = null;
  var status = "none";            // none | loading | ready | failed
  var waiters = [];
  var FAIL_REASON = "";

  function prefix() {
    return /\/chapters\//.test(decodeURIComponent(location.pathname)) ? "../" : "";
  }

  function finish(ok, reason) {
    status = ok ? "ready" : "failed";
    FAIL_REASON = reason || "";
    var q = waiters;
    waiters = [];
    q.forEach(function (cb) { cb(ok); });
  }

  function instantiate(bytes) {
    return WebAssembly.instantiate(bytes, { env: { abort: function () {}, seed: function () { return 1; } } })
      .then(function (res) {
        instance = res.instance;
        finish(true);
      });
  }

  function loadEmbed() {
    var s = document.createElement("script");
    s.src = prefix() + "assets/js/cpprun-wasm-embed.js";
    s.onload = function () {
      try {
        var b64 = window.__CPPRUN_WASM_B64 || "";
        var raw = atob(b64);
        var bytes = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
        instantiate(bytes).catch(function (e) { finish(false, "WASM 实例化失败：" + e.message); });
      } catch (e) {
        finish(false, "内嵌 WASM 解码失败：" + e.message);
      }
    };
    s.onerror = function () { finish(false, "无法加载 assets/js/cpprun-wasm-embed.js"); };
    document.head.appendChild(s);
  }

  function loadWasm() {
    fetch(prefix() + "assets/wasm/cpprun.wasm")
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.arrayBuffer();
      })
      .then(function (bytes) { return instantiate(bytes); })
      .catch(function () {
        /* 网络或 MIME 异常时回退到内嵌版 */
        loadEmbed();
      });
  }

  var RE_FORBIDDEN = new RegExp(
    "\\bclass\\b|\\bstruct\\b|\\btemplate\\b|\\btypename\\b|\\bnamespace\\b|\\busing\\b|" +
    "\\bvector\\b|\\bmap\\b|\\bset\\b|\\bpair\\b|\\bstd::string\\b|\\bstring\\s+\\w+|\\bchar\\s*\\*|" +
    "\\bcin\\b|\\bprintf\\b|\\bscanf\\b|\\bgetline\\b|\\bstoi\\b|\\bto_string\\b|" +
    "\\bnew\\b|\\bdelete\\b|\\btry\\b|\\bthrow\\b|\\bcatch\\b|\\bswitch\\b|\\bwhile\\s*\\(\\s*true\\s*\\)\\s*;|" +
    "->|\\bpush_back\\b|\\blambda\\b|\\[&\\]|\\[=\\]",
    "i"
  );

  window.CppRun = {
    get status() { return status; },
    get failReason() { return FAIL_REASON; },

    ensure: function (cb) {
      if (status === "ready") { cb(true); return; }
      if (status === "failed") { cb(false); return; }
      if (status === "loading") { waiters.push(cb); return; }
      status = "loading";
      waiters.push(cb);
      var proto = location.protocol;
      if (proto === "https:" || proto === "http:") loadWasm();
      else loadEmbed();
    },

    /* 轻量启发式：通过才显示「在线运行」按钮；解释器内有完整的语法检查兜底 */
    canRun: function (code) {
      if (typeof code !== "string" || code.length === 0 || code.length > 20000) return false;
      if (!/int\s+main\s*\(/.test(code)) return false;
      if (RE_FORBIDDEN.test(code)) return false;
      if (/for\s*\([^;]*:[^;]*\)/.test(code)) return false;           // range-for
      if (/\w+\s*\[\s*\]\s*\[/.test(code)) return false;              // 二维数组
      return true;
    },

    run: function (code) {
      if (status !== "ready") return { ok: false, out: "", err: "运行器尚未就绪", warn: "" };
      var ex = instance.exports;
      var bytes = new TextEncoder().encode(code);
      var ptr = ex.allocSrc(bytes.length);
      new Uint8Array(ex.memory.buffer, ptr, bytes.length).set(bytes);
      ex.setSrcLen(bytes.length);
      var st = ex.runProgram();
      /* 用 slice() 拷贝出快照，避免后续运行覆写同一静态缓冲 */
      var out = new TextDecoder().decode(new Uint8Array(ex.memory.buffer, ex.getOutPtr(), ex.getOutLen()).slice());
      var err = new TextDecoder().decode(new Uint8Array(ex.memory.buffer, ex.getErrPtr(), ex.getErrLen()).slice());
      var warn = new TextDecoder().decode(new Uint8Array(ex.memory.buffer, ex.getWarnPtr(), ex.getWarnLen()).slice());
      return { ok: st === 0, out: out, err: err, warn: warn };
    }
  };
})();
