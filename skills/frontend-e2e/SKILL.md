---
name: frontend-e2e
version: 0.1.0
description: "前端页面'完成/对齐 PRD/可移待验证'的浏览器结构化验收——用 ego-browser 驱动真实页面 + agent-eyes 遥测取证，逐区逐字段逐交互 diff，禁止关键词命中当验证。触发条件: 声称某前端页做完/对齐原型、移待验证前、验收 UI。触发词: 验收、对齐 PRD、移待验证、页面做完了、浏览器验证、E2E、UI 验证。"
license: MIT
author: cortexos
category: software-development
platforms: [macos, linux]
metadata:
  openclaw:
    tags: [frontend, e2e, verify, browser, prd]
    requires:
      env: []
      bins: [ego-browser]
---

通用前端研发唯一入口：[Frontend Flow](../../docs/frontend-flow.md)。项目品牌、组件库、域名和发布规则从项目读取。


# 前端浏览器结构化验收（E2E）

## 概述

把 engineering_baseline §4.2「验收铁律」变成可执行步骤：用 **ego-browser 驱动**真实页面（复用用户已登录的网站，TaskSpace 隔离）、用 **agent-eyes 遥测取证**，对目标页**逐区/逐字段/逐交互** diff PRD，产出 PASS/FAIL + 差异清单。驱动与观测分离——ego-browser 负责点/看 DOM，agent-eyes 负责落地真实 API/console/错误/DOM 快照/截图，不靠猜代码。

## 触发条件

- 要声称某前端页「做完 / 对齐 PRD / 对齐原型」时
- 把任务「移待验证」之前
- 用户说「验收这页」「浏览器验证」「E2E」
- **cs flow frontend 的禁止项「不做浏览器验证就声称完成」被触发时，必走本 skill**

## 快速开始

```bash
cs skill show frontend-e2e     # 读本流程
# 驱动引擎用法：读 ego-browser skill（~/.claude/skills/ego-browser/SKILL.md）
```

## 使用说明（照此执行，别跳步）

### 0. 先定「在哪验」——铁律
- **在用户真正会看到的状态验**：目标环境（main 已合并 / 已部署），**不是 feature 分支/worktree**。分支里的成果 ≠ 现状；分支未合就明说「分支里已做、线上还是旧的」。
- 走**客户端路由**进页面（点导航/改 history），不要直接开 `/some/api-path` 裸 URL（会被 dev 代理打到后端）。

### 1. 驱动（ego-browser 多视口响应式巡检）
- 用 `ego-browser nodejs` 打开目标页（一个验收任务一个 TaskSpace，记下 spaceId 复用）。
- **必须覆盖 4 阶梯级断点，严禁只测死板桌面单尺寸**：
  1. `Mobile (390×844)`：超窄屏测试，检验单列堆叠、移动端文本与按钮溢出；
  2. `Tablet-Split (768×1024)`：双列/半屏临界测试，检验网格收窄时弹性盒是否压榨文字；
  3. `Laptop (1280×800)`：常规工作视口测试；
  4. `Desktop (1600×900)`：宽屏自适应测试。
- 使用 `await page.cdp('Browser.setWindowBounds', { windowId, bounds: { width, height } })` 动态切换尺寸并截图。

### 2. 结构化断言（**核心：禁止关键词命中与死板目测**）
必须逐条验证以下硬断言（任何一条不通过即判 FAIL）：
- **盒模型主标题特权律**：卡片/列表的主标题（用户名、仓库名、工单名），在任意视口下的渲染宽度 `rect.width` 必须 `≥ 80px`，**严禁被右侧徽标挤压成单字母（c/d/v）或垂直断裂成乱码**！
- **无横向滚动条溢出**：`document.documentElement.scrollWidth <= window.innerWidth`；
- **全局浮层避让律**：全局通知/提示条必须默认轻量（高度 ≤ 36px）或具备自动收缩为胶囊的机制，严禁大黑卡死死遮挡页面操作按钮；
- **动态交互端到端真实闭环**：所有抽屉、弹窗、二级页面，**必须用 `page.click()` 真实展开一次**，验证无 404、无控制台报错、无红屏 `n-alert--error`，且图表/数据正常渲染；
- **门禁类抽检**（用 `js()` 取计算样式核对 token）：圆角是否符合 Design Token、色值是否使用语义 Token、严禁使用原生 `alert / confirm / prompt` 弹窗，严格使用成熟组件库（如 项目组件库）。

### 3. 取证（agent-eyes 遥测，读 `log/<port>/`）
- `api-calls.log`：真实请求/响应体（**绝不凭类型猜字段**，避免前后端路径拼写不一致）
- `console.log` / `errors.log`：有无报错/警告（排除已登录噪声）
- `interaction.log`：复现交互路径
- `snapshots/*.png`：4 个视口的真实截图作为最终验收交付物

### 4. 产出
- **PASS/FAIL + 差异清单**；所有 P0/P1 差异清零 + 4 阶视口截图齐全 + 抽屉/弹窗点击通过 + 依赖 API 就绪，才可「移待验证」。

## 反模式（命中即判 FAIL）

- ❌ **只测一个死板桌面宽度（如 1440px）就声称完成** —— 必须跑 4 阶响应式矩阵
- ❌ **文字被 `flex-shrink: 0` 的徽标反向压窄到几个像素导致单字母截断**
- ❌ **全局浮动卡片遮挡页面卡片和操作按钮**
- ❌ **抽屉与弹窗未做真实 `page.click()` 展开测试就交付，上线接口 404 崩成 JSON 报错**
- ❌ **在页面中使用原生 `alert / confirm / prompt` 弹窗**
- ❌ 用关键词/文本包含判断「对齐」
- ❌ 在分支/worktree 里验，却当成线上现状汇报
- ❌ 凭 TS 类型猜接口字段，不看 `api-calls.log` 真实响应
- ❌ **用户说「走页面」时用 curl/API 绕过去** —— 必须用 egolite 打开真实浏览器页面

## 排障模式：「页面访问不了」

用户说「XX 页访问不了」时，**禁止 curl 看 200 就回复「正常」**。必须开到浏览器 console 级别。

### 0. 先确认项目 ← 域名（防查错项目，2026-07-22 教训）

**不要凭"管理后台/业务中台/客户端"这类称谓跳到错误项目。** 先查项目 README/AGENTS.md 确认线上域名，再排查。

从项目自身 README/AGENTS/部署清单确认目标域名与环境，不携带跨项目域名映射。

### 1. 验证线上 JS 资源完整性
```bash
# 先看 HTML 里引用的 JS，逐个 HEAD 请求验证
curl -s "$URL" | grep -oP 'assets/[^\"]+\.js' | while read f; do
  code=$(curl -sI -o /dev/null -w "%{http_code}" "$URL/$f")
  [ "$code" != "200" ] && echo "❌ $code → $f"
done
```

常见根因：
- **JS hash 不匹配** → HTML 新但部署不完整，`npm run deploy` 重推
- **CF Pages cache** → 部署后 `npm run cache:purge` 清 SPA 路由缓存

### 2. 环境与构建配置

按项目实际托管平台核对构建期与运行期变量、资源版本和缓存。不要把供应商专有清缓存命令当通用修复。环境映射与事故记录留在所属项目。

### 3. 多视口响应式自动化巡检脚手架（ego-browser）
```bash
ego-browser nodejs -e '
const task = await taskSpace("e2e-responsive-audit");
const page = task.page("p1");
const { windowId } = await page.cdp("Browser.getWindowForTarget");
await page.cdp("Page.bringToFront");

// 4 阶响应式梯级视口
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet-split", width: 768, height: 1024 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1600, height: 900 }
];

await page.goto(process.env.URL ?? "$URL", { timeout: 30000 });
await page.waitForTimeout(2000);

for (const vp of viewports) {
  await page.cdp("Browser.setWindowBounds", {
    windowId,
    bounds: { windowState: "normal", width: vp.width, height: vp.height }
  });
  await page.waitForTimeout(1000);

  // 盒模型硬断言：无横向滚动条、主标题渲染宽度 >= 80px、严禁单字母截断
  const audit = await page.evaluate((name) => {
    const unames = Array.from(document.querySelectorAll(".card-uname, .pm-repo, .title")).map(el => ({
      text: el.innerText.trim(),
      width: Math.round(el.getBoundingClientRect().width),
      failed: el.innerText.trim().length <= 1 || el.getBoundingClientRect().width < 60
    }));
    return {
      viewport: name,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      hasOverflowX: document.documentElement.scrollWidth > window.innerWidth,
      failedTitles: unames.filter(u => u.failed)
    };
  }, vp.name);

  if (audit.hasOverflowX) console.error(`❌ [${vp.name}] 出现横向滚动条溢出！`);
  if (audit.failedTitles.length) console.error(`❌ [${vp.name}] 发现标题被压扁截断:`, audit.failedTitles);

  await page.screenshot({ path: `/tmp/e2e-${vp.name}.png` });
}
await task.finish({ keep: [] });
'
```

### 4. 判断标准
- **无 404 + body 有预期内容 + console 无 JS 异常** = 页面正常
- **4 阶视口全数通过**（无横向滚动条、无标题压成单字母、无大卡片遮挡操作）
- **所有抽屉/弹窗点击展开测试通过**（无接口 404、无 JSON parse 异常、无错误红框）
- **JS 全部 404** = 部署不完整，重新部署
- **body 是登录页** = 鉴权问题，不是页面挂了
- **console 有 JS 报错** = 代码 bug，查具体错误定位

> **铁律**：只看单尺寸截图不算验证；只 curl 看 HTTP 200 不算验证。必须多视口真机 render + console 零异常 + 盒模型不断裂。

## 环境要求

- **ego-browser**（`ego-browser` skill）：驱动真实 Chromium 渲染，复用用户已登录的网站
- **vite-plugin-agent-eyes**：目标项目已接 `installAgentErrorReporter()`；截图需 `agentDebugger({ screenshots: true })`
- 目标页的 dev / 部署地址

## 相关 Skills

- ego-browser skill —— 驱动引擎（`~/.claude/skills/ego-browser`）
- 规则真源：`cs rule engineering_baseline`（§4.2 验收铁律）、[前端 Flow](../../docs/frontend-flow.md)
