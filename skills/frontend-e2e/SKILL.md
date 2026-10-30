---
name: frontend-e2e
version: 0.1.0
description: "前端页面'完成/对齐 PRD/可移待验证'的浏览器结构化验收——使用当前环境浏览器与可用遥测取证，逐区逐字段逐交互 diff，禁止关键词命中当验证。触发条件: 声称某前端页做完/对齐原型、移待验证前、验收 UI。触发词: 验收、对齐 PRD、移待验证、页面做完了、浏览器验证、E2E、UI 验证。"
license: MIT
author: cortexos
category: software-development
platforms: [macos, linux]
metadata:
  openclaw:
    tags: [frontend, e2e, verify, browser, prd]
    requires:
      env: []
      bins: []
---

通用前端研发唯一入口：[Frontend Flow](https://github.com/webkubor/frontend-contrast-guard/blob/main/../)。项目品牌、组件库、域名和发布规则从项目读取。


# 前端浏览器结构化验收（E2E）

唯一入口：[Frontend Flow](https://github.com/webkubor/frontend-contrast-guard/blob/main/../)；验收依据：[评审标准](https://github.com/webkubor/frontend-contrast-guard/blob/main/../)。本方法逐区、逐字段、逐交互对照项目契约，产出通过项、差异与未验证项。

## 1. 定义环境与覆盖矩阵

记录目标 URL、环境、构建版本、参考版本、登录角色和数据状态。开发分支可验证改动，但不能据此声称已部署；交付声明必须对应实际验过的版本。按项目路由验证直接访问、刷新与站内导航，区分 SPA fallback 和 API 代理。

依据支持设备、布局断点和本次影响面选择视口；覆盖窄屏、常用宽度与布局切换的临界区，记录实际 CSS 视口、DPR、缩放和字体加载状态。390、768、1280、1600px 可作探索样本，不是固定四阶门槛。只支持单一终端时按契约验收。

## 2. 浏览器驱动

使用当前环境可用的浏览器工具，遵循其帮助和会话隔离方式。ego-browser、CDP 或浏览器 MCP 都可；不要求私有安装路径。复用已授权会话，遇登录或验证码按当前工具协议交给用户。

在预期内容和资源稳定后截图并实际打开检查。若工具不能模拟某设备、真实触摸或读屏，明确记录缺口。

## 3. 结构化断言

- **内容与任务**：逐区核对字段、单位、排序、状态、主要操作及真实请求响应。关键词命中不能证明对齐。
- **布局**：标题可理解且遵循项目截断策略，不被徽标挤压；通知与固定层不遮挡必要操作。检查意外横向溢出；数据表等明确设计的局部滚动可以保留。无跨项目标题最小宽度或浮层最大高度。
- **交互**：真实打开本次涉及的抽屉、弹窗和二级页，验证请求、结果、关闭/返回、键盘焦点与错误恢复。用项目语义选择器，不依赖某组件库的错误类名。
- **视觉契约**：抽查 computed style、命中规则和语义 token，核对同语义一致性；组件库与原生控件由项目决定。
- **状态与无障碍**：按适用范围覆盖 pending、空数据、失败、长内容、键盘、触控和减弱动效。脚本通过不等于完整无障碍验收。

## 4. 取证与产出

保留测试路径、视口、截图、关键 DOM/computed style、console 和请求证据。项目已接 agent-eyes 时可读取其日志；未接时用浏览器网络/console 等可用能力，不为验收强加插件。接口证据脱敏，不输出凭据或个人数据。

逐项报告 PASS / FAIL / 未验证及差异位置、影响、根因、建议。严重度和退出条件来自项目；阻塞主任务的缺陷不能被平均分掩盖。不能把本地通过当部署验收，也不能以 HTTP 200 代替页面验收。

## 页面访问失败排障

1. 从项目 README、AGENTS 或部署清单确认域名、环境、版本与角色。
2. 检查 HTML 引用的实际资源 URL、状态和响应内容，排除 HTML fallback 被当成 JS、hash 不匹配、旧缓存与不完整产物。先定位再按项目发布约定修复。
3. 在浏览器查看初始化异常、请求失败、鉴权重定向与数据状态；登录页本身不代表业务页通过，console 噪声应解释来源与影响。
4. 区分构建期公开配置与运行期服务配置。供应商专项方法见 [Cloudflare Pages + Vite 配置排障](references/cf-pages-vite-env-debug.md)。
5. 修复后在目标版本重跑相关路径与影响面，打开截图检查。

可选的 ego-browser 诊断示例见 [page-check.cjs](scripts/page-check.cjs)：它采集页面、事件与截图，不执行完整验收；先确认本机驱动 API 兼容。

## 相关方法

- [browser-verify](../browser-verify/SKILL.md)：截图与环境排障。
- [ui-review](../ui-review/SKILL.md)：视觉假设和证据评审。
- [ui-restore](../ui-restore/SKILL.md)：参考对齐与样式根因。
