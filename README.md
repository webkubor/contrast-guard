# contrast-guard

把配色对比度做成 CI 护栏。**不达标时直接告诉你该改成多少**，而不是只丢一个红叉。

支持 OKLCH，零依赖，12.6KB。

```
✗ 1 组配色低于门槛（共检查 48 组）

  theme-src/root-petal.css  链接/主色
    #e63f9f on #fef6f9   3.55:1  门槛 4.5
    → 改成 L=58%（#d0268c，4.55:1，压暗 6 点）
      oklch(64% 0.22 350)
```

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

## 运行时

面向 **Node ≥ 18**。纯 ESM、零依赖，因此 **Bun 也能直接跑**（实测 bun 1.3 通过全部测试）。

之所以以 Node 为目标而不是 Bun：这个包是被别的项目依赖的 CI 护栏，
不该要求使用方切换运行时；GitHub Actions 默认带 Node，用 Bun 得多一步 `setup-bun`。

## License

[MIT](./LICENSE)
