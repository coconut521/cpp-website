/* ============================================================
 * highlight.js —— 极简 C++ 语法高亮（无任何外部依赖，离线可用）
 * 暴露：window.CppLight = { highlight, highlightAll }
 * 自动对 <code class="cpp"> / <code class="lang-cpp"> 生效。
 * 说明：按行独立高亮（支持跨行块注释的续行着色），
 *       每行包一层 <span class="ln">，便于逐步执行时按行标亮。
 * ============================================================ */
(function () {
  "use strict";

  var KEYWORDS = [
    "alignas", "alignof", "and", "asm", "break", "case", "catch", "class", "co_await",
    "co_return", "co_yield", "compl", "concept", "consteval", "constinit", "const_cast",
    "continue", "decltype", "default", "delete", "do", "dynamic_cast", "else", "enum",
    "explicit", "export", "extern", "for", "friend", "goto", "if", "inline", "mutable",
    "namespace", "new", "noexcept", "not", "not_eq", "operator", "or", "or_eq",
    "private", "protected", "public", "register", "reinterpret_cast", "requires",
    "return", "sizeof", "static", "static_assert", "static_cast", "struct", "switch",
    "template", "this", "thread_local", "throw", "try", "typedef", "typeid", "typename",
    "union", "using", "virtual", "volatile", "while", "xor", "xor_eq"
  ];
  var TYPES = [
    "auto", "bool", "char", "char8_t", "char16_t", "char32_t", "const", "constexpr",
    "double", "float", "int", "long", "short", "signed", "unsigned", "void", "wchar_t",
    "size_t", "nullptr", "NULL", "true", "false", "std", "string", "vector", "map",
    "set", "unordered_map", "unordered_set", "pair", "array", "optional", "variant",
    "unique_ptr", "shared_ptr", "weak_ptr", "ostream", "istream", "cout", "cin", "endl"
  ];
  var KW_RE = KEYWORDS.join("|");
  var TY_RE = TYPES.join("|");

  function escHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* 对“单行已转义文本”做 token 替换；inBlockComment 为真时整行按注释处理，
     返回后更新 inBlockComment 以支持 /* ... *​/ 跨行块注释。 */
  function highlightLine(line, state) {
    var out = "";
    var i = 0;
    var n = line.length;

    if (state.inBlockComment) {
      var endIdx = line.indexOf("*/");
      if (endIdx === -1) return { html: '<span class="tok-com">' + line + "</span>", state: state };
      out += '<span class="tok-com">' + line.slice(0, endIdx + 2) + "</span>";
      i = endIdx + 2;
      state.inBlockComment = false;
      line = line.slice(i);
      n = line.length;
      i = 0;
    }

    while (i < n) {
      var rest = line.slice(i);

      // 行注释
      if (rest.indexOf("//") === 0) {
        out += '<span class="tok-com">' + rest + "</span>";
        return { html: out, state: state };
      }
      // 开始块注释
      if (rest.indexOf("/*") === 0) {
        var close = rest.indexOf("*/", 2);
        if (close === -1) {
          out += '<span class="tok-com">' + rest + "</span>";
          state.inBlockComment = true;
          return { html: out, state: state };
        }
        out += '<span class="tok-com">' + rest.slice(0, close + 2) + "</span>";
        i += close + 2;
        continue;
      }
      // 字符串（支持转义与相邻前缀 u8/u/U/L）
      var m = rest.match(/^(u8|u|U|L)?"((?:[^"\\]|\\.)*)"/);
      if (m) {
        out += '<span class="tok-str">' + escHtml(m[0]) + "</span>";
        i += m[0].length;
        continue;
      }
      // 字符
      m = rest.match(/^(u8|u|U|L)?'((?:[^'\\]|\\.)*)'/);
      if (m) {
        out += '<span class="tok-chr">' + escHtml(m[0]) + "</span>";
        i += m[0].length;
        continue;
      }
      // 预处理指令（行首 #）
      if (/^\s*#\w/.test(rest) && out.replace(/<[^>]*>/g, "").trim() === "") {
        out += '<span class="tok-pre">' + rest + "</span>";
        return { html: out, state: state };
      }
      // 数字
      m = rest.match(/^(0[xXbB][0-9a-fA-F']+|\d[\d'.]*([eE][+-]?\d+)?)[uUlLfF]*/);
      if (m) {
        out += '<span class="tok-num">' + m[0] + "</span>";
        i += m[0].length;
        continue;
      }
      // 标识符 / 关键字 / 类型 / 函数名
      m = rest.match(/^[A-Za-z_]\w*/);
      if (m) {
        var word = m[0];
        var after = line.slice(i + word.length);
        var cls = null;
        if (new RegExp("^" + KW_RE + "$").test(word)) cls = "tok-kw";
        else if (new RegExp("^" + TY_RE + "$").test(word)) cls = "tok-type";
        else if (/^\s*\(/.test(after) && !new RegExp("^(" + KW_RE + "|" + TY_RE + ")$").test(word)) cls = "tok-fn";
        out += cls ? '<span class="' + cls + '">' + word + "</span>" : word;
        i += word.length;
        continue;
      }
      // 其余字符原样
      out += line[i];
      i++;
    }
    return { html: out, state: state };
  }

  function highlight(src) {
    if (src == null) return "";
    var text = String(src).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    // 先整体转义，再逐行着色（转义不会产生引号变化，字符串匹配不受影响）
    text = escHtml(text);
    var lines = text.split("\n");
    var state = { inBlockComment: false };
    var htmlLines = [];
    for (var k = 0; k < lines.length; k++) {
      var r = highlightLine(lines[k], state);
      htmlLines.push('<span class="ln" data-n="' + (k + 1) + '">' + r.html + "</span>");
    }
    return htmlLines.join("\n");
  }

  function highlightAll(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll('pre code.cpp, pre code.lang-cpp');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.getAttribute("data-hl") === "1") continue;
      // 保留原始文本（含未高亮前），便于复制
      el.setAttribute("data-raw", el.textContent);
      el.innerHTML = highlight(el.textContent);
      el.setAttribute("data-hl", "1");
    }
  }

  window.CppLight = { highlight: highlight, highlightAll: highlightAll };
  document.addEventListener("DOMContentLoaded", function () { highlightAll(document); });
})();
