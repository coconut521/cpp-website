/* ============================================================
 * bughunt-data.js —— 「火眼金睛」找 Bug 练习题库
 * 暴露：window.BUGHUNT_DATA
 * 每题字段：
 *   id       唯一 id（bh- 前缀；也被用作页面锚点，全站不可重复）
 *   ch       所属章节 id（与 toc.js 的 COURSE_TOC 对应）
 *   title    题目标题
 *   kind     问题类型："compile" 编译错误 | "logic" 逻辑错误 | "ub" 未定义行为
 *   code     代码原文（按行拆成数组；引擎负责转义与高亮）
 *   bugLine  出问题的行号（1 起，与 code 的行序一致）
 *   hint     可选：点「提示」按钮后显示
 *   why      解析（作为原始 HTML 插入；尖括号写 &lt; &gt;）
 * 注意：本站教学原则 —— 涉及 UB 的题不问"确定输出"，解析里说明原因。
 * ============================================================ */
window.BUGHUNT_DATA = [
  /* ---------- 第1章 变量与基本类型 ---------- */
  {
    id: "bh-ch01-01",
    ch: "ch01",
    title: "找错：十月的天数怎么变成 8 了",
    kind: "logic",
    code: [
      '#include <iostream>',
      'int main() {',
      '    int total = 010;        // 十月有 10 天活动',
      '    std::cout << total << "\\n";',
      '    return 0;',
      '}'
    ],
    bugLine: 3,
    hint: '这个字面量是怎么<b>开头</b>的？C++ 对开头字符有特殊规定。',
    why: '以 <code>0</code> 开头的整数字面量是<b>八进制</b>：<code>010</code> 等于十进制的 8，程序输出 8 而不是 10。表示十进制就直接写 <code>10</code>；顺带一提，<code>09</code> 这种写法（9 不是八进制数码）会直接编译错误。'
  },
  {
    id: "bh-ch01-02",
    ch: "ch01",
    title: "找错：给 char 赋“姓名首字母”",
    kind: "compile",
    code: [
      '#include <iostream>',
      'int main() {',
      '    char initial = "Z";     // 姓名首字母',
      '    std::cout << initial << "\\n";',
      '    return 0;',
      '}'
    ],
    bugLine: 3,
    hint: '单引号和双引号在 C++ 里不是一回事。',
    why: '双引号 <code>"Z"</code> 是<b>字符串字面量</b>（类型 <code>const char*</code>），不能赋给只能装一个字符的 <code>char</code>，会编译报错。字符要用<b>单引号</b>：<code>char initial = \'Z\';</code>。'
  },

  /* ---------- 第2章 运算符与表达式 ---------- */
  {
    id: "bh-ch02-01",
    ch: "ch02",
    title: "找错：平均分 87.5 怎么算成了 87",
    kind: "logic",
    code: [
      '#include <iostream>',
      'int main() {',
      '    int chinese = 85, math = 90;',
      '    double avg = (chinese + math) / 2;   // 求两科平均分',
      '    std::cout << avg << "\\n";',
      '    return 0;',
      '}'
    ],
    bugLine: 4,
    hint: '除号两边操作数的类型，决定了这是哪种除法。',
    why: '<code>(chinese + math) / 2</code> 两侧都是 <code>int</code>，先做<b>整数除法</b>得 87，之后才把 87 转成 double 存进 avg——输出 87 而不是 87.5。把 2 写成 <code>2.0</code>（或先把一侧转成 double）即可。'
  },
  {
    id: "bh-ch02-02",
    ch: "ch02",
    title: "找错：想判断满分，结果人人满分",
    kind: "logic",
    code: [
      '#include <iostream>',
      'int main() {',
      '    int score = 60;',
      '    if (score = 100) {                  // 想判断是否满分',
      '        std::cout << "满分！\\n";',
      '    }',
      '    std::cout << score << "\\n";',
      '    return 0;',
      '}'
    ],
    bugLine: 4,
    hint: '一个等号和两个等号，差一个字符，差一种含义。',
    why: '<code>=</code> 是<b>赋值</b>不是比较：<code>score = 100</code> 把 score 改成 100，整个表达式的值是 100（非 0，恒为真），于是永远打印「满分！」，且最后一行输出 100。判断相等要写 <code>==</code>；开 <code>-Wall</code> 通常能提前收到警告。'
  },

  /* ---------- 第3章 控制流 ---------- */
  {
    id: "bh-ch03-01",
    ch: "ch03",
    title: "找错：多打印一次的循环",
    kind: "ub",
    code: [
      '#include <iostream>',
      'int main() {',
      '    int a[5] = {1, 2, 3, 4, 5};',
      '    for (int i = 0; i <= 5; ++i) {      // 依次打印数组元素',
      '        std::cout << a[i] << " ";',
      '    }',
      '    return 0;',
      '}'
    ],
    bugLine: 4,
    hint: '5 个元素，最后一个下标是几？',
    why: '数组下标范围是 0~4，<code>i &lt;= 5</code> 会访问到 <code>a[5]</code>——<b>数组越界是未定义行为</b>，可能输出垃圾值甚至崩溃。正确写法是 <code>i &lt; 5</code>。'
  },
  {
    id: "bh-ch03-02",
    ch: "ch03",
    title: "找错：switch 一次输出三行",
    kind: "logic",
    code: [
      '#include <iostream>',
      'int main() {',
      '    int level = 1;',
      '    switch (level) {',
      '        case 1: std::cout << "新手\\n";',
      '        case 2: std::cout << "进阶\\n";',
      '        default: std::cout << "未知\\n";',
      '    }',
      '    return 0;',
      '}'
    ],
    bugLine: 5,
    hint: '每个分支的出口在哪里？',
    why: '<code>case 1</code> 的末尾没有 <code>break</code>，匹配后会<b>继续执行</b>下面的分支（fallthrough），level 为 1 时三行全部输出。每个分支结尾加 <code>break;</code>；确需故意贯穿时，用 <code>[[fallthrough]];</code> 显式注明。'
  },

  /* ---------- 第4章 函数 ---------- */
  {
    id: "bh-ch04-01",
    ch: "ch04",
    title: "找错：返回“较大的那个”的引用",
    kind: "ub",
    code: [
      '#include <iostream>',
      'int& bigger(int& a, int& b) {',
      '    int m = (a > b) ? a : b;',
      '    return m;                  // 返回较大的那个',
      '}',
      'int main() {',
      '    int x = 3, y = 8;',
      '    std::cout << bigger(x, y) << "\\n";',
      '    return 0;',
      '}'
    ],
    bugLine: 4,
    hint: '函数返回之后，这个引用指向的对象还活着吗？',
    why: '<code>m</code> 是函数内的局部变量，函数一返回它就销毁了，返回它的引用是<b>未定义行为</b>（悬空引用）。应直接返回引用参数：<code>return (a &gt; b) ? a : b;</code>，或把返回类型改成按值的 <code>int</code>。'
  },
  {
    id: "bh-ch04-02",
    ch: "ch04",
    title: "找错：写了交换函数，两个数却没换",
    kind: "logic",
    code: [
      '#include <iostream>',
      'void mySwap(int a, int b) {',
      '    int t = a; a = b; b = t;',
      '}',
      'int main() {',
      '    int x = 1, y = 9;',
      '    mySwap(x, y);',
      '    std::cout << x << " " << y << "\\n";',
      '    return 0;',
      '}'
    ],
    bugLine: 2,
    hint: '函数拿到的是原件，还是复印件？',
    why: '参数按<b>值传递</b>：函数交换的只是 <code>x</code>、<code>y</code> 的副本，外面的两个变量纹丝不动，输出仍是 <code>1 9</code>。把参数改成引用 <code>int&amp; a, int&amp; b</code>，才能交换实参本身。'
  },

  /* ---------- 第5章 指针与引用 ---------- */
  {
    id: "bh-ch05-01",
    ch: "ch05",
    title: "找错：delete 之后还想看一眼",
    kind: "ub",
    code: [
      '#include <iostream>',
      'int main() {',
      '    int* p = new int(42);',
      '    delete p;',
      '    std::cout << *p << "\\n";   // 看看内存里还留着什么',
      '    return 0;',
      '}'
    ],
    bugLine: 5,
    hint: '这块内存已经归还给系统了。',
    why: '<code>delete</code> 之后 <code>p</code> 成了<b>悬空指针</b>，再解引用是未定义行为。需要值应在 delete 前取出；释放后立刻置空 <code>p = nullptr;</code>，避免误用。'
  },
  {
    id: "bh-ch05-02",
    ch: "ch05",
    title: "找错：没初始化的指针直接用",
    kind: "ub",
    code: [
      '#include <iostream>',
      'int main() {',
      '    int* p;              // 指向"某个地方"',
      '    *p = 10;             // 通过 p 写入数据',
      '    std::cout << *p << "\\n";',
      '    return 0;',
      '}'
    ],
    bugLine: 4,
    hint: 'p 的值是多少？你答不出来，它自己也没有答案。',
    why: '<code>p</code> 只声明未初始化，里面是随机地址（<b>野指针</b>），<code>*p = 10</code> 会向随机地址写入——未定义行为，常见后果是程序崩溃。应先指向明确的对象（如 <code>int x; int* p = &amp;x;</code>），或初始化为 <code>nullptr</code> 并在使用前判空。'
  },

  /* ---------- 第6章 数组与字符串 ---------- */
  {
    id: "bh-ch06-01",
    ch: "ch06",
    title: "找错：自己拼的“C++”打印出乱码",
    kind: "ub",
    code: [
      '#include <iostream>',
      'int main() {',
      "    char name[] = {'C', '+', '+'};   // 想存\"C++\"",
      '    std::cout << name << "\\n";',
      '    return 0;',
      '}'
    ],
    bugLine: 3,
    hint: 'cout 怎么知道字符串到哪里结束？',
    why: '用 <code>&lt;&lt;</code> 输出 C 风格字符数组时，会一路读取内存直到遇到 <code>\'\\0\'</code>——这里没有结束符，越界读取是<b>未定义行为</b>。直接写 <code>char name[] = &quot;C++&quot;;</code>，编译器会自动补 <code>\'\\0\'</code>（数组长度为 4）。'
  },
  {
    id: "bh-ch06-02",
    ch: "ch06",
    title: "找错：取“第 9 个字符”",
    kind: "ub",
    code: [
      '#include <iostream>',
      '#include <string>',
      'int main() {',
      '    std::string s = "hello";',
      '    char c = s[9];          // 取"第 9 个字符"',
      '    std::cout << c << "\\n";',
      '    return 0;',
      '}'
    ],
    bugLine: 5,
    hint: '这个字符串一共只有几个字符？',
    why: '<code>s</code> 只有 5 个字符，合法下标是 0~4；<code>operator[]</code> 越界访问是<b>未定义行为</b>（<code>at()</code> 遇到越界才会抛 <code>std::out_of_range</code>）。访问前先判断 <code>s.size()</code>。'
  },

  /* ---------- 第7章 类与对象 ---------- */
  {
    id: "bh-ch07-01",
    ch: "ch07",
    title: "找错：复制 Buffer，程序却崩了",
    kind: "ub",
    code: [
      '#include <iostream>',
      'class Buffer {',
      'public:',
      '    Buffer(int n) : data_(new int[n]), size_(n) {}',
      '    ~Buffer() { delete[] data_; }',
      '    int& at(int i) { return data_[i]; }',
      'private:',
      '    int* data_;',
      '    int size_;',
      '};',
      'int main() {',
      '    Buffer a(4);',
      '    Buffer b = a;          // 想复制一份',
      '    b.at(0) = 99;',
      '    std::cout << a.at(0) << "\\n";',
      '    return 0;',
      '}'
    ],
    bugLine: 13,
    hint: '拷贝的到底是指针，还是指针指向的那块内存？',
    why: '编译器自动生成的拷贝构造只复制<b>指针本身</b>（浅拷贝），<code>a</code> 和 <code>b</code> 的 <code>data_</code> 指向同一块内存：先看到 99（改的是同一块），main 结束时两个对象先后析构，<b>同一块内存被 delete 两次</b>——未定义行为。管理资源的类必须自己写深拷贝（Rule of Three）。'
  },
  {
    id: "bh-ch07-02",
    ch: "ch07",
    title: "找错：构造函数里赋值，成员却是默认值",
    kind: "logic",
    code: [
      '#include <iostream>',
      '#include <string>',
      'class Student {',
      'public:',
      '    Student(std::string name, int age) {',
      '        name = name;       // 想把参数存进成员',
      '        age = age;',
      '    }',
      '    void show() { std::cout << name << " " << age << "\\n"; }',
      'private:',
      '    std::string name = "?";',
      '    int age = 0;',
      '};',
      'int main() {',
      '    Student s("小椰子", 18);',
      '    s.show();',
      '    return 0;',
      '}'
    ],
    bugLine: 6,
    hint: '等号左右两个 name，真是你想的那两个变量吗？',
    why: '参数名与成员名相同，<code>name = name</code> 是<b>参数给自己赋值</b>，成员根本没被赋值，show() 输出默认的 <code>? 0</code>。推荐用初始化列表并把参数改名：<code>Student(std::string n, int a) : name(n), age(a) {}</code>；或写 <code>this-&gt;name = name;</code>。'
  },

  /* ---------- 第8章 继承与多态 ---------- */
  {
    id: "bh-ch08-01",
    ch: "ch08",
    title: "找错：猫传进函数，叫声变了",
    kind: "logic",
    code: [
      '#include <iostream>',
      'class Animal {',
      'public:',
      '    virtual void speak() { std::cout << "...\\n"; }',
      '};',
      'class Cat : public Animal {',
      'public:',
      '    void speak() override { std::cout << "喵\\n"; }',
      '};',
      'void letSpeak(Animal a) { a.speak(); }   // 让动物叫一声',
      'int main() {',
      '    Cat c;',
      '    letSpeak(c);',
      '    return 0;',
      '}'
    ],
    bugLine: 10,
    hint: '传进函数的 Cat，还剩下几分是 Cat？',
    why: '参数按值传递，<code>Cat</code> 被切成 <code>Animal</code>（<b>对象切片</b>）——多态失效，输出 <code>...</code> 而不是 <code>喵</code>。把参数改成引用 <code>void letSpeak(Animal&amp; a)</code>，动态绑定才会生效。'
  },
  {
    id: "bh-ch08-02",
    ch: "ch08",
    title: "找错：delete 基类指针，派生类析构没跑",
    kind: "ub",
    code: [
      '#include <iostream>',
      'class Base {',
      'public:',
      '    ~Base() { std::cout << "~Base\\n"; }',
      '};',
      'class Derived : public Base {',
      'public:',
      '    ~Derived() { std::cout << "~Derived\\n"; }',
      '};',
      'int main() {',
      '    Base* p = new Derived();',
      '    delete p;              // 释放派生类对象',
      '    return 0;',
      '}'
    ],
    bugLine: 4,
    hint: '执行 delete 的时候，p 知道自己指向的到底是什么吗？',
    why: '通过基类指针 <code>delete</code> 派生类对象，而 <code>~Base()</code> 不是虚函数——标准规定这是<b>未定义行为</b>，常见表现是只执行 <code>~Base</code>、<code>~Derived</code> 被跳过，派生类资源泄漏。多态基类的析构函数应声明为 <code>virtual</code>。'
  },

  /* ---------- 第9章 移动语义与智能指针 ---------- */
  {
    id: "bh-ch09-01",
    ch: "ch09",
    title: "找错：想再要一个 unique_ptr",
    kind: "compile",
    code: [
      '#include <iostream>',
      '#include <memory>',
      'int main() {',
      '    auto a = std::make_unique<int>(42);',
      '    auto b = a;            // 想再要一个指针',
      '    std::cout << *b << "\\n";',
      '    return 0;',
      '}'
    ],
    bugLine: 5,
    hint: 'unique 这个词本身就说清楚了规则。',
    why: '<code>unique_ptr</code> <b>独占所有权</b>，拷贝构造被 <code>=delete</code>，这行直接编译错误。想共享用 <code>shared_ptr</code>；想转移所有权用 <code>auto b = std::move(a);</code>（之后 a 为空）。'
  },
  {
    id: "bh-ch09-02",
    ch: "ch09",
    title: "找错：双向引用，析构函数从不执行",
    kind: "logic",
    code: [
      '#include <iostream>',
      '#include <memory>',
      'class Node {',
      'public:',
      '    std::shared_ptr<Node> next;',
      '    ~Node() { std::cout << "~Node\\n"; }',
      '};',
      'int main() {',
      '    auto a = std::make_shared<Node>();',
      '    auto b = std::make_shared<Node>();',
      '    a->next = b;',
      '    b->next = a;           // 建立双向关系',
      '    std::cout << "done\\n";',
      '    return 0;',
      '}'
    ],
    bugLine: 12,
    hint: '程序结束前，数一数每个对象的引用计数能不能归零。',
    why: '<code>a</code>、<code>b</code> 互相用 <code>shared_ptr</code> 持有，<b>循环引用</b>让两块内存的引用计数永远无法归零，<code>~Node</code> 永远不会执行——程序正常结束但内存泄漏（运行后会发现输出里没有 ~Node）。把其中一端改成 <code>std::weak_ptr</code> 打破循环。'
  },

  /* ---------- 第10章 模板与 STL ---------- */
  {
    id: "bh-ch10-01",
    ch: "ch10",
    title: "找错：边遍历边删除偶数",
    kind: "ub",
    code: [
      '#include <iostream>',
      '#include <vector>',
      'int main() {',
      '    std::vector<int> v = {1, 2, 3, 4, 5, 6};',
      '    for (auto it = v.begin(); it != v.end(); ++it) {',
      '        if (*it % 2 == 0) v.erase(it);   // 删除所有偶数',
      '    }',
      '    for (int x : v) std::cout << x << " ";',
      '    return 0;',
      '}'
    ],
    bugLine: 6,
    hint: 'erase 之后，it 还指向"下一个元素"吗？',
    why: '<code>erase</code> 会使被删位置及其后的迭代器<b>全部失效</b>，回到循环头再 <code>++it</code> 是未定义行为。正确写法：命中时 <code>it = v.erase(it);</code>（返回值就是下一个有效迭代器），未命中才 <code>++it</code>。'
  },

  /* ---------- 第11章 异常与错误处理 ---------- */
  {
    id: "bh-ch11-01",
    ch: "ch11",
    title: "找错：专门的异常分支永远接不到",
    kind: "logic",
    code: [
      '#include <iostream>',
      '#include <stdexcept>',
      'int main() {',
      '    try {',
      '        throw std::out_of_range("下标越界");',
      '    } catch (std::exception&) {          // 兜底：所有标准异常',
      '        std::cout << "一般异常\\n";',
      '    } catch (std::out_of_range&) {       // 单独处理越界',
      '        std::cout << "越界异常\\n";',
      '    }',
      '    return 0;',
      '}'
    ],
    bugLine: 6,
    hint: 'catch 的匹配是从上往下的，第一个"接得住"的分支生效。',
    why: 'catch 按<b>书写顺序</b>匹配：基类 <code>std::exception&amp;</code> 排在前面，先把 <code>out_of_range</code> 接住了，后面的专门分支永远执行不到，输出「一般异常」。派生类的 catch 必须写在基类之前。'
  },

  /* ---------- 第12章 Lambda 与现代 C++ ---------- */
  {
    id: "bh-ch12-01",
    ch: "ch12",
    title: "找错：返回的计数器一调用就出错",
    kind: "ub",
    code: [
      '#include <iostream>',
      '#include <functional>',
      'std::function<int()> makeCounter(int start) {',
      '    return [&]() { return ++start; };   // 计数器：每调一次加一',
      '}',
      'int main() {',
      '    auto c = makeCounter(10);',
      '    std::cout << c() << " " << c() << "\\n";',
      '    return 0;',
      '}'
    ],
    bugLine: 4,
    hint: '引用捕获的“原件”，在函数返回后还活着吗？',
    why: '<code>[&amp;]</code> 按<b>引用</b>捕获了参数 <code>start</code>，而它是函数内的局部对象——<code>makeCounter</code> 一返回，闭包里的引用就<b>悬空</b>了，之后再调用 <code>c()</code> 是未定义行为。按值捕获：<code>[start]() { return ++start; }</code>（需要加 <code>mutable</code>）。'
  }
];
