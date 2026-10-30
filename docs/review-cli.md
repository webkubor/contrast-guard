# 可执行的视觉评审报告

`check` 校验声明的色对；`measure` 描述 CSS 分布；`review` 校验证据与评审闭环。
三者回答不同的问题。`review` 不启动浏览器、不解析图片、不鉴别评审者是否真的看过图片，
也不生成综合美感分数。`PASS` 的准确含义是：声明范围内证据记录完整，人工评审维度通过，
没有未解决的 critical/major 问题。它不是“这个网站绝对漂亮”。

```bash
contrast-guard review --init ui-review.json
# 先开浏览器截图并实际检查，再填写报告
contrast-guard review ui-review.json
contrast-guard review ui-review.json --json
```

初始化返回 0；评估返回 0=PASS、1=HOLD、2=输入错误。初始化不覆盖现有文件。
模板故意不填产品契约、目标版本、截图和判断，生成后评估必然 HOLD。

## 报告字段

- `contract`：product、user、job、primaryAction、firstRead、density、signature、constraints。
  写具体选择及理由。例如目录的第一识别物是工具名称，密度优先支持横向比较，
  品牌识别来自命令语言、排版和真实工具数据。
- `scope`：`revision` 是目标构建/提交标识；routes、themes、widths、states 的笛卡尔积
  是必须覆盖的范围。rationale 解释为何选择这些状态；单主题产品可只声明一个主题，
  但不能用缩小范围掩盖已改动的组件。
- `evidence`：每张截图有唯一 id，route/theme/state/width/height、revision、screenshot 路径或 URL、
  capturedAt、reviewer、observation、status（pending/reviewed）、页面级 scrollWidth。
  只有目标 revision 且标为 reviewed 的证据计入覆盖矩阵；旧版本记录仅可用于前后比较。
  reviewer 是评审署名，不是独立性认证。路径不等于图像已经被检查，也不验证文件存在。
- `assessments`：七个维度分别填写 status（pass/hold/unreviewed）、evidenceIds、observation、rationale：
  product-fit、hierarchy、typography、spacing-layout、color-tokens、components-states、distinctiveness。
  指向旧版本、pending 或不存在的证据，不算有效评审。
- `findings`：唯一 id、ruleId、severity（critical/major/minor）、status（open/resolved）、evidenceIds，
  以及 observation→impact→hypothesis→change→verify。每个问题给可执行修改和复测条件。
  minor 可以保持 open 并作为后续改进；critical/major open 会 HOLD。
- `iterations`：id、findingId、before/after 证据 id、change、outcome、guardObservation、guardsPassed、
  result（improved/regressed/inconclusive）。解决问题需要同 route/theme/state/width/height、
  不同 revision 的前后 reviewed 证据，明确改善且保护条件通过。主题不同的截图不能互充前后对照。

## 真实试跑：不溢出仍然可能难读

2026-10-26 浏览器查看 SuperCLI 首页：390×844 浅色默认态，页面 `scrollWidth=390`，
没有页面横向溢出。但 Wrangler 的安装命令末尾 `g` 单独换行。
1280×800 下同一命令完整显示。两张都是实际打开检查的截图，不能只靠计量宣称“全绿”。

一条有效 finding 应类似：

```json
{
  "id": "F-command-wrap",
  "ruleId": "typography.command-legibility",
  "severity": "major",
  "status": "open",
  "evidenceIds": ["mobile-light-default"],
  "observation": "Wrangler 安装命令末尾 g 在 390px 独占一行。",
  "impact": "命令作为可复制的工作对象，阅读被拆断；零页面溢出没有保证内容可读。",
  "hypothesis": "复制按钮固定宽度挤占命令轨道，逐词 span 与终端换行规则共同导致碎裂。",
  "change": "窄屏命令与复制按钮分行；保持命令 token 完整，必要时给命令区局部横向滚动。",
  "verify": "390px 明暗主题检查短/长命令、长名称、焦点与复制；1280px 布局保持可读。"
}
```

该问题仍是 HOLD：本轮改的是评审工具，没有改 SuperCLI 的组件。
不填造假的 after 截图把结论冲绿。实际截图保存在当次会话工作产物中，
没有把带本机路径的截图当作仓库永久测试资源。

## 每轮怎么提高

从 [评审标准](frontend-review-standard.md) 选一个最影响任务的具体问题，
限制这一轮的改动预算，记录修改假设及保护条件，取得同条件的新版证据。
效果不确定就保持 inconclusive，出现退步就回滚；没有明确问题时停止修改。
可复用规则进入 [规则演进流程](rule-evolution.md)，至少带正例、反例、适用域和失败案例。
首批 [机器可读规则库](visual-rules.json) 包含命令可读性、语义 token 溯源、首读对象与任务匹配三条，
分别处于 trial/proposed；它们是有反例与升级条件的待验证规则，不是自动评分权重。

## 参考边界

[DTCG Format 2025.10](https://www.designtokens.org/TR/2025.10/format/)
定义命名值、类型、描述、别名与跨工具交换；它是 Community Group Report，不是审美标准。
本工具的 token 审查原则参考这些概念，不声称已实现完整 DTCG 格式解析器。
“语义 token 正确”与“页面有设计感”仍需分别验证。
