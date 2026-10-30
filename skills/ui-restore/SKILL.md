---
name: ui-restore
version: 1.0.0
description: "从 Figma、PRD 原图、验收截图或现有页面还原 UI、定位视觉缺陷。固定参考和渲染条件，截图与 computed style 双证据，追踪 token/选择器根因，最小修复并验证影响面。触发：还原设计稿、1:1、像素对齐、原图对比、UI 样式修复。"
license: MIT
---

# UI 还原与视觉缺陷修复

唯一入口是 [前端 Flow](https://github.com/webkubor/frontend-contrast-guard/blob/main/../)，判定遵循[评审标准](https://github.com/webkubor/frontend-contrast-guard/blob/main/../)。本 skill 是通用工程方法，不为项目指定固定视觉风格。

## 1. 锁定参考及边界

记录参考文件/URL、版本、目标区域、预期状态、语言、视口、DPR、缩放和字体。PRD 黄框表示待检查区域，不等于期望样式；先区分「缺陷截图」「正确对照图」「标注稿」。不能把错误截图本身当成要复刻的目标。

- Figma 可用时获取节点结构、尺寸、资源和渲染图，再映射项目组件；禁止只拿生成代码直接覆盖项目。
- 只有截图时明确未知：字体、透明背景、裁切、滚动、设备缩放和交互状态。裁剪图不能推断整个页面尺寸。
- 有线上参考时检查交互和展开态；整站逆向采用 `clone-website`。
- 数据内容不同导致的行高/换行先用相同输入复现，不伪造数据或成功态。
- 报单新增了对照图或修订标题时重新读取原始材料；摘要只是导航。

用一句话写可观察目标，例如「英文排序选项单行；其余选项与选中行为不变」。未授权的风格偏好另列，不扩成全面换肤。

## 2. 取得改前证据

运行目标版本，固定参考条件，截图并实际打开。至少保留目标区域截图，必要时全页截图说明上下文。检查实际 URL、页面语言、资源加载、字体、主题根属性及页面状态，防止比较错页面或错误版本。

针对区域测量：

```js
const el = document.querySelector(selector);
if (!el) throw new Error(`Missing target: ${selector}`);
const r = el.getBoundingClientRect();
const s = getComputedStyle(el);
({ rect: { x:r.x, y:r.y, width:r.width, height:r.height },
   border:s.border, background:s.backgroundColor, color:s.color,
   font:s.font, lineHeight:s.lineHeight, whiteSpace:s.whiteSpace,
   display:s.display, gap:s.gap, overflow:s.overflow,
   clientWidth:el.clientWidth, scrollWidth:el.scrollWidth });
```

检查父容器和相邻对齐锚点。截图提供可见事实，DOM 提供数值；任何一方不能单独证明视觉通过。图片叠加/差分只在画布、裁切、数据、字体和动画时刻可比时使用，标记抗锯齿/动态内容的不确定性。

## 3. 从结果追到原因

按「元素→组件变体→命中规则→语义 token→基础值/主题」追踪，记录文件与规则位置。

常见分支：

- 规则是否真正加载、选择器是否命中（`data-theme` 与另一套主题属性不一致）？
- CSS 变量是否在该元素作用域取到另一主题值，有无继承覆盖或缺失 fallback？
- 组件迁移是否只搬 JSX 未搬基础 CSS？
- flex/grid 的收缩、min-width、绝对定位、overflow 是否使布局挤压/裁切？
- 文字是否受字体、字重、混排、空格、nowrap 和本地化长度影响？
- 图表是否高度封顶但父容器被相邻列撑高？

缺陷不存在时记录版本、原始截图条件及反证，不为「必须改代码」编造原因。参考含缺失功能时核对产品范围，不能通过补一个死链接冒充还原。

## 4. 最小修复与独立复查

优先修共享来源或组件变体；避免每个页面加覆盖。全局属性/token 改动先列出所有命中规则及使用页面。复查者只依据参考、运行页面与修改范围检查，不用总分掩盖未关闭问题。

每轮记录：差异 ID、事实、根因、修改、同条件复测、影响面。未改善时修订假设；连续两轮无改善即重新取证，不靠重复换 agent 或堆 CSS。停止条件是已声明差异关闭且保护条件满足，没有任意的保真及格分。

## 5. 验证影响面与交付

- 同输入/主题/视口/状态对比改前改后，打开截图逐张检查。
- 核对支持的窄屏、桌面、实际断点两侧、长文案与展开态。
- 共享选择器/token：逐受影响组件和页面复测；对预计不变的页面比较 computed style/截图，记录实际差异。
- 运行与改动匹配的项目门禁；部署按项目规则，在测试环境通过后再进入生产，记录实际版本。
- 登录/数据无法呈现的分支写「未验证」；本地组件量测和产物检查可以补证，但不能写成线上实测。

输出使用「目标→改前证据→根因→改动→改后证据→影响面→残余缺口」。证据文件附环境、版本和条件；不提供无依据的 1:1 承诺。

## 来源与本地验证

方法吸收了 [MadAppGang ui-implementer](https://github.com/MadAppGang/claude-code/tree/main/plugins/frontend/skills/ui-implementer) 的实现/独立审查/迭代闭环，以及其 designer 对 computed style 与命中规则的要求。本文件为独立编写，不依赖其插件子 agent 或特定 MCP。

2026-10-30 的四例本地盲测中，协议组与自由排查组均定位出已知 CSS 根因；这说明方法可用，不证明协议优于对照，也不证明像素一致。保留有效的参考取证、样式追踪与迭代；补上影响面验证，舍弃无量表的 X/60 分数及机械十轮循环。
