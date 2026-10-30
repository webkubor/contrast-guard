# 前端研发 Flow（唯一入口）

本仓是通用前端方法的唯一真源：Flow 组织阶段，skills 提供按需方法，CLI 提供测量与证据检查。CS、Agent 安装目录仅发现或引用这里，不维护第二份规范。

项目资产优先：开工读取项目 AGENTS、PRD、设计稿、DESIGN、组件/token、支持设备和发布约定。品牌配色、固定风格、域名、账号、页面结构属于项目，不得提升成通用默认。公司技能可规定协作和发布，但不能复制本 Flow 的视觉判据。

## 阶段与方法

| 阶段 | 输入与动作 | 按需 skill | 退出证据 |
|---|---|---|---|
| 1. 定义任务 | 确认目标、参考来源、现状版本、成功条件和修改边界 | 项目规范；[评审标准](frontend-review-standard.md) | 设计契约；区分新设计、还原、缺陷修复 |
| 2. 设计或还原 | 有既定稿先忠实还原；新设计才选择方向 | [landing-page-design](../skills/landing-page-design/SKILL.md)、[ui-restore](../skills/ui-restore/SKILL.md)、[clone-website](../skills/clone-website/SKILL.md) | 组件/布局方案、来源和不可测缺口 |
| 3. 实现 | 复用项目组件/token，状态和交互与视觉一起实现 | [apple-design](../skills/apple-design/SKILL.md)（交互原理）、[design-to-motion](../skills/design-to-motion/SKILL.md)（需要动效时）、[award-creative-ui](../skills/award-creative-ui/SKILL.md)（明确创意任务时） | 可运行实现、局部检查、影响面 |
| 4. 比对与修复 | 同条件截图、实测样式、追踪来源、修根因、复测 | [ui-restore](../skills/ui-restore/SKILL.md)、[ui-review](../skills/ui-review/SKILL.md) | 观察→原因→改法→前后证据；无未关闭关键差异 |
| 5. 验收 | 按声明矩阵运行真实交互、状态、临界宽度 | [frontend-e2e](../skills/frontend-e2e/SKILL.md)、[browser-verify](../skills/browser-verify/SKILL.md) | PASS/HOLD/未验证及截图、交互和版本证据 |
| 6. 交付 | 按项目分支/测试/部署规则交付，检查真实目标环境 | 项目的交付技能或规则 | 测试结果、部署版本、复测、残余项 |

## 路由原则

- 设计稿/Figma/PRD 原图/截图还原及样式缺陷 → `ui-restore`；参考是可交互整站 → `clone-website`。两者不额外创建设计风格。
- 从零构思或明确重设计 → `landing-page-design`；其风格菜单不是各项目强制皮肤。
- 判断视觉是否服务产品 → `ui-review`；判字段/路由/交互是否符合契约 → `frontend-e2e`。两者按任务组合，无须强制加载所有 skills。
- `apple-design` 提供手势、连续性和可中断交互的方法，不意味着所有项目采用 Apple 外观。`award-creative-ui` 不作为普通业务系统的风格要求。
- 测量分布是观察，不是跨产品审美及格线。阈值、矩阵、复测与结论遵循[评审标准](frontend-review-standard.md)。
- 已授权的修复持续到交付终态。仅遇到真实缺失信息、权限或不可替代的产品决策时说明具体阻塞；状态询问不取消正在执行的任务。

## 项目资产归属

每个项目维护自己的 DESIGN/设计系统及素材目录。全局 skill 只说明如何发现、测量、还原和验证；不携带某个业务域名、登录方式、品牌色、指定组件库或固定页面模板。部署命令和环境映射从项目读取。

## 工具与安装

CLI 的 `check`、`measure`、`review` 分工见 [README](../README.md) 与[评审 CLI](review-cli.md)。浏览器选择遵循当前运行环境提供的能力；截图后实际打开检查。工具不可用时标记缺口，不能拿 HTTP 200 或本地通过替代目标环境验收。

安装 skills 使用支持本仓 `skills/` 目录的 Agent 安装器；`cs skill` 可通过注册外部根发现本仓。安装副本不是真源，修改回到本仓。Flow、规范、skills 同步演进，不能在 CS 再建立一套判据。
