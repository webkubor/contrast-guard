# AGENTS.md — AI 助手工作守则

## 这是什么

contrast-guard —— 把配色对比度做成 CI 护栏的 CLI：支持 OKLCH，不达标时**反推出该改成多少**
（给出确切的 lightness），另有渲染后计量子命令。Bloom 主题家族的配色就靠它守门。

## 关键文件

- `contrast.config.json`：护栏配置 —— 声明哪些变量组合必须达标（AA/AAA）。
- `README.md` / `README.en.md`：双语 README，同步改。

## 约定

- 「不达标要给解」是本工具的灵魂：只报错不给修复值的改动会被视为退化。
- OKLCH 是一等公民；任何新增颜色空间支持不得降级 OKLCH 的精度。
- 检查必须可进 CI（退出码语义：0 通过 / 非 0 失败），别引入需要交互的模式。

## 前端方法唯一入口

- 先读 `docs/frontend-flow.md`，按需加载 `skills/`。判定真源为 `docs/frontend-review-standard.md`。
- 全局方法仅描述工程过程；品牌风格、项目路径/域名、环境账号与发布纪律在所属项目维护。
- 不向 CS 或安装目录复制规则正文；修改本仓真源，并检查 Flow/规范/skills 引用一致。
- CLI、setup 与 skills 是不同层：本次方法迁移不改变 npm 包发布范围或自动安装副作用。
