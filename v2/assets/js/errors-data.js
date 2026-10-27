/* ============================================================
 * errors-data.js —— 编译错误博物馆数据（全局变量，离线可用）
 * 每条：{ id, title, category, compilers, std?, bad, message, messageNote?,
 *         cause, fixed, prevention, related, level? }
 * category 取值：语法错误 | 声明与作用域 | 类型错误 | 头文件与命名空间
 *                | 链接错误 | 类与对象 | 运行时与未定义行为 | 警告 | IDE 与工具链
 * 报错原文以 g++（9~13）真实措辞为准，省略号表示省略的上下文行；
 * 「IDE 与工具链」分类与 compilers 含 "VS 2026" 的条目以 Visual Studio 2026 输出/症状为准。
 * ============================================================ */
window.ERRORS_DATA = [

  /* ---------------- 语法错误 ---------------- */
  {
    id: "err-missing-semicolon",
    title: "缺少分号",
    category: "语法错误",
    compilers: ["g++", "MSVC", "clang++"],
    std: "C++98 起",
    bad: `#include <iostream>

int main() {
    int a = 1
    std::cout << a << std::endl;
    return 0;
}`,
    message: `main.cpp: In function 'int main()':
main.cpp:5:5: error: expected ';' before 'std'`,
    messageNote: "MSVC: error C2143: syntax error: missing ';' before 'std'",
    cause: "C++ 的每条语句必须以分号结尾。编译器读到下一行时发现语句没有结束，就在“下一行开头的记号”处报错——所以报错位置常常在真正漏分号的下一行。",
    fixed: `int a = 1;   // 补上分号`,
    prevention: "习惯“写完一条语句立刻敲分号”；报错行本身没问题时，先看它的上一行是否漏了分号。",
    related: ["ch01"],
    level: "入门"
  },
  {
    id: "err-class-semicolon",
    title: "类定义结尾忘分号",
    category: "语法错误",
    compilers: ["g++", "MSVC"],
    bad: `class Point {
    int x;
    int y;
}

int main() {
    Point p;
    return 0;
}`,
    message: `main.cpp:4:1: error: expected ';' after class definition`,
    messageNote: "MSVC: error C2628: 'Point' followed by 'int' is illegal (did you forget a ';'?)",
    cause: "class/struct/enum 的定义属于“声明”，必须以分号结尾。漏掉后编译器把后面的 int main 当作“Point main()”这类奇怪声明来解析，产生一串连锁错误。",
    fixed: `class Point {
    int x;
    int y;
};   // ← 类定义以分号结尾`,
    prevention: "把 }; 三个字符当作一个整体记忆；连锁报错的第一行往往是漏分号的类。",
    related: ["ch07"],
    level: "入门"
  },
  {
    id: "err-too-few-args",
    title: "函数实参过少",
    category: "语法错误",
    compilers: ["g++", "MSVC"],
    bad: `int add(int a, int b) {
    return a + b;
}

int main() {
    return add(3);
}`,
    message: `main.cpp:6:12: error: too few arguments to function 'int add(int, int)'
    6 |     return add(3);
      |            ^~~`,
    cause: "没有默认值的形参必须有实参。g++ 会打印函数的完整签名，方便对照缺了哪一个。",
    fixed: `return add(3, 4);       // 补全实参
// 或声明时给默认值：int add(int a, int b = 0);`,
    prevention: "优先使用带默认参数或重载的接口；报错时对照打印出的签名逐一检查。",
    related: ["ch04"],
    level: "入门"
  },
  {
    id: "err-ambiguous-overload",
    title: "重载调用二义",
    category: "语法错误",
    compilers: ["g++", "MSVC"],
    bad: `void f(long x);
void f(double x);

int main() {
    f(10);      // int → long 还是 int → double？
    return 0;
}`,
    message: `main.cpp:5:5: error: call of overloaded 'f(int)' is ambiguous
    5 |     f(10);
      |     ^~~~
main.cpp:1:6: note: candidate: 'void f(long int)'
main.cpp:2:6: note: candidate: 'void f(double)'`,
    cause: "重载决议要求存在“唯一最佳匹配”。int 到 long 与 int 到 double 都属于标准转换，代价并列，编译器拒绝擅自选择。",
    fixed: `f(10L);        // 明确调用 f(long)
f(10.0);       // 明确调用 f(double)
// 或改为 void f(int x); 提供精确匹配`,
    prevention: "设计重载时让每个整数/浮点类型都有明确归宿；避免只提供 long 与 double 两个版本。",
    related: ["ch04"],
    level: "进阶"
  },
  {
    id: "err-break-outside",
    title: "break 出现在循环/switch 之外",
    category: "语法错误",
    compilers: ["g++", "MSVC"],
    bad: `int main() {
    if (true) {
        break;    // ⛔ 不在循环或 switch 里
    }
    return 0;
}`,
    message: `main.cpp:3:9: error: break statement not within loop or switch`,
    cause: "break 只在 for/while/do-while/switch 内部有定义。位置不对时编译器直接拒绝。",
    fixed: `if (true) {
        return 0;   // 想提前结束函数用 return
    }`,
    prevention: "break 的语义是“跳出最近一层循环或 switch”；提前结束函数请用 return。",
    related: ["ch03"],
    level: "入门"
  },
  {
    id: "err-fullwidth-chars",
    title: "全角字符／中文标点混入代码",
    category: "语法错误",
    compilers: ["g++", "MSVC"],
    bad: `#include <iostream>

int main() {
    int a = 1；    // ⛔ 这个分号是全角字符“；”，外形几乎一样
    std::cout << a << std::endl;
    return 0;
}`,
    message: `main.cpp:4:14: warning: stray '\\357' in program
main.cpp:4:14: warning: stray '\\274' in program
main.cpp:4:14: warning: stray '\\233' in program
main.cpp:5:5: error: expected ';' before 'std'`,
    messageNote: "MSVC 常报 error C2143 / C2059 等语法错误，位置更飘忽；中文输入法开着时高发",
    cause: "中文输入法的全角标点（；：（）“”，等）与半角外形相近，字节却完全不同，编译器只认半角。中文引号“”还会破坏字符串字面量的结构。stray 后面的三位八进制数就是全角字符的 UTF-8 字节。",
    fixed: `int a = 1;    // 半角分号`,
    prevention: "写代码时切英文输入法；报出 stray '\\357' 或一堆看不懂的记号错误时，先全文搜全角标点——多数编辑器会把全角字符标成不同颜色。",
    related: ["ch01"],
    level: "入门"
  },
  {
    id: "err-unbalanced-brace",
    title: "大括号不配对（expected '}' at end of input）",
    category: "语法错误",
    compilers: ["g++", "MSVC"],
    bad: `#include <iostream>

int main() {
    for (int i = 0; i < 3; ++i) {
        std::cout << i << std::endl;
    }
// ← 还差 main 的右大括号，文件就这样结束了`,
    message: `main.cpp:9:1: error: expected '}' at end of input
    9 | // ← 还差 main 的右大括号，文件就这样结束了
      | ^
main.cpp:4:33: note: to match this '{'`,
    messageNote: "MSVC: error C2143 / fatal error C1071（到达文件末尾仍有括号未闭合），报错同样在文件末尾附近",
    cause: "编译器从每个 { 开始逐个配对，读到文件末尾仍有 { 没等到 }，只能报“at end of input”。报错在文件末尾，真正漏写的地方却在前面——note 行会指出是哪个 { 还在等待配对。",
    fixed: `int main() {
    for (int i = 0; i < 3; ++i) {
        std::cout << i << std::endl;
    }
}   // ← 补上最外层的右括号`,
    prevention: "写完一个块立刻补齐配对括号，依赖编辑器自动缩进检查层级；见到“at end of input”类错误，优先排查前面某处少写了 }（或多写了 {）。",
    related: ["ch03"],
    level: "入门"
  },
  {
    id: "err-void-main",
    title: "void main()（main 返回类型不是 int）",
    category: "语法错误",
    compilers: ["g++", "MSVC"],
    bad: `#include <iostream>

void main() {              // ⛔ main 的返回类型必须是 int
    std::cout << "hi\\n";
}`,
    message: `main.cpp:3:1: error: '::main' must return 'int'`,
    messageNote: "MSVC: warning C4326: return type of 'main' should be 'int' instead of 'void'（只是警告、能编过，但同样不合标准）",
    cause: "老教材和 VC6 时代的编译器流行 void main()。现行标准规定 main 必须返回 int，返回值还会作为进程退出码交给操作系统。",
    fixed: `int main() {
    std::cout << "hi\\n";
    return 0;
}`,
    prevention: "入口函数固定写 int main()（或带命令行参数的版本）；教材上出现 void main 一律照改。",
    related: ["ch01"],
    level: "入门"
  },
  {
    id: "err-keyword-as-name",
    title: "用关键字作变量名",
    category: "语法错误",
    compilers: ["g++", "MSVC"],
    bad: `int main() {
    int new = 5;      // ⛔ new 是关键字
    int class = 6;    // ⛔ class 也是
    return 0;
}`,
    message: `main.cpp:2:9: error: expected unqualified-id before 'new'
    2 |     int new = 5;
      |         ^~~`,
    messageNote: "MSVC: error C2059: 语法错误:“new”（不同版本措辞略有差别）",
    cause: "new、class、this、delete、return、case 等是语言保留的关键字，有固定语法用途，不能作为变量名或函数名。",
    fixed: `int newCount = 5;
int classId = 6;    // 换一个与关键字相邻的名称`,
    prevention: "编辑器会把关键字高亮成关键字色——变量名也被“染”成这个颜色就立刻改名。",
    related: ["ch01"],
    level: "入门"
  },

  /* ---------------- 声明与作用域 ---------------- */
  {
    id: "err-undeclared-identifier",
    title: "使用未声明的变量（拼写错误）",
    category: "声明与作用域",
    compilers: ["g++", "MSVC", "clang++"],
    bad: `#include <iostream>

int main() {
    int num = 10;
    std::cout << nmue << std::endl;   // 拼错了
    return 0;
}`,
    message: `main.cpp:5:18: error: 'nmue' was not declared in this scope
    5 |     std::cout << nmue << std::endl;
      |                  ^~~~
main.cpp:4:9: note: suggested alternative: 'num'`,
    messageNote: "MSVC: error C2065: 'nmue': undeclared identifier",
    cause: "C++ 要求变量先声明后使用。名字对不上（拼写、大小写、作用域）都会触发此错误；新版 g++ 还会给出“你是不是想用 num”的提示。",
    fixed: `std::cout << num << std::endl;   // 改成正确的名字`,
    prevention: "统一命名规范；看到 was not declared 先检查拼写与作用域，再看是否漏了声明或头文件。",
    related: ["ch01"],
    level: "入门"
  },
  {
    id: "err-redefinition",
    title: "同一函数重复定义",
    category: "声明与作用域",
    compilers: ["g++", "MSVC"],
    bad: `int add(int a, int b) { return a + b; }
int add(int a, int b) { return a + b; }   // 同签名定义两次

int main() { return add(1, 2); }`,
    message: `main.cpp:2:5: error: redefinition of 'int add(int, int)'
main.cpp:1:5: note: 'int add(int, int)' previously defined here`,
    cause: "同一作用域中一个函数只能有一个定义（重载要求参数列表不同）。返回值不同但参数相同的两个函数也不是合法重载。",
    fixed: `int add(int a, int b)  { return a + b; }
double add(double a, double b) { return a + b; }   // 参数不同才是重载`,
    prevention: "记住：重载看参数列表，不看返回值；工具函数集中放在一处定义。",
    related: ["ch04"],
    level: "入门"
  },
  {
    id: "err-default-param-redef",
    title: "默认参数重复指定",
    category: "声明与作用域",
    compilers: ["g++", "MSVC"],
    bad: `void f(int a, int b = 10);

void f(int a, int b = 10) {   // ⛔ 定义处又给了一遍
}` ,
    message: `main.cpp:3:6: error: default argument given for parameter 2 of 'void f(int, int)' [-fpermissive]
    3 | void f(int a, int b = 10) {
      |      ^
main.cpp:1:6: note: after previous specification in 'void f(int, int)'`,
    cause: "默认实参在“同一作用域”里只能给一次：通常写在声明（头文件）里，定义处必须省略。",
    fixed: `void f(int a, int b = 10);        // 声明给默认值
void f(int a, int b) {            // 定义不再给
    // ...
}`,
    prevention: "团队约定：默认实参只出现在头文件声明中；成员函数同理（类内给、类外定义不给）。",
    related: ["ch04"],
    level: "进阶"
  },
  {
    id: "err-out-of-scope",
    title: "使用超出作用域的变量",
    category: "声明与作用域",
    compilers: ["g++", "MSVC"],
    bad: `#include <iostream>

int main() {
    for (int i = 0; i < 3; ++i) {
        // ...
    }
    std::cout << i << std::endl;   // ⛔ i 已离开 for 作用域
    return 0;
}`,
    message: `main.cpp:7:18: error: name lookup of 'i' changed for ISO 'for' scoping [-fpermissive]
main.cpp:7:18: note: (if you use '-fpermissive' G++ will accept your code)`,
    cause: "在 for 语句头声明的变量只属于循环体。循环结束后再使用属于作用域错误（老编译器可能容忍，标准 C++ 不允许）。",
    fixed: `int i = 0;
for (; i < 3; ++i) { /* ... */ }
std::cout << i << std::endl;   // 现在合法`,
    prevention: "需要“循环外继续用”的变量就声明在循环之外；其余一律用 for (int i = ...) 的局部作用域。",
    related: ["ch03"],
    level: "入门"
  },

  /* ---------------- 类型错误 ---------------- */
  {
    id: "err-type-mismatch",
    title: "类型不匹配的初始化",
    category: "类型错误",
    compilers: ["g++", "MSVC"],
    bad: `int main() {
    int age = "twenty";   // ⛔ 字符串指针 → int
    return 0;
}`,
    message: `main.cpp:2:15: error: cannot convert 'const char*' to 'int' in initialization
    2 |     int age = "twenty";
      |               ^~~~~~~~`,
    cause: "字符串字面量的类型是 const char*（指向字符数组的指针），它没有到 int 的隐式转换路径。",
    fixed: `int age = 20;              // 整数字面量
const char* name = "Tom";  // 字符串用指针/数组/std::string 接`,
    prevention: "记住常见字面量类型：42→int、3.14→double、'a'→char、\"a\"→const char*；类型对不上先改字面量或改接收类型。",
    related: ["ch01", "ch06"],
    level: "入门"
  },
  {
    id: "err-const-assign",
    title: "给 const 变量赋值",
    category: "类型错误",
    compilers: ["g++", "MSVC"],
    bad: `int main() {
    const int x = 10;
    x = 20;    // ⛔ 修改只读变量
    return 0;
}`,
    message: `main.cpp:3:7: error: assignment of read-only variable 'x'`,
    messageNote: "MSVC: error C3892: you cannot assign to a variable that is const",
    cause: "const 承诺“初始化后不可修改”，编译器在类型检查阶段直接拒绝赋值表达式。",
    fixed: `const int x = 10;   // const 变量只能在定义时初始化
int y = 20;         // 真要修改就去掉 const`,
    prevention: "把 const 变量当作“带名字的常量”使用；需要重新赋值的量不要加 const。",
    related: ["ch01"],
    level: "入门"
  },
  {
    id: "err-narrowing",
    title: "列表初始化禁止窄化",
    category: "类型错误",
    compilers: ["g++", "MSVC"],
    std: "C++11 起",
    bad: `int main() {
    int a{3.9};    // ⛔ double → int 会丢小数
    char c{300};   // ⛔ 300 超出 char 范围
    return 0;
}`,
    message: `main.cpp:2:11: error: narrowing conversion of '3.9000000000000000e+0' from 'double' to 'int' [-Wnarrowing]
main.cpp:3:12: error: narrowing conversion of '300' from 'int' to 'char' [-Wnarrowing]`,
    cause: "C++11 规定：列表初始化 {} 中，凡可能丢失信息的转换（double→int、int→char、int→bool 等）都是编译错误，防止静默截断。",
    fixed: `int a = 3.9;         // 明确接受截断（得 3）
int b{static_cast<int>(3.9)};   // 显式说明意图
char c{65};          // 65 在 char 范围内，合法`,
    prevention: "教育团队：能用 {} 就用 {}，它会替你拦截所有静默丢数据的转换。",
    related: ["ch01"],
    level: "入门"
  },
  {
    id: "err-char-array-too-long",
    title: "字符数组放不下字符串（漏 \\0 空间）",
    category: "类型错误",
    compilers: ["g++", "MSVC"],
    bad: `int main() {
    char s[5] = "hello";   // ⛔ "hello" 实际需要 6 字节（含 '\0'）
    return 0;
}`,
    message: `main.cpp:2:17: error: initializer-string for 'char [5]' is too long
    2 |     char s[5] = "hello";
      |                 ^~~~~~~`,
    cause: "C 字符串以 '\\0' 结尾，\"hello\" 占 6 个字节。数组只有 5 个位置，装不下结尾的 '\\0'。char s[6] = \"hello\" 才合法（char s[5] = {'h','e','l','l','o'} 也合法，但不是字符串）。",
    fixed: `char s[6] = "hello";        // 6 = 5 + '\0'
const char* s2 = "hello";   // 或直接用指针
std::string s3 = "hello";   // 推荐：C++ 字符串`,
    prevention: "用 std::string 替代字符数组；必须用数组时，长度 = 字符数 + 1。",
    related: ["ch06"],
    level: "入门"
  },
  {
    id: "err-return-no-value",
    title: "有返回值函数 return 不带值",
    category: "类型错误",
    compilers: ["g++", "MSVC"],
    bad: `int getNum() {
    return;    // ⛔ 声明返回 int 却没返回值
}`,
    message: `main.cpp:2:5: error: return-statement with no value, in function returning 'int' [-fpermissive]
    2 |     return;
      |     ^~`,
    cause: "非 void 函数的 return 必须带表达式。空 return 只有在 void 函数或构造/析构函数中合法。",
    fixed: `int getNum() {
    return 0;   // 返回一个 int
}
void doNothing() {
    return;     // void 函数的空 return 合法
}`,
    prevention: "写函数先定返回类型；return 语句逐条对照类型检查。",
    related: ["ch04"],
    level: "入门"
  },
  {
    id: "err-literal-to-charptr",
    title: "字符串字面量赋给 char* 并修改",
    category: "类型错误",
    compilers: ["g++", "MSVC"],
    bad: `#include <iostream>

int main() {
    char* s = "hello";    // ⛔ 字面量是只读的 const char*
    s[0] = 'H';           // 即使强转绕过编译，运行期也是 UB
    std::cout << s << std::endl;
    return 0;
}`,
    message: `main.cpp:4:15: error: ISO C++ forbids converting a string constant to 'char*' [-Wwrite-strings]`,
    messageNote: "MSVC：新版本 error C2440（无法从 const char [6] 转换为 char *）；旧版本默认仅警告 C4996，能编过但一运行就崩",
    cause: "字符串字面量存放在只读数据区，类型是 const char[6]。C++11 起标准明确禁止把它转换成 char*（历史上大量老代码依赖此写法才长期保留为警告）；用强制转换绕过后再写入就是未定义行为，典型结果是段错误。",
    fixed: `const char* s = "hello";    // 只读场景，安全
std::string t = "hello";    // 需要修改就用 std::string
t[0] = 'H';                 // 合法`,
    prevention: "会被修改的字符串一律 std::string；只读保存/传参用 const char*。看到 const 别嫌麻烦——它是编译器在保护你。",
    related: ["ch06", "ch05"],
    level: "入门"
  },

  /* ---------------- 头文件与命名空间 ---------------- */
  {
    id: "err-missing-include",
    title: "忘记 #include <iostream>",
    category: "头文件与命名空间",
    compilers: ["g++", "MSVC"],
    bad: `int main() {
    std::cout << "hi" << std::endl;   // ⛔ 没有 include
    return 0;
}`,
    message: `main.cpp: In function 'int main()':
main.cpp:2:10: error: 'cout' is not a member of 'std'
    2 |     std::cout << "hi" << std::endl;
      |          ^~~~
main.cpp:1:1: note: 'std::cout' is defined in header '<iostream>'; this is probably because you forgot to '#include <iostream>'`,
    messageNote: "MSVC: error C2065: 'cout': undeclared identifier（并提示 <iostream>）",
    cause: "std::cout、std::cin、std::endl 都定义在 <iostream> 里。没有 include，std 命名空间里根本“看不见”它们。",
    fixed: `#include <iostream>   // 补上头文件

int main() {
    std::cout << "hi" << std::endl;
    return 0;
}`,
    prevention: "新文件先写 include 清单再写代码；报错信息里 g++ 的 note 会直接告诉你缺哪个头文件。",
    related: ["ch01"],
    level: "入门"
  },
  {
    id: "err-missing-string-include",
    title: "使用 std::string 却没包含 <string>",
    category: "头文件与命名空间",
    compilers: ["g++", "MSVC"],
    bad: `#include <iostream>
// 注意：没有 #include <string>

int main() {
    std::string s = "hello";   // 有的实现能碰巧编过
    std::cout << s << std::endl;
    return 0;
}`,
    message: `main.cpp:5:10: error: 'string' is not a member of 'std'
    5 |     std::string s = "hello";
      |          ^~~~~~`,
    messageNote: "部分编译器/标准库版本因 <iostream> 间接引入了 <string> 而“碰巧”编译通过——这是不可靠的，换编译器或开更高标准就会失败。",
    cause: "<iostream> 不承诺把 <string> 带进来。虽然某些实现恰好间接包含，但标准没有保证，可移植代码必须显式包含。",
    fixed: `#include <iostream>
#include <string>   // 用 std::string 就显式包含`,
    prevention: "“用什么包含什么”：直接 include 每个用到的设施头文件，不依赖间接引入。",
    related: ["ch06"],
    level: "入门"
  },
  {
    id: "err-namespace-std",
    title: "忘写 std:: 前缀",
    category: "头文件与命名空间",
    compilers: ["g++", "MSVC"],
    bad: `#include <iostream>

int main() {
    cout << "hi" << endl;   // ⛔ cout 不在全局作用域
    return 0;
}`,
    message: `main.cpp:4:5: error: 'cout' was not declared in this scope
    4 |     cout << "hi" << endl;
      |     ^~~~
main.cpp:4:5: note: suggested alternative: 'std::cout'`,
    cause: "标准库的所有名字都在 std 命名空间里。要么写 std::cout，要么 using std::cout（或 using namespace std;），否则全局作用域没有 cout。",
    fixed: `#include <iostream>
using std::cout;    // 只引入需要的名字（推荐写法）
using std::endl;

int main() {
    cout << "hi" << endl;
    return 0;
}`,
    prevention: "初学阶段可 using namespace std; 快速上手，但工程代码建议逐个 using 或写全 std::，避免名字冲突。",
    related: ["ch01"],
    level: "入门"
  },
  {
    id: "err-old-header-h",
    title: "#include <iostream.h>（老教材头文件）",
    category: "头文件与命名空间",
    compilers: ["g++", "MSVC"],
    bad: `#include <iostream.h>    // ⛔ 上世纪 90 年代的写法

int main() {
    cout << "hi" << endl;
    return 0;
}`,
    message: `main.cpp:1:10: fatal error: iostream.h: No such file or directory
compilation terminated.`,
    messageNote: "MSVC: fatal error C1083: 无法打开包括文件:“iostream.h”: No such file or directory",
    cause: "带 .h 的 iostream.h 是 C++98 标准化之前的老式头文件，早已从所有现代编译器移除。标准化后的头文件没有 .h，且名字进入 std 命名空间——这也是现代写法要 std::cout 的原因。",
    fixed: `#include <iostream>          // 没有 .h
using namespace std;         // 老教材通常靠它省掉 std::

int main() {
    cout << "hi" << endl;
    return 0;
}`,
    prevention: "照老教材抄代码先做“现代化翻译”：<xxx.h> → <xxx> 并补 using；C 标准库则用 <cstdio> 这类 c 前缀写法。",
    related: ["ch01"],
    level: "入门"
  },
  {
    id: "err-gets-removed",
    title: "gets 不存在（已被标准删除）",
    category: "头文件与命名空间",
    compilers: ["g++", "MSVC"],
    bad: `#include <cstdio>

int main() {
    char name[20];
    gets(name);      // ⛔ C++11 弃用、C++14 彻底移除
    return 0;
}`,
    message: `main.cpp:6:5: error: 'gets' was not declared in this scope
    6 |     gets(name);
      |     ^~~~`,
    messageNote: "老编译器或宽松选项下表现为弃用警告（warning: 'gets' is deprecated），新编译器一律报错",
    cause: "gets 无法限制读入长度，是缓冲区溢出的著名源头，C++11 弃用、C++14 从标准中删除。不少老教材还在用它读一行字符串。",
    fixed: `#include <iostream>
#include <string>

int main() {
    std::string name;
    std::getline(std::cin, name);   // 推荐：自动扩容、无溢出风险
    // 字符数组版本：std::cin.getline(name, 20);
    return 0;
}`,
    prevention: "读一行用 std::string + std::getline；在老代码里见到 gets 要有警觉。",
    related: ["ch06"],
    level: "入门"
  },

  /* ---------------- 链接错误 ---------------- */
  {
    id: "err-undefined-reference",
    title: "undefined reference（只声明未定义）",
    category: "链接错误",
    compilers: ["g++", "MSVC"],
    bad: `// math_utils.h
int add(int a, int b);   // 只声明

// main.cpp
#include "math_utils.h"
int main() {
    return add(1, 2);    // 链接器找不到函数体
}`,
    message: `/usr/bin/ld: /tmp/ccXxYyZz.o: in function \`main':
main.cpp:(.text+0x1a): undefined reference to \`add(int, int)'
collect2: error: ld returned 1 exit status`,
    messageNote: "MSVC: error LNK2019: unresolved external symbol \"int __cdecl add(int,int)\" referenced in function main",
    cause: "编译期只检查“函数有没有声明”，函数体是否存在由链接器负责。声明了却从未定义（或定义所在的 .cpp 没参与链接）就会报 undefined reference。",
    fixed: `// math_utils.cpp —— 提供定义，并加入编译命令
int add(int a, int b) { return a + b; }

// g++ main.cpp math_utils.cpp -o app`,
    prevention: "undefined reference 先查三件事：① 函数是否真的定义了；② 定义所在的源文件有没有参与编译链接；③ C++ 调 C 库时是否用 extern \"C\" 包裹声明。",
    related: ["ch04"],
    level: "进阶"
  },
  {
    id: "err-undefined-main",
    title: "undefined reference to 'main'（没有主函数）",
    category: "链接错误",
    compilers: ["g++", "MSVC"],
    bad: `// 整个工程里只有这样的文件：
#include <iostream>

void run() {
    std::cout << "hello\\n";
}`,
    message: `/usr/bin/ld: /usr/lib/x86_64-linux-gnu/Scrt1.o: in function \`_start':
(.text+0x24): undefined reference to \`main'
collect2: error: ld returned 1 exit status`,
    messageNote: "Windows MinGW 下常表现为：undefined reference to `WinMain'（入口符号名不同）",
    cause: "可执行程序必须有入口 main。链接器找不到 main（或拼错了签名，如把 main 写成 mian、写成 float main）就无法生成可执行文件。",
    fixed: `int main() {     // 正确的入口签名
    run();
    return 0;
}`,
    prevention: "入口固定是 int main()（或带命令行参数的版本）；链接报 undefined reference to 'main' 先确认 main 是否存在、拼写是否正确。",
    related: ["ch01"],
    level: "入门"
  },
  {
    id: "err-multiple-definition",
    title: "multiple definition（头文件里定义全局变量）",
    category: "链接错误",
    compilers: ["g++", "MSVC"],
    bad: `// globals.h
int g_counter = 0;    // ⛔ 每个 include 它的 .cpp 都有一份定义

// a.cpp
#include "globals.h"
// b.cpp
#include "globals.h"
// 链接时出现两个 g_counter`,
    message: `/usr/bin/ld: b.o:(.data+0x0): multiple definition of \`g_counter'; a.o:(.data+0x0): first defined here
collect2: error: ld returned 1 exit status`,
    cause: "头文件会被多个源文件分别包含，其中的“定义”在每个翻译单元里都生成一份实体，链接器合并时发现重名。声明（extern）可以有多个，定义只能有一个。",
    fixed: `// globals.h —— 只放声明
extern int g_counter;

// globals.cpp —— 唯一的定义
int g_counter = 0;

// C++17 起也可以：inline int g_counter = 0; 放头文件`,
    prevention: "头文件里只放声明（extern/函数原型/类定义）；全局变量定义移到 .cpp；常量用 constexpr/inline。",
    related: ["ch04", "ch01"],
    level: "进阶"
  },

  /* ---------------- 类与对象 ---------------- */
  {
    id: "err-abstract-instantiate",
    title: "实例化抽象类",
    category: "类与对象",
    compilers: ["g++", "MSVC"],
    bad: `class Shape {
public:
    virtual double area() const = 0;   // 纯虚函数
};

int main() {
    Shape s;    // ⛔ 抽象类不能实例化
    return 0;
}`,
    message: `main.cpp:7:11: error: cannot declare variable 's' to be of abstract type 'Shape'
    7 |     Shape s;
      |           ^
main.cpp:3:19: note:   because the following virtual functions are pure within 'Shape':
main.cpp:3:19: note:     'virtual double Shape::area() const'`,
    cause: "含纯虚函数（= 0）的类是抽象类：它只定义接口，没有完整实现，标准禁止创建其对象。",
    fixed: `class Circle : public Shape {
public:
    double area() const override { return 3.14 * r * r; }
private:
    double r = 1.0;
};
Circle c;        // 派生类实现纯虚函数后才能实例化
Shape& ref = c;  // 但可以用基类指针/引用实现多态`,
    prevention: "抽象类用于“定义接口 + 通过基类引用/指针操作派生对象”；需要实例化的中间层类不要放纯虚函数。",
    related: ["ch08"],
    level: "进阶"
  },
  {
    id: "err-private-access",
    title: "访问类的私有成员",
    category: "类与对象",
    compilers: ["g++", "MSVC"],
    bad: `class Point {
private:
    int x = 0;
};

int main() {
    Point p;
    p.x = 3;    // ⛔ x 是 private
    return 0;
}`,
    message: `main.cpp:8:7: error: 'int Point::x' is private within this context
    8 |     p.x = 3;
      |       ^
main.cpp:3:9: note: declared private here`,
    cause: "private 成员只允许类自己的成员函数和 friend 访问。类外部只能通过公开接口操作对象状态。",
    fixed: `class Point {
public:
    void setX(int v) { x = v; }   // 提供公开接口
private:
    int x = 0;
};`,
    prevention: "封装原则：数据成员默认 private，行为通过成员函数暴露；需要外部读写时显式设计 setter/getter。",
    related: ["ch07"],
    level: "入门"
  },

  /* ---------------- 运行时与未定义行为 ---------------- */
  {
    id: "err-array-oob",
    title: "数组越界（编译能过，运行是 UB）",
    category: "运行时与未定义行为",
    compilers: ["g++", "MSVC", "clang++"],
    bad: `#include <iostream>

int main() {
    int a[5] = {1, 2, 3, 4, 5};
    std::cout << a[5] << std::endl;   // ⛔ 合法下标是 0~4
    return 0;
}`,
    message: `编译期（g++ -O2 -Wall）：warning: array subscript 5 is above array bounds of 'int [5]' [-Warray-bounds]
运行期（g++ -g -fsanitize=address）：
ERROR: AddressSanitizer: stack-buffer-overflow on address 0x7ffd... READ of size 4`,
    cause: "下标 5 已越过数组末尾。标准不检查数组边界——越界读取是未定义行为：可能读到相邻变量的值、读到垃圾、或看似“正常”。g++ 在能静态判定时给警告，AddressSanitizer 在运行时抓现行。",
    fixed: `for (int i = 0; i < 5; ++i)         // 循环条件用 < 5
    std::cout << a[i] << std::endl;
// 或改用 std::array / std::vector，越界用 .at() 会抛异常`,
    prevention: "循环条件牢记“< 长度”；开启 -Wall -Wextra；关键程序用 -fsanitize=address 自测；尽量用 std::vector 的 .at()。",
    related: ["ch05", "ch06"],
    level: "入门"
  },
  {
    id: "err-null-deref",
    title: "解引用空指针",
    category: "运行时与未定义行为",
    compilers: ["g++", "MSVC", "clang++"],
    bad: `#include <iostream>

int main() {
    int* p = nullptr;
    std::cout << *p << std::endl;   // ⛔ 对空指针解引用
    return 0;
}`,
    message: `编译期（g++ -Wall）通常只有警告：warning: null pointer dereference [-Wnull-dereference]
运行期（-fsanitize=address）：
ERROR: AddressSanitizer: SEGV on unknown address 0x000000000000
The signal is caused by a READ memory access.`,
    cause: "nullptr 不指向任何对象，*p 试图读取“地址 0 处的 int”。这是未定义行为：典型表现为段错误（SIGSEGV）崩溃，但标准不保证一定崩溃。",
    fixed: `if (p != nullptr) {          // 先判空再解引用
    std::cout << *p << std::endl;
}
// 或用引用语义/智能指针明确所有权`,
    prevention: "指针使用前必须初始化；不确定是否为空就先判空；函数返回指针的接口要写清“可能返回 nullptr”。",
    related: ["ch05", "ch09"],
    level: "入门"
  },
  {
    id: "err-use-after-free",
    title: "使用悬空指针（use-after-free）",
    category: "运行时与未定义行为",
    compilers: ["g++", "MSVC", "clang++"],
    bad: `#include <iostream>

int main() {
    int* p = new int(42);
    delete p;
    std::cout << *p << std::endl;   // ⛔ p 已悬空
    return 0;
}`,
    message: `编译期一般无任何警告！
运行期（-fsanitize=address）：
ERROR: AddressSanitizer: heap-use-after-free on address 0x602000000010
READ of size 4 at 0x602000000010 thread T0
freed by thread T0 here: ... operator delete`,
    cause: "delete 之后内存已归还，但指针 p 仍保存着旧地址（悬空指针）。读写它都是未定义行为，最危险的是“看似还能输出 42”——换平台/开优化就变脸。真正的“指向已销毁栈变量”的悬空指针同理。",
    fixed: `int* p = new int(42);
delete p;
p = nullptr;              // 立刻置空，杜绝误用
// 更好：std::unique_ptr<int> up = std::make_unique<int>(42);
//       离开作用域自动释放，不存在悬空`,
    prevention: "delete 后立即置 nullptr；能用智能指针就不用裸 new/delete；开启 -fsanitize=address 在测试期抓 use-after-free。",
    related: ["ch05", "ch09"],
    level: "进阶"
  },
  {
    id: "err-div-zero",
    title: "整数除以零",
    category: "运行时与未定义行为",
    compilers: ["g++", "MSVC"],
    bad: `#include <iostream>

int main() {
    int a = 0;
    int b = 10 / a;    // ⛔ 运行时整数除零
    std::cout << b << std::endl;
    return 0;
}`,
    message: `常量除零（int b = 10 / 0;）编译期警告：
warning: integer division by zero [-Wdiv-by-zero]
变量除零在运行期触发 SIGFPE（Floating point exception）崩溃`,
    cause: "整数除零在标准中是未定义行为：x86 上通常触发硬件异常使程序崩溃。注意区分：浮点除零不崩溃，结果是 inf 或 nan（需 <cmath>）。",
    fixed: `if (a != 0) {
    int b = 10 / a;
    std::cout << b << std::endl;
} else {
    std::cout << "除数不能为 0\\n";
}`,
    prevention: "除法前先判断除数；区分整数除零（崩溃/UB）与浮点除零（inf/nan）。",
    related: ["ch02"],
    level: "入门"
  },
  {
    id: "err-return-local-addr",
    title: "返回局部变量的地址/引用",
    category: "运行时与未定义行为",
    compilers: ["g++", "MSVC"],
    bad: `int& badRef() {
    int x = 10;
    return x;     // ⛔ 返回局部变量的引用
}`,
    message: `编译期（g++ -Wall）：
warning: reference to local variable 'x' returned [-Wreturn-local-addr]
运行期：函数返回后 x 所在栈帧已被回收，使用返回的引用是未定义行为`,
    cause: "局部变量存放在栈上，函数返回时栈帧销毁。返回它的引用/指针等于把“已经不存在的对象”交给调用者——解引用是未定义行为，可能得到垃圾值或崩溃。",
    fixed: `int byValue() { int x = 10; return x; }   // 返回值拷贝，安全
// 需要引用语义时：返回参数引用、static/全局变量，
// 或改用 std::unique_ptr / 返回对象本身（有移动语义，开销小）`,
    prevention: "牢记“局部变量生命周期止于函数返回”；-Wall 会给出 -Wreturn-local-addr 警告，务必当错误处理。",
    related: ["ch04", "ch05"],
    level: "进阶"
  },
  {
    id: "err-vector-at-oob",
    title: "vector::at 越界（抛异常，可定位）",
    category: "运行时与未定义行为",
    compilers: ["g++", "MSVC"],
    std: "调试期推荐写法",
    bad: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{1, 2, 3};
    std::cout << v.at(5) << std::endl;   // 越界：合法下标是 0~2
    return 0;
}`,
    message: `terminate called after throwing an instance of 'std::out_of_range'
  what():  vector::_M_range_check: __n (which is 5) >= this->size() (which is 3)`,
    messageNote: "与 a[5] 的关键区别：at() 越界是“有定义的失败”（抛异常后终止），[] 越界是未定义行为——这是调试期推荐 at() 的原因",
    cause: "at() 会先检查下标，越界就抛 std::out_of_range；没人捕获时程序以 abort 结束。好处是报错信息直接写明“越界下标是几、容器多大”，一眼定位。VS 下则提示 vector subscript out of range。",
    fixed: `std::cout << v[2] << std::endl;   // 明确合法的下标
// 或先判断：if (n < v.size()) v.at(n) ...
// 循环遍历交给 range-for：for (int x : v)`,
    prevention: "调试阶段用 .at() 让越界当场现形；确认下标逻辑无误后再换 []（更快）。数组越界请看“数组越界”条目——那是真正的 UB。",
    related: ["ch10"],
    level: "入门"
  },
  {
    id: "err-stack-overflow",
    title: "局部数组太大／递归过深（栈溢出）",
    category: "运行时与未定义行为",
    compilers: ["g++", "MSVC"],
    bad: `int main() {
    int big[10000000];    // ⛔ 约 40 MB，默认栈只有 1~8 MB
    big[0] = 1;
    return 0;
}`,
    message: `编译期没有任何警告/错误。运行期：
Segmentation fault (core dumped)`,
    messageNote: "VS 调试器下表现为 0xC00000FD: Stack overflow；无终止条件的递归同理",
    cause: "局部变量分配在栈上，而栈空间很小（Windows 默认约 1 MB，Linux 常见 8 MB）。超大局部数组在进入函数时就把栈打穿；没有终止条件的递归会层层压栈直到同一结局。OJ 里 int a[10000000] 放在 main 内崩溃，多半是这个原因。",
    fixed: `static int big[10000000];          // 方案一：放静态存储区
// 方案二（推荐）：放堆上，自动释放
#include <vector>
std::vector<int> big2(10000000);`,
    prevention: "几十万元素以上的数组改用 vector／static／全局变量；写递归先确认终止条件，并估算“深度 × 每层开销”是否超出栈空间。",
    related: ["ch06", "ch04"],
    level: "入门"
  },

  /* ---------------- 警告 ---------------- */
  {
    id: "err-no-return-path",
    title: "非 void 函数可能没有返回值",
    category: "警告",
    compilers: ["g++", "MSVC"],
    bad: `int sign(int x) {
    if (x > 0) return 1;
    if (x < 0) return -1;
    // x == 0 时没有 return！
}`,
    message: `warning: control reaches end of non-void function [-Wreturn-type]`,
    cause: "存在执行路径不经过 return 时，函数“返回值”是未定义行为（读取寄存器/栈上的残留）。g++ 以警告形式提示，MSVC（C4715）类似，但问题本质是 UB。",
    fixed: `int sign(int x) {
    if (x > 0) return 1;
    if (x < 0) return -1;
    return 0;          // 补全所有路径
}`,
    prevention: "编译加 -Werror 把警告变错误；多分支函数先在纸上列出所有路径。",
    related: ["ch04", "ch03"],
    level: "入门"
  },
  {
    id: "err-unused-variable",
    title: "定义了未使用的变量",
    category: "警告",
    compilers: ["g++", "MSVC"],
    bad: `int main() {
    int unused = 42;    // ⚠ 定义后从未使用
    return 0;
}`,
    message: `warning: unused variable 'unused' [-Wunused-variable]`,
    cause: "编译器发现变量既没被读也没被写，提示可能是残留代码或写错了变量名。有时也意味着你本想用它却用错了名字。",
    fixed: `int main() {
    int used = 42;
    return used;   // 真正使用它
    // 或删除无用变量；临时保留可写 (void)unused;
}`,
    prevention: "把它当作“代码没写完/写错名”的信号；工程开启 -Wall -Wextra 保持零警告。",
    related: ["ch01"],
    level: "入门"
  },
  {
    id: "err-signed-unsigned-cmp",
    title: "有符号与无符号比较",
    category: "警告",
    compilers: ["g++", "MSVC"],
    bad: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{1, 2, 3};
    int i = -1;
    if (i < v.size())          // ⚠ int 与 size_t(unsigned) 比较
        std::cout << "less\\n";
    return 0;
}`,
    message: `warning: comparison of integer expressions of different signedness: 'int' and 'std::vector<int>::size_type' {aka 'long unsigned int'} [-Wsign-compare]`,
    cause: "比较时 -1 被转换成无符号数：变成 size_t 的最大值（64 位平台上是 0xFFFFFFFFFFFFFFFF），因此 i < v.size() 结果是 false！“-1 小于 3”的直觉在这里失效，这正是许多越界循环 bug 的根源。",
    fixed: `for (std::size_t i = 0; i < v.size(); ++i)   // 用 size_t
    std::cout << v[i] << std::endl;
// 或 C++11 起直接 range-for：for (int x : v)
// 必须比较时显式转换：if (i < static_cast<int>(v.size()))`,
    prevention: "与 .size() 比较一律用 size_t 或 range-for；开 -Wall -Wextra 捕获所有 -Wsign-compare。",
    related: ["ch02", "ch10"],
    level: "进阶"
  },
  {
    id: "err-scanf-missing-amp",
    title: "scanf 漏写取地址 &",
    category: "警告",
    compilers: ["g++", "MSVC"],
    bad: `#include <cstdio>

int main() {
    int x;
    scanf("%d", x);    // ⛔ 漏了 &
    return 0;
}`,
    message: `warning: format '%d' expects argument of type 'int*', but argument 2 has type 'int' [-Wformat=]`,
    messageNote: "MSVC: warning C4473（实参个数/类型与格式串不符）；不改的话运行期行为不可预测",
    cause: "scanf 需要把读到的值“写进”变量，所以要的是地址（int*）。传 x 传的是值，scanf 会把它当地址去写——写到哪全看 x 里的垃圾值，轻则崩溃，重则悄悄改坏别的变量。",
    fixed: `int x;
scanf("%d", &x);    // & 取地址；数组名/指针本身已是地址，不用再加`,
    prevention: "口诀“scanf 遇普通变量必带 &”；开 -Wall 抓 -Wformat。更进一步：直接用 std::cin >> x，天然没有这个问题。",
    related: ["ch01"],
    level: "入门"
  },
  {
    id: "err-uninitialized-var",
    title: "使用未初始化的变量",
    category: "警告",
    compilers: ["g++", "MSVC"],
    bad: `#include <iostream>

int main() {
    int total;                       // ⚠ 没有初始化
    std::cout << total + 1 << std::endl;
    return 0;
}`,
    message: `warning: 'total' is used uninitialized [-Wuninitialized]`,
    messageNote: "部分写法要到 -O2 优化下才能检出；运行期读到的值是栈上的随机垃圾，每次可能不同",
    cause: "局部变量不会自动清零，定义时的“值”是栈上残留的字节。读取未初始化变量属于未定义行为：可能输出随机数，可能碰巧正常，也可能被优化器翻出更离谱的行为。只有全局/静态变量才会自动置零。",
    fixed: `int total = 0;      // 定义即初始化
// 指针同理：int* p = nullptr;`,
    prevention: "养成“定义即初始化”的肌肉记忆；-Wall -Wextra 配合 -O2 能抓出绝大多数漏网之鱼。",
    related: ["ch01"],
    level: "入门"
  },
  {
    id: "err-assign-in-if",
    title: "把 == 误写成 =（条件里的赋值）",
    category: "警告",
    compilers: ["g++", "MSVC"],
    bad: `#include <iostream>

int main() {
    int x = 0;
    if (x = 5) {                    // ⛔ 赋值，不是比较！
        std::cout << "x 是 5\\n";
    }
    std::cout << x << std::endl;    // 输出 5 —— x 被改写了
    return 0;
}`,
    message: `warning: suggest parentheses around assignment used as truth value [-Wparentheses]`,
    messageNote: "MSVC: warning C4706: 条件表达式中的赋值",
    cause: "(x = 5) 这个表达式的值是 5（非零即真），条件恒成立，同时 x 被改写成 5。原意 if (x == 5) 只应在 x 为 5 时成立。这类错误能编译能运行，只是逻辑悄悄错了，非常隐蔽。",
    fixed: `if (x == 5) { /* ... */ }      // 双等号才是比较
// 保险写法：常量放左边——if (5 == x)，漏写成 = 会直接编译报错`,
    prevention: "开 -Wall；需要“防手滑”时用 5 == x 的写法（Yoda 条件）；IDE 一般会对此高亮警告，别无视。",
    related: ["ch03"],
    level: "入门"
  },

  /* ---------------- IDE 与工具链（Visual Studio 2026） ---------------- */
  {
    id: "err-vs-c4996",
    title: "VS 报 C4996：scanf/strcpy 不安全",
    category: "IDE 与工具链",
    compilers: ["VS 2026"],
    bad: `#include <stdio.h>

int main() {
    int x;
    scanf("%d", &x);    // ⛔ VS 默认按错误处理：C4996
    return 0;
}`,
    message: `1>xxx.cpp(5,5): error C4996: 'scanf': This function or variable may be unsafe.
Consider using scanf_s instead. To disable deprecation, use _CRT_SECURE_NO_WARNINGS.
See online help for details.`,
    messageNote: "strcpy / strcat / sprintf / fopen 等同理；这是 VS 的安全检查（SDL），不是代码语法错误——同样的代码在 g++/MinGW 下能正常编译",
    cause: "微软认为这批 C 标准函数没有边界检查、容易写出溢出漏洞，默认按错误处理并建议改用 _s 后缀的专用版本。网上/教材上的代码在 VS 里“编不过”，很多都是撞上了它。",
    fixed: `#define _CRT_SECURE_NO_WARNINGS   // 必须写在所有 #include 之前
#include <stdio.h>

int main() {
    int x;
    scanf("%d", &x);   // 现在可以编译
    return 0;
}
// 或者：项目属性 → C/C++ → 常规 → “SDL 检查”改为“否”
// 或者：属性 → C/C++ → 预处理器 → 预处理器定义 中添加 _CRT_SECURE_NO_WARNINGS`,
    prevention: "统一一种方案并坚持（课程作业推荐加宏定义那一行）；知道 scanf_s/strcpy_s 是 VS 扩展、别的编译器不认即可。",
    related: ["ch06"],
    level: "入门"
  },
  {
    id: "err-vs-window-flash",
    title: "程序窗口一闪而过（F5 运行后立刻关闭）",
    category: "IDE 与工具链",
    compilers: ["VS 2026"],
    bad: `程序没有任何编译错误，Ctrl+F5 前一直按 F5 运行：
输出刚打印完，控制台窗口就自动关闭，来不及看结果。`,
    message: `无编译错误。程序执行完毕后控制台窗口立即关闭。`,
    messageNote: "这不是程序 bug——F5（“启动调试”）在 main 返回后由调试器立刻结束会话，窗口本来就不停留",
    cause: "F5 与 Ctrl+F5 的区别：F5 是调试运行，程序结束窗口即关；Ctrl+F5 是“开始执行不调试”，运行完会提示“按任意键关闭此窗口”。",
    fixed: `运行请按 Ctrl+F5（开始执行不调试）；
或在 return 0; 前加一行 std::cin.get(); 等待回车；
调试时在最后一行设置断点，程序会停在断点处供你查看输出。`,
    prevention: "平时统一用 Ctrl+F5 运行；不要用 while(true)、system(\"pause\") 之外的怪招“挡窗口”。",
    related: ["ch01"],
    level: "入门"
  },
  {
    id: "err-vs-lnk1168",
    title: "LNK1168：无法打开 xxx.exe 进行写入",
    category: "IDE 与工具链",
    compilers: ["VS 2026"],
    bad: `程序上次运行后卡死/忘关窗口，此时再次点击“生成”或“运行”。`,
    message: `1>LINK : fatal error LNK1168: 无法打开 D:\\code\\demo\\x64\\Debug\\demo.exe 进行写入`,
    messageNote: "常见诱因：死循环没退出的旧进程、没关的控制台窗口、被杀毒软件短暂占用",
    cause: "链接器要覆盖旧的 exe 文件，但旧程序还在运行（文件被占用），无法写入。代码本身往往没有任何问题。",
    fixed: `关掉正在运行的旧程序窗口；
找不到窗口就去 任务管理器 → 找到 demo.exe → 结束任务，再重新生成。`,
    prevention: "程序结束前别写死循环；看到 LNK1168 第一反应是“旧进程没死”，而不是改代码。",
    related: [],
    level: "入门"
  },
  {
    id: "err-vs-two-mains",
    title: "一个项目里放多个 main（LNK2005 already defined）",
    category: "IDE 与工具链",
    compilers: ["VS 2026"],
    bad: `// 把多份作业的 .cpp 都加进了同一个 VS 项目：
// main.cpp      → int main() { ... }   （第 1 份作业）
// homework2.cpp → int main() { ... }   （第 2 份作业）`,
    message: `MSVCRT.lib(exe_main.obj) : error LNK2005: main already defined in main.obj`,
    messageNote: "要点：VS 的一个“项目”会把项目里的所有 .cpp 一起编译并链接成一个 exe——这与 Dev-C++“每个文件单独编译运行”完全不同",
    cause: "一个项目 = 一个程序 = 全项目只能有一个 main。把多份作业塞进同一个项目，多个 main 在链接阶段撞车。",
    fixed: `方案一（推荐）：每份作业在解决方案里单独“新建项目”，运行哪个就右键它 → “设为启动项目”；
方案二：右键暂不参与的 .cpp → 属性 → 常规 → “从生成中排除”选“是”；
方案三：右键该文件 → “从项目中移除”（磁盘文件仍保留）。`,
    prevention: "记住 VS 的层级：解决方案 > 项目 > 源文件；一次只生成一个项目。",
    related: ["ch01"],
    level: "入门"
  },
  {
    id: "err-vs-garbled-chinese",
    title: "控制台中文输出乱码",
    category: "IDE 与工具链",
    compilers: ["VS 2026"],
    bad: `#include <iostream>

int main() {
    std::cout << "你好，世界" << std::endl;
    // 控制台实际显示：浣犲ソ锛屼笘鐣屻
    return 0;
}`,
    message: `无编译错误（或仅有 warning C4819）。症状：程序把“你好，世界”显示成一串乱码。`,
    messageNote: "乱码 ≠ 程序逻辑错：是“源文件编码”与“控制台解码编码”不一致",
    cause: "新版 VS 默认把源码保存为 UTF-8（无签名），而中文 Windows 控制台默认按 GBK（代码页 936）解码输出——UTF-8 字节流被按 GBK 解释就变成乱码。",
    fixed: `一劳永逸：项目属性 → C/C++ → 所有选项 → “源字符集”与“执行字符集”都改为 “UTF-8 (/utf-8)”；
或：文件 → “xxx 另存为” → 保存按钮旁下拉 → 编码保存 → “Unicode (UTF-8 带签名) - 代码页 65001”；
临时方案：程序开头执行 system("chcp 65001");`,
    prevention: "新建项目先把 /utf-8 配置好再写代码；见到乱码先怀疑编码，别急着改逻辑。",
    related: ["ch01"],
    level: "入门"
  },
  {
    id: "err-vs-default-std14",
    title: "VS 默认语言标准是 C++14（新特性编译报错）",
    category: "IDE 与工具链",
    compilers: ["VS 2026"],
    bad: `struct Point { int x, y; };

int main() {
    Point p{ .x = 1, .y = 2 };   // ⛔ 指定初始化器需要 C++20
    return 0;
}`,
    message: `1>xxx.cpp(4,15): error C7555: 指定的初始值设定项至少需要 "/std:c++20"`,
    messageNote: "结构化绑定、CTAD、if constexpr 等在默认标准下会报 C2065 / C2059 等别的错误——根源相同",
    cause: "VS 新建项目的默认语言标准是 ISO C++14，而课程示例多按 C++17/20 编写；课件上的现代写法直接贴进新项目就会报错。g++ 新版默认已支持更高标准，所以同样的代码在命令行能编过。",
    fixed: `菜单：项目 → 属性 → C/C++ → 语言 → “C++ 语言标准”
改为 “ISO C++17 (/std:c++17)” 或 “ISO C++20 (/std:c++20)”；
注意把左上角配置改成“所有配置 + 所有平台”再设置，避免 Debug/Release 只改了一半。`,
    prevention: "新建项目第一步就设置语言标准；命令行 g++ 的对应选项是 -std=c++17 / -std=c++20。",
    related: ["ch12"],
    level: "入门"
  },
  {
    id: "err-vs-debug-dll",
    title: "Debug 版 exe 发给别人提示缺 DLL",
    category: "IDE 与工具链",
    compilers: ["VS 2026"],
    bad: `把自己电脑上生成的 x64\\Debug\\demo.exe 直接发给同学运行。`,
    message: `系统错误：无法启动此程序，因为计算机中丢失 VCRUNTIME140D.dll。请尝试重新安装该程序以解决此问题。`,
    messageNote: "文件名末尾带 D 的（VCRUNTIME140D.dll、MSVCP140D.dll 等）都是调试版运行库",
    cause: "Debug 配置链接的是调试版 C/C++ 运行库，这些 DLL 只随 Visual Studio 安装——对方电脑上没有，自然报丢失。自己电脑能跑是因为装了 VS。",
    fixed: `把工具栏配置从 “Debug” 切换为 “Release” 重新生成，发送 x64\\Release\\ 下的 exe；
或：项目属性 → C/C++ → 代码生成 → 运行库 → 选 “多线程 (/MT)”（静态链接）后再发。`,
    prevention: "需要交付可执行文件时统一用 Release；拿不准就发源代码。",
    related: [],
    level: "入门"
  },
  {
    id: "err-vs-pdb-notice",
    title: "输出窗口刷屏“无法查找或打开 PDB 文件”",
    category: "IDE 与工具链",
    compilers: ["VS 2026"],
    bad: `正常运行程序，“输出”窗口却滚过一排提示：
已加载 “C:\\Windows\\System32\\ntdll.dll”。无法查找或打开 PDB 文件。`,
    message: `已加载 “C:\\Windows\\System32\\kernel32.dll”。无法查找或打开 PDB 文件。
（一连串类似提示，但程序正常编译、正常运行）`,
    messageNote: "PDB 是调试符号文件；系统自带 DLL 本来就不公开符号，VS 加载不到只是提示，不是错误",
    cause: "调试时 VS 顺手尝试加载每个 DLL 的符号文件（.pdb）以便调试进入系统代码；系统 DLL 的符号不公开，提示找不到属正常现象。",
    fixed: `直接忽略即可。想清爽些：工具 → 选项 → 调试 → 常规 → 勾选“启用‘仅我的代码’”。`,
    prevention: "判断程序成败只看两处：① “输出”/“错误列表”里的 error / LNK 字样；② 程序自己的输出。其余“已加载/无法查找”都是流水账。",
    related: [],
    level: "入门"
  },
  {
    id: "err-vs-intellisense",
    title: "IntelliSense 红色波浪线 ≠ 编译错误",
    category: "IDE 与工具链",
    compilers: ["VS 2026"],
    bad: `代码明明正确，#include <iostream> 下方却一直有红色波浪线
（“无法打开源文件 iostream”），或已经删掉的旧代码仍被标错。`,
    message: `实际按 Ctrl+F5 生成：0 个错误，程序正常运行——红线只是 IntelliSense 的缓存误报。`,
    messageNote: "反过来也要小心：没有红线 ≠ 一定能编译。两套系统互不同步，以“生成”结果为准",
    cause: "红色波浪线来自 IntelliSense（独立的语法分析器加本地缓存），与真正编译代码的 MSVC 编译器是两套东西；缓存陈旧或索引未完成时会误报。",
    fixed: `菜单：项目 → “重新扫描解决方案”；
仍不行：关闭 VS → 删除项目文件夹下的隐藏 .vs 目录 → 重新打开。`,
    prevention: "养成“以生成输出为准”的习惯：提交/交作业前一定按 Ctrl+F5 或 生成 → 生成解决方案 看真实结果。",
    related: [],
    level: "入门"
  }
];
