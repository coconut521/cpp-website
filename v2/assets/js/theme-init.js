/* ============================================================
 * theme-init.js —— 主题/字号预置（head 内同步加载，防止白屏闪烁）
 * cppcourse.theme 取值："light" | "dark" | "auto"（跟随系统；缺省 light）
 * 同时暴露 window.SiteTheme 供 nav.js 复用同一套判定逻辑。
 * ============================================================ */
(function () {
  "use strict";
  var mql = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function stored() {
    try {
      var t = localStorage.getItem("cppcourse.theme");
      return (t === "light" || t === "dark" || t === "auto") ? t : "light";
    } catch (e) { return "light"; }
  }
  function effective(mode) {
    if (mode === "auto") return (mql && mql.matches) ? "dark" : "light";
    return mode;
  }
  function apply() {
    var eff = effective(stored());
    if (eff === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    return eff;
  }

  apply();
  try {
    var f = parseFloat(localStorage.getItem("cppcourse.fontscale"));
    if (f > 0) document.documentElement.style.fontSize = (16 * f) + "px";
  } catch (e) {}

  /* 跟随系统模式下，系统切换深浅色时实时响应 */
  if (mql) {
    var onChange = function () { if (stored() === "auto") apply(); };
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else if (mql.addListener) mql.addListener(onChange);   // 旧版 Safari
  }

  window.SiteTheme = { stored: stored, effective: effective, apply: apply };
})();
