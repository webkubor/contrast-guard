# Single-Ruler Principle — CSS Token + Tailwind 架构铁律

> 来源：云砚存绘项目样式审计复盘
> 核心问题：样式混乱的根因不是"没对齐某个设计系统"，而是**两套刻度打架没收口**。

## 根因诊断

样式审计查出圆角 `12/13/14/16/18/20` 六选一、`shadow-xs` vs 自定义阴影、`bg-blue-500` vs `--brand-base` 满天飞。

**根因：** 项目里同时用了两把尺子：
- 尺子A：Tailwind 内置刻度（`rounded-2xl=16px`、`shadow-sm`、`bg-blue-500`）
- 尺子B：自定义 CSS Token（`--radius-lg=18px`、`--mg-*`）

写代码的人随手抓哪把都行，两把刻度还对不上（16≠18），结果就是全局不一致。

## 正解：单尺原则

**项目内只允许一把尺子——自定义 CSS 变量。Tailwind 仅作为原子类语法糖，所有刻度必须映射到 Token。**

### 实现方式

1. **`tokens.css`** 定义所有视觉变量（唯一真源）：
```css
:root {
  --yy-radius-sm: 6px;
  --yy-radius-md: 12px;
  --yy-radius-lg: 18px;
  --yy-shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --yy-accent-red: #C1272D;
}
```

2. **`tailwind.config.js`** 强制映射（覆盖默认值，不 extend）：
```js
module.exports = {
  theme: {
    extend: {
      borderRadius: {
        'yy-sm': 'var(--yy-radius-sm)',
        'yy-md': 'var(--yy-radius-md)',
        'yy-lg': 'var(--yy-radius-lg)',
      },
      colors: {
        'yy-red': 'var(--yy-accent-red)',
      },
    },
  },
};
```

3. **组件中只用映射后的类名**：
```html
<!-- ✅ 正确：走 Token -->
<div class="rounded-yy-lg bg-yy-red shadow-yy-sm">

<!-- ❌ 错误：Tailwind 内置刻度 -->
<div class="rounded-2xl bg-red-500 shadow-sm">
```

## 明确禁令

| 禁令 | 原因 |
|------|------|
| ❌ 不对齐 Material 3 (M3) | M3 是 Google 完整设计语言体系（tonal 调色、三级 token、state layer...）。对齐它 = 重写 + 强行套安卓味，与"反 AI 味、克制高级感"直接冲突 |
| ❌ 禁止 `bg-blue-500`/`rounded-xl`/`shadow-sm` 等 Tailwind 内置值 | 双尺打架根因 |
| ❌ 禁止内联 `style="..."` | 脱离 Token 体系 |
| ❌ 禁止"自定义 + Tailwind 混用却不统一刻度" | 问题不在于混用，在于没收口 |

## Lint 拦截

在 CI/ESLint 中配置规则，拦截非项目前缀的 Tailwind 类：
- 允许：`yy-*`、`w-*`、`h-*`、`flex`、`grid`、`p-*`、`m-*` 等布局类
- 拦截：`bg-blue-*`、`bg-red-*`（非 `yy-` 前缀的颜色）、`rounded-[0-9]xl`（非 `yy-` 前缀的圆角）、`shadow-[sm|md|lg]`（非 `yy-` 前缀的阴影）

## 适用场景

任何使用 **Tailwind + 自定义设计系统** 的项目。当项目有自己的视觉方向（非套用现成 UI 库）时，必须执行单尺原则。
