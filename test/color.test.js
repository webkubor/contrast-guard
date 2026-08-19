import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseColor, contrast, solveLightness, toHex, oklchToRgb } from '../src/color.js'
import { extractCss, extractJs, resolveVar } from '../src/extract.js'
import { check } from '../src/check.js'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const near = (a, b, tol = 0.02) => Math.abs(a - b) < tol

test('oklch 解析与已知色值一致', () => {
  // 这些是 typora-Bloom-theme 实际用过的值，hex 由浏览器渲染核对过
  assert.equal(toHex(oklchToRgb(0.64, 0.22, 350)), '#e63f9f') // petal 修正前
  assert.equal(toHex(oklchToRgb(0.58, 0.22, 350)), '#d0268c') // petal 修正后
  assert.equal(toHex(oklchToRgb(0.62, 0.12, 195)), '#009c9c') // ripple 修正前
})

test('parseColor 支持 oklch / hex / rgb', () => {
  assert.ok(parseColor('oklch(50% 0.08 240)'))
  assert.deepEqual(parseColor('#ffffff'), [1, 1, 1])
  assert.deepEqual(parseColor('#fff'), [1, 1, 1])
  assert.deepEqual(parseColor('rgb(0, 0, 0)'), [0, 0, 0])
  assert.equal(parseColor('not-a-color'), null)
})

test('rgba 带 alpha 时按 backdrop 合成', () => {
  const white = [1, 1, 1]
  const half = parseColor('rgba(0, 0, 0, 0.5)', white)
  assert.ok(near(half[0], 0.5))
})

test('对比度：黑白为 21:1，同色为 1:1', () => {
  assert.ok(near(contrast([0, 0, 0], [1, 1, 1]), 21, 0.1))
  assert.ok(near(contrast([1, 1, 1], [1, 1, 1]), 1, 0.001))
})

test('复现实战数据：6 套主题的实际对比度', () => {
  // 2026-08-19 在 typora-Bloom-theme 查出的真实缺口，用作回归基线
  const cases = [
    ['oklch(64% 0.22 350)', 'oklch(98% 0.01 350)', 3.55], // petal
    ['oklch(62% 0.12 195)', 'oklch(96% 0.01 195)', 3.02], // ripple
    ['oklch(62% 0.11 115)', 'oklch(97% 0.008 115)', 3.27], // sage
  ]
  for (const [fg, bg, expected] of cases) {
    const r = contrast(parseColor(fg), parseColor(bg))
    assert.ok(near(r, expected, 0.05), `${fg}: 期望 ~${expected}，实际 ${r.toFixed(2)}`)
  }
})

test('solveLightness 反推出达标值且保持色相彩度', () => {
  const bg = parseColor('oklch(98% 0.01 350)')
  const s = solveLightness('oklch(64% 0.22 350)', bg, 4.5)
  assert.ok(s, '应有解')
  assert.ok(s.ratio >= 4.5, `解出的比值应达标，实际 ${s.ratio}`)
  assert.ok(s.L < 64, '深色前景应被压暗')
  assert.ok(s.delta < 0)
})

test('solveLightness 对浅色前景会提亮而非压暗', () => {
  const bg = parseColor('oklch(20% 0.02 195)') // 深底
  const s = solveLightness('oklch(30% 0.12 195)', bg, 4.5)
  assert.ok(s && s.L > 30, '深底上的前景应被提亮')
  assert.ok(s.delta > 0)
})

test('无解时返回 null，而不是给一个假的建议', () => {
  const bg = parseColor('#808080')
  // 中灰底上，彩度极低的中灰前景无论怎么调明度都难达 21:1
  assert.equal(solveLightness('oklch(50% 0.01 240)', bg, 21), null)
})

test('extractCss 抓取自定义属性', () => {
  const vars = extractCss(':root { --accent: oklch(50% 0.08 240); --bg: #fff; }')
  assert.equal(vars.accent, 'oklch(50% 0.08 240)')
  assert.equal(vars.bg, '#fff')
})

test('extractJs 抓取内联色值对象', () => {
  const vars = extractJs(`{ name: "wheat", colors: { accent: "oklch(60% 0.065 82)", bg: "#fbf9f6" } }`)
  assert.equal(vars.accent, 'oklch(60% 0.065 82)')
  assert.equal(vars.bg, '#fbf9f6')
})

test('resolveVar 跟随 var() 引用', () => {
  const vars = { accent: 'oklch(50% 0.08 240)', link: 'var(--accent)' }
  assert.equal(resolveVar(vars, 'link'), 'oklch(50% 0.08 240)')
})

test('check 端到端：不达标时带出建议值', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cg-'))
  const f = join(dir, 'theme.css')
  writeFileSync(f, ':root { --accent: oklch(64% 0.22 350); --bg: oklch(98% 0.01 350); }')
  const { results, failed, checked } = check({
    files: [f],
    pairs: [{ fg: 'accent', bg: 'bg', min: 4.5 }],
  })
  assert.equal(checked, 1)
  assert.equal(failed, 1)
  assert.equal(results[0].pass, false)
  assert.ok(results[0].suggestion, '不达标必须给出建议值')
  assert.ok(results[0].suggestion.ratio >= 4.5)
})

test('check 跳过未定义该组变量的文件，而不是报错', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cg-'))
  const f = join(dir, 'partial.css')
  writeFileSync(f, ':root { --accent: #000; }') // 没有 --bg
  const { failed, checked } = check({ files: [f], pairs: [{ fg: 'accent', bg: 'bg', min: 4.5 }] })
  assert.equal(checked, 0)
  assert.equal(failed, 0)
})
