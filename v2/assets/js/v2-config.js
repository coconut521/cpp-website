/* ============================================================
 * v2-config.js —— v2 的设计配置
 *   - V2_ICONS  统一 SVG 图标（界面不再用 emoji）
 *   - V2_CONFIG 章节边注 + 实验台动画数据 + 专题页文案
 * 纯全局变量，file:// 可用；不依赖任何外部资源。
 * ============================================================ */
(function () {
  "use strict";

  var S = function (body) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + "</svg>";
  };

  window.V2_ICONS = {
    search: S('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>'),
    route: S('<path d="M4 7h9a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h12"/><circle cx="4" cy="7" r="1.6"/><circle cx="20" cy="19" r="1.6"/>'),
    book: S('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16"/><path d="M8 7h8M8 10h6"/>'),
    bug: S('<rect x="7" y="7" width="10" height="11" rx="5"/><path d="M9 7 7 5M15 7l2-2M4 11h3M17 11h3M4 16h3M17 16h3M12 18v3"/>'),
    card: S('<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 9h16M8 5v14"/>'),
    mine: S('<path d="M12 3 21 20H3z"/><path d="M12 9v5M12 17h.01"/>'),
    grid: S('<rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/>'),
    play: S('<path d="M8 5v14l11-7z"/>'),
    pause: S('<rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/>'),
    prev: S('<path d="M15 5 8 12l7 7"/>'),
    next: S('<path d="m9 5 7 7-7 7"/>'),
    first: S('<path d="M6 5v14"/><path d="m18 5-7 7 7 7"/>'),
    last: S('<path d="M18 5v14"/><path d="m6 5 7 7-7 7"/>'),
    print: S('<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v6H7z"/>'),
    check: S('<path d="m5 12 4.5 4.5L19 7"/>'),
    copy: S('<rect x="8" y="8" width="11" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12h4"/>'),
    download: S('<path d="M12 4v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 20h14"/>'),
    theme: S('<circle cx="12" cy="12" r="8"/><path d="M12 4v16"/><path d="M12 4a8 8 0 0 1 0 16"/>'),
    menu: S('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    close: S('<path d="m6 6 12 12M18 6 6 18"/>'),
    arrow: S('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),
    spark: S('<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M18 16v4M16 18h4"/>'),
    stack: S('<rect x="4" y="4" width="16" height="5" rx="1"/><rect x="4" y="11" width="16" height="5" rx="1"/><rect x="4" y="18" width="16" height="2" rx="1"/>'),
    timeline: S('<path d="M4 12h16"/><circle cx="7" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="17" cy="12" r="2"/>'),
    code: S('<path d="m8 7-4 5 4 5M16 7l4 5-4 5M14 4l-4 16"/>')
  };

  var NOTES = {
    ch01: [
      { section: 1, kicker: "DEFINITION", title: "变量 = 一块有名字的内存", body: "定义 <code>int a = 42;</code> 同时完成分配、命名、写入三件事。此后读写 a 就是读写那块内存。" },
      { section: 2, kicker: "EXAM", title: "五种初始化，结局不同", body: "<code>int e{};</code> 是值初始化，保证为 0；<code>int a;</code> 是默认初始化，局部变量不保证有值。" },
      { section: 4, kicker: "UB", title: "无符号会回绕，有符号是 UB", body: "无符号溢出按 2ⁿ 取模，是定义好的；有符号溢出在标准里是未定义行为，不能拿“实际结果”当答案。" },
      { section: 10, kicker: "TRAP", title: "未初始化变量不是 0", body: "局部变量 <code>int x;</code> 的值是栈上残留，读取它是 UB。定义时就初始化，是最便宜的安全习惯。" }
    ],
    ch02: [
      { section: 1, kicker: "RULE", title: "i++ 的值是旧值", body: "后缀表达式先取旧值参与运算，副作用（i 加 1）随后发生；前缀 <code>++i</code> 先加再取值。一条语句里不要对同一变量改两次。" },
      { section: 3, kicker: "SHORT-CIRCUIT", title: "右边可能根本不执行", body: "<code>a && f()</code> 在 a 为 false 时不会调用 f；<code>a || f()</code> 在 a 为 true 时也不会。副作用函数要小心。" },
      { section: 4, kicker: "PRECEDENCE", title: "四组最容易错的优先级", body: "后缀 > 前缀 > 乘除 > 加减 > 比较 > 相等 > 逻辑与 > 逻辑或 > 赋值。拿不准就加括号。" },
      { section: 7, kicker: "MIXED", title: "有符号遇到无符号会“变 unsigned”", body: "<code>-1 &lt; 1u</code> 是 false：-1 被转换成很大的无符号数。编译器警告不要忽略。" }
    ],
    ch03: [
      { section: 1, kicker: "TRAP", title: "else 跟最近的 if 配对", body: "缩进不决定配对，语法决定。花括号是避免悬空 else 的最简单办法。" },
      { section: 3, kicker: "SWITCH", title: "没有 break 就会贯穿", body: "case 只是标签，匹配后一直往下执行；故意分组时写注释，否则每个 case 末尾补 break。" },
      { section: 6, kicker: "FLOW", title: "continue 回到 ++i，break 结束循环", body: "continue 跳过本轮剩余语句但仍执行更新表达式；break 直接离开整个循环。" },
      { section: 8, kicker: "NESTED", title: "嵌套循环先固定外层", body: "手算时把外层 i 固定，内层 j 走完一圈，再动 i。不要同时跟踪两个变量。" }
    ],
    ch04: [
      { section: 3, kicker: "PASS", title: "传值是拷贝，引用是别名", body: "传值 <code>void f(int x)</code> 改的是副本；传引用 <code>void f(int&amp; x)</code> 改的是实参本体；传指针要判空。" },
      { section: 5, kicker: "DECAY", title: "数组传参会退化成指针", body: "函数里的 <code>sizeof(arr)</code> 是指针大小，不是数组大小。长度必须单独传。" },
      { section: 10, kicker: "RECURSION", title: "递归 = 基准 + 缩小 + 收敛", body: "每次调用压一个新栈帧；命中基准后逐层弹栈回乘。没有基准或没有缩小，就会栈溢出。" },
      { section: 9, kicker: "UB", title: "不要返回局部变量的引用/指针", body: "函数返回后局部对象已销毁，引用/指针悬空；解引用是 UB，碰巧输出正确也不算数。" }
    ],
    ch05: [
      { section: 1, kicker: "DEFINITION", title: "指针是存地址的变量", body: "<code>&amp;</code> 取地址，<code>*</code> 解引用。指针的类型决定“解引用按什么解释、算术跨多远”。" },
      { section: 3, kicker: "ARITHMETIC", title: "p + 1 跨的是 sizeof(T)", body: "对 <code>int*</code> 来说前进 4 字节，不是 1 字节。两个指针相减得到元素个数，不是字节差。" },
      { section: 6, kicker: "UB", title: "悬空指针指向已释放的内存", body: "delete 后原指针不自动置空；解引用或再次 delete 都是 UB。delete 后立刻 <code>p = nullptr;</code>。" },
      { section: 7, kicker: "REFERENCE", title: "引用必须初始化，不能重绑", body: "引用是对象的别名，没有“空引用”；一旦绑定就永远是那个对象。想换指向就用指针。" }
    ],
    ch06: [
      { section: 2, kicker: "LAYOUT", title: "二维数组按行连续存放", body: "<code>m[0][0..2]</code> 紧接着 <code>m[1][0..2]</code>。所以 <code>sizeof(m)</code> 是总字节数，行数×列数×元素大小。" },
      { section: 3, kicker: "C-STRING", title: "C 字符串以 '\\0' 结尾", body: "<code>char s[5] = \"hello\";</code> 装不下 5 个字符加结尾的 '\\0'，是经典编译错误/越界。" },
      { section: 5, kicker: "STD::STRING", title: "std::string 自己管理长度", body: "它不靠 '\\0' 找结尾，<code>.size()</code> 是 O(1)；<code>[]</code> 不检查越界，<code>.at()</code> 会抛异常。" },
      { section: 2, kicker: "EXAM", title: "手算地址先算行偏移", body: "元素 <code>m[i][j]</code> 的地址 = 首地址 + (i × 列数 + j) × sizeof(元素)。" }
    ],
    ch07: [
      { section: 3, kicker: "CTOR", title: "初始化列表不是赋值", body: "初始化列表在对象构造时直接初始化成员；函数体里的赋值是先默认构造再赋值。const 成员和引用成员只能用初始化列表。" },
      { section: 4, kicker: "ORDER", title: "初始化顺序 = 声明顺序", body: "和初始化列表的书写顺序无关。列表写了 b_ 在前，实际仍先构造 a_——经典考题。" },
      { section: 6, kicker: "DTOR", title: "析构顺序与构造相反", body: "同一作用域内后构造的先析构；离开作用域时逆序清理。RAII 就是靠这条规则工作的。" },
      { section: 8, kicker: "UB", title: "默认拷贝 + 指针成员 = 双重释放", body: "浅拷贝让两个对象指向同一块内存，析构时 delete 两次。要么 Rule of Three，要么用智能指针。" }
    ],
    ch08: [
      { section: 3, kicker: "POLY", title: "虚函数靠动态绑定", body: "通过基类指针/引用调用虚函数时，运行期按对象的动态类型查 vtable；按值传递会退化成静态绑定。" },
      { section: 4, kicker: "SLICE", title: "按值传参会切片", body: "<code>Animal v = cat;</code> 只拷贝 Animal 子对象，Cat 的成员和虚表都没了。多态参数用 <code>const Animal&amp;</code>。" },
      { section: 7, kicker: "DTOR", title: "基类析构必须是 virtual", body: "用基类指针 delete 派生对象时，非虚析构只调用基类析构，派生部分不清理——UB。" },
      { section: 8, kicker: "TRAP", title: "构造/析构中调用虚函数不分发", body: "构造基类时派生部分还没建好，虚调用只解析到当前类版本；析构时同理。" }
    ],
    ch09: [
      { section: 3, kicker: "MOVE", title: "移动构造偷指针，不复制元素", body: "移动后源对象的指针被置空，处于“有效但未指定”状态；不要再读它的值，只能销毁或重新赋值。" },
      { section: 5, kicker: "OWNERSHIP", title: "unique_ptr 独占所有权", body: "不能拷贝，只能 <code>std::move</code> 转移；<code>make_unique</code> 是最安全的创建方式。" },
      { section: 6, kicker: "REFCOUNT", title: "shared_ptr 用计数共享所有权", body: "拷贝加 1，销毁减 1，归零才 delete。循环引用会让计数永远不归零，用 weak_ptr 打破环。" },
      { section: 8, kicker: "RAII", title: "资源生命周期绑定对象生命周期", body: "构造获取、析构释放；离开作用域自动清理，异常路径也安全。智能指针、文件流、锁都遵循这套规则。" }
    ],
    ch10: [
      { section: 1, kicker: "TEMPLATE", title: "模板是编译期“盖章机”", body: "每组实际类型参数都会实例化出一份具体函数/类；模板本身不是可执行代码。" },
      { section: 3, kicker: "VECTOR", title: "vector 是连续内存的动态数组", body: "size 是元素个数，capacity 是已分配容量；push_back 超过 capacity 会重新分配并搬移全部元素。" },
      { section: 4, kicker: "INVALIDATION", title: "扩容会让迭代器失效", body: "vector 重新分配后，旧迭代器/指针/引用全部悬空；erase 也会让被删位置之后的迭代器失效。" },
      { section: 5, kicker: "MAP", title: "map 有序，unordered_map 哈希", body: "map 按 key 排序，查找 O(log n)；unordered_map 平均 O(1) 但顺序不确定。<code>m[key]</code> 会插入不存在的 key。" }
    ],
    ch11: [
      { section: 5, kicker: "UNWIND", title: "throw 后栈展开，析构先执行", body: "异常离开作用域时，沿途局部对象按构造逆序析构；然后才进入匹配的 catch。这就是 RAII 在异常路径也安全的原因。" },
      { section: 7, kicker: "SAFETY", title: "异常安全靠 RAII，不靠手写 catch", body: "用局部对象管理资源，异常路径自动释放；裸 new 在 throw 前不会自动 delete。" },
      { section: 9, kicker: "CTOR", title: "构造函数抛异常，自身析构不执行", body: "已构造完成的成员会被析构，但对象本身的析构函数不会调用。构造函数里要小心半成品状态。" },
      { section: 10, kicker: "NOEXCEPT", title: "noexcept 是承诺，不是建议", body: "标注 noexcept 的函数若真的抛出，程序会 terminate。移动构造通常标 noexcept，容器扩容才敢用它。" }
    ],
    ch12: [
      { section: 2, kicker: "CAPTURE", title: "捕获列表决定闭包里有什么", body: "<code>[x]</code> 拷贝一份 x；<code>[&amp;y]</code> 存 y 的引用；<code>[=]</code>/<code>[&amp;]</code> 默认按值/按引用捕获用到的变量。" },
      { section: 3, kicker: "MUTABLE", title: "按值捕获的副本默认是 const", body: "想在 lambda 里修改副本要写 <code>mutable</code>；改的只是闭包里的副本，不影响原变量。" },
      { section: 6, kicker: "LIFETIME", title: "lambda 可能比局部变量活得久", body: "按引用捕获局部变量后把 lambda 存起来/返回，原变量销毁后调用就是悬空引用——UB。" },
      { section: 8, kicker: "MODERN", title: "结构化绑定与 optional", body: "<code>auto [k, v] = pair;</code> 拆开 pair/tuple；<code>std::optional&lt;T&gt;</code> 表达“可能有值”，比魔法值更清楚。" }
    ]
  };

  var DEMOS = {
    ch01: {
      cardId: "ch01-ex-01",
      engine: "memory",
      question: "定义一个变量时，内存里到底多了什么？不同类型的变量各占多大？",
      frames: [
        { regions: [{ label: "栈帧 main()", cells: [
          { name: "age", type: "int", value: "20", size: "4 B", addr: "0x7ffd…1000", state: "active" }
        ] }], note: "先出现 age：4 字节，写入 20。" },
        { regions: [{ label: "栈帧 main()", cells: [
          { name: "age", type: "int", value: "20", size: "4 B", addr: "0x7ffd…1000", state: "done" },
          { name: "score", type: "double", value: "91.5", size: "8 B", addr: "0x7ffd…1008", state: "active" }
        ] }], note: "score 是 double，占 8 字节。" },
        { regions: [{ label: "栈帧 main()", cells: [
          { name: "age", type: "int", value: "20", size: "4 B", state: "done" },
          { name: "score", type: "double", value: "91.5", size: "8 B", state: "done" },
          { name: "grade", type: "char", value: "'A'", size: "1 B", addr: "0x7ffd…1010", state: "active" }
        ] }], note: "char 只占 1 字节；'A' 存的是编码值 65。" },
        { regions: [{ label: "栈帧 main()", cells: [
          { name: "age", type: "int", value: "20", size: "4 B", state: "done" },
          { name: "score", type: "double", value: "91.5", size: "8 B", state: "done" },
          { name: "grade", type: "char", value: "'A'", size: "1 B", state: "done" },
          { name: "pass", type: "bool", value: "true", size: "1 B", addr: "0x7ffd…1011", state: "active" }
        ] }], note: "bool 只有 true/false；默认输出成 1/0。" },
        { regions: [{ label: "栈帧 main()", cells: [
          { name: "age", type: "int", value: "20", size: "4 B", state: "active" },
          { name: "score", type: "double", value: "91.5", size: "8 B", state: "active" },
          { name: "grade", type: "char", value: "'A'", size: "1 B", state: "active" },
          { name: "pass", type: "bool", value: "true", size: "1 B", state: "active" }
        ] }], note: "四个变量同时在栈帧里；输出时依次读取它们。" },
        { regions: [{ label: "栈帧 main()", cells: [] }], note: "return 0：main 结束，整个栈帧销毁，四个变量一起消失。" }
      ]
    },
    ch02: {
      cardId: "ch02-ex-01",
      engine: "timeline",
      question: "i++ 和 ++i 到底差在哪一步？表达式的值是什么时候取的？",
      frames: [
        { events: [{ label: "i = 5", desc: "变量 i 初始化为 5", state: "active" }], note: "初始状态。" },
        { events: [
          { label: "取旧值 5", desc: "i++ 作为表达式，先取 i 的当前值 5", state: "active" },
          { label: "打印 5", desc: "cout 收到的是 5", state: "next" }
        ], note: "后缀：先取值，后自增。" },
        { events: [
          { label: "i 变成 6", desc: "副作用发生：i = i + 1", state: "done" },
          { label: "打印 6", desc: "下一条语句读到新值", state: "active" }
        ], note: "自增的副作用已经完成。" },
        { events: [{ label: "j = 5", desc: "另一个变量 j 初始化为 5", state: "active" }], note: "换一个变量看前缀。" },
        { events: [
          { label: "j 先变成 6", desc: "++j 先执行副作用", state: "active" },
          { label: "取新值 6", desc: "表达式的值是自增后的 6", state: "next" }
        ], note: "前缀：先自增，再取值。" },
        { events: [{ label: "打印 6", desc: "cout 收到的是 6", state: "active" }], note: "j 保持 6。" },
        { events: [{ label: "结束", desc: "程序正常退出", state: "active" }], note: "一条语句里不要对同一变量改两次。" }
      ]
    },
    ch03: {
      cardId: "ch03-ex-06",
      engine: "timeline",
      question: "continue 和 break 分别把执行流送到哪里？为什么 sum 最后是 16？",
      frames: [
        { events: [
          { label: "i = 1", desc: "奇数，continue 条件不成立", state: "active" },
          { label: "sum += 1", desc: "sum 变成 1", state: "next" }
        ], note: "第一轮正常相加。" },
        { events: [
          { label: "sum = 1", desc: "第一轮结束", state: "done" },
          { label: "i++ → 2", desc: "准备下一轮", state: "active" }
        ], note: "循环更新表达式回到 for 头部。" },
        { events: [
          { label: "i = 2", desc: "偶数", state: "active" },
          { label: "continue", desc: "跳过本轮剩余语句，直接执行 ++i", state: "next" }
        ], note: "continue 不会结束循环。" },
        { events: [
          { label: "i = 3", desc: "奇数", state: "active" },
          { label: "sum += 3", desc: "sum = 4", state: "next" }
        ], note: "累加奇数。" },
        { events: [
          { label: "i = 5", desc: "奇数", state: "active" },
          { label: "sum += 5", desc: "sum = 9", state: "next" }
        ], note: "i=4 已被 continue 跳过。" },
        { events: [
          { label: "i = 7", desc: "7 > 7 为假", state: "active" },
          { label: "sum += 7", desc: "sum = 16", state: "next" }
        ], note: "7 仍被累加。" },
        { events: [
          { label: "i = 8", desc: "偶数，continue", state: "active" },
          { label: "sum 不变", desc: "仍为 16", state: "next" }
        ], note: "continue 再次跳过。" },
        { events: [
          { label: "i = 9", desc: "9 > 7 为真", state: "active" },
          { label: "break", desc: "直接结束整个 for 循环", state: "next" }
        ], note: "break 不再执行 ++i。" },
        { events: [
          { label: "输出 16", desc: "1 + 3 + 5 + 7 = 16", state: "active" }
        ], note: "循环结束，执行 cout。" }
      ]
    },
    ch04: {
      cardId: "ch04-ex-11",
      engine: "stack",
      useStepStack: true,
      question: "递归调用时栈帧怎么一层层长高，又怎么一层层退回？"
    },
    ch05: {
      cardId: "ch05-ex-04",
      engine: "scene",
      question: "指针加 1 到底移动多少字节？为什么 q - p 是 3 而不是 12？",
      frames: [
        { boxes: [
          { id: "a0", label: "arr[0]", sub: "10", cls: "cell" },
          { id: "a1", label: "arr[1]", sub: "20", cls: "cell" },
          { id: "a2", label: "arr[2]", sub: "30", cls: "cell" },
          { id: "a3", label: "arr[3]", sub: "40", cls: "cell" },
          { id: "a4", label: "arr[4]", sub: "50", cls: "cell" },
          { id: "p", label: "p", sub: "int*", cls: "ptr" },
          { id: "q", label: "q", sub: "int*", cls: "ptr" }
        ], arrows: [], note: "5 个 int 连续存放，每个 4 字节。" },
        { boxes: [
          { id: "a0", label: "arr[0]", sub: "10", cls: "cell lit" },
          { id: "a1", label: "arr[1]", sub: "20", cls: "cell" },
          { id: "a2", label: "arr[2]", sub: "30", cls: "cell" },
          { id: "a3", label: "arr[3]", sub: "40", cls: "cell" },
          { id: "a4", label: "arr[4]", sub: "50", cls: "cell" },
          { id: "p", label: "p", sub: "int*", cls: "ptr" },
          { id: "q", label: "q", sub: "int*", cls: "ptr" }
        ], arrows: [{ from: "p", to: "a0" }], note: "数组名退化为首元素地址：p → arr[0]。" },
        { boxes: [
          { id: "a0", label: "arr[0]", sub: "10", cls: "cell" },
          { id: "a1", label: "arr[1]", sub: "20", cls: "cell" },
          { id: "a2", label: "arr[2]", sub: "30", cls: "cell" },
          { id: "a3", label: "arr[3]", sub: "40", cls: "cell" },
          { id: "a4", label: "arr[4]", sub: "50", cls: "cell lit" },
          { id: "p", label: "p", sub: "int*", cls: "ptr" },
          { id: "q", label: "q", sub: "int*", cls: "ptr" }
        ], arrows: [{ from: "p", to: "a0" }, { from: "q", to: "a4" }], note: "q 指向最后一个元素。" },
        { boxes: [
          { id: "a0", label: "arr[0]", sub: "10", cls: "cell lit" },
          { id: "a1", label: "arr[1]", sub: "20", cls: "cell lit" },
          { id: "a2", label: "arr[2]", sub: "30", cls: "cell" },
          { id: "a3", label: "arr[3]", sub: "40", cls: "cell" },
          { id: "a4", label: "arr[4]", sub: "50", cls: "cell lit" },
          { id: "p", label: "p", sub: "int*", cls: "ptr" },
          { id: "q", label: "q", sub: "int*", cls: "ptr" }
        ], arrows: [{ from: "p", to: "a0" }, { from: "q", to: "a4" }], note: "*p、*(p+1)、*(p+4) 分别读到 10、20、50。" },
        { boxes: [
          { id: "a0", label: "arr[0]", sub: "10", cls: "cell" },
          { id: "a1", label: "arr[1]", sub: "20", cls: "cell lit" },
          { id: "a2", label: "arr[2]", sub: "30", cls: "cell" },
          { id: "a3", label: "arr[3]", sub: "40", cls: "cell" },
          { id: "a4", label: "arr[4]", sub: "50", cls: "cell" },
          { id: "p", label: "p", sub: "int*", cls: "ptr" },
          { id: "q", label: "q", sub: "int*", cls: "ptr" }
        ], arrows: [{ from: "p", to: "a1" }, { from: "q", to: "a4" }], note: "++p 前进 sizeof(int) = 4 字节，落到 arr[1]。" },
        { boxes: [
          { id: "a0", label: "arr[0]", sub: "10", cls: "cell" },
          { id: "a1", label: "arr[1]", sub: "20", cls: "cell lit" },
          { id: "a2", label: "arr[2]", sub: "30", cls: "cell" },
          { id: "a3", label: "arr[3]", sub: "40", cls: "cell lit" },
          { id: "a4", label: "arr[4]", sub: "50", cls: "cell" },
          { id: "p", label: "p", sub: "int*", cls: "ptr" },
          { id: "q", label: "q", sub: "int*", cls: "ptr" }
        ], arrows: [{ from: "p", to: "a1" }, { from: "q", to: "a4" }], note: "p 指向 arr[1]；*(p+2) 是 arr[3]，读到 40。" },
        { boxes: [
          { id: "a0", label: "arr[0]", sub: "10", cls: "cell" },
          { id: "a1", label: "arr[1]", sub: "20", cls: "cell lit" },
          { id: "a2", label: "arr[2]", sub: "30", cls: "cell" },
          { id: "a3", label: "arr[3]", sub: "40", cls: "cell" },
          { id: "a4", label: "arr[4]", sub: "50", cls: "cell lit" },
          { id: "p", label: "p", sub: "int*", cls: "ptr" },
          { id: "q", label: "q", sub: "int*", cls: "ptr" }
        ], arrows: [{ from: "p", to: "a1" }, { from: "q", to: "a4" }], note: "q - p = 3：两个指针相差 3 个元素，不是 12 字节。" }
      ]
    },
    ch06: {
      cardId: "ch06-ex-03",
      engine: "grid",
      question: "二维数组在内存里是“表格”还是“一条长链”？按行存放怎么影响地址计算？",
      frames: [
        { rows: [[1, 2, 3], [4, 5, 6]], active: null, base: "0x1000", note: "2 行 3 列，共 6 个 int。" },
        { rows: [[1, 2, 3], [4, 5, 6]], active: [0, 0], base: "0x1000", note: "外层 i=0，先处理第 0 行。" },
        { rows: [[1, 2, 3], [4, 5, 6]], active: [0, 2], base: "0x1000", note: "内层 j 走完 0~2，第 0 行按顺序读完。" },
        { rows: [[1, 2, 3], [4, 5, 6]], active: [1, 2], base: "0x1000", note: "i=1 处理第 1 行；内存里紧接在第 0 行后面。" },
        { rows: [[1, 2, 3], [4, 5, 6]], active: null, base: "0x1000", note: "sizeof(m) = 2 × 3 × 4 = 24 字节。" }
      ]
    },
    ch07: {
      cardId: "ch07-ex-06",
      engine: "timeline",
      question: "对象什么时候构造、什么时候析构？为什么析构顺序和构造相反？",
      frames: [
        { events: [{ label: "构造 a", desc: "a 进入 main 作用域", state: "active" }], note: "a 是最先构造的。" },
        { events: [
          { label: "构造 a", desc: "仍在作用域", state: "done" },
          { label: "构造 b", desc: "进入内层大括号", state: "active" }
        ], note: "内层作用域开始。" },
        { events: [
          { label: "构造 a", desc: "仍在作用域", state: "done" },
          { label: "构造 b", desc: "内层对象", state: "done" },
          { label: "构造 c", desc: "内层最后构造", state: "active" }
        ], note: "c 是括号内最后构造的。" },
        { events: [
          { label: "构造 a", desc: "仍在作用域", state: "done" },
          { label: "构造 b", desc: "内层对象", state: "done" },
          { label: "析构 c", desc: "离开大括号，后构造的先析构", state: "active" }
        ], note: "c 先走。" },
        { events: [
          { label: "构造 a", desc: "仍在作用域", state: "done" },
          { label: "析构 b", desc: "括号内清空", state: "active" }
        ], note: "b 随后析构，a 不受影响。" },
        { events: [
          { label: "构造 a", desc: "仍在作用域", state: "done" },
          { label: "构造 d", desc: "d 在 main 作用域", state: "active" }
        ], note: "离开内层括号后再构造 d。" },
        { events: [
          { label: "构造 a", desc: "仍在作用域", state: "done" },
          { label: "构造 d", desc: "main 作用域", state: "done" },
          { label: "析构 d", desc: "main 结束，d 先析构", state: "active" }
        ], note: "d 最后构造，所以先析构。" },
        { events: [
          { label: "析构 a", desc: "最后析构最早构造的 a", state: "active" }
        ], note: "全部对象清理完毕。" }
      ]
    },
    ch08: {
      cardId: "ch08-ex-04",
      engine: "scene",
      question: "为什么按值传参就丢失了“喵”，按引用传参却能保留多态？",
      frames: [
        { boxes: [
          { id: "cat", label: "cat", sub: "Cat 对象", cls: "obj lit" },
          { id: "r", label: "r", sub: "Animal&", cls: "ptr" },
          { id: "v", label: "v", sub: "Animal", cls: "obj" }
        ], arrows: [{ from: "r", to: "cat" }], note: "引用 r 绑定到完整的 cat，动态类型仍是 Cat。" },
        { boxes: [
          { id: "cat", label: "cat", sub: "Cat 对象", cls: "obj" },
          { id: "r", label: "r", sub: "Animal&", cls: "ptr" },
          { id: "v", label: "v", sub: "Animal（切片）", cls: "obj bad" }
        ], arrows: [{ from: "r", to: "cat" }, { from: "v", to: "cat", cls: "bad", label: "只拷贝基类子对象" }], note: "Animal v = cat：切片发生，v 只是纯 Animal。" },
        { boxes: [
          { id: "cat", label: "cat", sub: "Cat 对象", cls: "obj" },
          { id: "r", label: "r", sub: "Animal&", cls: "ptr" },
          { id: "v", label: "v", sub: "Animal（切片）", cls: "obj bad" },
          { id: "vt", label: "Animal::speak", sub: "静态绑定", cls: "table" }
        ], arrows: [{ from: "v", to: "vt", cls: "bad" }], note: "byValue 的形参是切片对象，speak 解析到 Animal::speak。" },
        { boxes: [
          { id: "cat", label: "cat", sub: "Cat 对象", cls: "obj lit" },
          { id: "vt", label: "Cat::speak", sub: "动态绑定", cls: "table" },
          { id: "r", label: "r", sub: "Animal&", cls: "ptr" }
        ], arrows: [{ from: "r", to: "cat" }, { from: "cat", to: "vt", cls: "ok" }], note: "byRef 通过引用调用，运行期查 Cat 的 vtable，输出“喵~”。" },
        { boxes: [
          { id: "cat", label: "cat", sub: "Cat 对象", cls: "obj lit" },
          { id: "vt", label: "Cat::speak", sub: "动态绑定", cls: "table" },
          { id: "r", label: "r", sub: "Animal&", cls: "ptr" }
        ], arrows: [{ from: "r", to: "cat" }, { from: "cat", to: "vt", cls: "ok" }], note: "r.speak() 仍然指向完整的 cat。" },
        { boxes: [
          { id: "v", label: "v", sub: "Animal（切片）", cls: "obj bad" },
          { id: "vt", label: "Animal::speak", sub: "静态绑定", cls: "table" }
        ], arrows: [{ from: "v", to: "vt", cls: "bad" }], note: "v 是独立的 Animal 对象，与 cat 再无关系，输出基类版本。" }
      ]
    },
    ch09: {
      cardId: "ch09-ex-03",
      engine: "memory",
      question: "拷贝和移动到底差在哪？为什么移动不复制 1000 个 int？",
      frames: [
        { regions: [
          { label: "对象 a", cells: [{ name: "a.data_", type: "int*", value: "→ 堆缓冲区", size: "指针", state: "active" }] },
          { label: "堆", cells: [{ name: "int[1000]", type: "缓冲区", value: "1000 个 int", size: "4000 B", state: "active" }] }
        ], note: "a 构造：new int[1000]，a 是唯一拥有者。" },
        { regions: [
          { label: "对象", cells: [
            { name: "a.data_", type: "int*", value: "→ 原缓冲区", size: "指针", state: "done" },
            { name: "b.data_", type: "int*", value: "→ 新缓冲区", size: "指针", state: "active" }
          ] },
          { label: "堆", cells: [
            { name: "a 的缓冲区", type: "int[1000]", value: "1000 个 int", size: "4000 B", state: "done" },
            { name: "b 的副本", type: "int[1000]", value: "逐元素复制", size: "4000 B", state: "active" }
          ] }
        ], note: "拷贝构造：新分配一块内存，再复制 1000 个元素。" },
        { regions: [
          { label: "对象", cells: [
            { name: "a.data_", type: "int*", value: "nullptr（空壳）", size: "指针", state: "bad" },
            { name: "b.data_", type: "int*", value: "→ 副本", size: "指针", state: "done" },
            { name: "c.data_", type: "int*", value: "→ 原缓冲区", size: "指针", state: "active" }
          ] },
          { label: "堆", cells: [
            { name: "原缓冲区", type: "int[1000]", value: "现在归 c", size: "4000 B", state: "active" },
            { name: "b 的副本", type: "int[1000]", value: "仍归 b", size: "4000 B", state: "done" }
          ] }
        ], note: "移动构造：只把指针从 a 搬到 c，a 被置空；0 次元素复制。" },
        { regions: [
          { label: "对象", cells: [] },
          { label: "堆", cells: [] }
        ], note: "析构：c、b、a 各自 delete 自己的指针，无泄漏、无双重释放。" }
      ]
    },
    ch10: {
      cardId: "ch10-ex-04",
      engine: "memory",
      question: "vector 的 size 和 capacity 有什么区别？push_back 什么时候会搬移全部元素？",
      frames: [
        { regions: [{ label: "vector v1", cells: [
          { name: "size", type: "size_t", value: "0", size: "8 B", state: "active" },
          { name: "capacity", type: "size_t", value: "0", size: "8 B", state: "done" },
          { name: "data", type: "int*", value: "nullptr", size: "指针", state: "done" }
        ] }], note: "空 vector：size=0、capacity=0、data=nullptr。" },
        { regions: [{ label: "vector v3", cells: [
          { name: "size", type: "size_t", value: "3", size: "8 B", state: "active" },
          { name: "capacity", type: "size_t", value: "3", size: "8 B", state: "active" },
          { name: "data", type: "int*", value: "→ [9,9,9]", size: "指针", state: "active" }
        ] }], note: "vector(3, 9)：3 个元素都是 9，size = capacity = 3。" },
        { regions: [{ label: "vector v4", cells: [
          { name: "size", type: "size_t", value: "3", size: "8 B", state: "active" },
          { name: "capacity", type: "size_t", value: "3", size: "8 B", state: "active" },
          { name: "data", type: "int*", value: "→ [1,2,3]", size: "指针", state: "active" }
        ] }], note: "列表初始化 {1,2,3}，容量刚好 3。" },
        { regions: [{ label: "vector v1", cells: [
          { name: "size", type: "size_t", value: "2", size: "8 B", state: "active" },
          { name: "capacity", type: "size_t", value: "≥ 2", size: "8 B", state: "active" },
          { name: "data", type: "int*", value: "→ [10,20]", size: "指针", state: "active" }
        ] }], note: "push 10、20、30 后 pop_back：size 变 2，capacity 通常不会缩回。" },
        { regions: [{ label: "vector v1", cells: [
          { name: "size", type: "size_t", value: "2", size: "8 B", state: "active" },
          { name: "capacity", type: "size_t", value: "≥ 2", size: "8 B", state: "active" },
          { name: "data", type: "int*", value: "→ [10,20]", size: "指针", state: "active" }
        ] }], note: "size 是元素个数；empty() 为 false；boolalpha 让输出是 false。" },
        { regions: [{ label: "vector v1", cells: [
          { name: "v1[0]", type: "int&", value: "10", size: "引用", state: "active" },
          { name: "v1[1]", type: "int&", value: "20", size: "引用", state: "active" }
        ] }], note: "operator[] 直接按下标访问，不检查越界。" },
        { regions: [{ label: "vector w", cells: [
          { name: "w", type: "vector<int>", value: "[1,2,3]", size: "3 个 int", state: "active" }
        ] }], note: "w.at(1) 合法，返回 2。" },
        { regions: [{ label: "vector w", cells: [
          { name: "w.at(5)", type: "越界", value: "throw out_of_range", size: "异常", state: "bad" }
        ] }], note: "at(5) 抛异常，被 catch 接住；[] 在这种情况下不检查。" }
      ]
    },
    ch11: {
      cardId: "ch11-ex-04",
      engine: "stack",
      question: "throw 之后，栈帧是一下子全没了吗？局部对象的析构在 catch 之前还是之后？",
      frames: [
        { frames: [{ name: "main", locals: ["g3 已构造"] }], note: "进入 try 块，g3 构造。" },
        { frames: [{ name: "main", locals: ["g3"] }, { name: "middle()", locals: ["g2 已构造"] }], note: "进入 middle，g2 构造。" },
        { frames: [{ name: "main", locals: ["g3"] }, { name: "middle()", locals: ["g2"] }, { name: "inner()", locals: ["g1 已构造"] }], note: "进入 inner，g1 构造。" },
        { frames: [{ name: "main", locals: ["g3"] }, { name: "middle()", locals: ["g2"] }, { name: "inner()", locals: ["g1", "throw!"] }], note: "throw：栈展开开始，inner、middle、try 块将依次退出。" },
        { frames: [{ name: "main", locals: ["g3"] }, { name: "middle()", locals: ["g2"] }], note: "inner 退出：g1 析构；inner 栈帧弹出。" },
        { frames: [{ name: "main", locals: ["g3"] }], note: "middle 退出：g2 析构；第 20 行的正常输出被跳过。" },
        { frames: [{ name: "main", locals: ["g3", "准备进入 catch"] }], note: "关键考点：进入 catch 之前，try 块内的 g3 也被析构。" },
        { frames: [{ name: "main", locals: ["catch 已进入"] }], note: "现在才轮到 catch 处理器执行，输出捕获信息。" },
        { frames: [{ name: "main", locals: ["程序继续"] }], note: "异常已处理，程序继续执行。" }
      ]
    },
    ch12: {
      cardId: "ch12-ex-02",
      engine: "scene",
      question: "按值捕获和按引用捕获，闭包里到底存了什么？修改原变量后为什么结果不同？",
      frames: [
        { boxes: [
          { id: "x", label: "x", sub: "10", cls: "cell" },
          { id: "y", label: "y", sub: "20", cls: "cell" }
        ], arrows: [], note: "定义 x=10、y=20。" },
        { boxes: [
          { id: "x", label: "x", sub: "10", cls: "cell lit" },
          { id: "y", label: "y", sub: "20", cls: "cell" }
        ], arrows: [], note: "准备创建闭包 byVal。" },
        { boxes: [
          { id: "x", label: "x", sub: "10", cls: "cell" },
          { id: "y", label: "y", sub: "20", cls: "cell" },
          { id: "bv", label: "byVal.x", sub: "10（副本）", cls: "obj lit" }
        ], arrows: [{ from: "bv", to: "x", label: "拷贝当前值" }], note: "按值捕获：把 x 的当前值 10 复制进闭包。" },
        { boxes: [
          { id: "x", label: "x", sub: "10", cls: "cell" },
          { id: "y", label: "y", sub: "20", cls: "cell lit" },
          { id: "bv", label: "byVal.x", sub: "10（副本）", cls: "obj" },
          { id: "br", label: "byRef", sub: "&y", cls: "ptr lit" }
        ], arrows: [{ from: "br", to: "y", label: "引用" }], note: "按引用捕获：闭包记的是 y 本体。" },
        { boxes: [
          { id: "x", label: "x", sub: "99", cls: "cell lit" },
          { id: "y", label: "y", sub: "20", cls: "cell" },
          { id: "bv", label: "byVal.x", sub: "10（副本不变）", cls: "obj" },
          { id: "br", label: "byRef", sub: "&y", cls: "ptr" }
        ], arrows: [{ from: "br", to: "y", label: "引用" }], note: "原变量 x 改为 99；闭包里的副本不受影响。" },
        { boxes: [
          { id: "x", label: "x", sub: "99", cls: "cell" },
          { id: "y", label: "y", sub: "20", cls: "cell" },
          { id: "bv", label: "byVal()", sub: "返回 10", cls: "obj lit" },
          { id: "br", label: "byRef", sub: "&y", cls: "ptr" }
        ], arrows: [{ from: "br", to: "y", label: "引用" }], note: "byVal() 读自己的副本 → 10。" },
        { boxes: [
          { id: "x", label: "x", sub: "99", cls: "cell" },
          { id: "y", label: "y", sub: "21", cls: "cell lit" },
          { id: "bv", label: "byVal.x", sub: "10", cls: "obj" },
          { id: "br", label: "byRef", sub: "&y", cls: "ptr lit" }
        ], arrows: [{ from: "br", to: "y", label: "y += 1" }], note: "byRef() 执行 y += 1，y 本体变成 21。" },
        { boxes: [
          { id: "x", label: "x", sub: "99", cls: "cell" },
          { id: "y", label: "y", sub: "21", cls: "cell lit" },
          { id: "bv", label: "byVal.x", sub: "10", cls: "obj" },
          { id: "br", label: "byRef", sub: "&y", cls: "ptr" }
        ], arrows: [{ from: "br", to: "y", label: "引用" }], note: "打印 y 本体 → 21。" }
      ]
    },
    sorting: {
      cardId: "sort-ex-05",
      engine: "bars",
      useStepBars: true,
      question: "快排一趟 partition 之后，为什么基准一定在最终位置？"
    }
  };

  window.V2_CONFIG = {
    chapters: {
      ch01: { label: "变量与基本类型", notes: NOTES.ch01, demo: DEMOS.ch01 },
      ch02: { label: "运算符与表达式", notes: NOTES.ch02, demo: DEMOS.ch02 },
      ch03: { label: "控制流", notes: NOTES.ch03, demo: DEMOS.ch03 },
      ch04: { label: "函数", notes: NOTES.ch04, demo: DEMOS.ch04 },
      ch05: { label: "指针与引用", notes: NOTES.ch05, demo: DEMOS.ch05 },
      ch06: { label: "数组与字符串", notes: NOTES.ch06, demo: DEMOS.ch06 },
      ch07: { label: "类与对象", notes: NOTES.ch07, demo: DEMOS.ch07 },
      ch08: { label: "继承与多态", notes: NOTES.ch08, demo: DEMOS.ch08 },
      ch09: { label: "移动语义与智能指针", notes: NOTES.ch09, demo: DEMOS.ch09 },
      ch10: { label: "模板与 STL", notes: NOTES.ch10, demo: DEMOS.ch10 },
      ch11: { label: "异常与错误处理", notes: NOTES.ch11, demo: DEMOS.ch11 },
      ch12: { label: "Lambda 与现代 C++", notes: NOTES.ch12, demo: DEMOS.ch12 },
      sorting: { label: "排序算法专题", notes: [], demo: DEMOS.sorting }
    },
    specials: {
      errors: { kicker: "SPECIMEN WALL", title: "编译错误标本墙", lead: "每一条报错都是一件标本：症状、病因、处方，按编号归档。" },
      cheatsheets: { kicker: "CARD BOX", title: "速查卡盒", lead: "把常用表做成可抽取的索引卡：搜索、翻卡、打印带走。" },
      sorting: { kicker: "SORT RACE", title: "排序赛道", lead: "七种排序在同一条赛道上比复杂度、稳定性和交换次数。" },
      "exam-pitfalls": { kicker: "MINEFIELD", title: "易错雷区", lead: "20 个经典陷阱埋在这里。先看错误代码，再展开正确写法与考场问法。" },
      bughunt: { kicker: "CASE BOARD", title: "找错案件板", lead: "每段代码是一份案卷，只有一行是真正的凶手。" }
    }
  };
})();
