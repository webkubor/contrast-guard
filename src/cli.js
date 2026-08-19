#!/usr/bin/env node
/**
 * contrast-guard CLI
 *
 * 用法：
 *   contrast-guard                      读 contrast.config.json / .js
 *   contrast-guard --json               机器可读输出
 *   contrast-guard --init               生成一份配置模板
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, dirname, join, basename } from 'node:path'
import { pathToFileURL } from 'node:url'
import { check } from './check.js'

const C = process.stdout.isTTY
  ? { r: '\x1b[31m', g: '\x1b[32m', y: '\x1b[33m', d: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m' }
  : { r: '', g: '', y: '', d: '', b: '', x: '' }

const TEMPLATE = {
  files: ['src/**/*.css'],
  pairs: [
    { fg: 'text', bg: 'bg', min: 7, label: '正文' },
    { fg: 'accent', bg: 'bg', min: 4.5, label: '链接/主色' },
  ],
}

/** 极简 glob：只支持 * 与 **，够覆盖色板文件的常见摆法，省掉一个依赖 */
function expand(pattern, cwd) {
  if (!pattern.includes('*')) {
    const p = resolve(cwd, pattern)
    return existsSync(p) ? [p] : []
  }
  const idx = pattern.indexOf('*')
  const baseDir = resolve(cwd, dirname(pattern.slice(0, idx + 1)))
  if (!existsSync(baseDir)) return []
  const deep = pattern.includes('**')
  const re = new RegExp(
    '^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*\//g, '(?:.*/)?')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*') + '$'
  )
  const out = []
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (name === 'node_modules' || name.startsWith('.')) continue
      const full = join(dir, name)
      if (statSync(full).isDirectory()) { if (deep) walk(full); continue }
      const rel = full.slice(resolve(cwd).length + 1)
      if (re.test(rel)) out.push(full)
    }
  }
  walk(baseDir)
  return out.sort()
}

async function loadConfig(cwd) {
  for (const name of ['contrast.config.js', 'contrast.config.mjs', 'contrast.config.json']) {
    const p = resolve(cwd, name)
    if (!existsSync(p)) continue
    if (name.endsWith('.json')) return JSON.parse(readFileSync(p, 'utf8'))
    return (await import(pathToFileURL(p).href)).default
  }
  return null
}

const args = process.argv.slice(2)
const cwd = process.cwd()

if (args.includes('--init')) {
  const p = resolve(cwd, 'contrast.config.json')
  if (existsSync(p)) { console.error(`${C.y}已存在 ${basename(p)}${C.x}`); process.exit(1) }
  writeFileSync(p, JSON.stringify(TEMPLATE, null, 2) + '\n')
  console.log(`${C.g}已生成 contrast.config.json${C.x}，改成你的变量名后运行 contrast-guard`)
  process.exit(0)
}

const config = await loadConfig(cwd)
if (!config) {
  console.error(`${C.r}未找到 contrast.config.{js,mjs,json}${C.x}`)
  console.error(`运行 ${C.b}contrast-guard --init${C.x} 生成模板`)
  process.exit(2)
}

const files = [...new Set(config.files.flatMap((p) => expand(p, cwd)))]
if (!files.length) {
  console.error(`${C.r}没有匹配到任何文件${C.x}：${config.files.join(', ')}`)
  process.exit(2)
}

const { results, failed, checked } = check({ files, pairs: config.pairs })

if (args.includes('--json')) {
  console.log(JSON.stringify({ checked, failed, results }, null, 2))
  process.exit(failed ? 1 : 0)
}

const bad = results.filter((r) => !r.pass)
const rel = (f) => f.slice(cwd.length + 1)

if (!failed) {
  console.log(`${C.g}✓${C.x} ${checked} 组配色全部达标（${files.length} 个文件）`)
  process.exit(0)
}

console.log(`${C.r}✗ ${bad.length} 组配色低于门槛${C.x}（共检查 ${checked} 组）\n`)
for (const r of bad) {
  if (r.error) { console.log(`  ${C.r}${rel(r.file)}${C.x}  ${r.error}`); continue }
  console.log(`  ${C.b}${rel(r.file)}${C.x}  ${r.pair}`)
  console.log(`    ${r.fgHex} on ${r.bgHex}   ${C.r}${r.ratio.toFixed(2)}:1${C.x}  ${C.d}门槛 ${r.min}${C.x}`)
  if (r.suggestion) {
    const s = r.suggestion
    console.log(`    ${C.g}→ 改成 L=${s.L}%${C.x}（${s.hex}，${s.ratio.toFixed(2)}:1，${s.delta > 0 ? '提亮' : '压暗'} ${Math.abs(s.delta)} 点）`)
    console.log(`      ${C.d}${r.fgValue}${C.x}`)
  } else {
    console.log(`    ${C.y}→ 仅调明度无解，需要同时降低彩度或换背景${C.x}`)
  }
  console.log()
}
process.exit(1)
