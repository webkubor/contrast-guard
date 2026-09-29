# Changelog

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

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