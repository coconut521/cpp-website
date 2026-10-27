/* ============================================================
 * sorting-data.js —— 排序算法专题的搜索条目（供首页全局搜索）
 * 页面本体在 sorting.html；id 对应页内锚点（示例卡片 / 对比表）。
 * ============================================================ */
window.SORTING_DATA = [
  { id: "sort-ex-01", title: "冒泡排序", keywords: ["bubble", "冒泡", "交换", "相邻", "沉底", "swapped"], desc: "相邻两两比较交换，最大值逐轮沉底；稳定、原地、最好 O(n)" },
  { id: "sort-ex-02", title: "选择排序", keywords: ["selection", "选择", "最小值", "minIdx", "不稳定"], desc: "每轮选最小放前面；交换次数最少，但不稳定" },
  { id: "sort-ex-03", title: "插入排序", keywords: ["insertion", "插入", "扑克", "基本有序", "key"], desc: "像理扑克牌，前缀有序；基本有序时 O(n)，稳定" },
  { id: "sort-ex-04", title: "希尔排序", keywords: ["shell", "希尔", "gap", "增量", "分组"], desc: "分组插入排序，gap 逐轮减半；不稳定、原地" },
  { id: "sort-ex-05", title: "快速排序", keywords: ["quick", "快排", "partition", "基准", "pivot", "分治", "递归"], desc: "分治 + 划分，平均 O(n log n)；最坏 O(n²)，不稳定" },
  { id: "sort-ex-06", title: "归并排序", keywords: ["merge", "归并", "合并", "分治", "稳定", "temp"], desc: "分治 + 合并有序段；稳定、最坏 O(n log n)，需 O(n) 辅助空间" },
  { id: "sort-ex-07", title: "堆排序", keywords: ["heap", "堆排", "大顶堆", "siftDown", "堆顶"], desc: "建大顶堆后逐个取顶；最坏也是 O(n log n)，原地、不稳定" },
  { id: "sort-compare", title: "排序算法对比总表", keywords: ["复杂度", "稳定性", "对比", "时间复杂度", "空间复杂度", "选型"], desc: "7 种排序的最好/平均/最坏、空间、稳定性一览与选型建议" }
];
