# Changelog

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [Unreleased]

### Added

- 新增 `contrast-guard review --init ui-review.json` 与 `contrast-guard review ui-review.json --json`：以显式产品契约、七个评估维度、声明范围内的截图证据、具体改动和可比 before/after 复测记录形成评审门禁。
- 评估退出码：`0` 为记录满足门禁的 PASS，`1` 为 HOLD，`2` 为输入错误。初始化成功返回 `0`，空模板评估仍为 HOLD；初始化不覆盖已有文件。
- [规则演进](docs/rule-evolution.md)：规则身份与版本、正例与反例、`proposed / trial / stable / deprecated` 生命周期、试验预算、停止与回滚；配合更新后的 [前端 UI 评审标准](docs/frontend-review-standard.md)。

### Changed

- `measure` 默认返回中性 `observation`；缺少有效采样为 `unknown`。仅调用方显式提供阈值时给出配置提醒，不再把稀疏动效等分布当作通用审美失败。
- 双语 README 与 llms.txt 明确工具边界：`review` 读取 JSON，不自行采集或分析截图；PASS 不生成美感分数，也不证明截图已实际检查。四视口/主题/状态矩阵是声明的评审协议，不是 CLI 自动采集能力。
- 澄清 `measure` 提供 computed style 分布，不执行完整响应式审计、不计算真实渲染对比度，也不凭分布证明 token 漂移。

## [0.4.0] - 2026-10-25

### 🚀 重大进化：从单一配色护栏演进为「前端视觉全栈守卫」

承接 owner 2026-10-25 定调：收口对内前端工程与规范体系，CS 系统不再单独维护 UI 细节：
- **项目与包定位升级为 `frontend-contrast-guard`**：双别名兼容（支持 `frontend-contrast-guard` 与 `contrast-guard` 双命令行调用）。
- **沉淀前端工程视觉评审与交互自适应规范标准（SSOT）**：新增 `docs/frontend-review-standard.md`，承接原 CS 系统的核心视觉资产：
  - 视觉计量标准（computed style 采样分布，供情境化评审参考）；
  - 多视口响应式评审协议（四阶视口示例：390x844 / 768x1024 / 1280x800 / 1600x900，由评审者另行采集检查）；
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