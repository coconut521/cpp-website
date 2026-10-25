/* ============================================================
 * pitfalls-data.js —— 考试易错点专题数据（全局变量，离线可用）
 * 每条：{ id, title, tags, bad, why, good, examQ, quiz[2~4], related }
 * quiz 题型：mcq / tf / fill / code（与全站测验引擎一致）
 * 原则：未定义行为绝不给出“标准答案输出”。
 * ============================================================ */
window.PITFALLS_DATA = [

  {
    id: "pf-incdec",
    title: "i++ 与 ++i：先取值还是先自增",
    tags: ["运算符", "表达式求值"],
    bad: `int i = 5;
int x = 2 * i++;   // 用了旧值 5：x = 10，之后 i = 6
int y = 2 * ++i;   // 先自增到 7：y = 14，i = 7
// 更糟：混在一起
int z = i++ + ++i; // ⛔ 未定义行为`,
    why: "后缀 i++ 的表达式的值是自增前的旧值，前缀 ++i 的值是自增后的新值——但两者的副作用（i 加一）都会发生。单独使用（一行只有一个语句）时两者结果相同，所以很多人背混。而对同一个变量在一个表达式中修改多次，求值顺序标准未规定，是未定义行为。",
    good: `int i = 5;
int x = 2 * i;   // 明确：先用旧值
++i;             // 明确：再自增（无需值的场合优先 ++i）
// 需要新值就写：
int y = 2 * (++i);`,
    examQ: "典型题型：『int i=5; 求 cout << i++ << \",\" << ++i; 的输出』——这类同一语句中混合使用 i++ 与 ++i 的题本身就是未定义行为，正确回应是指出 UB 而不是硬算。合法考法是分开多行，逐行推演旧值/新值。",
    quiz: [
      { type: "mcq", q: "<code>int i = 3; int x = i++ + 10;</code> 之后 x 与 i 分别是？",
        options: ["x=13, i=4", "x=14, i=4", "x=13, i=3", "未定义行为"], answer: 0,
        explain: "一行只对 i 修改一次：i++ 取旧值 3 参与加法，x=13；随后 i 自增为 4。" },
      { type: "mcq", q: "<code>int i = 3; int x = ++i + 10;</code> 之后 x 与 i 分别是？",
        options: ["x=13, i=4", "x=14, i=4", "x=14, i=3", "x=13, i=3"], answer: 1,
        explain: "++i 先自增为 4，表达式的值取新值 4，x=14。" },
      { type: "tf", q: "单独一条语句 <code>++i;</code> 与 <code>i++;</code> 的效果完全相同。",
        answer: true, explain: "不使用表达式的值时，两者都只产生“i 加一”的副作用；习惯上写 ++i（对类类型理论上少一次临时对象）。" },
      { type: "mcq", q: "<code>int i = 0; int a[3] = {10,20,30};</code>，求 <code>a[i] = i + i++;</code> 后的确定结果。",
        options: ["a[0]=0", "a[1]=0", "a[0]=1", "这是未定义行为，没有确定结果"], answer: 3,
        explain: "表达式 <code>i + i++</code> 对 i 的读取与修改求值无序，属于未定义行为——任何“确定结果”的说法都不成立。" }
    ],
    related: ["ch02"]
  },

  {
    id: "pf-seq-multiple-modify",
    title: "同一表达式多次修改变量（序列点）",
    tags: ["运算符", "未定义行为"],
    bad: `int i = 1;
int r = i + i++ + ++i;   // ⛔ 未定义行为
cout << (i = i++ + i);   // ⛔ 同样是 UB`,
    why: "C++17 之前，一个表达式中对同一对象的多次无序修改，结果完全依赖编译器实现；C++17 虽规定赋值号右侧先于左侧求值（i = i++ + 1 由此变得有定义），但 + 号两侧的求值顺序至今仍未规定——i + i++ + ++i、(i = 2) + i 这类写法在任何标准下都是未定义行为。编译器可以按任意顺序求值子表达式、甚至利用 UB 做优化——没有“标准输出”可言。",
    good: `int i = 1;
int a = i + 1;   // 拆成多步，每步只改一次 i
++i;
int r = a + i;   // 每一步语义都确定`,
    examQ: "考试若出现『求 i + i++ + ++i 的值』，正确做法是指出这是未定义行为、任何具体数值都不是标准答案。阅卷现场若必须作答，写明 UB 并解释原因往往才是给分点。",
    quiz: [
      { type: "mcq", q: "<code>int i = 0; int r = (i = 2) + i;</code> 的结果？",
        options: ["一定是 2", "一定是 4", "未定义行为，不能想当然", "编译错误"], answer: 2,
        explain: "加号两侧的求值顺序标准始终未规定：(i = 2) 对 i 的修改与另一侧对 i 的读取无序，任何标准版本下都是未定义行为。这不是可靠的考试素材，工程上应拆开写。" },
      { type: "tf", q: "把 <code>i = i++ + 1;</code> 当作“先加一再赋值”来推导输出是可靠做法。",
        answer: false, explain: "该写法对 i 修改两次且无序，是未定义行为；编译器优化后可能给出任何结果。" }
    ],
    related: ["ch02"]
  },

  {
    id: "pf-shortcircuit",
    title: "短路求值会跳过右侧副作用",
    tags: ["逻辑运算符", "表达式求值"],
    bad: `int calls = 0;
bool inc()  { ++calls; return true;  }
bool ok()   { return false; }

if (ok() && inc()) { }      // inc 不执行
cout << calls;              // 0，不是 1！`,
    why: "&& 在左侧为假时直接短路，右侧表达式完全不求值；|| 在左侧为真时同理。把有副作用的函数调用（计数器、输出、指针移动）放在右侧，被短路后就悄悄“没执行”。",
    good: `// 需要两侧都执行：先算再判断
bool a = inc();
bool b = ok();
if (a && b) { }

// 或刻意利用短路做“先判空再使用”：
if (p != nullptr && *p > 0) { /* 安全 */ }`,
    examQ: "典型题型：『给出含 ++ 与 && 的表达式，问变量最终值』——先标出哪些子表达式被短路跳过，再数副作用发生了几次。短路保护惯用法 if (i < n && a[i] == x) 也是高频考点。",
    quiz: [
      { type: "mcq", q: "<code>int x = 0; bool b = false && ++x; </code> 执行后 x 的值？",
        options: ["1", "0", "2", "未定义"], answer: 1,
        explain: "false && … 直接短路，++x 不会执行，x 仍是 0。" },
      { type: "mcq", q: "<code>int i = 0; if (++i || ++i) ;</code> 执行后 i 的值？",
        options: ["1", "2", "0", "未定义"], answer: 0,
        explain: "左侧 ++i 得 1（真）后 || 短路，右侧 ++i 不执行；i 只加了一次。" },
      { type: "code", q: "补全空指针安全访问的惯用法：if (p ____ ____ *p > 0) { … }",
        answer: ["!= nullptr &&", "!= nullptr &amp;&amp;"], ci: true, explain: "先判空（左侧），短路保护保证 p 为空时右侧 *p 不求值。" }
    ],
    related: ["ch02"]
  },

  {
    id: "pf-intdiv",
    title: "整数除法与取余：向零截断",
    tags: ["运算符", "数值"],
    bad: `double avg = 7 / 2;        // 3，不是 3.5！
int q = -7 / 2;            // -3，不是 -4
int r = -7 % 2;            // -1（符号跟被除数）
int r2 = 7 % -2;           // 1（符号仍跟被除数）`,
    why: "两个整数相除执行整数除法，商向零取整（C++11 起标准明确规定），余数满足 (a/b)*b + a%b == a，因此 a%b 的符号与被除数 a 相同。7/2 先得 3，之后才转换成 double。想要 3.5 必须让至少一侧是浮点数。",
    good: `double avg = 7.0 / 2;      // 3.5
double avg2 = static_cast<double>(a) / b;  // a 为 int 时
int q = -7 / 2;            // -3（向零截断）
int r = -7 % 2;            // -1`,
    examQ: "高频填空：7/2、-7/2、7%2、-7%2 的值。答题模板：除法向零截断、余数符号跟被除数。另一类题问 (a+b)/2 为什么不是平均数——答案还是整数除法。",
    quiz: [
      { type: "fill", q: "表达式 <code>-7 / 2</code> 的值是 ____。", answer: ["-3"], explain: "向零截断：-3.5 截成 -3，不是四舍五入也不是向下取整的 -4。" },
      { type: "fill", q: "表达式 <code>-7 % 2</code> 的值是 ____。", answer: ["-1"], explain: "余数符号跟被除数：(-7/2)*2 + (-7%2) = -7，即 -3*2 + r = -7，r = -1。" },
      { type: "mcq", q: "<code>double d = 9 / 4;</code> 输出 d 是？",
        options: ["2.25", "2", "2.5", "3"], answer: 1,
        explain: "9/4 是整数除法得 2，之后才转换为 double 2.0。先除后转。" },
      { type: "tf", q: "C++11 起，整数除法向零取整、<code>%</code> 结果符号与被除数相同。",
        answer: true, explain: "C++98/03 曾允许实现选择，C++11 起标准统一规定（ truncation toward zero）。" }
    ],
    related: ["ch01", "ch02"]
  },

  {
    id: "pf-overflow",
    title: "有符号溢出是 UB，无符号回绕是定义",
    tags: ["数值", "未定义行为"],
    bad: `int big = 2147483647;
int boom = big + 1;      // ⛔ 有符号溢出：UB，什么结果都可能

unsigned u = 0;
u = u - 1;               // ✅ 定义好的回绕：4294967295`,
    why: "有符号整数的算术溢出标准定为未定义行为——编译器有权假设“它不会发生”并据此优化（比如把 i+1 > i 优化成 true）。无符号整数运算按 2^N 取模，回绕到另一端是明确定义的行为。",
    good: `// 需要大数：用更大的类型
long long big2 = 2147483647LL + 1;   // LL 后缀按 long long 运算
// 防溢出：先判断再运算，或使用无符号语义
unsigned u = 0;
unsigned w = u - 1;   // 4294967295（有定义）`,
    examQ: "判断题最爱：『int 溢出后变为负数』——错，那是“常见实现现象”，标准上是 UB。unsigned 减到负数回绕成最大值则是有定义的，考的是 0-1 = 2^32-1。",
    quiz: [
      { type: "mcq", q: "<code>unsigned int u = 0; u = u - 1;</code> 输出 u 是？",
        options: ["-1", "0", "4294967295", "未定义行为"], answer: 2,
        explain: "无符号运算对 2^32 取模，0-1 回绕到最大值。这是定义好的行为。" },
      { type: "tf", q: "<code>int x = 2147483647; x = x + 1;</code> 在标准 C++ 中结果一定是 -2147483648。",
        answer: false, explain: "有符号溢出是 UB，没有“一定”；输出 -2147483648 只是常见实现的巧合现象。" },
      { type: "mcq", q: "<code>for (unsigned i = 5; i >= 0; --i)</code> 的循环行为是？",
        options: ["循环 6 次", "死循环", "循环 5 次", "编译错误"], answer: 1,
        explain: "unsigned 永远 >= 0，条件恒真；i 减到 0 后再减回绕成最大值——死循环。" }
    ],
    related: ["ch01", "ch02", "ch03"]
  },

  {
    id: "pf-floatcmp",
    title: "浮点数不要用 == 直接比较",
    tags: ["数值", "浮点"],
    bad: `double a = 0.1 + 0.2;
if (a == 0.3)                 // ⛔ 几乎永远为假
    cout << "equal";
// 0.1+0.2 == 0.30000000000000004`,
    why: "二进制无法精确表示 0.1、0.2 这类小数，运算引入舍入误差。0.1+0.2 的实际存储值比 0.3 略大（约 2^-54），== 比较逐位判断自然为假。cout 默认 6 位有效数字把误差“藏起来”，才让人误以为相等。",
    good: `const double EPS = 1e-9;
if (std::fabs(a - 0.3) < EPS)       // 用绝对误差阈值
    cout << "equal";
// 更严谨： fabs(a-b) <= EPS * std::max({1.0, fabs(a), fabs(b)})`,
    examQ: "两类题：① 判断 0.1+0.2 == 0.3 的真假（答：假，误差累积）；② 写出正确的浮点比较方法（fabs(x-y) < eps）。还要能解释“为什么输出看起来是 0.3”——cout 默认 6 位有效数字。",
    quiz: [
      { type: "tf", q: "<code>0.1 + 0.2 == 0.3</code> 在典型平台上的结果是 true。",
        answer: false, explain: "0.1+0.2 存储为 0.30000000000000004…，与字面量 0.3 的表示不同，== 为假。" },
      { type: "mcq", q: "<code>std::cout << 0.1 + 0.2;</code>（默认精度）输出？",
        options: ["0.300000", "0.3", "0.30000000000000004", "0.3000000000000000044408920985"], answer: 1,
        explain: "cout 默认 6 位有效数字，四舍五入后显示 0.3——误差仍在，只是没显示。" },
      { type: "code", q: "写出判断 double 变量 x 与 1.0 近似相等的条件（用 fabs 与 EPS）：fabs(____) < EPS",
        answer: ["x - 1.0", "x-1.0"], explain: "标准写法 fabs(x - 1.0) < EPS，比较差值而不是直接比数值。" }
    ],
    related: ["ch02"]
  },

  {
    id: "pf-arraybound",
    title: "数组越界：编译器不替你把关",
    tags: ["数组", "未定义行为"],
    bad: `int a[5] = {1, 2, 3, 4, 5};
for (int i = 0; i <= 5; ++i)   // ⛔ i==5 越界
    cout << a[i];
char name[8];
cin >> name;                    // ⛔ 输入超过 7 个字符就溢出`,
    why: "C++ 不检查原生数组边界。a[5] 读到的是数组后面内存里的东西（可能是其他变量、垃圾、或崩溃）。越界写入更危险：会悄悄破坏相邻数据，比如经典的循环条件 <= 把循环变量自己覆盖掉。",
    good: `for (int i = 0; i < 5; ++i)     // 条件用 < 长度
    cout << a[i];
// 更安全：
std::vector<int> v{1,2,3,4,5};
for (std::size_t i = 0; i < v.size(); ++i) cout << v[i];
cout << v.at(5);   // 真要访问时用 at()，越界抛异常而非 UB`,
    examQ: "考题形式：循环条件 <= a.length 之类的改错题；或给出越界写入并修改了相邻变量的“灵异输出”，让你解释原因。答题要点：越界是 UB，可能破坏相邻内存。",
    quiz: [
      { type: "mcq", q: "<code>int a[5];</code> 合法的下标范围是？",
        options: ["0~5", "1~5", "0~4", "1~4"], answer: 2,
        explain: "长度 5 的数组下标 0~4。a[5] 是越界，属于 UB。" },
      { type: "tf", q: "数组越界读取时编译器一定会报编译错误。",
        answer: false, explain: "编译器最多在能静态判定时给警告（-Warray-bounds），多数越界只有运行期才能发现（甚至运行期也无症状）。" },
      { type: "code", q: "补全安全的遍历条件：for (int i = 0; i ____ 5; ++i)",
        answer: ["<"], explain: "用 < 长度而不是 <=，是最常见的越界来源。" }
    ],
    related: ["ch05", "ch06"]
  },

  {
    id: "pf-ptr-ref",
    title: "指针与引用：解引用忘 * 、引用当指针用",
    tags: ["指针", "引用"],
    bad: `int a = 10;
int* p = &a;
p = 20;          // ⛔ 把 20 当地址赋给指针
cout << p;       // 输出的是地址，不是 a 的值

int& r;          // ⛔ 引用必须初始化
r = a;           // 若 r 已绑定 b，这句是“把 a 赋给 b”，不是重绑`,
    why: "指针是“存地址的变量”，需要 * 解引用才能读写所指对象；引用是“别名”，从一而终不能重绑。r = x 看起来像“改指向”，实际是对被引用对象赋值——语义完全不同。",
    good: `int a = 10;
int* p = &a;
*p = 20;         // 通过指针修改 a → a == 20
cout << *p;      // 解引用取值

int b = 5;
int& r = a;      // 引用必须在定义时绑定
r = b;           // 等价于 a = b（不是重绑！）`,
    examQ: "经典题：给出 swap(int* a, int* b) 调用处忘写 & 取地址、或函数体内忘写 * 解引用，问交换结果。另一类题：r = b 后问 r 指向谁——永远指向初始化时绑定的对象。",
    quiz: [
      { type: "mcq", q: "<code>int a=1,b=2; int& r=a; r=b;</code> 之后 a、b 分别是？",
        options: ["a=2, b=2", "a=1, b=2", "a=2, b=1", "r 改为绑定 b"], answer: 0,
        explain: "r = b 是把 b 的值赋给 r 所引用的 a（a=2）。引用不能重绑，r 仍绑定 a。" },
      { type: "mcq", q: "<code>int a=10; int* p=&a;</code> 要通过 p 把 a 改成 99，写法是？",
        options: ["p = 99", "*p = 99", "&p = 99", "p* = 99"], answer: 1,
        explain: "解引用 *p 才是所指对象本身；p = 99 是把 99 当地址（编译错误）。" },
      { type: "tf", q: "引用可以之后重新绑定到另一个对象。",
        answer: false, explain: "引用初始化后与对象终身绑定，赋值语句改变的是被引用对象的值。" }
    ],
    related: ["ch05"]
  },

  {
    id: "pf-shallowcopy",
    title: "浅拷贝与深拷贝（双重释放）",
    tags: ["类", "拷贝控制"],
    bad: `class Buf {
public:
    int* data;
    Buf() : data(new int[10]) {}
    ~Buf() { delete[] data; }   // 只写了析构 → Rule of Three 违反
};

Buf a;
{
    Buf b = a;      // 浅拷贝：b.data == a.data
}                   // b 析构 → delete[] data
// a.data 已悬空，再次析构/使用 → ⛔ UB`,
    why: "编译器生成的拷贝构造逐成员复制：指针成员只复制“地址值”，两个对象共享同一块堆内存（浅拷贝）。析构时同一块内存被释放两次（双重释放，UB），或一方释放后另一方使用悬空指针。",
    good: `class Buf {
public:
    Buf() : data(new int[10]) {}
    Buf(const Buf& o) : data(new int[10]) {          // 深拷贝：自己 new
        std::copy(o.data, o.data + 10, data);
    }
    Buf& operator=(const Buf& o) {                   // 拷贝赋值：防自赋值
        if (this != &o) {
            int* nd = new int[10];
            std::copy(o.data, o.data + 10, nd);
            delete[] data;
            data = nd;
        }
        return *this;
    }
    ~Buf() { delete[] data; }
private:
    int* data;
};
// Rule of Zero：直接用 std::vector<int> 成员，五个特殊函数全免写`,
    examQ: "两种考法：① 给出带 char* 成员的 String 类，要求补全拷贝构造与赋值（深拷贝）；② 问“浅拷贝会导致什么问题”——答：共享内存 → 双重释放/悬空指针，属 UB。",
    quiz: [
      { type: "mcq", q: "浅拷贝后两个对象的指针成员指向什么？",
        options: ["各自独立的内存", "同一块内存", "空地址", "对方栈帧"], answer: 1,
        explain: "逐成员复制只拷贝指针的值，两对象共享同一块堆内存——这正是双重释放的根源。" },
      { type: "tf", q: "类中有裸指针成员并自管资源时，通常需要同时自定义析构、拷贝构造、拷贝赋值（Rule of Three）。",
        answer: true, explain: "三者缺一都会造成泄漏或双重释放；C++11 扩展为 Rule of Five（加移动两个）。" },
      { type: "mcq", q: "彻底避免手写拷贝控制的现代做法是？",
        options: ["把成员都改成裸指针", "用 vector/string/智能指针等管理资源（Rule of Zero）", "全部 =delete", "禁用拷贝"], answer: 1,
        explain: "资源管理交给 RAII 类型后，编译器生成的默认函数就是正确的。" }
    ],
    related: ["ch07", "ch09"]
  },

  {
    id: "pf-virtualdtor",
    title: "虚析构：基类指针 delete 派生类对象",
    tags: ["继承", "多态"],
    bad: `struct Base {
    ~Base() { cout << "~Base\\n"; }          // ⛔ 非虚析构
};
struct Derived : Base {
    int* buf;
    Derived() : buf(new int[100]) {}
    ~Derived() { delete[] buf; cout << "~Derived\\n"; }
};

Base* p = new Derived;
delete p;    // 只调用 ~Base！buf 泄漏，行为未定义`,
    why: "通过基类指针 delete 时，若析构函数不是 virtual，标准规定行为未定义——典型现象是只执行基类析构，派生类新增资源全部泄漏；编译器优化后甚至可能更糟。多态基类的析构函数必须 virtual。",
    good: `struct Base {
    virtual ~Base() { cout << "~Base\\n"; }   // 虚析构
};
// delete p; 输出：
// ~Derived
// ~Base
// （先派生后基类，资源正确释放）`,
    examQ: "经典输出题：virtual 与否的析构顺序对比。答题要点：①delete 经基类指针→析构函数必须是 virtual；②析构顺序先派生类后基类（与构造相反）；③非虚析构是 UB 而不只是泄漏。",
    quiz: [
      { type: "mcq", q: "<code>Base* p = new Derived; delete p;</code>（~Base 非 virtual）会发生什么？",
        options: ["正常调用两个析构", "只调用 ~Derived", "行为未定义，典型表现是只调用 ~Base 造成泄漏", "编译错误"], answer: 2,
        explain: "标准将其定为 UB；常见现象是派生类析构不被调用、资源泄漏。" },
      { type: "tf", q: "类被用作多态基类（会通过基类指针 delete）时，析构函数应声明为 virtual。",
        answer: true, explain: "这是 Effective C++ 条款 7 的经典准则。" },
      { type: "mcq", q: "<code>Base* p = new Derived;</code>（析构为 virtual）<code>delete p;</code> 的析构顺序？",
        options: ["先 ~Base 后 ~Derived", "先 ~Derived 后 ~Base", "只有 ~Base", "只有 ~Derived"], answer: 1,
        explain: "析构顺序与构造相反：先派生类成员与析构体，再基类析构。" }
    ],
    related: ["ch08"]
  },

  {
    id: "pf-overload-default",
    title: "重载与默认参数的二义性",
    tags: ["函数", "重载"],
    bad: `void f(int a, int b = 10);
void f(int a);

f(5);   // ⛔ 调用二义：f(5,10) 还是 f(5)？`,
    why: "两个重载都能只靠一个实参完成调用：f(int,int=10) 可以缺省第二个参数，f(int) 精确匹配。编译器无法选择唯一最佳版本，报 ambiguous（二义）错误。",
    good: `void f(int a, int b = 10);   // 只保留一个版本
f(5);        // b 取默认值 10
f(5, 20);    // 显式给 b
// 或让两个重载参数个数/类型差异明显：
void g(int a);
void g(int a, int b);   // 两个实参才能调到第二个`,
    examQ: "题面：『下列重载是否合法/调用 f(5) 调谁』。判断标准：默认参数展开后，若两个重载对同一调用都可行且无更优者，即为二义（编译错误），不是“取先声明的”。",
    quiz: [
      { type: "mcq", q: "<code>void f(int, int = 0);</code> 与 <code>void f(int);</code> 同时声明后调用 <code>f(3)</code>？",
        options: ["调用第一个", "调用第二个", "编译错误：二义", "运行时随机"], answer: 2,
        explain: "默认参数使两个重载都能接受单实参，产生二义。" },
      { type: "tf", q: "函数重载的区分依据包括参数个数、类型、顺序，但不包括返回值类型。",
        answer: true, explain: "仅返回值不同的两个函数不是合法重载。" }
    ],
    related: ["ch04"]
  },

  {
    id: "pf-template-deduce",
    title: "模板实参推导：auto 与引用/const 的游戏",
    tags: ["模板", "auto"],
    bad: `template <typename T>
void f(T x);        // 按值：T 推导时丢弃 const 和引用

const int& cr = x;
f(cr);              // T 推导为 int（顶层 const 与引用被丢弃）

auto y = cr;        // 同理：y 是 int，不是 const int&`,
    why: "按值传参的模板与 auto 推导都遵循同一套规则：实参的引用性被忽略，顶层 const 被丢弃——因为按值传递本来就是“拷贝一份”。这常导致意外的昂贵拷贝（传了 string 却拷贝了一份）或丢失常量性。",
    good: `template <typename T>
void f(const T& x);   // 想保留 const 性、避免拷贝：const T&

const int& cr = x;
auto y = cr;            // int（拷贝一份）
auto& z = cr;           // const int&（保留引用与底层 const）
const auto& w = 42;     // 绑定右值，合法`,
    examQ: "题型：『auto a = c;（c 是 const int&）a 的类型』——答 int。进阶题：模板 T 按值推导时传 const string 的开销问题——答发生了拷贝，应写 const T&。",
    quiz: [
      { type: "mcq", q: "<code>const int c = 5; auto a = c;</code>，a 的类型是？",
        options: ["const int", "int", "const int&", "int&"], answer: 1,
        explain: "auto 按值推导丢弃顶层 const，a 是可修改的 int 拷贝。" },
      { type: "mcq", q: "想避免大对象拷贝并保留只读语义，函数模板参数应声明为？",
        options: ["T", "T&", "const T&", "T*"], answer: 2,
        explain: "const T& 不拷贝、不可修改、可绑定临时对象，是最常用的只读参数写法。" },
      { type: "tf", q: "<code>auto& r = c;</code>（c 是 const int）中 r 的类型是 <code>const int&</code>。",
        answer: true, explain: "auto& 保留引用；const 通过引用的“底层 const”被保留，r 不可修改。" }
    ],
    related: ["ch10", "ch12"]
  },

  {
    id: "pf-iter-invalid",
    title: "迭代器失效：边遍历边改容器",
    tags: ["STL", "迭代器"],
    bad: `std::vector<int> v{1, 2, 3, 4};
for (auto it = v.begin(); it != v.end(); ++it) {
    if (*it == 2)
        v.erase(it);        // ⛔ erase 后 it 已失效，继续 ++it 是 UB
}
v.push_back(5);
auto old = v.begin();
v.push_back(6);
cout << *old;               // ⛔ push_back 可能扩容搬移，old 失效`,
    why: "vector 的元素连续存放：erase 会使被删位置及之后的迭代器全部失效；push_back 若触发扩容（超过 capacity），所有迭代器、指针、引用全部失效。继续使用失效迭代器是未定义行为。",
    good: `// 正确删除：用 erase 的返回值接住“下一个有效位置”
for (auto it = v.begin(); it != v.end(); ) {
    if (*it == 2) it = v.erase(it);
    else ++it;
}
// 正确做法：不在持有迭代器期间 push_back；或先 reserve 预留`,
    examQ: "高频改错题：erase 后没有接返回值直接 ++it；或 push_back 后继续用旧迭代器。标准答案：erase 返回下一个有效迭代器，必须 it = v.erase(it)。",
    quiz: [
      { type: "code", q: "补全删除偶数的正确写法：if (*it % 2 == 0) it = v.____(it); else ++it;",
        answer: ["erase"], explain: "v.erase(it) 返回下一个有效迭代器，用它更新 it 才安全。" },
      { type: "tf", q: "对 vector 执行 push_back 后，之前保存的所有迭代器一定仍然有效。",
        answer: false, explain: "一旦触发扩容（超过 capacity），全部迭代器/指针/引用失效；是否扩容取决于 size 与 capacity。" },
      { type: "mcq", q: "使用已失效的迭代器属于？",
        options: ["编译错误", "运行时必然崩溃", "未定义行为", "自动修复"], answer: 2,
        explain: "标准规定为 UB——可能崩溃、可能读到旧值、可能看似正常。" }
    ],
    related: ["ch10"]
  },

  {
    id: "pf-exception-raii",
    title: "异常路径上的资源泄漏与 RAII",
    tags: ["异常", "RAII"],
    bad: `void f() {
    int* p = new int[100];
    process();        // 若 process 抛异常……
    delete[] p;       // ⛔ 这行永远执行不到，泄漏！
}`,
    why: "异常发生时，throw 之后的语句全部跳过，直接跳到匹配的 catch——delete 语句被跳过，资源泄漏。C++ 保证的是：局部对象会析构（栈展开）。所以资源必须交给“对象”管理，析构函数负责释放，这就是 RAII。",
    good: `void f() {
    auto p = std::make_unique<int[]>(100);  // RAII：unique_ptr
    process();      // 抛异常？unique_ptr 析构自动释放
}                   // 正常结束也自动释放

// 同理：std::fstream 管文件、std::lock_guard 管锁`,
    examQ: "题面：『process() 抛异常时下面的 delete 执行吗』——不执行，泄漏。对策：智能指针/容器/lock_guard 等 RAII 手段，让“释放”发生在析构函数里，栈展开自动调用。",
    quiz: [
      { type: "mcq", q: "try 块中 new 的内存，在异常抛出离开 try 块时会自动释放吗？",
        options: ["会，编译器自动补 delete", "不会，裸资源不参与栈展开；要用智能指针", "会，垃圾回收器处理", "取决于优化等级"], answer: 1,
        explain: "C++ 没有垃圾回收；栈展开只析构“对象”。裸 new 的内存必须由 RAII 对象托管。" },
      { type: "tf", q: "栈展开过程中，try 块与各层函数中已构造完成的局部对象会被析构。",
        answer: true, explain: "这是异常机制的核心保证，也是 RAII 得以工作的基础。" },
      { type: "mcq", q: "下列哪个不是 RAII 的典型应用？",
        options: ["std::unique_ptr", "std::lock_guard", "std::ofstream", "手动 delete"], answer: 3,
        explain: "手动 delete 正是 RAII 要消灭的写法；前三者都是“构造获取、析构释放”。" }
    ],
    related: ["ch09", "ch11"]
  },

  {
    id: "pf-eqeq",
    title: "= 与 == 混用",
    tags: ["运算符", "控制流"],
    bad: `int a = 0;
if (a = 5) {          // ⛔ 赋值表达式值为 5（真），恒进入分支
    cout << "a 是 5";
}
cout << a;            // a 已被改成 5`,
    why: "if (a = 5) 是先把 5 赋给 a，再用赋值表达式的值（5，非零即真）作为条件——条件永远为真，而且悄悄改掉了 a。while 同理，可能造成死循环。",
    good: `if (a == 5) { }              // 比较
// 习惯：把常量写左边，误写 = 直接编译错误
if (5 == a) { }
// 或者不比较 bool：
if (is_ready) { }            // 而不是 if (is_ready == true)`,
    examQ: "题面：『if (x = 0) 分支体执行吗』——答：赋值表达式的值是 0（假），不执行，且 x 被改成了 0。反向题 if (x = 5) 恒真。g++ 对字面量赋值会警告 -Wparentheses。",
    quiz: [
      { type: "mcq", q: "<code>int x = 1; if (x = 0) cout << \"A\"; else cout << \"B\";</code> 输出？",
        options: ["A", "B", "编译错误", "未定义"], answer: 1,
        explain: "x = 0 的值是 0（假）→ 走 else；同时 x 已被赋成 0。" },
      { type: "tf", q: "<code>while (x = 1)</code>（x 初始任意）通常构成死循环。",
        answer: true, explain: "每次循环条件都是赋值表达式，值为 1（真），永不结束。" }
    ],
    related: ["ch02", "ch03"]
  },

  {
    id: "pf-unsigned-loop",
    title: "unsigned 循环：条件恒真与下溢回绕",
    tags: ["循环", "无符号"],
    bad: `for (unsigned i = 4; i >= 0; --i)   // ⛔ 死循环
    cout << a[i];
// i 减到 0 打印后 --i 回绕成 4294967295`,
    why: "unsigned 类型的值永远 >= 0，所以 i >= 0 恒真。i 从 0 再减一按 2^32 取模回绕成最大值，循环永不结束（且一旦用这个巨大下标访问数组又是越界 UB）。",
    good: `for (unsigned i = 5; i-- > 0; )      // 经典倒序惯用法
    cout << a[i];                     // i 经历 4,3,2,1,0
// 或直接：
for (int i = 4; i >= 0; --i)
    cout << a[i];
// 正向遍历容器：
for (std::size_t i = 0; i < v.size(); ++i)`,
    examQ: "题面：『找出循环错误』或『循环执行几次』。要点：unsigned 与 0 比较无意义；i-- > 0 惯用法的语义是“先用后减”。",
    quiz: [
      { type: "mcq", q: "<code>for (unsigned i = 4; i >= 0; --i)</code> 的行为？",
        options: ["执行 5 次", "执行 4 次", "死循环", "编译错误"], answer: 2,
        explain: "unsigned 永远 >= 0，条件恒真；下溢回绕使循环无法结束。" },
      { type: "fill", q: "倒序遍历 [0,5) 的惯用法：for (unsigned i = 5; i____ > 0; )",
        answer: ["--"], explain: "i-- > 0：先比较（5>0）再自减，循环体内 i 取 4,3,2,1,0。" }
    ],
    related: ["ch02", "ch03"]
  },

  {
    id: "pf-cstr-cmp",
    title: "C 字符串用 == 比较（比的是地址）",
    tags: ["字符串", "指针"],
    bad: `char s1[] = "abc";
char s2[] = "abc";
if (s1 == s2)          // ⛔ 比较两个数组的起始地址，必为假
    cout << "same";

const char* p = "hi";
if (p == "hi")         // 实现相关：可能碰巧相等（字面量池化）`,
    why: "C 字符串的变量名/指针是“地址”，== 比较的是地址是否相同，不是内容。两个内容相同的数组地址必然不同。字面量可能被编译器合并到同一地址，导致“碰巧为真”——实现相关，不可依赖。",
    good: `#include <cstring>
if (std::strcmp(s1, s2) == 0)   // C 风格：strcmp 逐字符比
    cout << "same";

std::string a = "abc", b = "abc";
if (a == b)                     // C++ 风格：== 按内容比较
    cout << "same";`,
    examQ: "题面：『s1==s2 输出什么』。分三层答：①数组名是指针，== 比地址；②内容比较用 strcmp==0；③std::string 的 == 才按内容。字面量池化是“可能碰巧相等”的加分点。",
    quiz: [
      { type: "mcq", q: "<code>char a[]=\"x\"; char b[]=\"x\"; a==b</code> 的结果？",
        options: ["true，内容相同", "false，比较的是不同数组的地址", "编译错误", "未定义"], answer: 1,
        explain: "数组名在表达式中退化为指针，== 比较地址。" },
      { type: "mcq", q: "C 风格字符串内容比较应使用？",
        options: ["s1 == s2", "s1.equals(s2)", "strcmp(s1, s2) == 0", "s1.size() == s2.size()"], answer: 2,
        explain: "strcmp 返回 0 表示相等（负/正表示小于/大于）。" },
      { type: "tf", q: "std::string 的 <code>==</code> 按内容逐字符比较。",
        answer: true, explain: "string 重载了运算符，== 是内容比较——这正是推荐用 string 的原因之一。" }
    ],
    related: ["ch06"]
  },

  {
    id: "pf-return-local",
    title: "返回局部变量的引用或地址",
    tags: ["函数", "生命周期"],
    bad: `int& bad() {
    int x = 42;
    return x;       // ⛔ x 随函数返回销毁
}
int* badp() {
    int y = 10;
    return &y;      // ⛔ 同样问题
}
// g++ -Wall: warning: reference to local variable 'x' returned`,
    why: "局部变量存于栈帧，函数返回时栈帧回收。返回其引用/指针，调用者拿到的是“已死对象”的别名——解引用是未定义行为，可能输出看似正确的 42（栈还没被覆盖），换个编译器/优化等级就变垃圾值。",
    good: `int goodValue() { int x = 42; return x; }        // 返回值拷贝，安全
std::string goodBig() { std::string s(1000,'a'); return s; } // 移动/拷贝省略，开销小

int& okParam(int& x) { return x; }               // 返回参数引用，安全
static int g = 0;
int& okStatic() { return g; }                    // 静态存储期，安全`,
    examQ: "输出题陷阱：给出返回局部引用的程序并问输出——正确答案：UB，没有可靠输出。改错题：识别 bad()/badp() 并说明 g++ 的 -Wreturn-local-addr 警告。",
    quiz: [
      { type: "tf", q: "<code>int& f() { int x = 1; return x; }</code> 调用 <code>f()</code> 后解引用得到的一定是 1。",
        answer: false, explain: "x 已销毁，使用返回的引用是 UB；输出 1 只是“栈尚未被覆盖”的巧合。" },
      { type: "mcq", q: "下列哪个返回是安全的？",
        options: ["返回局部变量的引用", "返回局部变量的地址", "返回值传递的局部对象（拷贝/移动）", "返回局部数组指针"], answer: 2,
        explain: "按值返回会拷贝/移动出函数，对象生命周期由调用者接管，安全。" },
      { type: "mcq", q: "<code>int& ok(int& x) { return x; }</code> 这样的写法？",
        options: ["安全：引用参数的生命周期在调用者侧", "不安全：局部变量", "编译错误", "只有 const 引用才安全"], answer: 0,
        explain: "参数引用指向调用者的对象，函数返回后对象仍然存在。" }
    ],
    related: ["ch04", "ch05"]
  },

  {
    id: "pf-narrowing",
    title: "隐式窄化：悄悄丢掉的精度与符号",
    tags: ["类型转换", "数值"],
    bad: `int n = 3.99;          // n == 3（截断，无提示编译）
char c = 300;          // 实现定义，通常 44
unsigned u = -1;       // 4294967295！
bool b = 0.5;          // true（非零即真）
double d = 1e308 * 10; // inf（溢出到无穷）`,
    why: "赋值初始化允许窄化：double→int 截断、大整数塞进小类型取模（实现定义）、负数转无符号按模回绕。这些转换不报错、常常连警告都没有（-Wconversion 才可见），是“数值对不上”类 bug 的头号来源。{} 列表初始化会拒绝它们。",
    good: `int n{3};                      // {} 拦住窄化
int m = static_cast<int>(3.99); // 显式截断，意图清晰
unsigned u = 1;                 // 不做负数到无符号的转换
char c{65};                     // 65 在 char 范围内才放行
// 编译期检测：g++ -Wconversion`,
    examQ: "高频填空：int n = 3.99 → 3；unsigned u = -1 → 4294967295；bool b = 0.5 → 1/true。判断题：『int x{3.9} 合法』——错，{} 禁止窄化。",
    quiz: [
      { type: "fill", q: "<code>unsigned int u = -1;</code> 后 <code>cout << u</code> 输出 ____。",
        answer: ["4294967295"], explain: "-1 按 2^32 取模回绕成最大值。这是定义好的转换行为。" },
      { type: "mcq", q: "<code>bool b = 0.5;</code> 输出 b（默认格式）是？",
        options: ["0.5", "0", "1", "true"], answer: 2,
        explain: "非零转 bool 为 true，输出默认显示 1。" },
      { type: "tf", q: "<code>int x{3.9};</code> 能通过编译。",
        answer: false, explain: "列表初始化禁止窄化，double→int 直接编译错误。" }
    ],
    related: ["ch01"]
  },

  {
    id: "pf-switch-nobreak",
    title: "switch 忘写 break：贯穿执行",
    tags: ["控制流", "switch"],
    bad: `switch (grade) {
    case 'A':
        cout << "优秀";
        // ⛔ 忘了 break
    case 'B':
        cout << "良好";   // 输入 'A' 时这句也执行！
        break;
    case 'C':
        cout << "及格";
        break;
}`,
    why: "case 标签只是“入口地址”，switch 不会自动在下一个 case 前停下——匹配成功后一路执行直到遇到 break 或 switch 结束（fallthrough）。输入 'A' 会连续输出“优秀良好”。空 case 连写（case 1: case 2:）才是合法的“或”语义。",
    good: `switch (grade) {
    case 'A':
        cout << "优秀";
        break;                     // 每个 case 以 break 收尾
    case 'B':
        cout << "良好";
        break;
    case 'C': case 'D':            // 合法的“或”
        cout << "及格";
        break;
    default:
        cout << "无效";
}`,
    examQ: "输出题常客：给一段缺 break 的 switch 和一个输入，问完整输出。答题套路：从匹配的 case 开始逐条执行、列出每条语句直到第一个 break。另注意 case 后必须是编译期常量，string 不能作 switch 条件。",
    quiz: [
      { type: "mcq", q: "<code>int x=1; switch(x){case 1: cout<<\"a\"; case 2: cout<<\"b\"; break; default: cout<<\"c\";}</code> 输出？",
        options: ["a", "ab", "abc", "b"], answer: 1,
        explain: "case 1 无 break，贯穿执行 case 2 的语句后遇到 break；default 不执行。" },
      { type: "tf", q: "<code>case 1:</code> 后紧跟 <code>case 2:</code>（中间无语句）是错误写法。",
        answer: false, explain: "空 case 连写表示“1 或 2 都进入同一段代码”，是合法惯用法。" },
      { type: "mcq", q: "switch 的条件表达式不能是哪种类型？",
        options: ["int", "char", "枚举", "std::string"], answer: 3,
        explain: "条件必须可转换为整型（含枚举/char）；string 不是整型，C++17 可用 if (auto s = ...; s == \"x\") 替代。" }
    ],
    related: ["ch03"]
  }
];
