# contrast-guard

<!-- bloom-series-nav -->

<table align="center">
<tr>
<td align="center" width="33%"><a href="https://github.com/webkubor/typora-Bloom-theme">🌸 Bloom for Typora</a><br/><sub>24 套主题</sub></td>
<td align="center" width="33%"><a href="https://github.com/webkubor/dsh-bloom-theme">🌊 Bloom for DSH</a><br/><sub>4 套配色</sub></td>
<td align="center" width="33%"><b>🛡️ contrast-guard</b><br/><sub>配色护栏 · 当前</sub></td>
</tr>
</table>

<p align="center">
  <sub>同一套莫兰迪设计语言：两个宿主的主题，加一个守住它们配色的工具。<br/>
  <i>One Morandi design language — two themes, and the tool that keeps their colors honest.</i></sub>
</p>


把配色对比度做成 CI 护栏。**不达标时直接告诉你该改成多少**，而不是只丢一个红叉。

支持 OKLCH，零依赖，12.6KB。

```
✗ 1 组配色低于门槛（共检查 48 组）

  theme-src/root-petal.css  链接/主色
    #e63f9f on #fef6f9   3.55:1  门槛 4.5
    → 改成 L=58%（#d0268c，4.55:1，压暗 6 点）
      oklch(64% 0.22 350)
```

另有 [`measure`](#measure渲染后视觉计量) 子命令做**渲染后视觉计量**——`check` 查
色值对不对，`measure` 查这一页用了几种字号、灰阶拉开几层、多少元素真的有动效。
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
| **contrast-guard** | **12.6KB** | **0** | ✅ | ✅ | ✅ |
| wcag-contrast | 24KB | 1 | ❌ | ❌ | ❌ |
| color-contrast-checker | 36KB | 0 | ❌ | ❌ | ❌ |
| a11y-color-contrast | 71KB | 0 | ❌ | ❌ | ❌ |
| chroma-js | 388KB | 0 | ✅ | ❌ | ❌ |
| culori | 1082KB | 0 | ✅ | ❌ | ❌ |

其它工具是「给两个颜色算比值」的库；真实场景是「一堆色板文件 + 一组规则 + 在 CI 里跑」。

**为什么支持 OKLCH 重要**：现代主题普遍用 OKLCH 定义色板（感知均匀、明暗切换不跳变），
但多数对比度工具只认 hex/rgb —— 于是用 OKLCH 写的色板正好落在检查的盲区里。

## 安装

```bash
npm i -D contrast-guard
```

## 使用

```bash
npx contrast-guard --init     # 生成配置模板
npx contrast-guard            # 检查，不达标退出码 1
npx contrast-guard --json     # 机器可读输出
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
import { check, solveLightness, contrast, parseColor } from 'contrast-guard'

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

## measure：渲染后视觉计量

`check` 查**对不对**（这个色值达不达标），`measure` 查**多少**（这一页实际用了
几种字号、灰阶拉开几层、多少元素真的有动效）。

需要它是因为：**丑的每一处单看往往都"对"**。每个色值都是合法 token、每个圆角都在
白名单里，但一屏 9 种字号、灰阶只拉开 2 层、间距 11 种——每条都过检，合起来就是丑。
二值门禁结构上抓不到这个。

```bash
contrast-guard measure https://linear.app --save linear   # 量参照站，存基线
contrast-guard measure http://localhost:5173 --vs linear  # 量自己的页面，逐项对比
contrast-guard measure --baselines                        # 列出已存基线
```

```
判据
  ⚠  动效几乎不存在：仅 12/6438 个元素带 transition（0.19%）。定义了 motion token ≠ 用上了
  ✓  字号分布集中：10 种，前 4 种覆盖 96%
  ⚠  背景灰阶 60 层，大量一次性色值绕过了 token（参照站量级约 20）

对比基线 linear
                         本次       linear
  动效覆盖率             0.2%         9.0%  ← 差距显著
  背景灰阶层               60           22
```

**阈值由实测校准，不是拍脑袋。** 校准时推翻了两个直觉判据：

- **「字号种类越少越好」是错的**——Linear 实测 14 种，比很多平庸站点还多。
  稳健的判据是**分布集中度**（前 4 种覆盖率）。凭空定「≤5 种」，第一天就会把标杆站判成不及格。
- **圆角/阴影/间距的种类数没有判别力**——同一标杆站圆角 20 种、阴影 14 种同样高。
  这类只作横向参考，不报警。

所以用法上有个硬要求：**先量参照站存成基线，再量自己的页面**。没有参照物就没有判据，
「丑」「高级一点」这类形容词对工具和 AI 都是零信息量，换成可观测的参照站才有意义。

基线里还可以补一段**风格画像**（`profile` 字段：typography / color / layout / motion /
signatureMoves），记录计量抓不到、只能看图得出的东西。数字回答「差多少」，
画像回答「差在哪种气质」——尤其是 signatureMoves，那是风格辨识度的来源。
重新计量不会覆盖已填的画像。

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

## License

[MIT](./LICENSE)
