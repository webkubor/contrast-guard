# 内容纪律（Content Discipline）—— 本仓补充

> B8「内容真实性」讲的是**写得像真的**；这份文档补的是 B8 没覆盖的四条**禁令**——
> 它们管的是「看起来像真的、实际是假的」以及「AI 味」。
> 违反任意一条 = 页面看着假，评审时当场打回。

---

## 一、四条禁令

### 1. 伪造数据冒充真实数据（Fabrication posing as real data）

编造的人设（`a.chen@grid.co`）、编造的遥测（`GRID.FREQ 59.998 Hz`、`BUILD 8.2.0-rc3`）。
生产主张必须真实；演示和原型可以使用明确标记的合成数据，不伪装成真实客户或遥测。

### 2. Filler 标签（Filler labels）

没人要过的单色大写副标题（登录页眉下的 `SECURE OPERATOR AUTHENTICATION`）、
假装是代码注释的 `//` 前缀引导语（`// INTELLIGENCE LAYER`）。
**判据：删掉这个字符串不损失任何信息 → 它就是 filler，删掉。**

### 3. 主题化替换标准 UI 文案（Themed replacement of standard UI copy）

`Authenticate Session` 代替 `Next`；`Remember this operator` 代替 `Remember me`。
**标准动作就用标准文案。** 主题化文案是要用真实效用偿还的税。

### 4. 用 Unicode 字形冒充图标（Unicode glyphs as icon substitutes）

`▣ Dashboard`、`◊ Market Navigator`。
**按项目图标系统与语义选择；文字字形或 ASCII 艺术可以有意采用，但须检查跨平台显示和可访问名称。**

---

## 二、AI 味语域（AI-slop register）

模型认得出来，你自己也得认得。删掉它，别等评审者先删：

- 严肃界面上的卖萌副标题（`Ask the grid.`）
- 日常 B2B 上的合成科幻状态条
- 假装是结构细节的装饰性「seam」「joinery」花活

---

## 三、与其他规则的合流

- **B8 内容真实性**管「写得真」；本文件管「不许假」与「不许 AI 味」。两者叠加使用。
- 字体、图标、文案气质由项目契约决定，不设全局白名单。
- token 一致性见[单尺原则](single-ruler-principle.md)。
