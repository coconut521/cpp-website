#!/usr/bin/env node
/* ============================================================
 * test-cpprun.mjs —— cpprun.wasm 解释器的 node 测试装置
 * 用法：node tools/test-cpprun.mjs
 * 独立于站点：直接实例化 WASM，验证教学子集的真实行为。
 * ============================================================ */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const wasmBytes = readFileSync(join(root, "assets", "wasm", "cpprun.wasm"));

const mod = await WebAssembly.instantiate(wasmBytes, { env: { abort: () => {}, seed: () => 1 } });
const ex = mod.instance.exports;

const enc = new TextEncoder();
const dec = new TextDecoder();

function run(source) {
  const bytes = enc.encode(source);
  const ptr = ex.allocSrc(bytes.length);
  const mem = new Uint8Array(ex.memory.buffer, ptr, bytes.length);
  mem.set(bytes);
  ex.setSrcLen(bytes.length);
  const status = ex.runProgram();
  const out = dec.decode(new Uint8Array(ex.memory.buffer, ex.getOutPtr(), ex.getOutLen()).slice());
  const err = dec.decode(new Uint8Array(ex.memory.buffer, ex.getErrPtr(), ex.getErrLen()).slice());
  const warn = dec.decode(new Uint8Array(ex.memory.buffer, ex.getWarnPtr(), ex.getWarnLen()).slice());
  return { status, out, err, warn };
}

let pass = 0, fail = 0;
function check(name, src, expect) {
  const r = run(src);
  const okOut = expect.out === undefined || r.out === expect.out;
  const okStatus = expect.status === undefined || r.status === expect.status;
  const okErrHas = expect.errHas === undefined || r.err.includes(expect.errHas);
  const okWarnHas = expect.warnHas === undefined || r.warn.includes(expect.warnHas);
  if (okOut && okStatus && okErrHas && okWarnHas) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name}`);
    console.log(`     status=${r.status} out=${JSON.stringify(r.out)} err=${JSON.stringify(r.err)} warn=${JSON.stringify(r.warn)}`);
  }
}

console.log("== 基础：变量与输出（ch01 示例） ==");
check("ch01 示例1", `#include <iostream>
int main() {
    int age = 20;
    double score = 91.5;
    char grade = 'A';
    bool pass = true;
    std::cout << age << " " << score << " " << grade << " " << pass << "\\n";
    return 0;
}`, { out: "20 91.5 A 1\n" });

check("ch01 示例2（五种初始化）", `#include <iostream>
int main() {
    int a = 1, b(2), c{3}, d = {4}, e{};
    std::cout << a << " " << b << " " << c << " " << d << " " << e << "\\n";
    return 0;
}`, { out: "1 2 3 4 0\n" });

check("整数除法与浮点", `int main() {
    double avg = 7 / 2;
    double ok = 7.0 / 2;
    std::cout << avg << " " << ok << std::endl;
    return 0;
}`, { out: "3 3.5\n" });

check("浮点精度 0.1+0.2", `#include <iostream>
int main() {
    std::cout << 0.1 + 0.2 << std::endl;
    return 0;
}`, { out: "0.3\n" });

console.log("== 控制流 ==");
check("if/else 链", `#include <iostream>
int main() {
    int score = 85;
    if (score >= 90) std::cout << "优秀";
    else if (score >= 80) std::cout << "良好";
    else std::cout << "加油";
    std::cout << std::endl;
    return 0;
}`, { out: "良好\n" });

check("for + break/continue", `#include <iostream>
int main() {
    int sum = 0;
    for (int i = 1; i <= 10; ++i) {
        if (i % 2 == 0) continue;
        if (i > 7) break;
        sum += i;
    }
    std::cout << sum << std::endl;
    return 0;
}`, { out: "16\n" });

check("while 与 do-while", `#include <iostream>
int main() {
    int i = 0, j = 10;
    while (i < 3) i++;
    do { j--; } while (j > 8);
    std::cout << i << " " << j << std::endl;
    return 0;
}`, { out: "3 8\n" });

console.log("== 函数与递归 ==");
check("ch04 阶乘", `#include <iostream>
long long factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
int main() {
    std::cout << "4! = " << factorial(4) << "\\n";
    return 0;
}`, { out: "4! = 24\n" });

check("斐波那契（递归）", `#include <iostream>
int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}
int main() {
    for (int i = 0; i < 7; ++i) std::cout << fib(i) << " ";
    std::cout << std::endl;
    return 0;
}`, { out: "0 1 1 2 3 5 8 \n" });

check("引用参数交换", `#include <iostream>
void mySwap(int& a, int& b) {
    int t = a; a = b; b = t;
}
int main() {
    int x = 1, y = 9;
    mySwap(x, y);
    std::cout << x << " " << y << std::endl;
    return 0;
}`, { out: "9 1\n" });

console.log("== 数组 ==");
check("冒泡排序（sorting.html 示例）", `#include <iostream>
void bubbleSort(int a[], int n) {
    for (int i = 0; i < n - 1; ++i) {
        bool swapped = false;
        for (int j = 0; j < n - 1 - i; ++j) {
            if (a[j] > a[j + 1]) {
                int t = a[j];
                a[j] = a[j + 1];
                a[j + 1] = t;
                swapped = true;
            }
        }
        if (!swapped) break;
    }
}
int main() {
    int a[5] = {5, 2, 4, 1, 3};
    bubbleSort(a, 5);
    for (int i = 0; i < 5; ++i) std::cout << a[i] << " ";
    std::cout << std::endl;
    return 0;
}`, { out: "1 2 3 4 5 \n" });

check("数组初始化列表与遍历", `#include <iostream>
int main() {
    int a[] = {10, 20, 30};
    int n = 3;
    for (int i = 0; i < n; ++i) std::cout << a[i] << "\\n";
    return 0;
}`, { out: "10\n20\n30\n" });

console.log("== UB 检测 ==");
check("整数除零 → 报错停止", `int main() {
    int a = 1;
    int b = 0;
    std::cout << a / b << std::endl;
    return 0;
}`, { status: 2, out: "", errHas: "除零" });

check("数组越界 → 报错停止", `#include <iostream>
int main() {
    int a[5] = {1, 2, 3, 4, 5};
    for (int i = 0; i <= 5; ++i) {
        std::cout << a[i] << " ";
    }
    return 0;
}`, { status: 2, errHas: "越界" });

check("未初始化读取 → 警告 + 按 0", `#include <iostream>
int main() {
    int x;
    std::cout << x << std::endl;
    return 0;
}`, { out: "0\n", warnHas: "未初始化" });

check("有符号溢出 → 警告", `#include <iostream>
int main() {
    int big = 2147483647;
    int boom = big + 1;
    std::cout << boom << std::endl;
    return 0;
}`, { warnHas: "溢出" });

check("递归过深 → 报错", `int f(int n) { return f(n + 1); }
int main() {
    return f(1);
}`, { status: 2, errHas: "递归过深" });

check("死循环 → 步数超限", `int main() {
    int i = 0;
    while (i < 10) {
        std::cout << "x";
    }
    return 0;
}`, { status: 2, errHas: "死循环" });

console.log("== 不支持的语法 → 明确报错 ==");
check("class 不支持", `class A { };
int main() { return 0; }`, { status: 1, errHas: "暂不支持" });

check("std::cin 不支持", `#include <iostream>
int main() {
    int x;
    std::cin >> x;
    return 0;
}`, { status: 1, errHas: "cin" });

check("中文输出", `#include <iostream>
int main() {
    std::cout << "满分！" << std::endl;
    return 0;
}`, { out: "满分！\n" });

check("sizeof 基本类型", `#include <iostream>
int main() {
    std::cout << sizeof(int) << " " << sizeof(double) << " " << sizeof(char) << std::endl;
    return 0;
}`, { out: "4 8 1\n" });

console.log(`\\n结果：${pass} 通过，${fail} 失败`);
process.exit(fail ? 1 : 0);
