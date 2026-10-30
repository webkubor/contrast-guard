---
name: award-creative-ui
version: 0.1.0
description: "Awwwards / Webby / FWA 获奖级创意 UI 研发手艺与门禁标准——长板惊艳、短板为零。约束创意前端研发全流程：任务可用性检查（无障碍键盘焦点环、移动端手势等价、减弱动效保护）、微交互实体触觉一致性（Hover/Focus/:active 物理下压三态闭环）、以及「快照-审计-打磨-收敛」自检循环机制。触发条件: 研发创意官网、数字展厅、高定个人主站、重度动效/着色器前端，或用户要求达到顶级国际设计奖品质时触发。触发词: Awwwards、FWA、Webby、获奖品质、顶级UI、创意前端、高定设计、微交互实体感、触觉反馈、动效门禁、短板一票否决。"
license: MIT
author: cortexos
category: software-development
platforms: [macos, linux]
metadata:
  openclaw:
    tags: [frontend, ui, creative, awwwards, motion, accessibility, design-system]
    requires:
      env: []
      bins: []
---

通用前端研发唯一入口：[Frontend Flow](https://github.com/webkubor/frontend-contrast-guard/blob/main/../)。项目品牌、组件库、域名和发布规则从项目读取。


# Awwwards / Webby / FWA 获奖级创意 UI 研发规范

> **核心哲学**：顶级数字作品的本质是**「长板惊艳，短板为零」**。
> 单纯堆砌 WebGL、49 帧雪碧图、物理粒子属于“能力杂耍”；若丢失可用性、触控手势或键盘导航，会削弱体验；奖项规则须按当届官方标准核实。
> 本 Skill 将国际获奖评审标准转化为工程化研发约束与微交互执行手艺。

---

## 一、 评审权重与核心模型 (The Evaluation Matrix)

以下历史权重只展示多维评审思路，不代表当届官方规则，也不用于全局评分或放行：

```
                    ┌──────────────────────────────┐
                    │   Awwwards / Webby / FWA     │
                    │        品质标杆体系          │
                    └──────────────┬───────────────┘
                                   │
      ┌──────────────┬─────────────┴────────────┬──────────────┐
      ▼              ▼                          ▼              ▼
Design (40%)    Usability (30%)            Creativity (20%) Content (10%)
视觉秩序与美学   无障碍与直觉交互            独特性与数字叙事 价值交付与记忆点
```

---

## 二、 短板一票否决门禁 (Hard Disqualification Gates)

按项目契约与适用标准判断问题严重度；阻断核心任务的问题不得被视觉分数掩盖：

### 1. 叙事聚焦（Content & Storytelling）
- 用快速首读测试检查陌生访客能否理解：“你是谁”、“核心价值主张是什么”、“第一步应该探索什么”。
- **严禁多中心争抢**：禁止让多个业务/要素平行抢戏，必须有统摄全局的唯一叙事主轴。

### 2. 可用性与等价性门禁（Usability Gate）
- **禁止鼠标特权**：所有核心链路与交互体验必须支持触控设备（Touch Scrubbing / Swipe）与全键盘 Tab 导航。
- **全键盘可操作性**：优先使用原生 button/link 等语义元素；自定义控件按对应语义模式实现焦点、Enter / Space 等键盘行为，且具备清晰醒目的 `:focus-visible` 高对比度焦点环（禁全局 `outline: none`）。
- **WCAG AA 对比度基线**：普通文本对比度 ≥ 4.5:1，大文本 ≥ 3:1（大文本按适用 WCAG 定义，不等于任意标题）；同时检查相关非文本控件要求。纯白与纯黑是否适合由项目决定。

### 3. 动效赋义与减弱动效门禁（Motion-for-Meaning Gate）
- 动效必须服务于叙事理解与层级引导，**严禁为了动而动**。
- **物理真实性**：按反馈、手势或叙事目的选择曲线；物理手势可用弹簧，匀速进度可用线性。
- **前庭神经安全（强制）**：检查适用动画的 `@media (prefers-reduced-motion: reduce)`。开启减弱动效时，必须禁用持续无限自转、流体漂浮位移与激进 3D 透视倾斜，回退至优雅静态分布。

### 4. 工程与性能预算门禁（Performance Gate）
- 按支持设备、刷新率与项目预算测量核心滚动和 Canvas/WebGL，定位影响操作的卡顿。
- 优先使用 `transform` 与 `opacity`；其他效果根据性能证据选择，避免无谓重排。
- 检查非预期横向溢出；明确设计的局部滚动区域单独验证。

---

## 三、 微交互的实体触觉一致性 (Tactile Integrity)

获奖级界面的手感来源于**扎实的物理反馈**。交互载体按语义提供适用状态，以下是可选的实体触觉方案：

1. **Hover 意图态**：微妙的位移提升（-2px ~ -3px）、精细流光边框、光晕跟随。
2. **Focus 轮廓态**：`:focus-visible` 提供清晰可见的焦点样式；可选双环（`outline` + `outline-offset` 或高亮投影），与鼠标 Hover 体验等价。
3. **:active 激活反馈态**：点击或键盘激活时，可给予与项目一致的微按压回弹（`scale(0.96 ~ 0.99)` 或 `translateY(0)`），也可以使用颜色或边框反馈，避免强制位移。

### 标准 CSS / SCSS 实现模式

```scss
/* 交互卡片 / 按钮标准实体触觉模版 */
.interactive-element {
  /* 常态 */
  border: 1px solid var(--border-color);
  background: var(--bg-surface);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.25s ease,
              box-shadow 0.25s ease;
  outline: revert;

  /* 1. 悬停意图 */
  &:hover {
    transform: translateY(-2px);
    border-color: var(--interactive-hover-border);
    box-shadow: var(--interactive-hover-shadow);
  }

  /* 2. 键盘无障碍焦点 */
  &:focus-visible {
    border-color: var(--focus-color);
    box-shadow: 0 0 0 3px var(--focus-color);
  }

  /* 3. 物理下压实体感 */
  &:active {
    transform: translateY(0) scale(0.98);
    transition-duration: 0.1s;
  }
}

/* 4. 减弱动效安全降级 */
@media (prefers-reduced-motion: reduce) {
  .interactive-element {
    transition: none !important;
    transform: none !important;
  }
}
```

---

## 四、 移动端手势与雪碧图/动效等价性 (Touch Parity)

当实现 49 帧雪碧图、Canvas 画布或 3D 卡片擦洗时，必须通过统一事件分发支持触控：

```typescript
// 兼顾鼠标与触摸屏的 Scrubbing / 手势监听模式
const onTouchMove = (e: TouchEvent) => {
  if (!e.touches[0]) return
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const touchX = e.touches[0].clientX
  const progress = Math.max(0, Math.min(1, (touchX - rect.left) / rect.width))
  currentFrame.value = Math.floor(progress * (frameCount - 1))
}
```

---

## 五、 自检与循环打磨协议 (The 4-Step Refinement Loop)

任何创意 UI 的开发与重构，可按 4 步闭环收敛：

```
1. 现状快照 (Snapshot) ──> 2. 门禁审计 (Gate Audit) ──> 3. 针刺打磨 (Refine) ──> 4. 证据收敛 (Converge)
```

1. **现状快照**：定位目标页面与核心路径（Hero → 代表作 → 深度交互 → 转化/思考）。
2. **门禁审计**：逐项对照短板一票否决门禁（无障碍、手势、减弱动效、对比度、帧率），挑出最严重的一条短板。
3. **针刺打磨**：单轮只验证一个体验假设，保持最小且最具杀伤力的修改，杜绝发散。
4. **证据收敛**：运行项目规定的类型检查、生产构建 与浏览器真机交互走查，门禁全绿方可放行。
