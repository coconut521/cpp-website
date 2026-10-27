/* ============================================================
 * toc.js —— 课程目录数据（全局变量，file:// 下无需 fetch）
 * 新增章节：在此数组中追加一条即可（文件需真实存在于 chapters/ 下）。
 * keywords 用于首页全局搜索；updated 用于“最近更新”。
 * ============================================================ */
window.COURSE_TOC = [
  {
    id: "ch01",
    title: "第1章 变量与基本类型",
    file: "chapters/ch01-variables.html",
    desc: "变量定义与五种初始化写法、基本类型与 sizeof、auto、const 与 constexpr、字面量、类型转换入门",
    keywords: ["变量", "初始化", "auto", "const", "constexpr", "sizeof", "类型", "字面量", "列表初始化"],
    updated: "2026-10-04"
  },
  {
    id: "ch02",
    title: "第2章 运算符与表达式",
    file: "chapters/ch02-operators.html",
    desc: "i++ 与 ++i、运算符优先级、短路求值、整数除法与取余、浮点精度、隐式类型转换与有符号无符号混用",
    keywords: ["运算符", "优先级", "自增", "自减", "短路", "整数除法", "浮点", "类型转换", "未定义行为"],
    updated: "2026-10-04"
  },
  {
    id: "ch03",
    title: "第3章 控制流",
    file: "chapters/ch03-control-flow.html",
    desc: "if/else 与悬空 else、switch 与 fallthrough、三种循环、range-for、break/continue、循环易错模式",
    keywords: ["if", "switch", "循环", "for", "while", "range-for", "break", "continue", "悬空else"],
    updated: "2026-10-04"
  },
  {
    id: "ch04",
    title: "第4章 函数",
    file: "chapters/ch04-functions.html",
    desc: "声明与定义、传值/传引用/传指针、const 引用参数、函数重载、默认参数、递归、返回局部变量的坑",
    keywords: ["函数", "重载", "默认参数", "递归", "传引用", "传值", "返回引用", "栈帧"],
    updated: "2026-10-04"
  },
  {
    id: "ch05",
    title: "第5章 指针与引用",
    file: "chapters/ch05-pointers-references.html",
    desc: "指针基础与 nullptr、指针算术、数组退化、const 与指针、悬空指针、引用、指针与引用对比",
    keywords: ["指针", "引用", "nullptr", "数组退化", "野指针", "悬空", "取地址", "解引用", "内存"],
    updated: "2026-10-04"
  },
  {
    id: "ch06",
    title: "第6章 数组与字符串",
    file: "chapters/ch06-arrays-strings.html",
    desc: "C 风格数组、字符数组与 '\\0'、std::string 常用操作、数字与字符串互转、越界与 at、string_view 简介",
    keywords: ["数组", "字符串", "std::string", "c_str", "stoi", "to_string", "越界", "string_view"],
    updated: "2026-10-04"
  },
  {
    id: "ch07",
    title: "第7章 类与对象",
    file: "chapters/ch07-classes.html",
    desc: "class 与 struct、构造/析构、初始化列表与成员初始化顺序、拷贝构造与浅拷贝、Rule of Three、static 成员",
    keywords: ["类", "对象", "构造函数", "析构函数", "拷贝构造", "浅拷贝", "深拷贝", "static", "this"],
    updated: "2026-10-04"
  },
  {
    id: "ch08",
    title: "第8章 继承与多态",
    file: "chapters/ch08-inheritance-polymorphism.html",
    desc: "public 继承、虚函数与动态绑定、override/final、纯虚函数与抽象类、虚析构、对象切片",
    keywords: ["继承", "多态", "虚函数", "虚析构", "override", "纯虚函数", "抽象类", "切片"],
    updated: "2026-10-04"
  },
  {
    id: "ch09",
    title: "第9章 移动语义与智能指针",
    file: "chapters/ch09-move-smart-pointers.html",
    desc: "左值右值与 std::move、移动构造与 Rule of Five、unique_ptr、shared_ptr 与循环引用、RAII",
    keywords: ["移动语义", "std::move", "右值引用", "unique_ptr", "shared_ptr", "weak_ptr", "RAII", "智能指针"],
    updated: "2026-10-04"
  },
  {
    id: "ch10",
    title: "第10章 模板与 STL",
    file: "chapters/ch10-templates-stl.html",
    desc: "函数模板与类模板、模板实参推导、vector/map/set 常用操作、迭代器、迭代器失效、常用算法",
    keywords: ["模板", "template", "STL", "vector", "map", "set", "迭代器", "迭代器失效", "sort", "find"],
    updated: "2026-10-04"
  },
  {
    id: "ch11",
    title: "第11章 异常与错误处理",
    file: "chapters/ch11-exceptions.html",
    desc: "throw/try/catch、标准异常层次、按 const 引用捕获、栈展开、noexcept、异常安全与 RAII、static_assert",
    keywords: ["异常", "throw", "try", "catch", "noexcept", "异常安全", "assert", "static_assert", "栈展开"],
    updated: "2026-10-04"
  },
  {
    id: "ch12",
    title: "第12章 Lambda 与现代 C++",
    file: "chapters/ch12-lambda-modern-cpp.html",
    desc: "Lambda 语法与捕获方式、泛型 Lambda、与 STL 算法配合、结构化绑定、optional、if constexpr、C++14/17/20 精选",
    keywords: ["lambda", "闭包", "捕获", "结构化绑定", "optional", "if constexpr", "C++17", "C++20"],
    updated: "2026-10-04"
  }
];

/* 专题页面（首页入口；全局搜索也覆盖这些页面内容） */
window.SPECIAL_PAGES = [
  { id: "errors", title: "编译错误博物馆", file: "errors.html", desc: "51 条常见错误（含 Visual Studio 2026 高频问题）的报错原文、原因、修复与预防", icon: "🏛️", cls: "sc-red" },
  { id: "cheatsheets", title: "速查表", file: "cheatsheets.html", desc: "优先级、string/vector/map、指针引用、迭代器失效、智能指针、Lambda 等 19 张表", icon: "📋", cls: "sc-green" },
  { id: "sorting", title: "排序算法专题", file: "sorting.html", desc: "冒泡/选择/插入/希尔/快排/归并/堆排 7 种常考排序，逐步执行 + 对比总表 + 随堂测验", icon: "📊", cls: "sc-blue" },
  { id: "exam-pitfalls", title: "易错点", file: "exam-pitfalls.html", desc: "20 个经典陷阱专题，附随机练习与「火眼金睛」找错训练", icon: "🎯", cls: "sc-amber" },
  { id: "teacher", title: "教师模式", file: null, desc: "右上角开关 / ?teacher=1 / Ctrl+Alt+T：显隐答案、导出代码", icon: "🧑‍🏫", cls: "sc-purple" }
];
