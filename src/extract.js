/**
 * 从文件里提取「变量名 → 色值」。
 *
 * 为什么要支持多来源：真实项目的色值往往不在一个地方。
 * typora-Bloom-theme 就是 16 套写在 theme-src/root-*.css 的 CSS 变量里，
 * 另外 8 套内联在 scripts/theme-list.js 的 colors 字段。人改色值时面对两个入口，
 * 检查却只看其中一个 —— 这正是缺口长期存活的原因之一。
 */
import { readFileSync } from 'node:fs'

/** CSS 自定义属性：--name: value; */
export function extractCss(source) {
  const vars = {}
  const re = /--([\w-]+)\s*:\s*([^;{}]+);/g
  let m
  while ((m = re.exec(source))) vars[m[1]] = m[2].trim()
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

export function extractFile(path) {
  const src = readFileSync(path, 'utf8')
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
