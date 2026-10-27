/* ============================================================
 * quizbank-data.js —— 跨章题库（「随机组卷」的数据源之一）
 * 暴露：window.QUIZBANK_DATA
 * 每题字段：
 *   id         唯一 id（qb- 前缀）
 *   ch         所属章节 id（对应 toc.js 的 COURSE_TOC）
 *   type       题型：mcq | tf | fill | code（与 quiz.js 引擎一致）
 *   q          题干（可含 <code>/<b> 等行内 HTML）
 *   options    mcq 的选项数组；answer 为正确项下标
 *   answer     tf 为 true/false；fill/code 为字符串或数组（多个可接受答案）
 *   explain    解析（出现在答案页）
 *   difficulty "easy" | "medium" | "hard"（组卷难度筛选）
 *   tags       考点标签数组
 * 原则：未定义行为绝不作为“求确定输出”的题目。
 * 注意：本文件同时被 teacher.js（组卷）按需动态注入——保持
 *       window.XXX = [...] 的全局挂载写法（file:// 无 fetch）。
 * ============================================================ */
window.QUIZBANK_DATA = [
  /* ---------- 第1章 变量与基本类型 ---------- */
  {
    id: "qb-ch01-1", ch: "ch01", type: "mcq", difficulty: "easy", tags: ["初始化"],
    q: "<code>int a{};</code> 之后 a 的值是？",
    options: ["未初始化的垃圾值", "0", "编译错误", "取决于编译器"], answer: 1,
    explain: "值初始化 int a{}; 标准保证清零；int a; 才是未初始化（读取是 UB）。"
  },
  {
    id: "qb-ch01-2", ch: "ch01", type: "tf", difficulty: "medium", tags: ["类型转换"],
    q: "<code>int x = 3.9;</code> 能通过编译，x 的值为 3。",
    answer: true,
    explain: "拷贝初始化允许隐式窄化（截断小数部分）；列表初始化 int x{3.9}; 才会编译报错。"
  },

  /* ---------- 第2章 运算符与表达式 ---------- */
  {
    id: "qb-ch02-1", ch: "ch02", type: "mcq", difficulty: "easy", tags: ["整数除法"],
    q: "<code>double r = 7 / 2;</code> 之后 r 的值是？",
    options: ["3.5", "3", "4", "编译错误"], answer: 1,
    explain: "除号两侧都是 int，先做整数除法得 3，再转换为 double。想得 3.5 要写 7.0 / 2 或 (double)7 / 2。"
  },
  {
    id: "qb-ch02-2", ch: "ch02", type: "mcq", difficulty: "hard", tags: ["未定义行为"],
    q: "<code>int i = 0; std::cout &lt;&lt; i++ &lt;&lt; i;</code> 的正确说法是？",
    options: ["输出 01", "输出 00", "输出 10", "未定义行为，没有标准答案"], answer: 3,
    explain: "同一条语句里对 i 既修改又读取且无序，是未定义行为——任何“确定的输出”都不成立。"
  },

  /* ---------- 第3章 控制流 ---------- */
  {
    id: "qb-ch03-1", ch: "ch03", type: "mcq", difficulty: "easy", tags: ["switch"],
    q: "switch 的条件表达式不能是下面哪种类型？",
    options: ["int", "char", "枚举", "std::string"], answer: 3,
    explain: "switch 条件必须可整型提升（int/char/枚举均可）；string 不是整型，编译报错。"
  },
  {
    id: "qb-ch03-2", ch: "ch03", type: "fill", difficulty: "medium", tags: ["循环"],
    q: "补全：无限循环最常写成的 for 头部（写最常见的那个字面量）。",
    answer: ["for (;;)"],
    explain: "for (;;) 是经典的无限循环写法；while (true) 同效。两段都省略时中间的判断恒为真。"
  },

  /* ---------- 第4章 函数 ---------- */
  {
    id: "qb-ch04-1", ch: "ch04", type: "mcq", difficulty: "medium", tags: ["传参"],
    q: "想让函数内部修改调用者的 int 变量，参数应写成？",
    options: ["int x", "const int& x", "int& x", "int x[]"], answer: 2,
    explain: "按值传参改的是副本；const 引用不能写；引用参数 int& x 才能作用于实参本身。"
  },
  {
    id: "qb-ch04-2", ch: "ch04", type: "mcq", difficulty: "hard", tags: ["递归", "未定义行为"],
    q: "<code>int& f() { int m = 1; return m; }</code>，关于 <code>int& r = f();</code> 的说法正确的是？",
    options: ["r 的值是 1", "r 是悬空引用，解引用是未定义行为", "编译错误，不能返回引用", "r 会自动变成按值拷贝"], answer: 1,
    explain: "返回局部变量的引用，函数返回后对象已销毁——悬空引用，使用它是 UB。"
  },

  /* ---------- 第5章 指针与引用 ---------- */
  {
    id: "qb-ch05-1", ch: "ch05", type: "mcq", difficulty: "easy", tags: ["空指针"],
    q: "表示“不指向任何对象”的空指针，现代 C++ 推荐写法是？",
    options: ["NULL", "0", "nullptr", "void*"], answer: 2,
    explain: "C++11 起一律写 nullptr：类型安全、重载决议更明确。NULL/0 在 C++ 里是整数表达式，容易踩重载坑。"
  },
  {
    id: "qb-ch05-2", ch: "ch05", type: "mcq", difficulty: "medium", tags: ["指针算术"],
    q: "<code>int a[5]; int* p = a; p + 1</code> 使指针的地址值增加多少（64 位平台、常见编译器）？",
    options: ["1 字节", "4 字节", "8 字节", "不确定"], answer: 1,
    explain: "指针算术按“元素跨度”移动：int 占 4 字节，p+1 前进一个 int。这也是指针有类型的原因。"
  },

  /* ---------- 第6章 数组与字符串 ---------- */
  {
    id: "qb-ch06-1", ch: "ch06", type: "mcq", difficulty: "easy", tags: ["C 风格字符串"],
    q: "<code>char s[] = \"hi\";</code> 中数组 s 的长度是？",
    options: ["2", "3", "4", "不确定"], answer: 1,
    explain: "字符串字面量自带 '\\0' 结束符：'h'、'i'、'\\0' 共 3 个。没有结束符的字符数组用 &lt;&lt; 输出会越界读（UB）。"
  },
  {
    id: "qb-ch06-2", ch: "ch06", type: "mcq", difficulty: "medium", tags: ["std::string"],
    q: "越界访问 <code>std::string</code> 的元素，哪个说法正确？",
    options: ["s[i] 越界是 UB，s.at(i) 越界抛异常", "两者都抛 std::out_of_range", "两者都是 UB", "两者都返回 '\\0'"], answer: 0,
    explain: "operator[] 不做越界检查（越界是 UB）；at() 做检查并抛 std::out_of_range。"
  },

  /* ---------- 第7章 类与对象 ---------- */
  {
    id: "qb-ch07-1", ch: "ch07", type: "tf", difficulty: "medium", tags: ["初始化列表"],
    q: "成员初始化列表的<b>执行顺序</b>由列表里的书写顺序决定。",
    answer: false,
    explain: "执行顺序由成员的<b>声明顺序</b>决定；列表顺序只决定“谁用什么初值”。书写顺序与声明顺序不一致时 -Werror=reorder 会警告。"
  },
  {
    id: "qb-ch07-2", ch: "ch07", type: "mcq", difficulty: "hard", tags: ["深拷贝"],
    q: "管理堆内存的类不写拷贝构造、直接用编译器生成的版本，两个对象赋值后会？",
    options: ["各自持有独立内存，安全", "两个对象的指针指向同一块内存，析构时双重释放（UB）", "编译错误", "第二次析构被自动跳过"], answer: 1,
    explain: "编译器生成的拷贝构造按位复制指针（浅拷贝）；两个对象析构同一块内存是 UB。必须自己实现深拷贝（Rule of Three）。"
  },

  /* ---------- 第8章 继承与多态 ---------- */
  {
    id: "qb-ch08-1", ch: "ch08", type: "mcq", difficulty: "medium", tags: ["多态"],
    q: "通过<b>基类引用或指针</b>调用虚函数时，执行哪个版本由什么决定？",
    options: ["引用/指针的静态类型", "运行时指向的实际对象类型", "编译器优化级别", "调用处所在文件"], answer: 1,
    explain: "虚函数的动态绑定看运行时的实际对象类型；按值传递会发生对象切片，多态失效。"
  },
  {
    id: "qb-ch08-2", ch: "ch08", type: "tf", difficulty: "hard", tags: ["虚析构"],
    q: "用基类指针 delete 派生类对象，而基类析构函数不是虚函数，是未定义行为。",
    answer: true,
    explain: "标准明确规定这是 UB，常见表现是派生类析构被跳过、资源泄漏。多态基类的析构函数应声明为 virtual。"
  },

  /* ---------- 第9章 移动语义与智能指针 ---------- */
  {
    id: "qb-ch09-1", ch: "ch09", type: "mcq", difficulty: "easy", tags: ["unique_ptr"],
    q: "<code>auto b = a;</code>（a 是 unique_ptr）的结果是？",
    options: ["b 和 a 共享对象", "编译错误：拷贝构造被删除", "b 拿到拷贝，a 不变", "a 被置空"], answer: 1,
    explain: "unique_ptr 独占所有权，拷贝构造 =delete，直接编译错误。转移所有权要写 auto b = std::move(a);。"
  },
  {
    id: "qb-ch09-2", ch: "ch09", type: "mcq", difficulty: "hard", tags: ["shared_ptr"],
    q: "两个对象用 shared_ptr <b>互相</b>持有对方，最可能的后果是？",
    options: ["编译错误", "引用计数永不归零，内存泄漏", "程序立即崩溃", "自动打破循环"], answer: 1,
    explain: "循环引用使计数无法归零，析构不执行。把一端改成 weak_ptr 打破循环。"
  },

  /* ---------- 第10章 模板与 STL ---------- */
  {
    id: "qb-ch10-1", ch: "ch10", type: "mcq", difficulty: "medium", tags: ["迭代器失效"],
    q: "遍历 <code>std::vector</code> 时删除当前元素，正确的写法是？",
    options: ["v.erase(it); 然后 ++it", "it = v.erase(it);，未命中才 ++it", "先 ++it 再 erase", "用 v[i] 下标边遍历边删"], answer: 1,
    explain: "erase 返回下一个有效迭代器；erase 后继续 ++it 是使用失效迭代器（UB）。"
  },
  {
    id: "qb-ch10-2", ch: "ch10", type: "fill", difficulty: "medium", tags: ["模板"],
    q: "补全函数模板头：求两数较大值（typename T 可换 class T，写 typename 版本）。",
    answer: ["template <typename T>", "template<typename T>"],
    explain: "模板参数在每次实例化时由实参推导；typename 与 class 在此处等价。"
  },

  /* ---------- 第11章 异常与错误处理 ---------- */
  {
    id: "qb-ch11-1", ch: "ch11", type: "mcq", difficulty: "easy", tags: ["异常"],
    q: "catch 子句捕获标准异常对象时，推荐的参数写法是？",
    options: ["catch (std::exception e)", "catch (std::exception& e)", "catch (std::exception* e)", "catch (...)"], answer: 1,
    explain: "按 const 引用最佳（此处给的是非 const 引用形式）：避免对象切片与多余拷贝。按值捕获会切片，按指针捕获有所有权歧义。"
  },
  {
    id: "qb-ch11-2", ch: "ch11", type: "tf", difficulty: "medium", tags: ["异常安全"],
    q: "析构函数默认（C++11 起）是 noexcept 的，析构函数里抛异常可能导致 std::terminate。",
    answer: true,
    explain: "析构默认 noexcept；栈展开中再抛异常会触发 std::terminate。析构里只做清理，不做可能抛异常的事。"
  },

  /* ---------- 第12章 Lambda 与现代 C++ ---------- */
  {
    id: "qb-ch12-1", ch: "ch12", type: "mcq", difficulty: "medium", tags: ["lambda"],
    q: "Lambda 想修改按引用捕获之外的<b>值捕获</b>变量（捕获副本），必须加什么？",
    options: ["static", "mutable", "const", "noexcept"], answer: 1,
    explain: "值捕获的副本默认 const；加 mutable 才能在 lambda 体内修改副本（不影响外部原变量）。"
  },
  {
    id: "qb-ch12-2", ch: "ch12", type: "mcq", difficulty: "hard", tags: ["lambda", "未定义行为"],
    q: "<code>auto make() { int x = 1; return [&amp;]() { return ++x; }; }</code> 返回的 lambda 在函数外调用时？",
    options: ["正常计数", "捕获的引用已悬空，调用是未定义行为", "编译错误", "自动改为按值捕获"], answer: 1,
    explain: "[&] 按引用捕获了局部变量 x，make 返回后引用悬空。跨生命周期传递 lambda 要按值捕获（需要 mutable 才能自增）。"
  }
];
