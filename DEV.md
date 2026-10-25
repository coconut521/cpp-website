# DEV.md —— 开发说明

面向要**修改 / 扩充本站内容**的开发者。使用方法见 [README.zh-CN.md](README.zh-CN.md)（英文版 [README.md](README.md)）。

## 1. 技术约束（先读这个）

- **纯静态、零依赖**：HTML5 + CSS3 + 原生 JS（ES2017+，面向现代浏览器），无框架、无构建、无包管理。
- **必须兼容 `file://` 直开**：因此*不能用* ES Module、`fetch()` 本地 JSON、CDN。所有数据都以 `window.XXX = [...]` 全局变量的形式放在 `assets/js/*-data.js` 中，页面用普通 `<script>` 顺序加载。
- **无任何网络请求**：不引入字体、图标、图片等外部资源。
- 站点主要文字为简体中文，文件编码 UTF-8。

## 2. 目录结构

```text
index.html                 首页（搜索 + 专题 + 目录 + 学习进度 + 最近更新）
errors.html                编译错误博物馆（51 条，含 Visual Studio 2026 常见问题）
sorting.html               排序算法专题（7 种排序 + 逐步执行 + 对比总表 + 测验）
cheatsheets.html           速查表（19 张 + 直达按钮）
exam-pitfalls.html         易错点（20 专题 + 随机练习）
chapters/ch01…ch12.html    12 章讲义
templates/
  chapter-template.html    新章节模板
  authoring-guide.md       页面组件写法指南（示例卡片 / 逐步执行 / 内存可视化等）
assets/
  css/style.css            全站样式（CSS 变量、暗色模式、打印样式）
  js/highlight.js          自研 C++ 语法高亮（暴露 window.CppLight）
  js/toc.js                目录数据 COURSE_TOC + 专题 SPECIAL_PAGES
  js/nav.js                顶栏 / 底栏 / 翻页 / 主题字号（暴露 window.SiteUI）
  js/quiz.js               测验引擎（暴露 window.Quiz）
  js/interactive.js        示例卡片按钮、逐步执行、内存可视化、排序、自增动画（window.Interact）
  js/teacher.js            教师模式
  js/mastery.js            知识点标记（会/不会）+ 导航栏「不会清单」汇总面板
  js/errors-data.js        错误博物馆数据 ERRORS_DATA
  js/cheatsheets-data.js   速查表数据 CHEATSHEETS_DATA
  js/pitfalls-data.js      易错点数据 PITFALLS_DATA
tools/validate.js          全站静态校验
README.md / README.zh-CN.md / DEV.md
```

每个页面只负责"骨架 + 页面私有 `<style>` + 少量组装脚本"，公共行为全部在 `assets/js/` 中。

## 3. 核心机制速记

| 机制 | 说明 |
| --- | --- |
| 语法高亮 | `highlight.js` 扫描 `pre code.cpp`，基于关键词/字符串正则打 token；复制按钮取高亮前的原文（`data-raw`），行号由 CSS 计数器生成、`user-select:none` |
| 导航 | `nav.js` 自动插入顶栏/底栏；章节页按 `COURSE_TOC` 生成上一章/下一章；子目录页面自动加 `../` 前缀 |
| 搜索 | 首页加载时把 4 个数据文件拼成一个语料数组，纯 `indexOf` 匹配，无索引 |
| 教师模式 | `body.teacher` 类 + `?teacher=1` + `Ctrl+Alt+T` 三种开关；答案块靠 `body.teacher-show-answers` 显示 |
| 学习进度 | 首页独有：勾选写入 `localStorage["cppcourse.progress"]`（JSON 数组，存章节 id）；渲染时逐卡片回显，进度条按 `已完成/总章数` 计算宽度 |
| 知识点标记 | `mastery.js` 把各章「学习目标」「自测清单」的 li 改造成「会/不会」标记（清单 checkbox 运行时移除）；存 `localStorage["cppcourse.mastery"]`，键为条目 id（清单用 `data-check-id`，学习目标动态生成 `chXX-obj-N`），值含条目文本与章节信息，供导航栏「🎯 不会清单」面板跨页汇总 |
| 存储 key | 统一前缀 `cppcourse.`：`theme`（light/dark）、`fontscale`（0.8~1.4）、`progress`、`mastery`（知识点会/不会标记）。所有读写都包 try/catch（`file://` 某些环境会禁存储） |
| HTML 注入 | 数据里的 `title` 多数渲染路径会 `esc()`；但 **`desc`、表格 `rows` 单元格、items 的 `desc` 是按 HTML 原样插入的**——想显示尖括号必须写 `&lt;` `&gt;`（详见第 5 节） |

## 4. 常见修改任务

### 4.1 新增章节

1. 复制 `templates/chapter-template.html` 到 `chapters/chNN-英文短名.html`。
2. 按 `templates/authoring-guide.md` 填写组件（示例卡片、逐步执行、测验等）。
3. 在 `assets/js/toc.js` 的 `COURSE_TOC` 追加一条（`id / title / file / desc / keywords / updated`）。
4. 运行 `node tools/validate.js` 自检。

完成后导航、目录、搜索、翻页自动生效。章节页有硬性要求（校验器会查）：

- 必须包含小节标题「学习目标」「本章小结」「自测清单」和一个 `<section class="quiz">`；
- 必须引用 6 个公共脚本（highlight / toc / nav / quiz / interactive / teacher）；
- `class="example-card"` 的 `id` 不得重复；示例卡片建议 8~15 个，`ex-steps` 建议 ≥2 个。

### 4.2 新增速查表

在 `assets/js/cheatsheets-data.js` 追加对象，常用字段：

```js
{
  id: "cs-xxx",            // 页内锚点，需唯一；建议 cs- 前缀
  title: "表名",           // 会被 esc() 后显示
  category: "分类名",       // 决定分类筛选按钮；新分类会自动出现新按钮
  short: "短名",           // 「直达」按钮上的文字；省略则用 title
  desc: "一句话说明",       // 按 HTML 原样插入，尖括号写实体
  type: "table" | "code" | "items",
  // table  →  header: [...], rows: [[...], ...]
  // code   →  code: `...`,  notes: ["...", ...]
  // items  →  items: [{ code: "...", desc: "..." }, ...]
  tip: "底部绿色提示条"      // 可选
}
```

数组顺序即页面显示顺序与「直达」按钮顺序。改完跑 `node tools/validate.js`（会做 JS 语法检查）。

### 4.3 新增错误条目 / 易错点

分别在 `errors-data.js`、`pitfalls-data.js` 追加对象，字段**以文件内注释和既有条目为准**（错误条目至少含 `id/title/message/cause/bad`，易错点至少含 `id/title/tags/why/examQ`）。首页全局搜索会自动覆盖新条目。

### 4.4 改样式

- 全站变量、暗色主题在 `style.css` 的 `:root` / `html[data-theme="dark"]`；新增颜色请走 CSS 变量，不要写死。
- 页面专属样式放在该页 `<head>` 的 `<style>` 里（如速查表页的直达按钮、首页的进度条）。
- 打印样式：全局规则在 `style.css` 的 `@media print`；页面私有的打印隐藏也写在页面 `<style>` 里。

## 5. 编码约定（校验器与踩坑总结）

1. **`<pre><code>` 内容必须转义**：`<` → `&lt;`、`&` → `&amp;`（`validate.js` 会报错）。行内的 `>` 可不转。
2. **数据文件的 HTML 字段**（`desc`、`rows` 单元格、`items[].desc`）按原样注入页面：写 `&lt;string&gt;` 而不是 `<string>`，否则浏览器会把它当未知标签吞掉。
3. **未定义行为（UB）一律用 `.ub-warning` 红色标注**，且不得作为"预测输出"考题——这是本站的教学原则。
4. 示例"输出"是预置结果，卡片上已有免责说明；新增示例请保持一致，不要声称是实时编译。
5. `id` 全页唯一（示例卡片、速查表锚点、目录卡片 `toc-chNN` 等）。
6. 所有 `localStorage` 访问包 `try/catch`；新增存储项沿用 `cppcourse.` 前缀。
7. 兼容 `file://`：不要引入 ES Module / fetch / worker；新 JS 继续用 IIFE + `window` 全局暴露的模式。
8. 中文文案与注释保持现有风格；教学语气面向大一学生。

## 6. 校验

```bash
node tools/validate.js                              # 全站（HTML + JS + toc 一致性）
node tools/validate.js chapters/ch07-classes.html   # 单页
```

校验项：本地链接 404、`<pre><code>` 转义、未知标签白名单、JSON 数据块（quiz-data / ex-steps / mem-data / sort-data）可解析、quiz schema、同页/跨页锚点、重复 id、章节页必需小节与脚本、`toc.js` 与 `chapters/` 一致性、所有 `assets/js/*.js` 的 `node --check`。

退出码非 0 即有错误；**提交前请保证 0 错误 0 警告**。

## 7. 手动测试建议

校验器只做静态检查，交互改动请再用浏览器过一遍：

- 双击 `index.html`（`file://`），或在根目录起本地服务器（如 `python -m http.server` / `npx serve`）。
- 重点回归：主题与字号切换后刷新仍生效、首页勾选进度后刷新恢复、速查表直达按钮在搜索过滤状态下点击能清筛选并滚动高亮、教师模式三种开关、`Ctrl+P` 打印预览。
- 学习进度存在浏览器里，改完代码记得清一次 `localStorage["cppcourse.progress"]` 再测。
