/* ============================================================
 * site-updates-data.js —— 网站功能 / 界面 / 体验更新记录
 * 原版首页与 v2 首页共用这份数据；href 为原版路径，hrefV2 为 v2 路径。
 * ============================================================ */
window.SITE_UPDATES = [
  {
    date: "2026-10-27",
    tag: "v2",
    title: "v2 界面重构测试版上线",
    desc: "学习地图首页、章节封面 + 边注实验台、Listing 检查器、专题页隐喻；原版保持可用。",
    href: "v2/index.html",
    hrefV2: "index.html"
  },
  {
    date: "2026-10-27",
    tag: "动画",
    title: "13 个机制动画检查器",
    desc: "内存、指针、调用栈、拷贝/移动、异常展开等；默认单步、可暂停、打印最终帧。",
    href: "v2/index.html#v2-map",
    hrefV2: "index.html#v2-map"
  },
  {
    date: "2026-10-27",
    tag: "界面",
    title: "学习地图与继续学习",
    desc: "12 站路线、进度沿路线填充、弱项/错题入口、最近学习记录。",
    href: "v2/index.html#v2-map",
    hrefV2: "index.html#v2-map"
  },
  {
    date: "2026-10-27",
    tag: "功能",
    title: "全站命令面板与课程抽屉",
    desc: "Ctrl+K 搜索章节 / 报错 / 速查 / 术语；顶栏课程抽屉直达 12 章。",
    href: "v2/index.html",
    hrefV2: "index.html"
  },
  {
    date: "2026-10-27",
    tag: "体验",
    title: "专题页各自的隐喻",
    desc: "排序赛道、错误标本墙、速查卡盒、易错雷区、找错案件板。",
    href: "v2/sorting.html",
    hrefV2: "sorting.html"
  },
  {
    date: "2026-10-27",
    tag: "功能",
    title: "找错、随机组卷、多空填空、指针图与 WASM 运行器",
    desc: "在逐步执行基础上补齐互动练习与在线运行，UB 仍然只警告、不给确定输出。",
    href: "exam-pitfalls.html#bughunt",
    hrefV2: "exam-pitfalls.html#bughunt"
  },
  {
    date: "2026-10-26",
    tag: "体验",
    title: "投屏、术语悬停、悬浮目录、跟随系统主题",
    desc: "课堂投屏、49 个术语气泡、页内目录与 light / dark / auto 三态主题。",
    href: "index.html#toc",
    hrefV2: "index.html#v2-map"
  }
];
