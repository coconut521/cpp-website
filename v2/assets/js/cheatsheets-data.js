/* ============================================================
 * cheatsheets-data.js —— 速查表专区数据（全局变量，离线可用）
 * 三种版式：type = "table"（header+rows）| "code"（code+notes）| "items"（code+desc 列表）
 * 额外字段：short —— 首页筛选栏“直达”按钮上的短名（省略则用完整标题）
 * 注意：desc / rows 单元格按 HTML 原样插入页面，尖括号请写 &lt; &gt;
 * ============================================================ */
window.CHEATSHEETS_DATA = [

  {
    id: "cs-operator-precedence",
    title: "运算符优先级速查",
    category: "运算符",
    short: "优先级",
    desc: "优先级从高到低；背下“先算术、再关系、再逻辑、赋值最低”即可解决大半问题。",
    type: "table",
    header: ["优先级", "运算符", "说明", "结合律"],
    rows: [
      ["1", "::", "作用域解析", "左→右"],
      ["2", "a++ a-- f() a[] a. a->", "后缀自增自减、函数调用、下标、成员访问", "左→右"],
      ["3", "++a --a ! ~ -一元+ *解引用 &取地址 sizeof", "一元运算符", "右→左"],
      ["3", "(T) / static_cast<T>()", "C 风格 / 命名强制转换", "右→左"],
      ["4", ".*  ->*", "成员指针访问", "左→右"],
      ["5", "* / %", "乘、除、取余", "左→右"],
      ["6", "+ -", "加、减", "左→右"],
      ["7", "<< >>", "左移、右移（cout 也用它！）", "左→右"],
      ["8", "< <= > >=", "关系比较", "左→右"],
      ["9", "== !=", "相等比较（比 < 低！常见坑）", "左→右"],
      ["10", "&", "按位与", "左→右"],
      ["11", "^", "按位异或", "左→右"],
      ["12", "|", "按位或", "左→右"],
      ["13", "&&", "逻辑与（短路）", "左→右"],
      ["14", "||", "逻辑或（短路）", "左→右"],
      ["15", "?:", "三目条件", "右→左"],
      ["16", "= += -= *= /= %= <<= >>= &= ^= |=", "赋值与复合赋值", "右→左"],
      ["17", ",", "逗号（顺序求值）", "左→右"]
    ],
    tip: "最常考的三组：== 优先级低于 <；<< 优先级高于 <（所以 cout<<x<y 要写 cout<<(x<y)）；赋值右结合（a=b=3 先算 b=3）。"
  },
  {
    id: "cs-basic-types",
    title: "基本类型与典型大小（Windows/Linux x64）",
    category: "类型与转换",
    short: "基本类型",
    desc: "标准只保证下限；“典型字节”以主流 64 位平台为准，考试写“典型/通常”更严谨。",
    type: "table",
    header: ["类型", "典型字节", "典型范围", "字面量后缀"],
    rows: [
      ["char", "1", "-128 ~ 127（是否默认有符号由实现决定）", "'a'"],
      ["bool", "1", "true / false", "true / false"],
      ["int", "4", "约 -21.4 亿 ~ 21.4 亿（±2^31-1）", "无（默认）"],
      ["unsigned int", "4", "0 ~ 4294967295", "u / U"],
      ["long", "4（Windows）/ 8（Linux/Mac）", "同上或更宽", "l / L"],
      ["long long", "8", "约 ±9.2×10^18", "ll / LL"],
      ["float", "4", "约 ±3.4×10^38，~7 位有效数字", "f / F"],
      ["double", "8", "约 ±1.8×10^308，~15 位有效数字", "无（小数默认）"],
      ["size_t", "8（64 位）", "0 ~ 2^64-1，无符号", "zu 配 printf"]
    ],
    tip: "sizeof 返回 size_t；与 int 比较时的有符号/无符号问题见第 2 章。"
  },
  {
    id: "cs-escape-chars",
    title: "转义字符表",
    category: "输入输出",
    short: "转义字符",
    desc: "字符串与字符字面量中的特殊符号。",
    type: "table",
    header: ["写法", "含义", "备注"],
    rows: [
      ["\\n", "换行（LF）", "最常用"],
      ["\\t", "水平制表符", "对齐输出"],
      ["\\\\", "反斜杠本身", "路径 C:\\\\tmp"],
      ["\\\"", "双引号", "字符串内引号"],
      ["\\'", "单引号", "字符内引号"],
      ["\\r", "回车（CR）", "Windows 换行是 \\r\\n"],
      ["\\0", "空字符（编码 0）", "C 字符串结尾标志"],
      ["\\a", "响铃", "终端可发出提示音"],
      ["\\x41", "十六进制转义（= 'A'）", "十六进制数码任意多个，注意贪婪"],
      ["\\101", "八进制转义（= 'A'）", "最多三位八进制数码"]
    ],
    tip: "“\\” 开头的都是“一个字符”：'\\n' 是 char，长度 1；\"\\n\" 是字符串，长度 2（含 \\0）。"
  },
  {
    id: "cs-cout-format",
    title: "std::cout 输出格式控制",
    category: "输入输出",
    short: "cout 格式",
    desc: "需要 #include &lt;iomanip&gt; 的是带参数的操纵符；无参数的直接用。",
    type: "items",
    items: [
      { code: "std::cout << 3.141592653;", desc: "默认 6 位有效数字 → 3.14159" },
      { code: "std::cout << std::fixed << 3.141592653;", desc: "固定小数 6 位 → 3.141593" },
      { code: "std::cout << std::setprecision(2) << 3.14159;", desc: "有效数字 2 位 → 3.1（配合 fixed 则是小数 2 位）" },
      { code: "std::cout << std::setw(8) << 42;", desc: "右对齐占 8 列（需 <iomanip>），默认右对齐补空格" },
      { code: "std::cout << std::left << std::setw(8) << 42;", desc: "左对齐占 8 列" },
      { code: "std::cout << std::setfill('*') << std::setw(6) << 42;", desc: "填充字符 → ****42" },
      { code: "std::cout << std::hex << 255;", desc: "十六进制 → ff（oct 八进制、dec 十进制）" },
      { code: "std::cout << std::boolalpha << true;", desc: "bool 输出 true/false 而非 1/0" },
      { code: "std::cout << std::showpoint << 3.0;", desc: "强制显示小数点 → 3.00000" }
    ],
    tip: "setw 只对“下一个”输出项生效；setprecision/fixed/hex 等对流持续有效。"
  },
  {
    id: "cs-cin",
    title: "cin 输入模式套路",
    category: "输入输出",
    short: "cin 输入",
    desc: "OJ 与课后题最常用的读入写法。核心口诀：<b>&gt;&gt; 跳过空白但留下换行，getline 吃掉整行</b>。",
    type: "items",
    items: [
      { code: "cin >> x;", desc: "读一个“词”：跳过前导空白，遇空格/换行/Tab 停止；换行符仍留在缓冲区" },
      { code: "getline(cin, s);", desc: "读一整行（可含空格），并丢弃末尾换行符；需要 #include &lt;string&gt;" },
      { code: "cin >> n;  cin.ignore();  getline(cin, s);", desc: "经典坑：>> 之后缓冲区残留换行，紧接着的 getline 会立刻读到空串，中间必须加 ignore()" },
      { code: "while (cin >> x) { … }", desc: "读到 EOF 或非法输入为止（Windows 下 Ctrl+Z 回车结束）——多组输入的标准写法" },
      { code: "while (getline(cin, line)) { … }", desc: "逐行读到文件尾；末尾的空行也会被读成空串" },
      { code: "cin >> n;  vector<int> v(n);  for (auto& e : v) cin >> e;", desc: "先读元素个数再循环读入——OJ 最常见套路" },
      { code: "if (!(cin >> x)) { cin.clear(); cin.ignore(1024, '\\n'); }", desc: "读入失败的善后：clear() 清错误状态，ignore() 丢掉坏输入；不清空则后续读取全部无效" },
      { code: "cin.get(ch);", desc: "读单个字符（含空格与换行），适合逐字符处理" },
      { code: "istringstream iss(line);  while (iss >> w) { … }", desc: "把一行拆成若干“词”：getline + stringstream（需 #include &lt;sstream&gt;）" }
    ],
    tip: "cin >> 与 getline 混用，中间必插一条 cin.ignore();；读入失败后 cin 处于 fail 状态，必须 clear() 才能继续读。"
  },
  {
    id: "cs-type-cast",
    title: "四种类型转换",
    category: "类型与转换",
    short: "类型转换",
    desc: "考试考 static_cast 最多；其余三种知道用途即可。",
    type: "table",
    header: ["写法", "用途", "备注"],
    rows: [
      ["static_cast<T>(e)", "相关类型的良性转换：double→int、int→char、void*→int*", "编译期检查，考试与工程首选"],
      ["dynamic_cast<T*>(e)", "多态类型的安全下行转换（基类→派生类）", "失败返回 nullptr / 抛 bad_cast，需虚函数"],
      ["const_cast<T>(e)", "去掉/加回 const 或 volatile", "改真正 const 的对象是 UB"],
      ["reinterpret_cast<T>(e)", "指针位模式的重新解释", "最危险，几乎只在底层编程用"],
      ["(T)e（C 风格）", "以上按序尝试的组合", "能写但难搜索难审查，不推荐"]
    ],
    tip: "隐式转换方向：bool→int→long long→float→double 一路“加宽”安全；反向是窄化，{} 初始化会拒绝。"
  },
  {
    id: "cs-string",
    title: "std::string 速查",
    category: "字符串",
    short: "string",
    desc: "#include &lt;string&gt;。与 C 字符串互转用 c_str()。",
    type: "items",
    items: [
      { code: "s.size()  /  s.length()", desc: "字符个数（两者等价），类型 size_t" },
      { code: "s.empty()", desc: "是否为空串" },
      { code: "s[i]  /  s.at(i)", desc: "访问第 i 个字符；at 越界抛 out_of_range，[] 越界是 UB" },
      { code: "s.front() / s.back()", desc: "首字符 / 尾字符" },
      { code: "s1 + s2  /  s += \"abc\"", desc: "拼接（+ 需至少一侧是 string）" },
      { code: "s1 == s2  /  s1 < s2", desc: "按内容比较（字典序）——C 字符串 == 比的是地址！" },
      { code: "s.find(\"lo\")", desc: "查找子串，返回下标；找不到返回 std::string::npos" },
      { code: "s.rfind(\"lo\")", desc: "从后往前找，返回最后一次出现的下标" },
      { code: "s.substr(pos, len)", desc: "取子串；pos 从 0 起" },
      { code: "s.insert(pos, \"x\") / s.erase(pos, len)", desc: "插入 / 删除" },
      { code: "s.replace(pos, len, \"new\")", desc: "替换一段" },
      { code: "for (char c : s) / for (char& c : s)", desc: "逐字符遍历；加 & 可修改字符" },
      { code: "s.c_str()", desc: "得到 const char*（传给 C 接口用）" },
      { code: "std::to_string(42)", desc: "数字 → 字符串 \"42\"" },
      { code: "std::stoi(\"123\") / std::stod(\"3.5\")", desc: "字符串 → 数字；无法解析抛 invalid_argument" }
    ],
    tip: "判断 find 是否成功：if (s.find(\"x\") != std::string::npos)。npos 是 size_t 的最大值，不是 -1（虽然常被这么记）。"
  },
  {
    id: "cs-cstring",
    title: "C 字符串函数速查（<cstring>）",
    category: "字符串",
    short: "C 字符串",
    desc: "都要求字符串以 '\\0' 结尾，且<b>不做任何边界检查</b>——主要用于读懂旧代码；新代码一律 std::string。",
    type: "table",
    header: ["函数", "作用", "返回 / 注意"],
    rows: [
      ["strlen(s)", "求长度（不含 '\\0'）", "每次调用都从头数，O(n)；string 的 s.size() 是 O(1)"],
      ["strcpy(dst, src)", "把 src 拷入 dst", "不检查 dst 大小，装不下就是缓冲区溢出（UB）；改用 strncpy 或 std::string 赋值"],
      ["strncpy(dst, src, n)", "最多拷 n 个字符", "src 短于 n 才补 '\\0'，否则不补——需手动收尾，否则 dst 没有 '\\0'"],
      ["strcat(dst, src)", "把 src 接到 dst 末尾", "同样不查边界；std::string 的等价写法是 s += t"],
      ["strcmp(a, b)", "按字典序比较内容", "返回负数 / 0 / 正数，<b>不是布尔值</b>；string 直接用 ==、< 按内容比较"],
      ["strchr(s, c)", "找字符 c 首次出现", "返回指针，找不到返回 NULL；string 用 s.find(c)"],
      ["strstr(s, sub)", "找子串 sub 首次出现", "返回指针，找不到返回 NULL；string 用 s.find(sub)"],
      ["strtok(s, delim)", "按分隔符切分", "会修改原串（插入 '\\0'）、依赖内部静态状态，不能嵌套调用；C++ 用 stringstream 分割"],
      ["memcpy / memset", "按字节拷贝 / 填充内存", "只对简单类型安全；用于含 string 成员的类对象是 UB"]
    ],
    tip: "三个共同坑：不查边界、要求 '\\0' 结尾、长度每次现算。与 std::string 互转：string → const char* 用 c_str()，反向直接赋值。"
  },
  {
    id: "cs-ptr-ref-array",
    title: "指针 · 引用 · 数组 对比",
    category: "指针与内存",
    short: "指针/引用/数组",
    desc: "三者都和“地址”打交道，但语义完全不同；按“能不能为空、能不能改绑、sizeof 是什么”三条线记。",
    type: "table",
    header: ["对比点", "指针 T*", "引用 T&", "数组 T[N]"],
    rows: [
      ["本质", "存放地址的变量", "已有对象的别名（第二个名字）", "同类型元素的连续内存块"],
      ["可以为空", "可以：nullptr", "不可以，定义时必须绑定", "不可以"],
      ["能否改绑", "可以：p = &y;", "不可以，绑定终身不变", "数组名不可赋值"],
      ["算术运算", "p + 1 跨一个元素", "不支持", "数组名退化成指针后支持 a + i"],
      ["sizeof 的结果", "指针本身大小（64 位 8 字节）", "被引对象的大小", "整个数组的字节数；<b>传参后退化为指针大小！</b>"],
      ["做函数参数时", "传地址的副本；函数内可改所指对象，也可判空", "直接操作实参本身，无拷贝", "退化为 T*，长度信息丢失，需另传长度"],
      ["典型用途", "可选参数、遍历、与 C 接口交互", "避免拷贝传参、range-for 中修改元素", "长度固定的缓冲区（新代码多换 vector/array）"]
    ],
    tip: "口诀：要“可能不指任何东西”或“中途换目标”用指针；只是给对象起第二个名字（常见于传参避免拷贝）用引用。函数里 sizeof(arr) 拿到的是指针大小——经典考题。"
  },
  {
    id: "cs-containers",
    title: "常用容器全景对比",
    category: "容器与算法",
    short: "容器全景",
    desc: "拿不准用哪个容器时按这张表选：<b>默认 vector，需要映射用 map，只求快且不关心顺序用 unordered_*</b>。",
    type: "table",
    header: ["容器", "头文件", "底层 / 复杂度", "什么时候用"],
    rows: [
      ["vector", "&lt;vector&gt;", "动态数组；随机访问 O(1)，尾部插删均摊 O(1)", "默认首选；下标遍历、缓存友好"],
      ["array", "&lt;array&gt;", "定长数组包装；栈上分配，长度编译期确定", "长度已知且不变，替代原生数组"],
      ["deque", "&lt;deque&gt;", "双端队列；两端插删 O(1)，也支持下标", "两端进出：滑动窗口、任务队列"],
      ["list", "&lt;list&gt;", "双向链表；已定位处插删 O(1)，不支持下标", "频繁在中间插删；缓存不友好，少用"],
      ["stack / queue", "&lt;stack&gt; &lt;queue&gt;", "容器适配器（默认基于 deque）", "只暴露一端 / 两端操作，语义受限更安全"],
      ["set / map", "&lt;set&gt; &lt;map&gt;", "红黑树；查找插删 O(log n)，按 key 有序", "去重集合 / 键值映射，且需要有序遍历"],
      ["unordered_set / map", "&lt;unordered_set&gt; &lt;unordered_map&gt;", "哈希表；平均 O(1)，最坏 O(n)", "只求快、不需要顺序；key 需可哈希"]
    ],
    tip: "选型速记：要下标 → vector；要映射 → map；要有序去重 → set；要最快 → unordered_*；定长 → array。string 可以看作“字符的 vector”，接口基本同款。"
  },
  {
    id: "cs-vector",
    title: "std::vector 速查",
    category: "容器与算法",
    short: "vector",
    desc: "#include &lt;vector&gt;。动态数组，内存连续，随机访问 O(1)。",
    type: "items",
    items: [
      { code: "std::vector<int> v{1, 2, 3};", desc: "列表初始化（C++11）" },
      { code: "std::vector<int> v(5, 0);", desc: "5 个元素，每个都是 0（注意与 {5,0} 区分！）" },
      { code: "v.push_back(x)", desc: "尾部追加，可能引发扩容→迭代器失效" },
      { code: "v.pop_back()", desc: "删除尾部元素（不返回该元素）" },
      { code: "v.size() / v.empty()", desc: "元素个数 / 是否为空" },
      { code: "v[i] / v.at(i)", desc: "访问；at 越界抛 out_of_range，[] 越界 UB" },
      { code: "v.front() / v.back()", desc: "首 / 尾元素" },
      { code: "v.insert(v.begin()+2, x)", desc: "在迭代器位置前插入" },
      { code: "v.erase(v.begin()+2)", desc: "删除指定位置，返回下一个位置的迭代器" },
      { code: "v.clear()", desc: "清空（size 归 0）" },
      { code: "v.resize(10) / v.reserve(100)", desc: "改 size / 预留 capacity（不改变 size）" },
      { code: "for (auto& x : v)", desc: "range-for 遍历；加 & 修改元素、避免拷贝" }
    ],
    tip: "vector<int> v(5, 0) 是“5 个 0”，vector<int> v{5, 0} 是“两个元素 5 和 0”——圆括号与花括号语义不同，经典考点。"
  },
  {
    id: "cs-map",
    title: "map 与 unordered_map 速查",
    category: "容器与算法",
    short: "map/set",
    desc: "#include &lt;map&gt; / &lt;unordered_map&gt;。键值对容器；set 的接口与之高度一致（没有 []）。",
    type: "items",
    items: [
      { code: "m[k] = v", desc: "插入或覆盖；查询时若 k 不存在会自动插入默认值！" },
      { code: "m.at(k)", desc: "只访问不插入；k 不存在抛 out_of_range" },
      { code: "m.find(k)", desc: "返回迭代器，找不到返回 m.end()" },
      { code: "m.count(k)", desc: "0 或 1（键是否存在的稳妥写法）" },
      { code: "m.erase(k)", desc: "按键删除，返回删除个数" },
      { code: "m.insert({k, v})", desc: "插入（键已存在时不覆盖）" },
      { code: "for (auto& [k, v] : m)", desc: "结构化绑定遍历（C++17）；map 按 key 升序" },
      { code: "std::unordered_map<K,V>", desc: "哈希实现：平均 O(1)，遍历顺序不确定" },
      { code: "std::map<K,V>", desc: "红黑树实现：O(log n)，按 key 有序" }
    ],
    tip: "只查不改请用 find/count/at，不要用 []——[] 会把“查无此键”变成“插入一个默认值”，是 size 变大的隐形凶手。"
  },
  {
    id: "cs-algorithms",
    title: "常用算法速查",
    category: "容器与算法",
    short: "常用算法",
    desc: "#include &lt;algorithm&gt;（accumulate 在 &lt;numeric&gt;）。都作用于迭代器区间 [first, last)。",
    type: "items",
    items: [
      { code: "std::sort(v.begin(), v.end())", desc: "升序排序（不稳定，平均 O(n log n)）" },
      { code: "std::sort(v.begin(), v.end(), std::greater<int>())", desc: "降序排序" },
      { code: "std::sort(v.begin(), v.end(), [](int a, int b){ return a > b; })", desc: "自定义比较（lambda）" },
      { code: "std::find(v.begin(), v.end(), x)", desc: "线性查找，找不到返回 end()" },
      { code: "std::count(v.begin(), v.end(), x)", desc: "统计等于 x 的个数" },
      { code: "std::count_if(v.begin(), v.end(), pred)", desc: "按条件统计" },
      { code: "std::accumulate(v.begin(), v.end(), 0)", desc: "求和（初始值 0；求和浮点容器给 0.0）" },
      { code: "std::max_element(v.begin(), v.end())", desc: "最大元素迭代器，*解引用取值" },
      { code: "std::reverse(v.begin(), v.end())", desc: "原地反转" }
    ],
    tip: "sort 的比较器必须满足“严格弱序”（如 a<b），写成 a<=b 在相等元素上会导致未定义行为。"
  },
  {
    id: "cs-iterator-invalidation",
    title: "迭代器失效规则",
    category: "容器与算法",
    short: "迭代器失效",
    desc: "容器一旦“改了结构”，旧迭代器就可能作废；考试与工程都按最保守的规则处理。",
    type: "table",
    header: ["操作", "vector / string", "deque", "list / set / map（节点容器）"],
    rows: [
      ["尾部插入 push_back 等", "扩容则全部失效（引用也算）；未扩容仅 end() 失效", "迭代器失效，引用仍有效", "全部不受影响"],
      ["任意位置插入 insert", "插入点及其后失效", "全部失效", "其余不受影响"],
      ["删除 erase / pop", "被删元素及其后失效", "被删元素及其后失效（两端删仅该点失效）", "仅被删元素失效"],
      ["resize / reserve / clear", "全部失效", "全部失效", "clear 后仅指向元素的失效，容器本身有效"]
    ],
    tip: "保险法则：只要本次循环里容器可能被修改，就不要复用循环外拿到的迭代器。erase 的标准姿势是 it = c.erase(it)（返回下一个有效位置），千万不要 erase 后继续 ++ 旧迭代器。"
  },
  {
    id: "cs-smart-pointers",
    title: "智能指针速查",
    category: "面向对象",
    short: "智能指针",
    desc: "#include &lt;memory&gt;。C++11 起标准；make_unique 是 C++14。",
    type: "table",
    header: ["写法", "说明", "备注"],
    rows: [
      ["auto p = std::make_unique<T>(args)", "创建 unique_ptr<T>，异常安全", "独占所有权，不能拷贝只能 std::move"],
      ["*p / p->member", "解引用与成员访问", "与裸指针用法一致"],
      ["p.get()", "取出裸指针（不转移所有权）", "禁止用 get() 的结果 delete"],
      ["p.reset(q)", "释放旧资源并接管 q（或 reset() 直接释放）", "p.reset() = 立即释放"],
      ["p.release()", "放弃所有权并交出裸指针", "调用者负责 delete"],
      ["auto s = std::make_shared<T>(args)", "创建 shared_ptr，引用计数 +1", "use_count() 查看计数"],
      ["shared_ptr 拷贝", "计数 +1；析构 -1；归 0 时释放", "最后一个持有者负责释放"],
      ["std::weak_ptr<T> w = s", "不增加计数的观察者", "用 w.lock() 取临时 shared_ptr"],
      ["auto arr = std::make_unique<int[]>(10)", "动态数组特化", "unique_ptr<int[]> 用 [] 访问"]
    ],
    tip: "shared_ptr 循环引用（A 持 B、B 持 A）计数永不归零 → 泄漏；把一方改成 weak_ptr 打破环路。"
  },
  {
    id: "cs-special-members",
    title: "类的特殊成员函数（六大件）",
    category: "面向对象",
    short: "类六大件",
    desc: "“编译器什么时候替你生成”是 Rule of Three/Five 的核心。",
    type: "table",
    header: ["成员函数", "签名示例", "编译器默认生成条件", "说明"],
    rows: [
      ["默认构造", "T()", "未声明任何构造函数时", "否则必须自己写或 =default"],
      ["析构函数", "~T()", "未自行声明析构函数时（写了就不再生成）", "虚析构见第 8 章"],
      ["拷贝构造", "T(const T&)", "未声明拷贝构造/移动操作时", "值传参、值返回时调用"],
      ["拷贝赋值", "T& operator=(const T&)", "同上", "注意自赋值与返回 *this"],
      ["移动构造", "T(T&&)", "未声明拷贝/析构/赋值时（C++11）", "有自定义析构就不生成"],
      ["移动赋值", "T& operator=(T&&)", "同上", "noexcept 很重要"]
    ],
    tip: "Rule of Three：写了析构/拷贝构造/拷贝赋值之一，通常三个都要写（管理资源时）。Rule of Zero：用 vector/string/智能指针成员，六个都不用写。"
  },
  {
    id: "cs-lambda",
    title: "Lambda 语法速查",
    category: "现代C++",
    short: "Lambda",
    desc: "C++11 起。完整形态：[捕获](参数) -> 返回类型 { 函数体 }。",
    type: "code",
    code: `int total = 0, factor = 3;
auto addScaled = [&, factor](int x) -> int {   // 引用捕获其余，按值捕获 factor
    total += x;          // 按引用修改外部 total
    return x * factor;   // factor 是拷贝，默认不可改
};
int r = addScaled(5);    // total = 5, r = 15`,
    notes: [
      "[] 不捕获；[=] 全按值；[&] 全按引用；[x, &y] 逐个指定；[=, &y] 混合",
      "按值捕获的副本默认 const，要修改加 mutable",
      "按引用捕获局部变量后，lambda 若比变量活得久 → 悬空引用（UB）",
      "C++14 起参数可 auto（泛型 lambda）；C++14 初始化捕获 [p = std::move(ptr)]"
    ]
  },
  {
    id: "cpp-version-features",
    title: "C++11/14/17/20 新特性一览",
    category: "现代C++",
    short: "新特性",
    desc: "本课程出现过的现代特性按版本归档。",
    type: "table",
    header: ["版本", "特性", "一句话"],
    rows: [
      ["C++11", "auto / decltype", "按初始值推导类型"],
      ["C++11", "列表初始化 {}", "统一初始化 + 禁止窄化"],
      ["C++11", "constexpr", "编译期常量"],
      ["C++11", "范围 for", "for (auto x : v)"],
      ["C++11", "Lambda", "匿名函数对象"],
      ["C++11", "nullptr", "替代 NULL 的空指针常量"],
      ["C++11", "智能指针", "unique_ptr / shared_ptr / weak_ptr"],
      ["C++11", "移动语义 / 右值引用", "T(T&&) 偷资源而非拷贝"],
      ["C++11", "override / final", "显式标记虚函数重写"],
      ["C++11", "noexcept / static_assert", "无异常承诺 / 编译期断言"],
      ["C++11", "long long / unordered_map", "64 位整型 / 哈希容器"],
      ["C++14", "make_unique", "unique_ptr 工厂函数"],
      ["C++14", "泛型 Lambda", "参数 auto"],
      ["C++14", "初始化捕获", "[p = std::move(ptr)]"],
      ["C++17", "结构化绑定", "auto [k, v] : map"],
      ["C++17", "if / switch 带初始化", "if (auto p = f(); p)"],
      ["C++17", "std::optional", "“可能没有值”的返回类型"],
      ["C++17", "std::string_view", "字符串只读视图，不复制"],
      ["C++17", "CTAD", "std::pair p(1, 2.0); 自动推模板参数"],
      ["C++17", "移除 auto_ptr / 动态异常规范", "清理过时设施"],
      ["C++20", "concepts", "模板参数约束：requires"],
      ["C++20", "ranges", "管道式算法：v | filter | transform"],
      ["C++20", "三路比较 <=>", "一次定义全部比较"],
      ["C++20", "指定初始化器", "Point{.x = 1, .y = 2}"]
    ],
    tip: "编译时用 g++ -std=c++17（或 c++20）开启对应标准；课程示例默认按 C++17 编译均可通过。"
  },
  {
    id: "cs-headers",
    title: "常见头文件速查",
    category: "输入输出",
    short: "头文件",
    desc: "“用什么包含什么”，不依赖间接引入。",
    type: "items",
    items: [
      { code: "#include <iostream>", desc: "cin / cout / cerr / endl" },
      { code: "#include <iomanip>", desc: "setw / setprecision / setfill" },
      { code: "#include <string>", desc: "std::string、stoi、to_string" },
      { code: "#include <sstream>", desc: "stringstream（字符串拆分、拼接）" },
      { code: "#include <vector>", desc: "std::vector" },
      { code: "#include <map> / <unordered_map>", desc: "键值容器" },
      { code: "#include <set>", desc: "集合" },
      { code: "#include <algorithm>", desc: "sort / find / count / max_element" },
      { code: "#include <numeric>", desc: "accumulate / iota" },
      { code: "#include <memory>", desc: "unique_ptr / shared_ptr / make_unique" },
      { code: "#include <cmath>", desc: "sqrt / pow / sin / fabs / NAN" },
      { code: "#include <cstdint>", desc: "int32_t / int64_t 固定宽度整型" },
      { code: "#include <cctype>", desc: "isalpha / isdigit / toupper / tolower" },
      { code: "#include <cstring>", desc: "strlen / strcpy / strcmp 等 C 字符串函数" },
      { code: "#include <cassert> / <stdexcept>", desc: "assert / 标准异常（out_of_range 等）" },
      { code: "#include <fstream>", desc: "ifstream / ofstream 文件流" }
    ],
    tip: "C 标准库头文件在 C++ 里的写法是 <cstdio> <cstdlib> <cstring>（比 stdio.h 多个 c 前缀，名字进 std）。"
  }
];
