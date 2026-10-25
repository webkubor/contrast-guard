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
