---
name: browser-verify
description: UI 视觉验证方法论（截图取证/双主题/移动端/白屏诊断/读屏上值的 DoD 流程）。驱动浏览器本体优先走 ego-browser（继承登录态、隔离空间），本 skill 的价值是"验什么、怎么算验过"的清单与技巧；ego-browser 不可用时才退回其内置的 browser-harness(CDP) 驱动。触发："看渲染 / 截图验证 / UI DoD / 双主题核对 / 白屏排查"。
version: 1.0.0
---

通用前端研发唯一入口：[Frontend Flow](../../docs/frontend-flow.md)。项目品牌、组件库、域名和发布规则从项目读取。


# 浏览器控制 / UI 可视化验证（browser-harness）

跨 Agent 的浏览器控制能力，依赖 **`browser-harness`**（CDP 直控本机 Chrome）。它是命令行工具，Claude / Codex / Gemini 都能 shell 调用——不绑定某个 Agent 专属的浏览器 MCP，所以跨 Agent。

## 何时用

- **UI 改动的视觉验收（DoD）**：亲眼看渲染（明暗 / 移动宽度），不靠猜。**线上改动要看部署后的真实环境（test/prod），不是只看 localhost。**
- **排查「空白 / 没数据」**：区分是数据问题还是渲染问题（先看接口/日志，再看渲染）
- 确认交互、布局、配色的实际效果

## 调用形态（heredoc，python 内核）

内网 / 本地一律带 `NO_PROXY` 防 Clash 劫持：

```bash
NO_PROXY=127.0.0.1,localhost browser-harness <<'PY'
new_tab("http://localhost:5173/dashboard")   # 首次导航用 new_tab；别用 goto（会抢用户当前标签页）
wait_for_load()
import time; time.sleep(2)                    # SPA 数据异步，留一点渲染时间
p = capture_screenshot()                      # 截图落 /tmp/shot.png，再用 Read 工具看图下结论
print("SHOT:", p)
PY
```

- **读 DOM 文本/值**：`js("(()=>{ ...return 字符串... })()")`——比截图快，适合核对具体数值/文案
- **点击**：先截图读坐标 → `click_at_xy(x, y)` → 再截图验证（命中走 Chrome 合成层，穿透 iframe/shadow）
- **滚动到元素**：`js("document.querySelector('.sel')?.scrollIntoView({block:'center'})")`
- **输入**：`type_text("...")` / `press_key("Enter")`

## 验证纪律

- 部署后在项目实际目标环境复测，记录构建版本；本地验证不替代线上。
- 登录、账号和权限策略从项目读取；没有可用会话时明确阻塞，不擅自注册或更换账号。
- 空白页面先看前端错误、请求和资源状态，区分后端不可用与渲染缺陷。
- 截图后实际打开检查，记录观察，不能裸报「渲染正常」。

工具调用以当前浏览器工具的帮助为准；上面的 browser-harness 示例仅为 fallback，不是强制环境。完整验收走 [frontend-e2e](../frontend-e2e/SKILL.md)，阶段与交付走 [Flow](../../docs/frontend-flow.md)。
