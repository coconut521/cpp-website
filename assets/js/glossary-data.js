/* ============================================================
 * glossary-data.js —— 术语表数据（「术语悬停解释」功能）
 * 暴露：window.GLOSSARY_DATA
 * 每条字段：
 *   term    术语正文写法（讲义正文里出现时自动加虚线下划线，悬停出解释）
 *   aliases 可选：同义/别写法，也参与匹配（英文别名按整词匹配）
 *   detail  悬停气泡里的解释（作为原始 HTML 插入；尖括号写 &lt; &gt;）
 *   href    可选：点击术语跳转的页面（相对站点根目录）
 * 匹配规则（见 glossary.js）：每个术语每页只标注首次出现；
 * 代码块、链接、标题 h1 等内部不标注；长术语优先，避免「虚函数」
 * 抢走「纯虚函数」的匹配。
 * ============================================================ */
window.GLOSSARY_DATA = [
  /* ---------- 基础 ---------- */
  {
    term: "变量",
    detail: "给一块内存起的名字，连同里面存的值和类型。读写变量就是读写这块内存。",
    href: "chapters/ch01-variables.html"
  },
  {
    term: "初始化",
    detail: "定义变量的同时给它第一个值。<code>int a;</code> 只是定义没初始化，<code>int a{0};</code> 才有保证为 0 的初值。",
    href: "chapters/ch01-variables.html"
  },
  {
    term: "未定义行为",
    aliases: ["UB"],
    detail: "标准没有规定结果的行为：可能崩溃、可能输出垃圾值、可能被编译器优化掉。本站凡涉 UB 的代码一律红标，考试也不会有“确定输出”的标准答案。",
    href: "chapters/ch01-variables.html"
  },
  {
    term: "字面量",
    detail: "直接写在代码里的固定值，如 <code>42</code>、<code>3.14</code>、<code>'A'</code>、<code>\"hi\"</code>。以 0 开头是八进制、0x 开头是十六进制。",
    href: "chapters/ch01-variables.html"
  },
  {
    term: "窄化转换",
    detail: "把值存进装不下它的类型（如 double → int）而可能丢失信息。<code>=</code> 初始化允许并静默截断，<code>{}</code> 列表初始化直接编译报错。",
    href: "chapters/ch01-variables.html"
  },
  {
    term: "截断",
    detail: "浮点转整数时直接丢掉小数部分（向零取整），<b>不是四舍五入</b>：3.99 → 3，-3.99 → -3。",
    href: "chapters/ch01-variables.html"
  },
  {
    term: "编译期",
    detail: "程序还没有运行、编译器正在翻译代码的阶段。<code>sizeof</code>、<code>constexpr</code>、模板实例化都发生在编译期。",
    href: "chapters/ch01-variables.html"
  },
  {
    term: "整数除法",
    detail: "两个 int 相除，结果还是 int，小数部分直接丢弃：<code>7 / 2</code> 得 3。想得 3.5，至少一侧要是浮点数。",
    href: "chapters/ch02-operators.html"
  },
  {
    term: "短路求值",
    detail: "<code>&amp;&amp;</code> 和 <code>||</code> 一旦能确定整体结果，就不再计算右边的表达式，常用于“先判空再使用”。",
    href: "chapters/ch02-operators.html"
  },
  {
    term: "越界",
    detail: "访问超出合法范围的内存，比如下标 ≥ 数组长度。<code>operator[]</code> 越界是未定义行为；<code>at()</code> 越界才会抛异常。",
    href: "chapters/ch06-arrays-strings.html"
  },

  /* ---------- 函数 ---------- */
  {
    term: "传值",
    detail: "函数收到的是实参的<b>副本</b>，修改参数不影响外面的变量，大对象按值传递还有拷贝开销。",
    href: "chapters/ch04-functions.html"
  },
  {
    term: "传引用",
    aliases: ["按引用传递"],
    detail: "函数收到的是实参本身的别名，修改参数就是修改实参——<code>swap(int&amp; a, int&amp; b)</code> 能真正交换两个数靠的就是它。",
    href: "chapters/ch04-functions.html"
  },
  {
    term: "递归",
    detail: "函数直接或间接调用自己。必须有终止条件，否则无限递归会耗尽栈空间（stack overflow）。",
    href: "chapters/ch04-functions.html"
  },
  {
    term: "函数重载",
    aliases: ["重载"],
    detail: "同名函数靠<b>参数的个数或类型</b>区分。只靠返回类型不同不能构成重载。",
    href: "chapters/ch04-functions.html"
  },
  {
    term: "默认参数",
    detail: "声明时给参数预设值，调用时可以省略。默认参数必须从右往左连续给出。",
    href: "chapters/ch04-functions.html"
  },
  {
    term: "栈帧",
    detail: "每次函数调用在栈上占用的区域，存放参数、局部变量和返回地址；函数返回时栈帧销毁——这也是不能返回局部变量引用的原因。",
    href: "chapters/ch04-functions.html"
  },

  /* ---------- 指针与引用 ---------- */
  {
    term: "指针",
    detail: "存放另一个对象<b>地址</b>的变量：<code>int* p = &amp;x;</code>，通过 <code>*p</code> 读写所指向的对象。",
    href: "chapters/ch05-pointers-references.html"
  },
  {
    term: "引用",
    detail: "某个已存在对象的别名（<code>int&amp; r = x;</code>）。定义时必须绑定、之后不能改绑，也不存在“空引用”。",
    href: "chapters/ch05-pointers-references.html"
  },
  {
    term: "解引用",
    detail: "通过指针访问它指向的对象，写作 <code>*p</code>。对空指针或悬空指针解引用都是未定义行为。",
    href: "chapters/ch05-pointers-references.html"
  },
  {
    term: "空指针",
    aliases: ["nullptr"],
    detail: "不指向任何对象的指针（<code>nullptr</code>）。解引用空指针是未定义行为，使用前先判断 <code>if (p)</code>。",
    href: "chapters/ch05-pointers-references.html"
  },
  {
    term: "悬空指针",
    aliases: ["野指针"],
    detail: "指向已释放内存或未初始化的指针，解引用是未定义行为。<code>delete</code> 后立刻置 <code>nullptr</code>；指针定义时就初始化。",
    href: "chapters/ch05-pointers-references.html"
  },
  {
    term: "数组退化",
    detail: "数组在传参或表达式中自动变成指向首元素的指针，<code>sizeof</code> 也随之不再表示数组大小。",
    href: "chapters/ch05-pointers-references.html"
  },
  {
    term: "字符串",
    detail: "C++ 有两种：<b>C 风格字符数组</b>（以 <code>'\\0'</code> 结尾）和 <b>std::string</b>（自动管理长度）。新手优先用 std::string。",
    href: "chapters/ch06-arrays-strings.html"
  },

  /* ---------- 类与对象 ---------- */
  {
    term: "构造函数",
    detail: "与类同名的特殊成员函数，对象创建时自动执行，负责初始化成员。",
    href: "chapters/ch07-classes.html"
  },
  {
    term: "析构函数",
    detail: "<code>~类名()</code>，对象销毁时自动调用，负责释放资源。会被多态使用的基类，析构函数必须声明为 virtual。",
    href: "chapters/ch07-classes.html"
  },
  {
    term: "初始化列表",
    detail: "构造函数里冒号开头的成员初始化写法：<code>: name_(n), age_(a)</code>。成员实际的初始化顺序由<b>声明顺序</b>决定，与列表顺序无关。",
    href: "chapters/ch07-classes.html"
  },
  {
    term: "拷贝构造",
    detail: "用同类型对象初始化新对象时调用的构造函数 <code>X(const X&amp;)</code>。不写时编译器会生成逐成员复制的版本。",
    href: "chapters/ch07-classes.html"
  },
  {
    term: "浅拷贝",
    detail: "只复制指针本身、不复制指向的内存——两个对象共享同一块资源，析构时重复释放（double free，未定义行为）。",
    href: "chapters/ch07-classes.html"
  },
  {
    term: "深拷贝",
    detail: "为新对象另行分配并复制一份资源，两个对象各自独立。管理资源的类要自定义深拷贝（Rule of Three）。",
    href: "chapters/ch07-classes.html"
  },

  /* ---------- 继承与多态 ---------- */
  {
    term: "继承",
    detail: "<code>class Cat : public Animal</code> 让派生类自动获得基类的成员，表达 is-a 关系。",
    href: "chapters/ch08-inheritance-polymorphism.html"
  },
  {
    term: "多态",
    detail: "通过基类指针或引用调用虚函数时，执行的是对象<b>自己</b>的版本——具体调用哪个在运行期决定。",
    href: "chapters/ch08-inheritance-polymorphism.html"
  },
  {
    term: "虚函数",
    detail: "声明为 <code>virtual</code> 的成员函数，支持运行期动态绑定；派生类重写时建议加 <code>override</code> 让编译器帮你核对。",
    href: "chapters/ch08-inheritance-polymorphism.html"
  },
  {
    term: "纯虚函数",
    detail: "<code>virtual void f() = 0;</code> 只声明不实现，使所在类成为抽象类，强制派生类给出自己的实现。",
    href: "chapters/ch08-inheritance-polymorphism.html"
  },
  {
    term: "抽象类",
    detail: "至少含一个纯虚函数的类。<b>不能直接创建对象</b>，只能当作接口基类通过指针/引用使用。",
    href: "chapters/ch08-inheritance-polymorphism.html"
  },
  {
    term: "对象切片",
    aliases: ["切片"],
    detail: "把派生类对象按值赋给或传给基类时，派生类新增的部分被“切掉”，多态随之失效。想保持多态请用指针或引用传递。",
    href: "chapters/ch08-inheritance-polymorphism.html"
  },
  {
    term: "虚析构",
    detail: "<code>virtual ~Base()</code>。通过基类指针 delete 派生类对象时，基类析构函数必须是虚函数，否则是未定义行为。",
    href: "chapters/ch08-inheritance-polymorphism.html"
  },

  /* ---------- 移动语义与智能指针 ---------- */
  {
    term: "左值",
    detail: "有名字、能取地址、表达式结束后依然存在的对象。与之相对的右值是临时的、即将消亡的值（字面量、函数返回的临时对象）。",
    href: "chapters/ch09-move-smart-pointers.html"
  },
  {
    term: "右值",
    detail: "临时的、即将消亡的值（字面量、函数返回的临时对象）。右值引用 <code>Type&amp;&amp;</code> 专门绑定右值，是移动构造的参数类型。",
    href: "chapters/ch09-move-smart-pointers.html"
  },
  {
    term: "移动语义",
    detail: "把资源（如堆内存）从一个对象“搬”到另一个对象而不是复制，C++11 起配合右值引用与 <code>std::move</code> 使用。",
    href: "chapters/ch09-move-smart-pointers.html"
  },
  {
    term: "智能指针",
    detail: "自动管理对象生命周期的指针模板：<code>unique_ptr</code> 独占、<code>shared_ptr</code> 共享引用计数、<code>weak_ptr</code> 观察但不计数。",
    href: "chapters/ch09-move-smart-pointers.html"
  },
  {
    term: "RAII",
    detail: "Resource Acquisition Is Initialization：资源在对象构造时获取、析构时释放。靠栈对象“必然析构”的确定性防止泄漏，是现代 C++ 的资源管理基石。",
    href: "chapters/ch09-move-smart-pointers.html"
  },
  {
    term: "循环引用",
    detail: "两个对象用 <code>shared_ptr</code> 互相持有，引用计数永远无法归零，内存泄漏。把其中一端改成 <code>weak_ptr</code> 打破循环。",
    href: "chapters/ch09-move-smart-pointers.html"
  },

  /* ---------- 模板 / STL / 异常 / 现代 C++ ---------- */
  {
    term: "模板",
    detail: "写一份带类型参数的代码，编译器按实际使用的类型生成具体版本，如 <code>vector&lt;int&gt;</code>。",
    href: "chapters/ch10-templates-stl.html"
  },
  {
    term: "迭代器",
    detail: "行为类似指针的对象，用来遍历容器：<code>v.begin()</code> 指向首元素，<code>v.end()</code> 指向末尾元素的<b>后面</b>。",
    href: "chapters/ch10-templates-stl.html"
  },
  {
    term: "迭代器失效",
    detail: "修改容器（如 vector 的 erase、扩容）会使某些迭代器不再有效，继续使用是未定义行为。<code>erase</code> 会返回下一个有效迭代器。",
    href: "chapters/ch10-templates-stl.html"
  },
  {
    term: "STL",
    detail: "标准模板库：容器（vector / map / set…）、迭代器和通用算法（sort / find…）的总称，现代 C++ 的日常工具箱。",
    href: "chapters/ch10-templates-stl.html"
  },
  {
    term: "栈展开",
    detail: "异常抛出后沿调用链逐层退出、并逐一析构局部对象的过程——这正是 RAII 能保证异常路径下资源也被释放的原因。",
    href: "chapters/ch11-exceptions.html"
  },
  {
    term: "Lambda",
    aliases: ["lambda", "闭包"],
    detail: "匿名函数对象，写作 <code>[捕获](参数){ 函数体 }</code>。捕获列表决定能否使用外部变量：<code>[=]</code> 按值、<code>[&amp;]</code> 按引用。",
    href: "chapters/ch12-lambda-modern-cpp.html"
  },
  {
    term: "结构化绑定",
    detail: "C++17 语法：<code>auto [k, v] : myMap</code>，把 pair、数组或结构体的成员一次性拆到具名变量里。",
    href: "chapters/ch12-lambda-modern-cpp.html"
  }
];
