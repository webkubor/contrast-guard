/**
 * 渲染计量观察与基线。数字描述当前采样，不判断设计美感。
 * 仅调用方显式传入的阈值触发配置提醒；历史阈值保留为兼容导出。
 */
import { motionRate } from './metric.js'
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

// 历史配置值仅供调用方显式选用，并非通用的设计质量标准。
export const THRESHOLDS = {
  motionRateDead: 0.01,
  motionRateLow: 0.03,
  fontCoverMin: 0.80,
  familyMax: 2,
  bgLumMax: 40,
  bgLumMin: 4,
  fgLumMin: 3,
  durationKindsMax: 8,
}

/** 返回带证据来源的观察；缺少采样时标为 unknown。 */
export function verdicts(m, th = {}) {
  const rate = motionRate(m)
  const textSamples = m.textEls > 0
  const visibleSamples = m.visible > 0
  const rules = [
    {
      id: 'motion', known: visibleSamples && Number.isFinite(m.motionEls),
      observed: { elements: m.motionEls, samples: m.visible, rate },
      source: 'computed-style: transitionDuration / visible elements',
      text: `非零 transition 声明覆盖 ${(rate * 100).toFixed(1)}%（${m.motionEls}/${m.visible} 个元素）`,
      limits: [['motionRateDead', rate, 'min'], ['motionRateLow', rate, 'min']],
      nextCheck: '结合交互状态与减弱动效偏好，检查过渡是否符合使用场景。',
    },
    {
      id: 'font-size', known: textSamples && m.fontSize?.kinds > 0 && Number.isFinite(m.fontSize?.cover),
      observed: m.fontSize, source: 'computed-style: fontSize on direct text elements',
      text: `字号 ${m.fontSize?.kinds} 种，前 4 种覆盖 ${((m.fontSize?.cover ?? 0) * 100).toFixed(0)}%`,
      limits: [['fontCoverMin', m.fontSize?.cover, 'min']],
      nextCheck: '结合标题、正文等文本角色检查字号分工与可读性。',
    },
    {
      id: 'font-family', known: textSamples && m.family?.kinds > 0,
      observed: m.family, source: 'computed-style: first fontFamily on direct text elements',
      text: `字体族 ${m.family?.kinds} 种（${topNames(m.family || {}, 3)}）`,
      limits: [['familyMax', m.family?.kinds, 'max']],
      nextCheck: '检查字体加载、语言回退与各文本角色的字体需求。',
    },
    {
      id: 'background-luminance', known: visibleSamples && m.bgLum?.kinds > 0,
      observed: m.bgLum, source: 'computed-style: sampled backgroundColor luminance',
      text: `背景灰阶 ${m.bgLum?.kinds} 层`,
      limits: [['bgLumMin', m.bgLum?.kinds, 'min'], ['bgLumMax', m.bgLum?.kinds, 'max']],
      nextCheck: '结合实际背景与前景配对检查对比度和信息分组。',
    },
    {
      id: 'foreground-luminance', known: textSamples && m.fgLum?.kinds > 0,
      observed: m.fgLum, source: 'computed-style: sampled text color luminance',
      text: `文字灰阶 ${m.fgLum?.kinds} 层`,
      limits: [['fgLumMin', m.fgLum?.kinds, 'min']],
      nextCheck: '检查实际文字与背景的对比度，以及字号、字重等角色线索。',
    },
    {
      id: 'motion-duration', known: visibleSamples && Number.isFinite(m.duration?.kinds),
      observed: m.duration, source: 'computed-style: transitionDuration on visible elements',
      text: `动效时长 ${m.duration?.kinds} 种`,
      limits: [['durationKindsMax', m.duration?.kinds, 'max']],
      nextCheck: '按交互用途检查时长与减弱动效行为；零过渡也可符合设计意图。',
    },
  ]
  return rules.map(({ id, known, observed, source, text, limits, nextCheck }) => {
    const exceeded = known ? limits.filter(([key, value, bound]) =>
      Object.hasOwn(th, key) && Number.isFinite(th[key]) &&
      (bound === 'min' ? value < th[key] : value > th[key])) : []
    const configured = exceeded.map(([key, , bound]) =>
      `${key} ${bound === 'min' ? '≥' : '≤'} ${th[key]}`).join('；')
    return {
      level: exceeded.length ? 'warn' : 'ok',
      text: known ? text + (configured ? `；超出调用方配置限值：${configured}` : '') : '缺少有效采样，观察结果未知',
      ruleId: `measure.${id}`, assessment: known ? 'observation' : 'unknown',
      observed: observed ?? null, source, nextCheck,
    }
  })
}

export function topNames(d, n = 3, max = 28) {
  return (d.top || []).slice(0, n)
    .map((it) => (it.v.length > max ? it.v.slice(0, max - 1) + '…' : it.v))
    .join(' / ')
}

// ─── 基线 ─────────────────────────────────────────────
//
// 风格画像（profile）是人/agent 看过截图后填的，计量抓不到：视觉焦点在哪、
// 留白节奏、签名动作。结构参考 mono-color-skill 的 reference-analysis.json。
// 数字回答「差多少」，画像回答「差在哪种气质」。

export function baselineDir(cwd = process.cwd(), override) {
  return override || resolve(cwd, '.contrast-guard', 'baselines')
}

export function saveBaseline(name, data, dir) {
  mkdirSync(dir, { recursive: true })
  const path = join(dir, `${name}.json`)
  // 画像是最贵的那部分信息，重新计量绝不能把它冲掉
  if (!data.profile && existsSync(path)) {
    try {
      const old = JSON.parse(readFileSync(path, 'utf8'))
      if (old.profile) data.profile = old.profile
    } catch { /* 旧文件坏了就当没有 */ }
  }
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n')
  return path
}

export function loadBaseline(name, dir) {
  return JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8'))
}

export function listBaselines(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const name = f.slice(0, -5)
      try { return { name, data: loadBaseline(name, dir) } } catch { return null }
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** 与基线逐项对比，供 CLI 与调用方复用 */
export function compare(m, base) {
  return [
    { name: '动效覆盖率', cur: motionRate(m) * 100, ref: motionRate(base) * 100, unit: '%' },
    { name: '字号集中度', cur: m.fontSize.cover * 100, ref: base.fontSize.cover * 100, unit: '%' },
    { name: '字号种类', cur: m.fontSize.kinds, ref: base.fontSize.kinds },
    { name: '字体族', cur: m.family.kinds, ref: base.family.kinds },
    { name: '背景灰阶层', cur: m.bgLum.kinds, ref: base.bgLum.kinds },
    { name: '文字灰阶层', cur: m.fgLum.kinds, ref: base.fgLum.kinds },
    { name: '动效时长种类', cur: m.duration.kinds, ref: base.duration.kinds },
    { name: '阴影种类', cur: m.shadow.kinds, ref: base.shadow.kinds },
  ].map((row) => ({ ...row, delta: row.cur - row.ref }))
}
