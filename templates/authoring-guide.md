# 章节编写指南（作者必读）

本站是**纯离线**静态教学网站：HTML5 + CSS3 + 原生 JS，无 CDN、无网络字体、无图片、无 `fetch()`。
所有页面必须能用 `file://` 协议双击直接打开。本文定义所有可复用组件的**唯一正确写法**。

---

## 0. 铁律（违反任何一条都算错误）

1. **代码块内的 `<`、`>`、`&` 必须转义**：`<` → `&lt;`，`>` → `&gt;`，`&` → `&amp;`。
   例如 `#include <iostream>` 必须写成 `#include &lt;iostream&gt;`。
   校验器会把 `<iostream>` 当作未知 HTML 标签报错。
2. **JSON 数据块必须是严格 JSON**：`<script type="application/json">` 内不能有注释、
   不能有尾逗号、字符串只能用双引号、内部双引号要写成 `\"`。
3. 不引用任何外部资源（http/https/CDN/在线字体/图片）。不用 `fetch`、`import`。
4. 不要修改 `assets/` 下任何文件和其他章节；只写分配给你的文件。
5. UTF-8 编码。中文正常书写即可。
6. 示例的**预期输出必须正确**。拿不准输出的例子不要写；先在脑中按标准 C++ 逐行推演。
7. **未定义行为（UB）绝不作为“预测输出”题**。凡 UB 必须放在
   `<div class="ub-warning">…</div>` 中并解释为什么是 UB（如未初始化读取、
   `i = i++ + 1`、数组越界、悬空引用解引用等）。编译器差异用 `<div class="std-diff">` 标注。
8. 每个示例卡片的代码必须完整可编译（含 `#include` 与 `main`），
   除非卡片主题就是“错误示例”（错误示例用 `<pre><code class="cpp">` 同样转义）。

---

## 1. 页面骨架

新章节从 `templates/chapter-template.html` 复制。骨架要点（见模板与 ch01 范例）：

- `<head>` 内：UTF-8、viewport、`<title>第N章 XXX | 大学C++离线助教</title>`、
  主题预置内联脚本、`<link rel="stylesheet" href="../assets/css/style.css">`。
- `<body>` 内只有一个 `<main class="container chapter">`，章节各节依次为：
  1. `学习目标`（`<section class="card objectives">`，含“前置知识”一行）
  2. 若干 `<h2>` 正文小节 + 示例卡片
  3. `常见错误` 小节（`.warn` / `.ub-warning` / 对比块）
  4. `C++ 标准差异` 小节（`.std-diff`，也可散布在正文）
  5. `本章小结`（`<div class="keypoint">` + 要点列表）
  6. `自测清单`（`<ul class="checklist" data-chapter="chXX">`）
  7. 随堂测验（`<section class="quiz" data-source="chXX">`）
- `</main>` 之后：按模板顺序引入 7 个 JS（路径用 `../assets/js/...`，最后一个是 `mastery.js` 知识点标记）。
- 顶栏、底栏、上一章/下一章由 `nav.js` 自动生成，**不要手写**。
- 复杂度控制：所有互动元件的 JSON 都放在正文相应位置（见下）。

## 2. 示例卡片（每章 8~15 个）

```html
<article class="example-card" id="ch02-ex-01">
  <div class="ex-head">
    <h3 class="ex-title">示例1：i++ 与 ++i 的取值差异</h3>
    <div class="ex-meta"><span class="tag">知识点：自增运算符</span><span class="tag amber">高频考点</span></div>
  </div>
  <pre class="ex-code"><code class="cpp">#include &lt;iostream&gt;
int main() {
    int i = 5;
    std::cout &lt;&lt; i++ &lt;&lt; "\n";   // 先取值后自增
    std::cout &lt;&lt; i   &lt;&lt; "\n";
    return 0;
}</code></pre>
  <div class="ex-btns"></div>
  <div class="ex-output">
    <div class="ex-output-label">▶ 预期输出</div>
    <pre><code class="output-text">5
6</code></pre>
  </div>
  <div class="ex-explain">
    <h4>逐行解释</h4>
    <ul>
      <li><b>第4行</b>：…</li>
    </ul>
  </div>
  <div class="ex-variants">
    <h4>变体对比</h4>
    <p>把 <code>i++</code> 改为 <code>++i</code> 则输出 6 和 6 …</p>
  </div>
  <div class="ex-pitfall">
    <h4>⚠ 易错点</h4>
    <p>…</p>
  </div>
  <script type="application/json" class="ex-steps">{ "steps": [
    { "line": 3, "vars": { "i": "?" }, "out": "", "note": "…" },
    { "line": 5, "vars": { "i": "5" }, "out": "5", "note": "…" }
  ] }</script>
</article>
```

规则：

- `id` 必须有且全站唯一：`chXX-ex-NN`。
- `.ex-btns` 空容器**保留**（JS 注入按钮）；也可以不写，JS 会自动插入。
- `.ex-output` 默认隐藏（JS 控制），内容放 `<pre><code class="output-text">`。
- `.ex-explain`（逐行解释）**必须有**；`.ex-variants`、`.ex-pitfall` 强烈建议；
  没有内容的区块直接省略。
- `.ex-steps`（逐步执行）每章至少 2 个卡片提供。`line` 是代码行号（从 1 开始，
  与代码块中的物理行对应）；`vars` 是该步执行后的变量快照（字符串值）；
  `out` 是该步新产生的控制台输出行（无则 `""`）；`note` 是讲解文字。
- 简短演示代码可不带 `main`（如片段对比），但要在解释中说明“片段”；
  带输出的完整示例尽量完整可编译。

## 3. 互动元件速查

### 3.1 左右对比（纯 HTML，无需 JS）

```html
<div class="compare">
  <div class="compare-col badc"><h4>❌ 常见错误写法</h4> … </div>
  <div class="compare-col good"><h4>✅ 推荐写法</h4> … </div>
</div>
```

### 3.2 内存可视化

```html
<div class="memviz"><script type="application/json" class="mem-data">{ "title": "int a = 42; int* p = &amp;a;",
  "regions": [
    { "addr": "0x7ffe…1000", "name": "a", "type": "int", "value": "42", "note": "栈上对象" },
    { "addr": "0x7ffe…2008", "name": "p", "type": "int*", "value": "0x7ffe…1000", "note": "p 存的是 a 的地址" }
  ],
  "note": "箭头语义：p 指向 a" }</script></div>
```

注意：`<script type="application/json">` 内是**原始文本**，HTML 解析器不会解析其中的
标签，所以 JSON 里可以直接写 `vector<int>`、`int*` 这样的文本（唯二禁止：
字符串里出现 `</script>`、以及严格 JSON 语法之外的注释/尾逗号）。
渲染组件会把它们当纯文本转义显示，因此**不要**在 ex-steps / mem-data / sort-data
里写 HTML 实体，直接写原始字符即可。而 quiz 的 `q`/`explain` 字段按 HTML 插入
（见 3.8），其中的字面 `<` 要写 `&lt;`。

### 3.3 拖拽排序

```html
<div class="widget-sort"><script type="application/json" class="sort-data">{ "items": [
  "行1（正确顺序的第1行）", "行2", "行3"
], "hint": "提示文字", "explain": "答案解析" }</script></div>
```

`items` 按**正确顺序**书写，渲染时自动打乱；支持拖拽和 ↑↓ 按钮（移动端可用）。

### 3.4 自增自减动画

```html
<div class="widget-incdec" data-start="5"></div>
```

### 3.5 提示框

`<div class="note">`（蓝色补充）、`<div class="tip">`（绿色技巧）、
`<div class="warn">`（黄色警告）、`<div class="ub-warning">`（UB 专用，自动加标题）、
`<div class="std-diff">`（标准差异，自动加标题）、`<div class="keypoint">`（关键结论）。

### 3.6 折叠答案

```html
<details class="fold"><summary>点击查看答案</summary><div class="details-body">…</div></details>
```

### 3.7 自测清单

```html
<ul class="checklist">
  <li><label><input type="checkbox"><span>说清 i++ 与 ++i 的取值顺序</span></label></li>
</ul>
```

清单里的 checkbox 会被 `mastery.js` 在运行时替换为「会 / 不会」标记按钮（存入 localStorage，导航栏「🎯 不会清单」汇总）——作者只需按上面的结构书写，不必写任何 JS。

### 3.8 随堂测验

```html
<section class="quiz" data-source="ch02">
  <script type="application/json" class="quiz-data">{ "title": "随堂测验：运算符",
    "questions": [
      { "type": "mcq", "q": "int i=3; cout << i++; 输出？",
        "options": ["3", "4", "编译错误", "未定义"], "answer": 0,
        "explain": "i++ 返回旧值 3。" },
      { "type": "tf", "q": "++i 总是比 i++ 快。", "answer": false,
        "explain": "内建类型在现代编译器下无差别。" },
      { "type": "fill", "q": "表达式 7 / 2 的值是 ____。", "answer": ["3"], "explain": "整数除法向零截断。" },
      { "type": "code", "q": "补全：循环 10 次写 for (int i = 0; i ____ 10; ++i)", "answer": ["<"], "explain": "…" }
    ] }</script>
</section>
```

- `data-source` 用章节 id（如 `ch02`），错题本按它归档。
- 每章 6~10 题，mcq 至少 4 题，tf/fill/code 搭配。
- 题干 `q` 里可以写 HTML（如 `<code>x</code>`），但代码里的 `<` 同样要转义。
- **测验题目不得以 UB 行为为标准答案。**

### 3.9 火眼金睛（找错练习）

一般**不需要在章节里写任何东西**：只要 `assets/js/bughunt-data.js` 里有本章（`ch` 字段）的题目，`bug-hunt.js` 会在随堂测验前自动插入「🔥 火眼金睛：本章找错」一节。想手动控制位置时再显式放置：

```html
<section class="bug-hunt" data-ch="ch02"></section>
```

- `data-ch` 为章节 id；省略或写 `all` 表示全部题目；加 `data-shuffle="1"` 提供打乱顺序按钮。
- 题目数据字段见 `bughunt-data.js` 头注释：`id / ch / title / kind("compile"|"logic"|"ub") / code(逐行原文) / bugLine / hint? / why`。
- 代码行是**原文**（引擎负责转义与高亮），`why` 是原始 HTML（尖括号写实体）。
- 同样的教学原则：**UB 题不问"确定输出"**，`why` 里解释原因即可。

## 4. 文字与排版习惯

- 章节标题层级：`<h2>` 小节 → `<h3>` 示例卡片标题（卡片内已含）。
- 行内代码一律 `<code>…</code>`（内部转义）。
- 表格用 `<table class="data-table">`。
- 重要术语首次出现加 `<b>`。
- 面向大学一学期课程：语言精炼、要点式，避免大段散文。

## 5. 自检清单（提交前逐条核对）

- [ ] 代码块内所有 `<`/`>`/`&` 已转义
- [ ] 所有 JSON 块能通过 `JSON.parse`（无注释/尾逗号）
- [ ] 示例 id 唯一（`chXX-ex-NN`）
- [ ] 8~15 个示例卡片；≥2 个卡片有 `.ex-steps`
- [ ] 测验 6~10 题、checklist 6~8 项
- [ ] 有“常见错误”“C++ 标准差异”“本章小结”小节
- [ ] UB 全部用 `.ub-warning` 标注，未把 UB 当考题
- [ ] 运行 `node tools/validate.js chapters/chXX-xxx.html` 全绿
