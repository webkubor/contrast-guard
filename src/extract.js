/**
 * 从文件里提取「变量名 → 色值」。
 *
 * 为什么要支持多来源：真实项目的色值往往不在一个地方。
 * typora-Bloom-theme 就是 16 套写在 theme-src/root-*.css 的 CSS 变量里，
 * 另外 8 套内联在 scripts/theme-list.js 的 colors 字段。人改色值时面对两个入口，
 * 检查却只看其中一个 —— 这正是缺口长期存活的原因之一。
 */
import { readFileSync } from 'node:fs'

/**
 * CSS 自定义属性：--name: value;
 *
 * ⚠️ 只取每个变量「第一次」出现的值，并且默认忽略 @media 块。
 * 主题文件常在 @media print 里把 --bg 覆盖成浅色（打印用白底），
 * 若取最后一次赋值，就会拿打印背景去和屏幕前景比对 ——
 * 实测 bloom-ripple-dark.css 的 --bg 主块是 #0a1919，print 块是 #ebf4f4，
 * 取错会把一个达标的深色主题误报成 3.01:1。
 *
 * @param {string} source
 * @param {{includeAtRules?: boolean}} [opts] includeAtRules=true 时连 @media 内的一起收
 */
export function extractCss(source, { includeAtRules = false } = {}) {
  let scope = source
  if (!includeAtRules) {
    // 截到第一个顶层 @ 规则为止：主色板一定在它之前声明
    const at = source.search(/^\s*@(media|supports|container)\b/m)
    if (at > 0) scope = source.slice(0, at)
  }
  const vars = {}
  const re = /--([\w-]+)\s*:\s*([^;{}]+);/g
  let m
  while ((m = re.exec(scope))) {
    if (!(m[1] in vars)) vars[m[1]] = m[2].trim() // 首次赋值优先
  }
  return vars
}

/**
 * JS/JSON 里的色值对象。不 import、不 eval —— 目标文件常有副作用或依赖，
 * 静态抓取比执行它安全得多。
 * 匹配 name: 'oklch(...)' / "name": "#abc" 这类键值对。
 */
export function extractJs(source) {
  const vars = {}
  const re = /["']?([\w-]+)["']?\s*:\s*["'](oklch\([^"']+\)|#[0-9a-fA-F]{3,8}|rgba?\([^"']+\))["']/g
  let m
  while ((m = re.exec(source))) vars[m[1]] = m[2]
  return vars
}

/**
 * 一个文件里含多组色板时，按顶层键拆开分别提取。
 *
 * 常见于把所有变体写在同一个对象里：
 *   const PALETTE = {
 *     mist:  { accentL: 'oklch(…)', bgL: 'oklch(…)' },
 *     petal: { accentL: 'oklch(…)', bgL: 'oklch(…)' },
 *   }
 * 若按整文件提取，各组同名键会互相覆盖，只剩最后一组被检查 ——
 * 结果是「显示全绿，其实只查了 1/N」，比不检查更危险。
 *
 * @returns {Record<string, Record<string,string>>} 组名 → 该组变量表
 */
export function extractGroups(source, { groupPattern } = {}) {
  const groups = {}
  // 匹配缩进 2-4 空格的 `名字: {`，即顶层分组；更深的嵌套不当作组
  const re = groupPattern || /^[ \t]{2,4}(\w[\w-]*)\s*:\s*\{/gm
  const starts = []
  let m
  while ((m = re.exec(source))) starts.push({ name: m[1], from: m.index + m[0].length })
  for (let i = 0; i < starts.length; i++) {
    const end = i + 1 < starts.length ? starts[i + 1].from : source.length
    const vars = extractJs(source.slice(starts[i].from, end))
    if (Object.keys(vars).length) groups[starts[i].name] = vars
  }
  return groups
}

export function extractFile(path, { groups = false } = {}) {
  const src = readFileSync(path, 'utf8')
  if (groups) return extractGroups(src)
  return /\.(css|scss|less)$/i.test(path) ? extractCss(src) : extractJs(src)
}

/**
 * 解析 var(--x) 引用，最多跟 depth 层。
 * 色板里 --link: var(--accent) 很常见，不解引用就会漏检。
 */
export function resolveVar(vars, name, depth = 0) {
  const raw = vars[name]
  if (!raw || depth > 5) return raw ?? null
  const ref = raw.match(/^var\(\s*--([\w-]+)\s*(?:,[^)]*)?\)$/)
  return ref ? resolveVar(vars, ref[1], depth + 1) : raw
}
