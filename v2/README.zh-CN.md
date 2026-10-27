# 大学 C++ 离线助教 —— v2

**语言 / Language**：[简体中文](README.zh-CN.md) | [English](README.md) ｜ 开发说明 / Dev Guide: [DEV.md](../DEV.md)

v2 是界面重构测试版。原始网站仍保留在仓库根目录，所有新增文件都放在 `v2/` 下。直接打开 `v2/index.html` 即可使用——不需要服务器、不需要构建、不需要联网。

## 1. 设计方向

- **正文：编辑部教材。** 纸色/墨色底、细线分隔与留白，章节页由章节封面、可读性优先的正文栏和右侧边注栏组成。
- **组件：代码实验室。** 示例升级为带标题栏、工具栏和输出终端的 `Listing`；讲解升级为代码、图解、输出同步的检查器。
- **首页：学习地图。** 12 个站点的路线图，进度直接填在路线上，并提供「继续学习」和弱项入口。
- **专题页：各自一个隐喻。**

| 页面 | 隐喻 |
| --- | --- |
| 排序 | 赛道 |
| 编译错误 | 标本墙 |
| 速查表 | 卡盒 |
| 易错点 | 雷区 |
| 找错 | 案件板 |

紫色仍是品牌强调色，用于链接、当前状态和进度。大面积背景使用纸色/墨色。专题卡共用同一底色，靠编号、图标和细线图案区分，不再使用五套渐变。

## 2. 变化内容

| 区域 | v2 体验 |
| --- | --- |
| 首页 | 学习路线、继续学习、进度环、弱项、支线入口、站点更新、命令面板 |
| 章节 | 章节封面、阅读正文栏、边注/实验台、阅读进度 |
| 代码 | `LISTING 05.1 / main.cpp / 行数` 标题栏，复制/下载/输出/单步/运行工具，深色输出终端 |
| 解释动画 | 代码行、图解和累计输出保持同步；默认暂停；支持单步/播放/暂停；打印时显示最终帧 |
| 导航 | `Ctrl+K` 命令面板、课程抽屉、三态主题、字号调节、投屏、教师模式 |
| 专题页 | 标本墙、卡盒、雷区、赛道、案件板 |

## 3. 解释动画

所有解释动画都由数据驱动，默认停在第 1 帧。每个动画会显示它要回答的具体问题，并支持首帧/上一帧/下一帧/播放/暂停/末帧和速度选择。

| 章节 | 问题 | 引擎 |
| --- | --- | --- |
| 1 | 定义一个变量后，内存里到底出现了什么？ | memory |
| 2 | `i++` 和 `++i` 到底差在哪一步？ | timeline |
| 3 | `continue` 和 `break` 分别把控制流送到哪里？ | timeline |
| 4 | 递归时栈帧如何增长和回退？ | stack |
| 5 | 指针算术到底移动多远，为什么 `q - p` 是 3？ | scene |
| 6 | 二维数组是一张表，还是一条连续链？ | grid |
| 7 | 对象何时构造、何时析构，为什么顺序相反？ | timeline |
| 8 | 为什么按值传递会丢失多态？ | scene |
| 9 | 拷贝和移动的区别是什么？ | memory |
| 10 | `size` 和 `capacity` 的区别是什么？ | memory |
| 11 | `throw` 之后栈如何展开，析构函数何时执行？ | stack |
| 12 | 按值捕获和按引用捕获的闭包分别存了什么？ | scene |
| 排序 | 为什么一次划分后基准元素就到了最终位置？ | bars |

`stack` 演示可以复用 `ex-steps.stack`；`bars` 演示可以复用 `ex-steps` 的数组以及比较/基准下标。其他引擎使用 `v2/assets/js/v2-config.js` 里的 `frames`。

## 4. 目录结构

```text
v2/
  index.html                    学习地图首页
  errors.html                   标本墙
  cheatsheets.html              卡盒
  sorting.html                  赛道
  exam-pitfalls.html            雷区 + 案件板
  chapters/ch01...ch12.html     章节页（内容相同，v2 外壳）
  assets/
    css/v2.css                  Design token、布局、组件、打印、深色、响应式
    js/v2-config.js             图标、边注、解释动画数据
    js/v2-core.js               封面/边注栏、Listing、专题页、命令面板
    js/v2-lab.js                检查器和六种渲染器
    js/v2-home.js               学习地图、继续学习、弱项
    js/nav.js                   页头、课程抽屉、页脚、翻页
    js/interactive.js           带 SVG 图标的互动引擎分支
    js/present.js               投屏模式（跳过边注栏）
    js/page-toc.js              在 v2 页面禁用经典悬浮目录
    js/site-updates-data.js     站点更新数据（与原版保持同步）
    js/...                      复用的数据、测验、教师、掌握度、找错、术语、WASM
  templates/
    chapter-template.html       可直接用于 v2 的章节模板
    authoring-guide.md          英文组件编写指南
  tools/
    inject-v2.mjs               给复制过来的页面注入 v2 CSS/脚本
    validate-v2.mjs             v2 静态校验器
```

## 5. 新增解释动画

1. 在章节页里添加一个普通的 `example-card`，并放入 `script.ex-steps`。
2. 在 `v2/assets/js/v2-config.js` 中给 `V2_CONFIG.chapters.chXX` 添加 `demo`：

```js
demo: {
  cardId: "ch05-ex-04",
  engine: "scene",
  question: "指针算术到底移动多远？",
  frames: [ /* 每一步一个视觉状态 */ ]
}
```

3. 引擎专用快捷方式：

- `stack` + `useStepStack: true` 复用 `step.stack`。
- `bars` + `useStepBars: true` 复用 `step.vars["a[]"]`、`step.cmp` 和 `step.pivot`。
- 其他引擎读取 `frames`。

4. 运行 `node v2/tools/validate-v2.mjs`，然后在浏览器里逐步检查效果。

## 6. 新增章节或同步内容

v2 是内容快照。新增章节时：

1. 先完成原版章节。
2. 把它复制到 `v2/chapters/`。
3. 运行 `node v2/tools/inject-v2.mjs`。
4. 如有需要，在 `v2-config.js` 中补充边注和解释动画。
5. 运行两个校验器。

原版与 v2 之间需要保持同步的文件：

- `assets/js/site-updates-data.js` 与 `v2/assets/js/site-updates-data.js`（站点更新数据）。
- 两版都需要的共享引擎修复。

v2 测试版提示条由原版 `assets/js/nav.js` 注入；v2 自身不显示该提示条。

## 7. 约束

- 纯静态、零依赖、双击 `file://` 可打开；禁止 ES modules、`fetch`、CDN 和 workers。
- 不使用外部字体、图片或动画库；图标用内联 SVG，图解用 SVG/HTML/CSS。
- 保持打印、投屏、亮色/暗色/跟随系统、字号缩放可用。
- 未定义行为示例只做概念演示，绝不为 UB 编造确定性输出。
- 校验：`node v2/tools/validate-v2.mjs` 和 `node tools/validate.js` 都必须以 0 错误、0 警告结束。
- 开发文档以英文为准；本文件是中文说明，英文版见 `README.md`。完整开发指南见 `../DEV.md`。
