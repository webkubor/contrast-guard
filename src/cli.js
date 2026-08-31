#!/usr/bin/env node
/**
 * contrast-guard CLI
 *
 * 静态检查（零依赖，CI 里裸跑）：
 *   contrast-guard                      读 contrast.config.json / .js
 *   contrast-guard --json               机器可读输出
 *   contrast-guard --init               生成一份配置模板
 *
 * 渲染后计量（需要浏览器，运行时探测，不写进 dependencies）：
 *   contrast-guard measure <url>              判据 + 参考量
 *   contrast-guard measure <url> --save <名>   存为基线
 *   contrast-guard measure <url> --vs <名>     与基线逐项对比
 *   contrast-guard measure --baselines        列出已存基线
 *
 * 两者分工：check 查「对不对」（色值达不达标），measure 查「多少」
 * （几种字号、几层灰阶、多少元素有动效）。丑的每一处单看往往都"对"。
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

// measure 是唯一需要浏览器的子命令，相关模块也只在这条路径上动态加载——
// check 路径完全不碰它们，零依赖承诺不受影响。
if (args[0] === 'measure') {
  await runMeasure(args.slice(1), cwd)
  process.exit(0)
}
if (args[0] === 'check') args.shift() // 显式写法，等价于无参数

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

const { results, failed, checked } = check({ files, pairs: config.pairs, groups: config.groups === true })

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
  console.log(`  ${C.b}${rel(r.file)}${C.x}${r.group ? C.y + '  [' + r.group + ']' + C.x : ''}  ${r.pair}`)
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

// ─── measure 子命令 ──────────────────────────────────

/** CJK 与全角标点占两列，%-Ns 那套在中文表格上会错位 */
function dispWidth(s) {
  let w = 0
  for (const ch of s) {
    const c = ch.codePointAt(0)
    w += (c >= 0x1100 && c <= 0x115f) || (c >= 0x2e80 && c <= 0xa4cf) ||
         (c >= 0xac00 && c <= 0xd7a3) || (c >= 0xf900 && c <= 0xfaff) ||
         (c >= 0xfe30 && c <= 0xfe6f) || (c >= 0xff00 && c <= 0xff60) ||
         (c >= 0xffe0 && c <= 0xffe6) ? 2 : 1
  }
  return w
}
// 必须用函数声明而非 const 箭头函数：runMeasure 在文件顶部就被调用，
// const 此时还在 TDZ 里，只有函数声明会提升。
function padR(s, w) { return s + ' '.repeat(Math.max(0, w - dispWidth(s))) }
function padL(s, w) { return ' '.repeat(Math.max(0, w - dispWidth(s))) + s }

async function runMeasure(argv, cwd) {
  const { measure } = await import('./measure/driver.js')
  const V = await import('./measure/verdict.js')

  const flag = (name) => {
    const i = argv.indexOf(name)
    return i >= 0 ? argv[i + 1] : null
  }
  const dir = V.baselineDir(cwd, flag('--baseline-dir'))

  if (argv.includes('--baselines')) {
    const list = V.listBaselines(dir)
    if (!list.length) {
      console.log(`暂无基线。先量个参照站存起来：${C.b}contrast-guard measure https://linear.app --save linear${C.x}`)
      return
    }
    console.log(`${C.b}视觉基线${C.x}（${list.length}）  ${C.d}${dir}${C.x}`)
    for (const { name, data } of list) {
      const { motionRate } = await import('./measure/metric.js')
      console.log(`  ${padR(name, 16)} ${data.url}`)
      console.log(`  ${padR('', 16)} ${C.d}动效 ${(motionRate(data) * 100).toFixed(1)}% · 字号集中度 ${(data.fontSize.cover * 100).toFixed(0)}% · 背景灰阶 ${data.bgLum.kinds} 层${C.x}`)
      const sm = data.profile?.signatureMoves
      if (sm?.length) console.log(`  ${padR('', 16)} ${C.d}签名动作：${sm.join('；')}${C.x}`)
      else console.log(`  ${padR('', 16)} ${C.y}⚠ 缺风格画像，只有数字${C.x}`)
    }
    return
  }

  // 剥掉 flag 及其取值，剩下的第一个位置参数就是 URL
  const VALUED = new Set(['--save', '--vs', '--baseline-dir'])
  const positional = []
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) { if (VALUED.has(argv[i])) i++; continue }
    positional.push(argv[i])
  }
  const url = positional[0]
  if (!url) {
    console.error(`${C.r}用法：contrast-guard measure <url> [--save 名] [--vs 名] [--json]${C.x}`)
    process.exit(2)
  }

  let m
  try {
    m = await measure(url.startsWith('http') ? url : `https://${url}`)
  } catch (e) {
    console.error(`${C.r}✗${C.x} ${e.message}`)
    process.exit(1)
  }

  const saveName = flag('--save')
  if (saveName) {
    const p = V.saveBaseline(saveName, m, dir)
    console.log(`${C.g}已存基线${C.x} ${saveName}  ${C.d}${p}${C.x}`)
  }

  if (argv.includes('--json')) {
    console.log(JSON.stringify(m, null, 2))
    return
  }

  const { motionRate } = await import('./measure/metric.js')
  console.log(`\n${C.b}视觉计量${C.x}  ${m.url}`)
  console.log(`${C.d}可见元素 ${m.visible} · 文本元素 ${m.textEls} · 计量耗时 ${m.ms}ms · 驱动 ${m.driver}${C.x}\n`)

  console.log(`${C.b}判据${C.x}`)
  for (const v of V.verdicts(m)) {
    console.log(v.level === 'warn' ? `  ${C.r}⚠${C.x}  ${v.text}` : `  ${C.g}✓${C.x}  ${v.text}`)
  }
  console.log()

  console.log(`${C.b}参考量${C.x} ${C.d}（种类数不构成好坏，只用于横向对比）${C.x}`)
  for (const [label, d] of [
    ['字号', m.fontSize], ['字重', m.fontWeight], ['圆角', m.radius], ['阴影', m.shadow],
    ['间距(padding)', m.pad], ['间隙(gap)', m.gap], ['动效时长', m.duration], ['缓动曲线', m.timing],
  ]) {
    console.log(`  ${padR(label, 14)} ${padL(String(d.kinds), 2)} 种  ${C.d}${V.topNames(d, 3)}${C.x}`)
  }
  console.log()

  const vsName = flag('--vs')
  if (!vsName) return
  let base
  try { base = V.loadBaseline(vsName, dir) } catch {
    console.error(`${C.y}基线 ${vsName} 读取失败${C.x}`)
    return
  }

  console.log(`${C.b}对比基线 ${vsName}${C.x}`)
  console.log(`  ${padR('', 16)} ${padL('本次', 10)} ${padL(vsName, 12)}`)
  for (const c of V.compare(m, base)) {
    const fmt = (n) => (c.unit === '%' ? n.toFixed(c.name === '动效覆盖率' ? 1 : 0) + '%' : String(n))
    const gap = c.higherIsBetter && c.cur < c.ref * 0.7 ? `  ${C.r}← 差距显著${C.x}` : ''
    console.log(`  ${padR(c.name, 16)} ${padL(fmt(c.cur), 10)} ${padL(fmt(c.ref), 12)}${gap}`)
  }
  console.log()

  // 数字对齐了不等于气质对齐——画像是计量抓不到的那部分
  const p = base.profile
  if (p) {
    console.log(`${C.b}${vsName} 的风格画像${C.x} ${C.d}（数字对齐 ≠ 气质对齐）${C.x}`)
    for (const [label, vs] of [
      ['排版', p.typography], ['色彩', p.color], ['布局', p.layout],
      ['动效', p.motion], ['签名动作', p.signatureMoves],
    ]) {
      if (vs?.length) console.log(`  ${padR(label, 10)} ${C.d}${vs.join('；')}${C.x}`)
    }
    console.log()
  }
}
