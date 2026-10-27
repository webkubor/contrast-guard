<h1 align="center">🛡️ frontend-contrast-guard</h1>

<p align="center">
  <strong>配色对比度护栏、CSS 计量与 UI 评审记录。</strong><br>
  静态查色彩配对 · 采样 CSS 分布 · 核验声明范围内的评审证据<br>
  <i>Contrast checks, CSS measurements, and recorded UI review evidence.</i>
</p>

<p align="center">
  <a href="https://github.com/webkubor/frontend-contrast-guard/blob/main/LICENSE"><img src="https://img.shields.io/github/license/webkubor/frontend-contrast-guard?style=for-the-badge&color=gold" alt="License"></a>
  <a href="https://github.com/webkubor/frontend-contrast-guard/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/webkubor/frontend-contrast-guard/ci.yml?style=for-the-badge&color=4c9a6b" alt="CI"></a>
  <a href="https://www.npmjs.com/package/frontend-contrast-guard"><img src="https://img.shields.io/npm/v/frontend-contrast-guard?style=for-the-badge&color=cb3837" alt="npm"></a>
  <a href="https://www.npmjs.com/package/frontend-contrast-guard"><img src="https://img.shields.io/npm/dm/frontend-contrast-guard?style=for-the-badge&color=cb3837" alt="npm 下载"></a>
  <a href="https://github.com/webkubor/frontend-contrast-guard"><img src="https://img.shields.io/github/stars/webkubor/frontend-contrast-guard?style=for-the-badge&color=coral" alt="Stars"></a>
  <a href="https://github.com/webkubor/frontend-contrast-guard"><img src="https://img.shields.io/badge/JavaScript-333333?style=for-the-badge" alt="技术栈"></a>
</p>

<p align="center">
  <a href="README.en.md">English</a> · <a href="CHANGELOG.md">更新日志</a> · <a href="docs/frontend-review-standard.md">前端视觉与评审规范 (SSOT)</a>
</p>

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/webkubor/free-imgbed@main/frontend-contrast-guard/hero-terminal.svg" alt="frontend-contrast-guard terminal preview" width="800" style="border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,0.5);">
</p>

---

## 🏆 为什么用它（Why This）

| 任务 | 命令 / 规范 | 结果与边界 |
|---|---|---|
| 配色不达标时给出修复值 | `check` | 保持色相彩度，求目标明度；检查配置中声明的配色对 |
| 了解页面实际使用的样式 | `measure` | 浏览器采样 computed style 分布，默认输出中性观察 |
| 核验 UI 评审记录 | `review` | 检查设计契约、声明范围、七维评估、发现与复测证据的完整性 |
| 组织响应式与交互评审 | [评审标准](docs/frontend-review-standard.md) | 人或 Agent 执行视口、主题与状态协议；CLI 不自动完成该矩阵采集 |

---

<!-- bloom-series-nav -->

<table align="center">
<tr>
<td align="center" width="33%"><a href="https://github.com/webkubor/typora-Bloom-theme">🌸 Bloom for Typora</a><br/><sub>24 套主题</sub></td>
<td align="center" width="33%"><a href="https://github.com/webkubor/dsh-bloom-theme">🌊 Bloom for DSH</a><br/><sub>4 套配色</sub></td>
<td align="center" width="33%"><b>🛡️ frontend-contrast-guard</b><br/><sub>视觉与色彩全栈护栏</sub></td>
</tr>
</table>

<p align="center">
  <sub>同一套莫兰迪设计语言：两个宿主的主题，加一个守住它们配色的工具。<br/>
  <i>One Morandi design language — two themes, and the tool that keeps their colors honest.</i></sub>
</p>


把配色对比度做成 CI 护栏。**不达标时直接告诉你该改成多少**，而不是只丢一个红叉。

支持 OKLCH，**零依赖**，检查核心 11.6KB。

```
✗ 1 组配色低于门槛（共检查 48 组）

  theme-src/root-petal.css  链接/主色
    #e63f9f on #fef6f9   3.55:1  门槛 4.5
    → 改成 L=58%（#d0268c，4.55:1，压暗 6 点）
      oklch(64% 0.22 350)
```

另有 [`measure`](#measure渲染后视觉计量) 子命令做**渲染后视觉计量**——`check` 查
色值对不对，`measure` 查这一页用了几种字号、灰阶拉开几层、多少元素声明了 transition 时长。
它需要浏览器，但驱动是运行时探测的，**`check` 仍然零依赖、CI 里裸跑**。

## 为什么造这个

现有的对比度工具都只回答「达标了吗」，而真正费时的是下一步——**「那我改成多少？」**

一句「3.02:1，不达标」之后，人还得自己试色：调暗一点？调多少？色相会不会偏？改完还要再算一遍。
一套主题几个色值还能忍，24 套主题就是几百次手工试错。

`contrast-guard` 直接把这一步做完：保持色相与彩度不变，只解出刚好达标的明度，
输出「L=58%，压暗 6 点」这种可以直接抄进代码的结论。

这个工具来自一次真实事故：[typora-Bloom-theme](https://github.com/webkubor/typora-Bloom-theme)
（90★）的 24 套主题里，有 6 套的链接色低于 WCAG AA 且长期无人发现。
排查后是四层缺口叠加——校验清单漏了 `accent` 这一项、校验从没在 CI 里跑过、
新增 workflow 又被 `.gitignore` 静默吞掉。**修完那次，就有了这个包。**

## 对比

| | 体积 | 依赖 | OKLCH | 扫色板文件 | 给建议值 |
|---|---|---|---|---|---|
| **contrast-guard** | **11.6KB** | **0** | ✅ | ✅ | ✅ |
| wcag-contrast | 24KB | 1 | ❌ | ❌ | ❌ |
| color-contrast-checker | 36KB | 0 | ❌ | ❌ | ❌ |
| a11y-color-contrast | 71KB | 0 | ❌ | ❌ | ❌ |
| chroma-js | 388KB | 0 | ✅ | ❌ | ❌ |
| culori | 1082KB | 0 | ✅ | ❌ | ❌ |

> 体积按 `check` 路径的源码算（与表中同类库的功能维度对齐）。`measure` 是另一条
> 独立路径，只在你调用它时才加载，不影响 `check` 的体积与零依赖。

其它工具是「给两个颜色算比值」的库；真实场景是「一堆色板文件 + 一组规则 + 在 CI 里跑」。

**为什么支持 OKLCH 重要**：现代主题普遍用 OKLCH 定义色板（感知均匀、明暗切换不跳变），
但多数对比度工具只认 hex/rgb —— 于是用 OKLCH 写的色板正好落在检查的盲区里。

## 安装

```bash
npm i -D frontend-contrast-guard
```

包名为 `frontend-contrast-guard`；`frontend-contrast-guard` 与 `contrast-guard` 两个命令指向同一 CLI，以下使用短别名。

## 使用

```bash
npx contrast-guard --init     # 生成配置模板
npx contrast-guard            # 检查，不达标退出码 1
npx contrast-guard --json     # 机器可读输出
contrast-guard review --init ui-review.json  # 创建待填写的评审模板
contrast-guard review ui-review.json --json  # 核验已记录的证据
```

`contrast.config.json`：

```json
{
  "files": ["theme-src/root-*.css", "src/tokens.js"],
  "pairs": [
    { "fg": "text",      "bg": "bg", "min": 7,   "label": "正文" },
    { "fg": "text-semi", "bg": "bg", "min": 4.5, "label": "次要文字" },
    { "fg": "accent",    "bg": "bg", "min": 4.5, "label": "链接/主色" }
  ]
}
```

**`pairs` 要把每一处「会被读的前景色」都列上。** 上面那次事故里，
文字类的三项全部宽裕达标（正文 12.9~16.1），唯独漏了 `accent` ——
而它是正文里唯一会被点击的东西。缺口总是落在清单没覆盖的那一格。

### 接进 CI

```yaml
- run: npx contrast-guard
```

### 编程调用

```js
import { check, solveLightness, contrast, parseColor } from 'frontend-contrast-guard'

const { results, failed } = check({
  files: ['theme-src/root-petal.css'],
  pairs: [{ fg: 'accent', bg: 'bg', min: 4.5 }],
})

// 也可以只用反推
const bg = parseColor('oklch(98% 0.01 350)')
solveLightness('oklch(64% 0.22 350)', bg, 4.5)
// → { L: 58, ratio: 4.55, hex: '#d0268c', delta: -6 }
```

## 支持的写法

**色值**：`oklch()` · `#rgb` · `#rrggbb` · `rgb()` · `rgba()`（带 alpha 时按背景合成）

**来源**：CSS 自定义属性；JS/JSON 里的内联色值对象。
两者都支持是因为真实项目的色值常常分散在多处——上面那个主题就是 16 套写在 CSS、
另外 8 套内联在 JS 里，人改色值面对两个入口，而检查只看其中一个。

`var(--x)` 引用会自动解引用（最多 5 层）。

## review：记录产品契约与评审闭环

```bash
contrast-guard review --init ui-review.json
contrast-guard review ui-review.json --json
```

初始化成功退出 `0`，生成的空模板仍待补充，评估为 `HOLD`，且初始化不会覆盖现有文件。评估退出码为 **`0`：PASS（记录完整且满足门禁）；`1`：HOLD；`2`：输入错误**（包括文件读取、JSON 或结构错误）。

先填写显式设计契约：产品、用户、任务、主操作、首读对象、密度、视觉辨识点与约束。再声明 `scope.revision` 目标版本及 `scope` 中的路由、主题、宽度和状态，并解释选取理由。默认宽度为 `390 / 768 / 1280 / 1600`，主题为 light/dark，状态为 default；这是四视口×主题×状态的**评审协议**，不是 CLI 自动捕获的响应式审计。按产品补充临界宽度、加载、空、错误与交互状态；证据另记实际宽高。

七个评估维度分别是：

| JSON 维度 | 评审重点 |
|---|---|
| `product-fit` | 产品任务、内容模式与密度是否相符 |
| `hierarchy` | 首读焦点与信息优先级 |
| `typography` | 字体角色、可读性与层级 |
| `spacing-layout` | 对齐、邻近、间距、构图与响应式布局 |
| `color-tokens` | 色彩语义、配色可读性与 token 来源 |
| `components-states` | 组件一致性、交互反馈与状态覆盖 |
| `distinctiveness` | 服务任务的产品特色、图像与诚实内容 |

截图由评审者另行采集并逐张打开检查，再填写证据的截图引用、版本、路由、主题、视口、状态、采集时间、检查者、观察、页面 `scrollWidth` 和 `reviewed` 状态。每个维度要有关联证据、观察、理由及通过决定。发现要写清观察、影响、假设、规则 ID、**具体 token/组件改动与验证方法**，避免只写“更精致”。

已解决的发现需要可比的 before/after 迭代：路由、主题、状态、宽高相同，版本不同，两份证据均已记录为 reviewed，结果为 improved 且保护条件通过。还应固定数据与捕获条件，并实际复验交互、可读性、键盘与减弱动效行为。开放的 critical/major 问题、未完成维度、缺失范围证据、记录的全页溢出或无有效复测的解决声明会使结果 HOLD；minor 可保留为明确的后续事项。

例如（假设性方案）：390px 深色主题的长标题被按钮挤压时，修改 `ToolRow` 的标题列为 `minmax(0, 1fr)`，让操作区换行；用相同数据、状态与宽高的不同版本截图对照，检查标题及操作完整可达、全页无横向溢出，并复验键盘和浅色主题。完成真实验证后再记录结果，不把方案写成已证实的改善。

`review` **读取 JSON 证据，不自行浏览页面、打开或分析截图，也不验证截图文件是否存在或确实被检查**。PASS 仅表示证据完整性与已记录的评审决定，不是自动美感评分，也不是截图已被实际检查的证明。字段和真实试跑见 [review CLI](docs/review-cli.md)；完整执行方式见 [前端 UI 评审标准](docs/frontend-review-standard.md)；规则的版本、正反例、`proposed → trial → stable → deprecated` 生命周期、试验预算与回滚见 [规则演进](docs/rule-evolution.md)。

## measure：渲染后视觉计量

`measure` 采样当前页面的 computed style，统计字号分布、字体族、前景/背景亮度、transition 时长等；动效覆盖指声明了非零 transition 时长的采样元素比例，不证明动画实际播放或交互反馈有效。

```bash
contrast-guard measure https://linear.app --save linear   # 保存参照采样
contrast-guard measure http://localhost:5173 --vs linear  # 对比分布与差值
contrast-guard measure --baselines                        # 列出基线
```

`src/measure/verdict.js` 默认把有效采样标为 `observation`，缺少有效采样标为 `unknown`；只有调用方显式传入阈值时才产生相应配置提醒。默认结果是中性观察，不是审美失败。字号集中度、灰阶层数、字体数量或动效覆盖率没有跨产品通用及格线；更多动效不必然更好，零过渡也可以符合产品与 reduced-motion 需求。

基线差异用于提出待调查问题。与参照站接近不证明设计质量，不同也不等于失败；选择参照时应解释任务、内容与采样条件的可比性。computed style 分布不含变量来源追踪，无法据此证明硬编码或 token 漂移，需要核对定义、引用与组件语义映射。

`measure` 不执行完整响应式或交互审计，也不计算真实渲染后的前景/背景配对对比度；它不替代对透明叠加、背景图、状态、焦点、键盘或读屏的验证。`check` 校验配置配色对；真实界面仍按评审协议采集和检查证据。

基线可手工补充 `profile`（typography / color / layout / motion / signatureMoves），记录实际看图后的观察；重新计量会保留已有画像。它仍是评审者填写的记录。

### 浏览器驱动（零依赖边界）

`measure` 需要一个浏览器，但**驱动是运行时探测的，不在 dependencies 里**：

| 驱动 | 说明 |
|---|---|
| [ego-browser](https://github.com/ego-browser) | 优先。复用已登录状态，能量需要登录才看得到的页面 |
| playwright | `npm i -D playwright && npx playwright install chromium` |

两个都没装时 `measure` 会明确报错并给出安装指引，**`check` 不受任何影响**——
它完全不加载这条路径的代码，仍然零依赖、CI 里裸跑。

## 运行时

面向 **Node ≥ 18**。纯 ESM，`check` 路径**零依赖**，因此 **Bun 也能直接跑**
（实测 bun 1.3 通过全部测试）。`measure` 额外需要一个浏览器驱动，见上。

之所以以 Node 为目标而不是 Bun：这个包是被别的项目依赖的 CI 护栏，
不该要求使用方切换运行时；GitHub Actions 默认带 Node，用 Bun 得多一步 `setup-bun`。

## 配套：同一条前端质量链路

和 [**vite-plugin-agent-eyes**](https://github.com/webkubor/vite-plugin-agent-eyes) 配合时，各工具提供不同证据：

| 时机 | 工具 | 作用 |
|---|---|---|
| 写代码当下 | agent-eyes `agentSizeWatch` | 提醒文件规模 |
| `git commit` 前 | agent-eyes `agentGuard` 的 `cssVars` | 检查未声明的 CSS 变量引用 |
| CI | **contrast-guard `check`** | 检查声明的配色对并给出修复值 |
| 页面运行时 | **contrast-guard `measure`** | 提供 computed style 采样分布与基线差值 |
| UI 评审 | **contrast-guard `review`** | 核验手工记录的契约、截图证据、发现与可比复测 |
| 排障与采证 | agent-eyes 运行时日志 / 截图 | 提供运行时错误、登录态与 API 失败线索 |

统计、截图与任务验证互相补充；截图仍需实际打开检查，局部自动检查通过不外推为完整 UI 或无障碍验收。

## License

[MIT](./LICENSE)
