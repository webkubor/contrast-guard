# Changelog

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [0.4.0] - 2026-10-25

### 🚀 重大进化：从单一配色护栏演进为「前端视觉全栈守卫」

承接 owner 2026-10-25 定调：收口对内前端工程与规范体系，CS 系统不再单独维护 UI 细节：
- **项目与包定位升级为 `frontend-contrast-guard`**：双别名兼容（支持 `frontend-contrast-guard` 与 `contrast-guard` 双命令行调用）。
- **沉淀前端工程视觉评审与交互自适应规范标准（SSOT）**：新增 `docs/frontend-review-standard.md`，承接原 CS 系统的核心视觉资产：
  - 视觉计量标准（计算值与真实渲染灰阶、字号集中度、动效覆盖率）；
  - 多视口响应式自适应度量标准（Ego Lite 4 阶矩阵：390x844 / 768x1024 / 1280x800 / 1600x900）；
  - 盒模型排版与组件三硬铁律（主标题特权律 Anti-Squeeze、全局浮层避让律 Anti-Occlusion、交互端到端真实闭环）；
  - 组件选型与弹窗铁律（坚决拒绝原生 alert/confirm/prompt，优先复用成熟组件库）；
  - 前端全生命周期工具流（插件类、CLI类、npm 研发库三大类资产协同流）。
- **重构 README**：首屏对齐开源金字塔规范（居中品牌、for-the-badge 徽章、置顶 Why This 痛点对比矩阵）。

## [0.3.0] - 2026-09-08

主发布：

- **新增 `measure` 子命令** —— 渲染后视觉计量（cf128c7）
- **`measure` 自驱动**：ego 驱动收掉自己开的 task space（0a9df0a）
- **失败即判死**：导航失败时不再把错误页的指标当页面指标（2bcda42）

### 文档

- 与 `vite-plugin-agent-eyes` 互链，说明前端质量链路分工（7890a5c）
- README 加 Bloom 系列导航（a3a0b48）

## 历史

- `0c7ce3a` — feat: 支持一个文件内多组色板（groups 模式）
- `a896a4c` — fix: 修复两个 dogfooding 暴露的缺陷 —— `@media` 覆盖污染与 hex 无建议值
- `6f9ce0e` — feat: contrast-guard 首版 —— 把配色对比度做成 CI 护栏，并直接给出该改成多少

---

完整 commit 列表见 `git log`。