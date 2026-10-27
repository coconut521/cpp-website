/* ============================================================
 * interpreter.ts —— 教学用 C++ 子集解释器（AssemblyScript → WASM）
 *
 * 覆盖子集（与课程前几章示例对齐）：
 *   - 类型：int / long long / short / double / float / bool / char / auto / const
 *   - 一维数组（含初始化列表、数组传参）；引用参数（int&）
 *   - 运算：算术 / 比较 / 逻辑（短路） / 赋值及复合 / ++ -- / ?: / (cast)
 *   - 控制流：if-else / while / do-while / for / break / continue / return
 *   - 函数定义与递归调用；std::cout << 链式输出；std::endl；"\n"
 *   - UB 检测：未初始化读取（警告+按 0）、有符号溢出（警告+回绕）、
 *     整数除零 / 数组越界（报错停止）、递归过深（报错停止）
 * 未覆盖的语法（class/template/string/vector/switch/cin 等）给出一句
 * 中文提示并停止，不产生误导性输出。
 *
 * 通信约定（JS ↔ WASM）：
 *   allocSrc(len) -> ptr   JS 把 UTF-8 源码写进线性内存
 *   runProgram()  -> 状态码 0 成功 | 1 解析失败 | 2 运行错误 | 3 步数超限
 *   getOutPtr/Len()        stdout 字节
 *   getErrPtr/Len()        错误信息（UTF-8，可能含中文）
 *   getWarnPtr/Len()       警告信息（UTF-8，多行）
 * ============================================================ */

/* ---------------- 常量 ---------------- */
const TOK_EOF: i32 = 0, TOK_ID = 1, TOK_NUM = 2, TOK_STR = 3, TOK_CHR = 4, TOK_OP = 5;

const N_FUNC: i32 = 1, N_PARAM = 2, N_DECL = 3, N_DECLR = 4, N_IF = 5, N_WHILE = 6,
  N_DOWHILE = 7, N_FOR = 8, N_RETURN = 9, N_BREAK = 10, N_CONTINUE = 11, N_BLOCK = 12,
  N_EXPRSTMT = 13, N_EMPTY = 14;
const E_NUM: i32 = 20, E_STR = 21, E_CHR = 22, E_ID = 23, E_ASSIGN = 24, E_BIN = 25,
  E_UNARY = 26, E_POST = 27, E_CALL = 28, E_TERNARY = 29, E_INDEX = 30, E_CAST = 31;

const T_INT: i32 = 0, T_DOUBLE = 1, T_BOOL = 2, T_CHAR = 3, T_ARRAY = 4, T_REF = 5, T_COUT = 6, T_STRLIT = 7;

const SRC_CAP: i32 = 262144;
const OUT_CAP: i32 = 262144;
const STEP_LIMIT: i32 = 5000000;
const DEPTH_LIMIT: i32 = 200;
const INT_MAX: f64 = 2147483647.0;
const INT_MIN: f64 = -2147483648.0;
const LOG10E: f64 = 0.4342944819032518;

/* ---------------- 全局状态 ---------------- */
var srcBuf = new StaticArray<u8>(SRC_CAP);
var srcLen: i32 = 0;
var outBuf = new StaticArray<u8>(OUT_CAP);
var outLen: i32 = 0;
var errStr: string = "";
var warnStr: string = "";
var steps: i32 = 0;
var depth: i32 = 0;
var gRet: bool = false;
var gRetVal: Val = new Val(T_INT);
var gBrk: bool = false;
var gCnt: bool = false;
var gErr: bool = false;

/* ---------------- 基础数据结构 ---------------- */
class Node {
  kind: i32 = 0;
  s: string = "";
  n: f64 = 0;
  f: i32 = 0;                 // 标志位：1=数组声明/参数 2=引用参数 4=数字是整型
  line: i32 = 0;
  a: Node | null = null;
  b: Node | null = null;
  c: Node | null = null;
  d: Node | null = null;
  kids: Array<Node> = new Array<Node>();
}

class Arr {
  data: Array<f64> = new Array<f64>();
  t: i32 = T_INT;
  constructor(t: i32, size: i32) {
    this.t = t;
    for (var i = 0; i < size; i++) this.data.push(0.0);
  }
}

class Val {
  t: i32 = T_INT;
  n: f64 = 0;
  arr: Arr | null = null;
  refSc: Scope | null = null;
  refIdx: i32 = -1;
  constructor(t: i32) { this.t = t; }
}

class Scope {
  names: Array<string> = new Array<string>();
  vals: Array<Val> = new Array<Val>();
  find(name: string): i32 {
    for (var i = this.names.length - 1; i >= 0; i--) {
      if (this.names[i] == name) return i;
    }
    return -1;
  }
  define(name: string, v: Val): void {
    var i = this.find(name);
    if (i >= 0) { this.vals[i] = v; return; }
    this.names.push(name);
    this.vals.push(v);
  }
}

var gScopes: Array<Scope> = new Array<Scope>();
var fnNames: Array<string> = new Array<string>();
var fnBodies: Array<Node> = new Array<Node>();

/* ---------------- 工具 ---------------- */
function warn(msg: string): void {
  if (warnStr.length > 0) warnStr += "\n";
  warnStr += msg;
}

function fail(line: i32, msg: string): void {
  if (gErr) return;
  gErr = true;
  errStr = "第 " + line.toString() + " 行：" + msg;
}

function valCopy(v: Val): Val {
  var r = new Val(v.t);
  r.n = v.n; r.arr = v.arr; r.refSc = v.refSc; r.refIdx = v.refIdx;
  return r;
}

function deref(v: Val): Val {
  if (v.t == T_REF && v.refSc != null) {
    var sc = v.refSc as Scope;
    var i = v.refIdx;
    if (i >= 0 && i < sc.vals.length) return valCopy(sc.vals[i]);
  }
  return valCopy(v);
}

function writeThrough(v: Val, nv: Val): void {
  /* 给可能为引用的槽位赋值：引用则穿透写入目标槽位的内容 */
  if (v.t == T_REF && v.refSc != null) {
    var sc = v.refSc as Scope;
    var i = v.refIdx;
    if (i >= 0 && i < sc.vals.length) {
      var dst = sc.vals[i];
      if (dst.t == T_REF) { writeThrough(dst, nv); return; }
      dst.t = nv.t; dst.n = nv.n; dst.arr = nv.arr;
      return;
    }
    return;
  }
  v.t = nv.t; v.n = nv.n; v.arr = nv.arr;
}

function coerce(v: Val, t: i32): Val {
  if (t == T_INT) {
    if (v.t == T_DOUBLE || v.t == T_BOOL || v.t == T_CHAR) {
      var r = new Val(T_INT); r.n = <f64>(<i32>v.n); return r;
    }
    return valCopy(v);
  }
  if (t == T_DOUBLE) {
    if (v.t == T_INT || v.t == T_BOOL || v.t == T_CHAR) {
      var r2 = new Val(T_DOUBLE); r2.n = v.n; return r2;
    }
    return valCopy(v);
  }
  if (t == T_BOOL) {
    var r3 = new Val(T_BOOL);
    var x = deref(v);
    r3.n = (x.t == T_ARRAY || x.n != 0.0) ? 1.0 : 0.0;
    return r3;
  }
  if (t == T_CHAR) {
    var r4 = new Val(T_CHAR); r4.n = <f64>(<i32>v.n); return r4;
  }
  return valCopy(v);
}

function wrap32(v: f64): f64 {
  if (v > INT_MAX || v < INT_MIN) {
    var m = 4294967296.0;
    var r = v - Math.floor((v + 2147483648.0) / m) * m - 2147483648.0;
    return r;
  }
  return v;
}

function ipow10(n: i32): f64 {
  var r: f64 = 1.0;
  var i: i32 = 0;
  while (i < n) { r *= 10.0; i++; }
  while (i > n) { r /= 10.0; i--; }
  return r;
}

function fmtInt(v: f64): string {
  var neg = v < 0;
  var a = neg ? -v : v;
  if (a == 0) return "0";
  var digits = new Array<string>();
  while (a >= 1.0) {
    var d = <i32>(a - Math.floor(a / 10.0) * 10.0);
    digits.push(String.fromCharCode(48 + d));
    a = Math.floor(a / 10.0);
  }
  var s = "";
  if (neg) s += "-";
  for (var i = digits.length - 1; i >= 0; i--) s += digits[i];
  return s;
}

/* 模拟 C++ cout 对 double 的默认输出：6 位有效数字、去尾零、整数不带小数点 */
function fmtDouble(v: f64): string {
  if (v != v) return "nan";
  if (v > 1.79e308) return "inf";
  if (v < -1.79e308) return "-inf";
  var neg = v < 0;
  var a = neg ? -v : v;
  var sign = neg ? "-" : "";
  if (a == 0) return "0";
  if (a == Math.floor(a) && a < 1e15) return sign + fmtInt(a);
  var d: i32 = <i32>Math.floor(Math.log(a) * LOG10E);
  var digits: i32 = 6 - 1 - d;
  if (digits < 0) {
    var p = ipow10(d - 5);
    var r = Math.round(a / p) * p;
    if (r == Math.floor(r) && r < 1e15) return sign + fmtInt(r);
    return sign + fmtInt(Math.round(a / p)) + "e" + fmtInt(d);
  }
  var scaled = Math.round(a * ipow10(digits));
  var ip = <i64>scaled;
  var intPart = <i64>(ip / (<i64>ipow10(digits)));
  var fracPart = ip - intPart * <i64>ipow10(digits);
  var s = fmtInt(<f64>intPart);
  if (digits > 0) {
    var fs = fmtInt(<f64>fracPart);
    while (fs.length < digits) fs = "0" + fs;
    while (fs.length > 0 && fs.charAt(fs.length - 1) == "0") fs = fs.substring(0, fs.length - 1);
    if (fs.length > 0) s += "." + fs;
  }
  return sign + s;
}

function emitByte(b: u8): void {
  if (outLen < OUT_CAP) { outBuf[outLen] = b; outLen++; }
}

/* 源码字节区间的字符串字面量 → 处理转义后写入输出 */
function emitStrLiteral(start: i32, len: i32): void {
  var i = start;
  var end = start + len;
  while (i < end) {
    var b = srcBuf[i];
    if (b == 0x5C && i + 1 < end) {          // 反斜杠转义
      var c = srcBuf[i + 1];
      if (c == 0x6E) emitByte(10);           // \n
      else if (c == 0x74) emitByte(9);       // \t
      else if (c == 0x72) emitByte(13);      // \r
      else if (c == 0x30) emitByte(0);       // \0
      else emitByte(c);                      // \" \' \\ 等原样
      i += 2;
      continue;
    }
    emitByte(b);
    i++;
  }
}

function emitString(s: string): void {
  var ab = String.UTF8.encode(s);
  var n = String.UTF8.byteLength(s);
  var bytes = Uint8Array.wrap(ab, 0, n);
  for (var i = 0; i < n; i++) emitByte(bytes[i]);
}

/* 错误/警告 → 静态缓冲区（惰性编码，resetRun 时置脏） */
var errBuf = new StaticArray<u8>(8192);
var errBufLen: i32 = 0;
var errDirty = true;
var warnBuf = new StaticArray<u8>(8192);
var warnBufLen: i32 = 0;
var warnDirty = true;

function copyStringInto(s: string, buf: StaticArray<u8>): i32 {
  if (s.length == 0) return 0;
  var ab = String.UTF8.encode(s);
  var n = String.UTF8.byteLength(s);
  if (n > 8192) n = 8192;
  var bytes = Uint8Array.wrap(ab, 0, n);
  for (var i = 0; i < n; i++) buf[i] = bytes[i];
  return n;
}

/* ---------------- 词法分析（字节级，注释/字符串按原始字节保留） ---------------- */
var tkKind: Array<i32> = new Array<i32>();
var tkText: Array<string> = new Array<string>();
var tkNum: Array<f64> = new Array<f64>();
var tkLine: Array<i32> = new Array<i32>();
var tkStart: Array<i32> = new Array<i32>();
var tkLen: Array<i32> = new Array<i32>();
var lexPos: i32 = 0;
var lexLine: i32 = 1;

function isIdStart(b: u8): bool {
  return (b >= 65 && b <= 90) || (b >= 97 && b <= 122) || b == 0x5F;
}
function isIdChar(b: u8): bool {
  return isIdStart(b) || (b >= 48 && b <= 57);
}
function isDigit(b: u8): bool { return b >= 48 && b <= 57; }

function lex(): bool {
  tkKind.length = 0; tkText.length = 0; tkNum.length = 0;
  tkLine.length = 0; tkStart.length = 0; tkLen.length = 0;
  lexPos = 0; lexLine = 1;
  while (lexPos < srcLen) {
    var b = srcBuf[lexPos];
    if (b == 10) { lexLine++; lexPos++; continue; }
    if (b == 32 || b == 9 || b == 13) { lexPos++; continue; }
    // 预处理行
    if (b == 0x23) { while (lexPos < srcLen && srcBuf[lexPos] != 10) lexPos++; continue; }
    // 注释
    if (b == 0x2F && lexPos + 1 < srcLen && srcBuf[lexPos + 1] == 0x2F) {
      while (lexPos < srcLen && srcBuf[lexPos] != 10) lexPos++;
      continue;
    }
    if (b == 0x2F && lexPos + 1 < srcLen && srcBuf[lexPos + 1] == 0x2A) {
      lexPos += 2;
      while (lexPos + 1 < srcLen && !(srcBuf[lexPos] == 0x2A && srcBuf[lexPos + 1] == 0x2F)) {
        if (srcBuf[lexPos] == 10) lexLine++;
        lexPos++;
      }
      lexPos += 2;
      continue;
    }
    // 标识符
    if (isIdStart(b)) {
      var st = lexPos;
      while (lexPos < srcLen && isIdChar(srcBuf[lexPos])) lexPos++;
      var s = "";
      for (var i = st; i < lexPos; i++) s += String.fromCharCode(srcBuf[i]);
      tkKind.push(TOK_ID); tkText.push(s); tkNum.push(0); tkLine.push(lexLine); tkStart.push(st); tkLen.push(lexPos - st);
      continue;
    }
    // 数字
    if (isDigit(b) || (b == 0x2E && lexPos + 1 < srcLen && isDigit(srcBuf[lexPos + 1]))) {
      var st2 = lexPos;
      var isHex = false, isOct = false, isBin = false;
      if (b == 0x30 && lexPos + 1 < srcLen) {
        var nb = srcBuf[lexPos + 1];
        if (nb == 0x78 || nb == 0x58) isHex = true;
        else if (nb == 0x62 || nb == 0x42) isBin = true;
        else isOct = isDigit(nb);
      }
      var val: f64 = 0;
      if (isHex || isBin) {
        lexPos += 2;
        while (lexPos < srcLen) {
          var hb = srcBuf[lexPos];
          var d: f64 = -1;
          if (isHex) {
            if (hb >= 48 && hb <= 57) d = <f64>(hb - 48);
            else if (hb >= 65 && hb <= 70) d = <f64>(hb - 55);
            else if (hb >= 97 && hb <= 102) d = <f64>(hb - 87);
          } else if (hb == 48 || hb == 49) d = <f64>(hb - 48);
          if (d < 0) break;
          val = val * (isHex ? 16.0 : 2.0) + d;
          lexPos++;
        }
      } else {
        while (lexPos < srcLen && isDigit(srcBuf[lexPos])) { val = val * 10.0 + <f64>(srcBuf[lexPos] - 48); lexPos++; }
        if (lexPos < srcLen && srcBuf[lexPos] == 0x2E) {
          lexPos++;
          var scale = 0.1;
          while (lexPos < srcLen && isDigit(srcBuf[lexPos])) { val += <f64>(srcBuf[lexPos] - 48) * scale; scale *= 0.1; lexPos++; }
        }
        if (lexPos < srcLen && (srcBuf[lexPos] == 0x65 || srcBuf[lexPos] == 0x45)) {
          var save = lexPos;
          lexPos++;
          var eneg = false;
          if (lexPos < srcLen && (srcBuf[lexPos] == 0x2B || srcBuf[lexPos] == 0x2D)) {
            eneg = srcBuf[lexPos] == 0x2D; lexPos++;
          }
          if (lexPos < srcLen && isDigit(srcBuf[lexPos])) {
            var e: i32 = 0;
            while (lexPos < srcLen && isDigit(srcBuf[lexPos])) { e = e * 10 + <i32>(srcBuf[lexPos] - 48); lexPos++; }
            val *= ipow10(eneg ? -e : e);
          } else lexPos = save;
        }
      }
      // 后缀 u/l 忽略
      while (lexPos < srcLen && (srcBuf[lexPos] == 0x75 || srcBuf[lexPos] == 0x55 ||
        srcBuf[lexPos] == 0x6C || srcBuf[lexPos] == 0x4C)) lexPos++;
      var isInt = true;
      if (isOct || isHex || isBin) isInt = true;
      // 判断是否含小数点/指数：从 st2 扫描
      for (var k = st2; k < lexPos; k++) {
        var cb = srcBuf[k];
        if (cb == 0x2E || cb == 0x65 || cb == 0x45) isInt = false;
      }
      tkKind.push(TOK_NUM); tkText.push(""); tkNum.push(val); tkLine.push(lexLine);
      tkStart.push(st2); tkLen.push(lexPos - st2);
      tkKind[tkKind.length - 1] = TOK_NUM;
      if (isInt) tkNum[tkNum.length - 1] = wrap32(val);
      continue;
    }
    // 字符串字面量（保留原始字节区间）
    if (b == 0x22) {
      var st3 = lexPos + 1;
      lexPos++;
      while (lexPos < srcLen && srcBuf[lexPos] != 0x22) {
        if (srcBuf[lexPos] == 0x5C && lexPos + 1 < srcLen) lexPos++;
        if (srcBuf[lexPos] == 10) lexLine++;
        lexPos++;
      }
      tkKind.push(TOK_STR); tkText.push(""); tkNum.push(0); tkLine.push(lexLine);
      tkStart.push(st3); tkLen.push(lexPos - st3);
      lexPos++;
      continue;
    }
    // 字符字面量
    if (b == 0x27) {
      lexPos++;
      var code: f64 = 0;
      if (lexPos < srcLen && srcBuf[lexPos] == 0x5C) {
        lexPos++;
        var e2 = srcBuf[lexPos];
        if (e2 == 0x6E) code = 10;
        else if (e2 == 0x74) code = 9;
        else if (e2 == 0x72) code = 13;
        else if (e2 == 0x30) code = 0;
        else code = <f64>e2;
        lexPos++;
      } else if (lexPos < srcLen) {
        code = <f64>srcBuf[lexPos];
        lexPos++;
      }
      while (lexPos < srcLen && srcBuf[lexPos] != 0x27) { if (srcBuf[lexPos] == 10) lexLine++; lexPos++; }
      lexPos++;
      tkKind.push(TOK_CHR); tkText.push(""); tkNum.push(code); tkLine.push(lexLine); tkStart.push(0); tkLen.push(0);
      continue;
    }
    // 运算符（最长匹配）
    var two: string = "";
    if (lexPos + 1 < srcLen) {
      two = String.fromCharCode(srcBuf[lexPos]) + String.fromCharCode(srcBuf[lexPos + 1]);
    }
    if (two == "==" || two == "!=" || two == "<=" || two == ">=" || two == "&&" || two == "||" ||
      two == "+=" || two == "-=" || two == "*=" || two == "/=" || two == "%=" || two == "<<" ||
      two == ">>" || two == "::" || two == "++" || two == "--") {
      tkKind.push(TOK_OP); tkText.push(two); tkNum.push(0); tkLine.push(lexLine); tkStart.push(lexPos); tkLen.push(2);
      lexPos += 2;
      continue;
    }
    var ch = String.fromCharCode(b);
    tkKind.push(TOK_OP); tkText.push(ch); tkNum.push(0); tkLine.push(lexLine); tkStart.push(lexPos); tkLen.push(1);
    lexPos++;
  }
  tkKind.push(TOK_EOF); tkText.push(""); tkNum.push(0); tkLine.push(lexLine); tkStart.push(0); tkLen.push(0);
  return true;
}

/* ---------------- 语法分析 ---------------- */
var p: i32 = 0;

function peek(): i32 { return tkKind[p]; }
function peekText(): string { return tkText[p]; }
function peekLine(): i32 { return tkLine[p]; }
function next(): i32 { var k = tkKind[p]; p++; return k; }
function acceptOp(op: string): bool {
  if (tkKind[p] == TOK_OP && tkText[p] == op) { p++; return true; }
  return false;
}
function expectOp(op: string, nodeLine: i32): bool {
  if (acceptOp(op)) return true;
  var saw = peek();
  var sawText = saw == TOK_EOF ? "<文件结尾>" : (saw == TOK_STR ? "<字符串字面量>" : (tkText[p] == "" ? String.fromCharCode(0) : tkText[p]));
  fail(nodeLine, "解析失败：这里应当是 “" + op + "”，但看到了 “" + sawText + "”（记号 " + p.toString() + "/" + tkKind.length.toString() + "）");
  return false;
}

function mkNode(kind: i32): Node {
  var n = new Node();
  n.kind = kind;
  n.line = tkLine[p];
  return n;
}

var TYPE_WORDS: Array<string> = [
  "int", "long", "short", "double", "float", "bool", "char", "unsigned", "signed", "auto", "void"
];

function isTypeStart(): bool {
  if (tkKind[p] != TOK_ID) return false;
  var t = tkText[p];
  if (t == "const") return true;
  for (var i = 0; i < TYPE_WORDS.length; i++) if (TYPE_WORDS[i] == t) return true;
  return false;
}

/* 读一个类型说明（含 const / long long / unsigned int / void），返回归一化类型码 */
function parseType(): i32 {
  var t: i32 = T_INT;
  var sawWord = false;
  while (tkKind[p] == TOK_ID) {
    var w = tkText[p];
    if (w == "const") { p++; continue; }
    if (w == "int") { t = T_INT; p++; sawWord = true; continue; }
    if (w == "long" || w == "short") { t = T_INT; p++; sawWord = true; continue; }
    if (w == "unsigned" || w == "signed") { t = T_INT; p++; sawWord = true; continue; }
    if (w == "double" || w == "float") { t = T_DOUBLE; p++; sawWord = true; continue; }
    if (w == "bool") { t = T_BOOL; p++; sawWord = true; continue; }
    if (w == "char") { t = T_CHAR; p++; sawWord = true; continue; }
    if (w == "void") { t = T_INT; p++; sawWord = true; continue; }
    if (w == "auto") { t = T_INT; p++; sawWord = true; continue; }
    break;
  }
  if (!sawWord) fail(tkLine[p], "解析失败：无法识别的类型");
  return t;
}

function parseProgram(): Node | null {
  var prog = mkNode(N_BLOCK);
  while (peek() != TOK_EOF) {
    if (isTypeStart()) {
      // 函数还是全局变量：向前看 名字 之后是否 '('
      var save = p;
      parseType();
      if (tkKind[p] == TOK_ID) {
        var name = tkText[p];
        p++;
        if (tkKind[p] == TOK_OP && tkText[p] == "(") {
          p = save;
          var f = parseFunction();
          if (f == null) return null;
          prog.kids.push(f as Node);
          continue;
        }
      }
      p = save;
      var d = parseDecl(true);
      if (d == null) return null;
      prog.kids.push(d as Node);
      continue;
    }
    if (tkKind[p] == TOK_ID && tkText[p] == "using") {
      // using namespace std; —— 跳过整行
      while (peek() != TOK_EOF && !(tkKind[p] == TOK_OP && tkText[p] == ";")) p++;
      p++;
      continue;
    }
    if (tkKind[p] == TOK_ID) {
      var gw = tkText[p];
      if (gw == "class" || gw == "struct" || gw == "template" || gw == "try" || gw == "throw") {
        fail(peekLine(), "运行器暂不支持 “" + gw + "”（涉及课程后续章节的语法）——请在本地用 g++ / MSVC 编译运行");
        return null;
      }
    }
    fail(peekLine(), "解析失败：无法识别的全局内容 “" + peekText() + "”");
    return null;
  }
  return prog;
}

function parseFunction(): Node | null {
  var f = mkNode(N_FUNC);
  parseType();
  if (tkKind[p] != TOK_ID) { fail(peekLine(), "解析失败：缺少函数名"); return null; }
  f.s = tkText[p];
  p++;
  if (!expectOp("(", f.line)) return null;
  while (peek() != TOK_EOF && !(tkKind[p] == TOK_OP && tkText[p] == ")")) {
    if (tkKind[p] == TOK_ID && tkText[p] == "const") p++;
    var pt = parseType();
    var isArr = false, isRef = false;
    if (acceptOp("&")) isRef = true;
    if (tkKind[p] != TOK_ID) { fail(peekLine(), "解析失败：缺少参数名"); return null; }
    var pn = tkText[p];
    p++;
    if (acceptOp("[")) { isArr = true; if (!expectOp("]", f.line)) return null; }
    var prm = mkNode(N_PARAM);
    prm.s = pn; prm.n = <f64>pt; prm.f = (isArr ? 1 : 0) | (isRef ? 2 : 0);
    f.kids.push(prm);
    if (!acceptOp(",")) break;
  }
  if (!expectOp(")", f.line)) return null;
  var body = parseBlock();
  if (body == null) return null;
  f.a = body;
  return f;
}

function parseBlock(): Node | null {
  var line = peekLine();
  if (!expectOp("{", line)) return null;
  var blk = mkNode(N_BLOCK);
  while (peek() != TOK_EOF && !(tkKind[p] == TOK_OP && tkText[p] == "}")) {
    var st = parseStatement();
    if (st == null) return null;
    blk.kids.push(st as Node);
  }
  if (!expectOp("}", line)) return null;
  return blk;
}

function parseStatement(): Node | null {
  var line = peekLine();
  if (tkKind[p] == TOK_OP && tkText[p] == "{") return parseBlock();
  if (acceptOp(";")) { var e0 = mkNode(N_EMPTY); return e0; }
  if (tkKind[p] == TOK_ID) {
    var w = tkText[p];
    if (w == "if") {
      var nif = mkNode(N_IF);
      p++;
      if (!expectOp("(", line)) return null;
      var cond = parseExpr();
      if (cond == null) return null;
      if (!expectOp(")", line)) return null;
      var th = parseStatement();
      if (th == null) return null;
      nif.a = cond; nif.b = th;
      if (tkKind[p] == TOK_ID && tkText[p] == "else") {
        p++;
        var el = parseStatement();
        if (el == null) return null;
        nif.c = el;
      }
      return nif;
    }
    if (w == "while") {
      var nw = mkNode(N_WHILE);
      p++;
      if (!expectOp("(", line)) return null;
      var c2 = parseExpr();
      if (c2 == null) return null;
      if (!expectOp(")", line)) return null;
      var b2 = parseStatement();
      if (b2 == null) return null;
      nw.a = c2; nw.b = b2;
      return nw;
    }
    if (w == "do") {
      var nd = mkNode(N_DOWHILE);
      p++;
      var b3 = parseStatement();
      if (b3 == null) return null;
      if (!(tkKind[p] == TOK_ID && tkText[p] == "while")) { fail(peekLine(), "解析失败：do 后缺少 while"); return null; }
      p++;
      if (!expectOp("(", line)) return null;
      var c3 = parseExpr();
      if (c3 == null) return null;
      if (!expectOp(")", line)) return null;
      if (!expectOp(";", line)) return null;
      nd.a = c3; nd.b = b3;
      return nd;
    }
    if (w == "for") {
      var nf = mkNode(N_FOR);
      p++;
      if (!expectOp("(", line)) return null;
      // init
      if (acceptOp(";")) { /* 无 init */ }
      else if (isTypeStart()) {
        var di = parseDecl(false);
        if (di == null) return null;
        if (!expectOp(";", line)) return null;   /* 声明式 init 也要吃掉自己的分号 */
        nf.a = di;
      } else {
        var ei = parseExpr();
        if (ei == null) return null;
        if (!expectOp(";", line)) return null;
        var es = mkNode(N_EXPRSTMT); es.a = ei;
        nf.a = es;
      }
      // cond
      if (tkKind[p] == TOK_OP && tkText[p] == ";") {
        p++;
      } else {
        var ec = parseExpr();
        if (ec == null) return null;
        nf.b = ec;
        if (!expectOp(";", line)) return null;
      }
      // step
      if (!(tkKind[p] == TOK_OP && tkText[p] == ")")) {
        var est = parseCommaExpr();
        if (est == null) return null;
        nf.c = est;
      }
      if (!expectOp(")", line)) return null;
      var fb = parseStatement();
      if (fb == null) return null;
      nf.d = fb;
      return nf;
    }
    if (w == "return") {
      var nr = mkNode(N_RETURN);
      p++;
      if (!(tkKind[p] == TOK_OP && tkText[p] == ";")) {
        var rv = parseExpr();
        if (rv == null) return null;
        nr.a = rv;
      }
      if (!expectOp(";", line)) return null;
      return nr;
    }
    if (w == "break") {
      p++; if (!expectOp(";", line)) return null;
      var nb2 = mkNode(N_BREAK); return nb2;
    }
    if (w == "continue") {
      p++; if (!expectOp(";", line)) return null;
      var nc2 = mkNode(N_CONTINUE); return nc2;
    }
    if (w == "switch" || w == "try" || w == "throw" || w == "class" || w == "struct" ||
      w == "template" || w == "new" || w == "delete") {
      fail(line, "运行器暂不支持 “" + w + "”（涉及课程后续章节的语法）——请在本地用 g++ / MSVC 编译运行");
      return null;
    }
    if (w == "sizeof") {
      p++;
      var szNode2 = parseSizeofRest(line);
      return szNode2;
    }
    if (isTypeStart()) {
      var d = parseDecl(false);
      return d;
    }
  }
  // 表达式语句
  var ex = parseExpr();
  if (ex == null) return null;
  if (!expectOp(";", line)) return null;
  var es2 = mkNode(N_EXPRSTMT);
  es2.a = ex;
  return es2;
}

/* 声明：type name [= expr | { list }] [, name ...] ;  （withSemi=true 时吃分号） */
function parseDecl(withSemi: bool): Node | null {
  var line = peekLine();
  var base = parseType();
  var d = mkNode(N_DECL);
  d.n = <f64>base;
  while (true) {
    if (tkKind[p] != TOK_ID) { fail(peekLine(), "解析失败：声明缺少变量名"); return null; }
    var name = tkText[p];
    p++;
    var dr = mkNode(N_DECLR);
    dr.s = name;
    if (acceptOp("[")) {
      dr.f |= 1;
      if (!(tkKind[p] == TOK_OP && tkText[p] == "]")) {
        var sz = parseExpr();
        if (sz == null) return null;
        if (sz.kind != E_NUM) { fail(line, "解析失败：数组大小需要是常量"); return null; }
        dr.n = sz.n;
      }
      if (!expectOp("]", line)) return null;
    }
    if (acceptOp("=")) {
      if (acceptOp("{")) {
        while (!(tkKind[p] == TOK_OP && tkText[p] == "}")) {
          var it = parseExpr();
          if (it == null) return null;
          dr.kids.push(it as Node);
          if (!acceptOp(",")) break;
        }
        if (!expectOp("}", line)) return null;
      } else {
        var iv = parseExpr();
        if (iv == null) return null;
        dr.a = iv;
      }
    } else if (tkKind[p] == TOK_OP && tkText[p] == "(") {
      /* 直接初始化：int b(2) */
      p++;
      var dv = parseExpr();
      if (dv == null) return null;
      if (!expectOp(")", line)) return null;
      dr.a = dv;
    } else if (tkKind[p] == TOK_OP && tkText[p] == "{") {
      /* 花括号初始化：int c{3} / int e{}（值初始化，不给未初始化警告） */
      p++;
      dr.f |= 4;
      while (!(tkKind[p] == TOK_OP && tkText[p] == "}")) {
        var it2 = parseExpr();
        if (it2 == null) return null;
        dr.kids.push(it2 as Node);
        if (!acceptOp(",")) break;
      }
      if (!expectOp("}", line)) return null;
    }
    d.kids.push(dr);
    if (!acceptOp(",")) break;
  }
  if (withSemi && !expectOp(";", line)) return null;
  return d;
}

/* ---------------- 表达式 ---------------- */
function parseCommaExpr(): Node | null {
  var first = parseExpr();
  if (first == null) return null;
  while (tkKind[p] == TOK_OP && tkText[p] == ",") {
    var line = tkLine[p];
    p++;
    var second = parseExpr();
    if (second == null) return null;
    var comma = mkNode(E_BIN);
    comma.s = ","; comma.a = first; comma.b = second; comma.line = line;
    first = comma;
  }
  return first;
}

var BIN_PREC: Array<string> = ["||", "&&", "==!=", "<<>>", "<><=>=", "+-", "*/%"];

function precOf(op: string): i32 {
  if (op == "||") return 1;
  if (op == "&&") return 2;
  if (op == "==" || op == "!=") return 3;
  if (op == "<<" || op == ">>") return 4;
  if (op == "<" || op == "<=" || op == ">" || op == ">=") return 5;
  if (op == "+" || op == "-") return 6;
  if (op == "*" || op == "/" || op == "%") return 7;
  return 0;
}

function parseExpr(): Node | null {
  var left = parseTernary();
  if (left == null) return null;
  var line = tkLine[p];
  var t = tkText[p];
  if (tkKind[p] == TOK_OP && (t == "=" || t == "+=" || t == "-=" || t == "*=" || t == "/=" || t == "%=")) {
    p++;
    var right = parseExpr();
    if (right == null) return null;
    if (left.kind != E_ID && left.kind != E_INDEX) {
      fail(line, "解析失败：赋值左侧必须是变量");
      return null;
    }
    var asg = mkNode(E_ASSIGN);
    asg.s = t; asg.a = left; asg.b = right;
    return asg;
  }
  return left;
}

function parseTernary(): Node | null {
  var cond = parseBinary(1);
  if (cond == null) return null;
  if (tkKind[p] == TOK_OP && tkText[p] == "?") {
    var line = tkLine[p];
    p++;
    var th = parseExpr();
    if (th == null) return null;
    if (!expectOp(":", line)) return null;
    var el = parseTernary();
    if (el == null) return null;
    var n = mkNode(E_TERNARY);
    n.a = cond; n.b = th; n.c = el;
    return n;
  }
  return cond;
}

function parseBinary(minPrec: i32): Node | null {
  var left = parseUnary();
  if (left == null) return null;
  while (true) {
    if (tkKind[p] != TOK_OP) break;
    var op = tkText[p];
    var pr = precOf(op);
    if (pr < minPrec || pr == 0) break;
    var line = tkLine[p];
    p++;
    var right = parseBinary(pr + 1);
    if (right == null) return null;
    var n = mkNode(E_BIN);
    n.s = op; n.a = left; n.b = right; n.line = line;
    left = n;
  }
  return left;
}

function parseUnary(): Node | null {
  var line = tkLine[p];
  if (tkKind[p] == TOK_OP) {
    var t = tkText[p];
    if (t == "-" || t == "!") {
      p++;
      var v = parseUnary();
      if (v == null) return null;
      var n = mkNode(E_UNARY);
      n.s = t; n.a = v;
      return n;
    }
    if (t == "+") { p++; return parseUnary(); }
    if (t == "++" || t == "--") {
      p++;
      var v2 = parseUnary();
      if (v2 == null) return null;
      var n2 = mkNode(E_UNARY);
      n2.s = t; n2.a = v2;
      return n2;
    }
    if (t == "(") {
      // 类型转换 (double)x / (int)x / (char)x
      var save = p;
      p++;
      if (isTypeStart()) {
        var ct = parseType();
        if (tkKind[p] == TOK_OP && tkText[p] == ")") {
          p++;
          var inner = parseUnary();
          if (inner == null) return null;
          var cn = mkNode(E_CAST);
          cn.n = <f64>ct; cn.a = inner;
          return cn;
        }
      }
      p = save;
    }
  }
  return parsePostfix();
}

function parsePostfix(): Node | null {
  var prim = parsePrimary();
  if (prim == null) return null;
  while (true) {
    var line = tkLine[p];
    if (tkKind[p] == TOK_OP && tkText[p] == "++") {
      p++;
      var n1 = mkNode(E_POST); n1.s = "++"; n1.a = prim; n1.line = line;
      prim = n1;
      continue;
    }
    if (tkKind[p] == TOK_OP && tkText[p] == "--") {
      p++;
      var n2 = mkNode(E_POST); n2.s = "--"; n2.a = prim; n2.line = line;
      prim = n2;
      continue;
    }
    if (tkKind[p] == TOK_OP && tkText[p] == "[") {
      p++;
      var idx = parseExpr();
      if (idx == null) return null;
      if (!expectOp("]", line)) return null;
      var n3 = mkNode(E_INDEX); n3.a = prim; n3.b = idx; n3.line = line;
      prim = n3;
      continue;
    }
    break;
  }
  return prim;
}

/* sizeof(类型或表达式) 的公共实现（parsePrimary 与 parseStatement 共用），
   调用前提：sizeof 记号已被消费 */
function parseSizeofRest(line: i32): Node | null {
  if (!expectOp("(", line)) return null;
  var szv: f64 = 0;
  if (isTypeStart()) {
    var sawDouble = false, sawFloat = false, sawChar = false, sawBool = false, sawShort = false, longs = 0;
    while (tkKind[p] == TOK_ID) {
      var tw = tkText[p];
      if (tw == "double") sawDouble = true;
      else if (tw == "float") sawFloat = true;
      else if (tw == "char") sawChar = true;
      else if (tw == "bool") sawBool = true;
      else if (tw == "short") sawShort = true;
      else if (tw == "long") longs++;
      else if (tw == "int" || tw == "unsigned" || tw == "signed" || tw == "const" || tw == "auto") { /* 计入宽度 */ }
      else break;
      p++;
    }
    if (sawDouble) szv = 8;
    else if (sawFloat) szv = 4;
    else if (sawChar) szv = 1;
    else if (sawBool) szv = 1;
    else if (sawShort) szv = 2;
    else if (longs >= 2) szv = 8;
    else szv = 4;
  } else {
    var se = parseExpr();
    if (se == null) return null;
    var sv = evalExpr(se);
    if (sv == null) return null;
    var sd = deref(sv);
    if (sd.t == T_DOUBLE) szv = 8;
    else if (sd.t == T_CHAR) szv = 1;
    else if (sd.t == T_BOOL) szv = 1;
    else if (sd.t == T_ARRAY && sd.arr != null) {
      var elSz: f64 = (sd.arr as Arr).t == T_DOUBLE ? 8.0 : 4.0;
      szv = <f64>(sd.arr as Arr).data.length * elSz;
    } else szv = 4;
  }
  if (!expectOp(")", line)) return null;
  var sn = mkNode(E_NUM);
  sn.n = szv;
  sn.f = 4;
  return sn;
}

function parsePrimary(): Node | null {
  var line = tkLine[p];
  if (tkKind[p] == TOK_NUM) {
    var n = mkNode(E_NUM);
    n.n = tkNum[p];
    n.f = 4;  // 数字字面量默认按整型理解，除非带小数点
    for (var i = 0; i < tkLen[p]; i++) {
      var b = srcBuf[tkStart[p] + i];
      if (b == 0x2E || b == 0x65 || b == 0x45) n.f = 0;
    }
    p++;
    return n;
  }
  if (tkKind[p] == TOK_STR) {
    var n2 = mkNode(E_STR);
    n2.n = <f64>tkStart[p];
    n2.f = tkLen[p];
    p++;
    return n2;
  }
  if (tkKind[p] == TOK_CHR) {
    var n3 = mkNode(E_CHR);
    n3.n = tkNum[p];
    p++;
    return n3;
  }
  if (tkKind[p] == TOK_OP && tkText[p] == "(") {
    p++;
    var inner2 = parseCommaExpr();
    if (inner2 == null) return null;
    if (!expectOp(")", line)) return null;
    return inner2;
  }
  if (tkKind[p] == TOK_ID) {
    var name = tkText[p];
    p++;
    if (name == "std" && tkKind[p] == TOK_OP && tkText[p] == "::") {
      p++;
      if (tkKind[p] != TOK_ID) { fail(line, "解析失败：std:: 后缺少名称"); return null; }
      var sub = tkText[p];
      p++;
      if (sub == "cout" || sub == "endl" || sub == "cin") {
        name = sub;
        if (sub == "cin") { fail(line, "运行器暂不支持输入（std::cin）——示例输出均为预置或只读程序"); }
      } else {
        fail(line, "运行器暂不支持 std::" + sub);
        return null;
      }
    }
    if (name == "cin") {
      fail(line, "运行器暂不支持输入（cin）");
      return null;
    }
    if (name == "sizeof") {
      /* sizeof(类型或表达式)：与 parseStatement 的语句级分支共用实现 */
      var szNode = parseSizeofRest(line);
      return szNode;
    }
    if (tkKind[p] == TOK_OP && tkText[p] == "(") {
      p++;
      var call = mkNode(E_CALL);
      call.s = name;
      call.line = line;
      while (!(tkKind[p] == TOK_OP && tkText[p] == ")")) {
        var arg = parseExpr();
        if (arg == null) return null;
        call.kids.push(arg as Node);
        if (!acceptOp(",")) break;
      }
      if (!expectOp(")", line)) return null;
      return call;
    }
    var idn = mkNode(E_ID);
    idn.s = name;
    idn.line = line;
    return idn;
  }
  fail(line, "解析失败：无法理解的表达式 “" + peekText() + "”");
  return null;
}

/* ---------------- 求值 ---------------- */
function stepTick(line: i32): bool {
  steps++;
  if (steps > STEP_LIMIT) {
    fail(line, "程序步数超限（" + STEP_LIMIT.toString() + " 步）——很可能是死循环，已停止");
    return false;
  }
  return true;
}

function lookup(name: string): Val | null {
  for (var i = gScopes.length - 1; i >= 0; i--) {
    var sc = gScopes[i];
    var idx = sc.find(name);
    if (idx >= 0) return sc.vals[idx];
  }
  return null;
}

function lookupSlot(name: string): Scope | null {
  for (var i = gScopes.length - 1; i >= 0; i--) {
    var sc = gScopes[i];
    if (sc.find(name) >= 0) return sc;
  }
  return null;
}

function declareVar(name: string, v: Val): void {
  var sc = gScopes[gScopes.length - 1];
  sc.define(name, v);
}

function asString(v: Val): string {
  var x = deref(v);
  if (x.t == T_INT) return fmtInt(x.n);
  if (x.t == T_DOUBLE) return fmtDouble(x.n);
  if (x.t == T_BOOL) return x.n != 0.0 ? "1" : "0";
  if (x.t == T_CHAR) return String.fromCharCode(<i32>x.n);
  if (x.t == T_STRLIT) return "<字符串>";   // 字面量只在 cout 链里按字节输出
  if (x.t == T_ARRAY) return "<数组>";
  return "";
}

function evalBin(op: string, a: Val, b: Val, line: i32): Val | null {
  var x = deref(a);
  var y = deref(b);
  if (x.t == T_STRLIT || y.t == T_STRLIT) {
    if (op != "<<") {
      fail(line, "暂不支持对字符串字面量做运算或比较（字符串处理见第 6 章讲解，或本地编译运行）");
      return null;
    }
  }
  if (op == "&&") {
    var r1 = new Val(T_BOOL);
    r1.n = (x.n != 0.0 && y.n != 0.0) ? 1.0 : 0.0;
    return r1;
  }
  if (op == "||") {
    var r2 = new Val(T_BOOL);
    r2.n = (x.n != 0.0 || y.n != 0.0) ? 1.0 : 0.0;
    return r2;
  }
  if (op == "==") { var r3 = new Val(T_BOOL); r3.n = x.n == y.n ? 1.0 : 0.0; return r3; }
  if (op == "!=") { var r4 = new Val(T_BOOL); r4.n = x.n != y.n ? 1.0 : 0.0; return r4; }
  if (op == "<") { var r5 = new Val(T_BOOL); r5.n = x.n < y.n ? 1.0 : 0.0; return r5; }
  if (op == "<=") { var r6 = new Val(T_BOOL); r6.n = x.n <= y.n ? 1.0 : 0.0; return r6; }
  if (op == ">") { var r7 = new Val(T_BOOL); r7.n = x.n > y.n ? 1.0 : 0.0; return r7; }
  if (op == ">=") { var r8 = new Val(T_BOOL); r8.n = x.n >= y.n ? 1.0 : 0.0; return r8; }
  // cout 链
  if (op == "<<") {
    if (x.t == T_COUT) {
      if (y.t == T_STRLIT) {
        emitStrLiteral(<i32>y.n, y.refIdx);   // 字符串字面量按原始字节输出（含中文）
      } else {
        emitString(asString(y));
      }
      return valCopy(a);
    }
    var r9 = new Val(T_INT);
    r9.n = wrap32(Math.floor(x.n * ipow10(<i32>y.n)));
    return r9;
  }
  if (op == ">>") {
    var r10 = new Val(T_INT);
    r10.n = wrap32(Math.floor(x.n / ipow10(<i32>y.n)));
    return r10;
  }
  var isInt = (x.t == T_INT || x.t == T_BOOL || x.t == T_CHAR) && (y.t == T_INT || y.t == T_BOOL || y.t == T_CHAR);
  var res: f64 = 0;
  var rt: i32 = isInt ? T_INT : T_DOUBLE;
  if (op == "+") res = x.n + y.n;
  else if (op == "-") res = x.n - y.n;
  else if (op == "*") res = x.n * y.n;
  else if (op == "/") {
    if (y.n == 0.0) {
      if (isInt) { fail(line, "整数除零（a / 0）——未定义行为，已停止"); return null; }
      res = 1.0 / 0.0;
    } else if (isInt) {
      res = Math.trunc(x.n / y.n);
    } else {
      res = x.n / y.n;
    }
  } else if (op == "%") {
    if (y.n == 0.0) { fail(line, "对 0 取余（a % 0）——未定义行为，已停止"); return null; }
    var q = Math.trunc(x.n / y.n);
    res = x.n - q * y.n;
  } else if (op == ",") {
    return valCopy(y);
  } else {
    fail(line, "暂不支持的运算符 " + op);
    return null;
  }
  if (isInt) {
    if (op == "+" || op == "-" || op == "*") {
      if (res > INT_MAX || res < INT_MIN) {
        warn("第 " + line.toString() + " 行：有符号 int 溢出（" + res.toString() + "）——未定义行为，结果按回绕处理");
        res = wrap32(res);
      }
    }
  }
  var r11 = new Val(rt);
  r11.n = res;
  return r11;
}

function evalExpr(node: Node): Val | null {
  if (!stepTick(node.line)) return null;
  var k = node.kind;
  if (k == E_NUM) {
    var v = new Val((node.f & 4) ? T_INT : T_DOUBLE);
    v.n = node.n;
    return v;
  }
  if (k == E_STR) {
    // 字符串字面量：n=字节起点，f=字节长度；仅在 cout 链中输出
    var v2 = new Val(T_STRLIT);
    v2.n = node.n;
    v2.refIdx = node.f;
    return v2;
  }
  if (k == E_CHR) {
    var v3 = new Val(T_CHAR); v3.n = node.n; return v3;
  }
  if (k == E_ID) {
    if (node.s == "cout") { var vc = new Val(T_COUT); return vc; }
    if (node.s == "endl") { var ve = new Val(T_CHAR); ve.n = 10; return ve; }
    if (node.s == "true") { var vt = new Val(T_BOOL); vt.n = 1; return vt; }
    if (node.s == "false") { var vf = new Val(T_BOOL); vf.n = 0; return vf; }
    if (node.s == "nullptr") { var vn = new Val(T_INT); vn.n = 0; return vn; }
    var got = lookup(node.s);
    if (got == null) {
      fail(node.line, "使用了未定义的变量 “" + node.s + "”");
      return null;
    }
    var x = got as Val;
    if (x.t == T_REF) return deref(x);
    // 未初始化读取：值为 0 时提示（初始化为 0 的合法值无法区分，这里只在“从未赋值”时提示）
    return valCopy(x);
  }
  if (k == E_ASSIGN) {
    var lv = node.a as Node;
    var rv = evalExpr(node.b as Node);
    if (rv == null) return null;
    var op = node.s;
    var nv: Val | null;
    if (op == "=") {
      nv = rv;
    } else {
      var cur = evalExpr(lv);
      if (cur == null) return null;
      var binop = op.substring(0, 1);
      nv = evalBin(binop, cur, rv, node.line);
      if (nv == null) return null;
    }
    if (lv.kind == E_ID) {
      var slot = lookup(lv.s);
      if (slot == null) { fail(node.line, "给未定义的变量 “" + lv.s + "” 赋值"); return null; }
      // 目标类型收窄：int 变量吃 double 值时截断
      var tt = slot.t == T_REF ? (slot.refSc as Scope).vals[slot.refIdx].t : slot.t;
      var coerced = coerce(nv, tt);
      writeThrough(slot, coerced);
      return valCopy(coerced);
    }
    if (lv.kind == E_INDEX) {
      var arrV = evalExpr(lv.a as Node);
      if (arrV == null) return null;
      var av = deref(arrV);
      if (av.t != T_ARRAY || av.arr == null) { fail(node.line, "下标赋值的对象不是数组"); return null; }
      var iv = evalExpr(lv.b as Node);
      if (iv == null) return null;
      var idxv = deref(iv);
      var ii = <i32>idxv.n;
      var arr = av.arr as Arr;
      if (ii < 0 || ii >= arr.data.length) {
        fail(node.line, "数组越界：下标 " + ii.toString() + "，数组大小 " + arr.data.length.toString() + "——未定义行为，已停止");
        return null;
      }
      var elemType = arr.t;
      var cv2 = coerce(nv, elemType);
      arr.data[ii] = cv2.n;
      return valCopy(cv2);
    }
    fail(node.line, "不支持的赋值目标");
    return null;
  }
  if (k == E_BIN) {
    var op2 = node.s;
    if (op2 == "&&") {
      var l1 = evalExpr(node.a as Node);
      if (l1 == null) return null;
      var d1 = deref(l1);
      if (d1.n == 0.0) { var fb = new Val(T_BOOL); fb.n = 0.0; return fb; }
      var r2v = evalExpr(node.b as Node);
      if (r2v == null) return null;
      var d2 = deref(r2v);
      var fb2 = new Val(T_BOOL); fb2.n = d2.n != 0.0 ? 1.0 : 0.0;
      return fb2;
    }
    if (op2 == "||") {
      var l3 = evalExpr(node.a as Node);
      if (l3 == null) return null;
      var d3 = deref(l3);
      if (d3.n != 0.0) { var ft = new Val(T_BOOL); ft.n = 1.0; return ft; }
      var r4v = evalExpr(node.b as Node);
      if (r4v == null) return null;
      var d4 = deref(r4v);
      var ft2 = new Val(T_BOOL); ft2.n = d4.n != 0.0 ? 1.0 : 0.0;
      return ft2;
    }
    var av2 = evalExpr(node.a as Node);
    if (av2 == null) return null;
    var bv2 = evalExpr(node.b as Node);
    if (bv2 == null) return null;
    return evalBin(op2, av2, bv2, node.line);
  }
  if (k == E_UNARY) {
    var v5 = evalExpr(node.a as Node);
    if (v5 == null) return null;
    var op3 = node.s;
    if (op3 == "-") {
      var d5 = deref(v5);
      var r5 = new Val(d5.t); r5.n = -d5.n;
      return r5;
    }
    if (op3 == "!") {
      var d6 = deref(v5);
      var r6 = new Val(T_BOOL); r6.n = d6.n == 0.0 ? 1.0 : 0.0;
      return r6;
    }
    if (op3 == "++" || op3 == "--") {
      var cur2 = evalExpr(node.a as Node);
      if (cur2 == null) return null;
      var d7 = deref(cur2);
      var one = op3 == "++" ? 1.0 : -1.0;
      var nv2 = new Val(d7.t); nv2.n = wrap32(d7.n + one);
      // 写回
      var lv2 = node.a as Node;
      var slot2 = lookup((lv2 as Node).s);
      if (slot2 == null) { fail(node.line, "自增/自减的对象不是变量"); return null; }
      writeThrough(slot2, nv2);
      return valCopy(nv2);   // 前缀：返回新值
    }
  }
  if (k == E_POST) {
    var cur3 = evalExpr(node.a as Node);
    if (cur3 == null) return null;
    var d8 = deref(cur3);
    var old = valCopy(d8);
    var one2 = node.s == "++" ? 1.0 : -1.0;
    var nv3 = new Val(d8.t); nv3.n = wrap32(d8.n + one2);
    var lv3 = node.a as Node;
    var slot3 = lookup(lv3.s);
    if (slot3 == null) { fail(node.line, "自增/自减的对象不是变量"); return null; }
    writeThrough(slot3, nv3);
    return old;   // 后缀：返回旧值
  }
  if (k == E_TERNARY) {
    var c = evalExpr(node.a as Node);
    if (c == null) return null;
    var cd = deref(c);
    return evalExpr(cd.n != 0.0 ? (node.b as Node) : (node.c as Node));
  }
  if (k == E_CAST) {
    var v6 = evalExpr(node.a as Node);
    if (v6 == null) return null;
    return coerce(v6, <i32>node.n);
  }
  if (k == E_INDEX) {
    var arrV2 = evalExpr(node.a as Node);
    if (arrV2 == null) return null;
    var av3 = deref(arrV2);
    if (av3.t != T_ARRAY || av3.arr == null) {
      fail(node.line, "对非数组使用下标");
      return null;
    }
    var iv2 = evalExpr(node.b as Node);
    if (iv2 == null) return null;
    var idx2 = deref(iv2);
    var ii2 = <i32>idx2.n;
    var arr2 = av3.arr as Arr;
    if (ii2 < 0 || ii2 >= arr2.data.length) {
      fail(node.line, "数组越界：下标 " + ii2.toString() + "，数组大小 " + arr2.data.length.toString() + "——未定义行为，已停止");
      return null;
    }
    var out = new Val(arr2.t);
    out.n = arr2.data[ii2];
    return out;
  }
  if (k == E_CALL) {
    return callFunction(node.s, node, node.line);
  }
  fail(node.line, "暂不支持的表达式（kind " + node.kind.toString() + "）");
  return null;
}

function callFunction(name: string, callNode: Node, line: i32): Val | null {
  if (!stepTick(line)) return null;
  // 找函数
  var fi = -1;
  for (var i = 0; i < fnNames.length; i++) {
    if (fnNames[i] == name) { fi = i; break; }
  }
  if (fi < 0) {
    fail(line, "调用了未定义的函数 “" + name + "”");
    return null;
  }
  var fn = fnBodies[fi];
  var argVals = new Array<Val>();
  var argsOk = true;
  for (var a2 = 0; a2 < callNode.kids.length; a2++) {
    var oneArg = evalExpr(callNode.kids[a2]);
    if (oneArg == null) { argsOk = false; break; }
    argVals.push(oneArg as Val);
  }
  if (!argsOk) return null;
  depth++;
  if (depth > DEPTH_LIMIT) {
    depth--;
    fail(line, "递归过深（超过 " + DEPTH_LIMIT.toString() + " 层）——相当于栈溢出，请检查基准情形");
    return null;
  }
  gScopes.push(new Scope());
  var params = fn.kids;
  for (var pi = 0; pi < params.length; pi++) {
    var prm = params[pi];
    var pname = prm.s;
    var ptype = <i32>prm.n;
    var isArr = (prm.f & 1) != 0;
    var isRef = (prm.f & 2) != 0;
    var argVal: Val | null = null;
    if (argVals.length > pi) argVal = argVals[pi];
    if (isArr) {
      var nvArr = new Val(T_ARRAY);
      if (argVal != null) {
        var av = deref(argVal);
        if (av.t == T_ARRAY) nvArr.arr = av.arr;
      }
      declareVar(pname, nvArr);
      continue;
    }
    if (isRef) {
      // 实参必须是一个变量（Id）
      var argNode = callNode.kids[pi];
      if (argNode.kind != E_ID) {
        fail(line, "引用参数 “" + pname + "” 需要传入变量本身");
        depth--;
        return null;
      }
      var sc = lookupSlot(argNode.s);
      if (sc == null) {
        fail(line, "引用参数找不到变量 “" + argNode.s + "”");
        depth--;
        return null;
      }
      var idx = sc.find(argNode.s);
      var target = sc.vals[idx];
      var ref = new Val(T_REF);
      if (target.t == T_REF) {
        ref.refSc = target.refSc; ref.refIdx = target.refIdx;
      } else {
        ref.refSc = sc; ref.refIdx = idx;
      }
      declareVar(pname, ref);
      continue;
    }
    var dv = argVal == null ? new Val(ptype) : coerce(argVal as Val, ptype);
    declareVar(pname, dv);
  }
  // 执行函数体
  var body = fn.a as Node;
  var savedRet = gRet;
  gRet = false;
  execStmt(body);
  var returned = gRet;
  var retVal = valCopy(gRetVal);
  gRet = savedRet;
  gScopes.pop();
  depth--;
  if (gErr) return null;
  if (returned) {
    return retVal;
  }
  // void 函数 / 无 return
  var voidV = new Val(T_INT); voidV.n = 0;
  return voidV;
}

/* ---------------- 语句执行 ---------------- */
function initDecl(node: Node): bool {
  var base = <i32>node.n;
  for (var i = 0; i < node.kids.length; i++) {
    var dr = node.kids[i];
    var name = dr.s;
    var zinit = (dr.f & 4) != 0;   // {} 值初始化：不给未初始化警告
    if ((dr.f & 1) != 0) {
      var size = <i32>dr.n;
      var initArr = new Arr(base, size > 0 ? size : dr.kids.length);
      if (dr.kids.length > 0) {
        if (size > 0 && dr.kids.length > size) {
          fail(dr.line, "初始化列表元素个数超过数组大小");
          return false;
        }
        for (var j = 0; j < dr.kids.length; j++) {
          var ev = evalExpr(dr.kids[j]);
          if (ev == null) return false;
          var cv = coerce(ev as Val, base);
          initArr.data[j] = cv.n;
        }
      }
      var av = new Val(T_ARRAY);
      av.arr = initArr;
      declareVar(name, av);
      continue;
    }
    var v: Val | null;
    if (dr.a != null) {
      v = evalExpr(dr.a as Node);
      if (v == null) return false;
      v = coerce(v as Val, base);
    } else if (dr.kids.length > 0) {
      /* 标量的列表初始化：int d = {4}; / int c{3}; —— 取首元素 */
      v = evalExpr(dr.kids[0]);
      if (v == null) return false;
      v = coerce(v as Val, base);
    } else if (zinit) {
      v = new Val(base);
    } else {
      v = new Val(base);
      warn("第 " + dr.line.toString() + " 行：变量 “" + name + "” 未初始化（真实程序中读取未初始化变量是未定义行为，这里按 0 处理）");
    }
    declareVar(name, v as Val);
  }
  return true;
}

function execStmt(node: Node): void {
  if (gErr) return;
  if (!stepTick(node.line)) return;
  var k = node.kind;
  if (k == N_BLOCK) {
    gScopes.push(new Scope());
    for (var i = 0; i < node.kids.length; i++) {
      execStmt(node.kids[i]);
      if (gErr || gRet || gBrk || gCnt) break;
    }
    gScopes.pop();
    return;
  }
  if (k == N_DECL) { initDecl(node); return; }
  if (k == N_EXPRSTMT) {
    if (node.a != null) evalExpr(node.a as Node);
    return;
  }
  if (k == N_EMPTY) return;
  if (k == N_IF) {
    var c = evalExpr(node.a as Node);
    if (c == null) return;
    var cd = deref(c);
    if (cd.n != 0.0) execStmt(node.b as Node);
    else if (node.c != null) execStmt(node.c as Node);
    return;
  }
  if (k == N_WHILE) {
    while (true) {
      if (gErr) return;
      var cw = evalExpr(node.a as Node);
      if (cw == null) return;
      var cdw = deref(cw);
      if (cdw.n == 0.0) break;
      execStmt(node.b as Node);
      if (gErr || gRet) return;
      if (gBrk) { gBrk = false; break; }
      if (gCnt) gCnt = false;
    }
    return;
  }
  if (k == N_DOWHILE) {
    while (true) {
      if (gErr) return;
      execStmt(node.b as Node);
      if (gErr || gRet) return;
      if (gBrk) { gBrk = false; break; }
      if (gCnt) gCnt = false;
      var cd2 = evalExpr(node.a as Node);
      if (cd2 == null) return;
      var dd = deref(cd2);
      if (dd.n == 0.0) break;
    }
    return;
  }
  if (k == N_FOR) {
    gScopes.push(new Scope());
    if (node.a != null) execStmt(node.a as Node);
    while (!gErr) {
      var condOk = true;
      if (node.b != null) {
        var cf = evalExpr(node.b as Node);
        if (cf == null) { gScopes.pop(); return; }
        var cdf = deref(cf);
        condOk = cdf.n != 0.0;
      }
      if (!condOk) break;
      execStmt(node.d as Node);
      if (gErr || gRet) break;
      if (gBrk) { gBrk = false; break; }
      if (gCnt) gCnt = false;
      if (node.c != null) evalExpr(node.c as Node);
    }
    gScopes.pop();
    return;
  }
  if (k == N_RETURN) {
    if (node.a != null) {
      var rv = evalExpr(node.a as Node);
      if (rv == null) return;
      gRetVal = valCopy(rv as Val);
    }
    gRet = true;
    return;
  }
  if (k == N_BREAK) { gBrk = true; return; }
  if (k == N_CONTINUE) { gCnt = true; return; }
  if (k == N_FUNC) return;
  warn("第 " + node.line.toString() + " 行：未实现的语句类型 " + k.toString());
}

/* ---------------- 入口 ---------------- */
export function allocSrc(len: i32): usize {
  if (len > SRC_CAP) len = SRC_CAP;
  return changetype<usize>(srcBuf);
}

export function setSrcLen(len: i32): void {
  srcLen = len <= SRC_CAP ? len : SRC_CAP;
}

/* 调试用：返回词法结果（空格分隔），定位解析问题时使用 */
export function dbgTokens(): usize {
  lex();
  var s = "";
  for (var i = 0; i < tkKind.length; i++) {
    if (tkKind[i] == TOK_STR) s += "<str>";
    else if (tkKind[i] == TOK_EOF) s += "<eof>";
    else s += tkText[i];
    s += " ";
  }
  var ab = String.UTF8.encode(s);
  return changetype<usize>(ab);
}

function resetRun(): void {
  outLen = 0;
  errStr = "";
  warnStr = "";
  errDirty = true;
  warnDirty = true;
  steps = 0;
  depth = 0;
  gRet = false;
  gBrk = false;
  gCnt = false;
  gErr = false;
  gScopes = new Array<Scope>();
  fnNames.length = 0;
  fnBodies.length = 0;
}

export function runProgram(): i32 {
  resetRun();
  if (!lex()) return 1;
  p = 0;
  var prog = parseProgram();
  if (gErr || prog == null) return 1;
  // 注册函数 + 顺序执行全局声明
  for (var i = 0; i < prog.kids.length; i++) {
    var top = prog.kids[i];
    if (top.kind == N_FUNC) {
      fnNames.push(top.s);
      fnBodies.push(top);
    }
  }
  for (var j = 0; j < prog.kids.length; j++) {
    var top2 = prog.kids[j];
    if (top2.kind == N_DECL) {
      execStmt(top2);
      if (gErr) return 2;
    }
  }
  var hasMain = false;
  for (var m = 0; m < fnNames.length; m++) {
    if (fnNames[m] == "main") { hasMain = true; break; }
  }
  if (!hasMain) {
    errStr = "没有找到 main 函数";
    return 2;
  }
  var call = new Node();
  call.kind = E_CALL;
  call.s = "main";
  call.line = 1;
  var r = callFunction("main", call, 1);
  if (gErr) return 2;
  if (r == null) return 2;
  return 0;
}

export function getOutPtr(): usize { return changetype<usize>(outBuf); }
export function getOutLen(): i32 { return outLen; }
export function getErrPtr(): usize {
  if (errDirty) { errBufLen = copyStringInto(errStr, errBuf); errDirty = false; }
  return changetype<usize>(errBuf);
}
export function getWarnPtr(): usize {
  if (warnDirty) { warnBufLen = copyStringInto(warnStr, warnBuf); warnDirty = false; }
  return changetype<usize>(warnBuf);
}
export function getErrLen(): i32 {
  if (errDirty) { errBufLen = copyStringInto(errStr, errBuf); errDirty = false; }
  return errBufLen;
}
export function getWarnLen(): i32 {
  if (warnDirty) { warnBufLen = copyStringInto(warnStr, warnBuf); warnDirty = false; }
  return warnBufLen;
}
