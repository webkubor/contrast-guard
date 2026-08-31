/**
 * 判据与基线。
 *
 * 阈值全部由参照站实测校准，不是拍脑袋定的。校准过程推翻了两个直觉判据，
 * 记在这里免得后来者改回去：
 *
 *  1. 「字号种类越少越好」是错的。设计标杆站（Linear）实测 14 种字号，
 *     比很多平庸站点还多。稳健的判据是**分布集中度**——前 4 种覆盖多少。
 *     凭空定「字号 ≤5 种」，第一天就会把标杆站判成不及格。
 *  2. 圆角 / 阴影 / 间距的**种类数没有判别力**。同一标杆站圆角 21 种、
 *     阴影 14 种同样很高，复杂站点天然种类多。这类只作横向参考，不报警。
 *
 * 通用教训：定阈值前必须先量参照物，标杆站跑出来全绿才说明尺子是准的。
 */
import { motionRate } from './metric.js'
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

export const THRESHOLDS = {
  motionRateDead: 0.01,   // 低于此判定动效缺失
  motionRateLow: 0.03,    // 低于此判定偏低（参照站量级 ~0.09）
  fontCoverMin: 0.80,     // 前 4 种字号覆盖率下限
  familyMax: 2,           // 字体族上限
  bgLumMax: 40,           // 背景灰阶层数上限（参照站 ~20）
  bgLumMin: 4,            // 下限：低于此说明压不出层级
  fgLumMin: 3,            // 文字灰阶下限：低于此说明主次没拉开
  durationKindsMax: 8,    // 动效时长档位上限
}

export function verdicts(m, th = THRESHOLDS) {
  const out = []
  const warn = (text) => out.push({ level: 'warn', text })
  const ok = (text) => out.push({ level: 'ok', text })

  const rate = motionRate(m)
  if (rate < th.motionRateDead) {
    warn(`动效几乎不存在：仅 ${m.motionEls}/${m.visible} 个元素带 transition（${(rate * 100).toFixed(2)}%）。定义了 motion token ≠ 用上了`)
  } else if (rate < th.motionRateLow) {
    warn(`动效覆盖偏低：${m.motionEls}/${m.visible}（${(rate * 100).toFixed(1)}%），状态切换多半是硬跳`)
  } else {
    ok(`动效覆盖 ${(rate * 100).toFixed(1)}%（${m.motionEls} 个元素）`)
  }

  if (m.fontSize.cover < th.fontCoverMin) {
    warn(`字号碎片化：${m.fontSize.kinds} 种，前 4 种只覆盖 ${(m.fontSize.cover * 100).toFixed(0)}%（健康线 ≥${th.fontCoverMin * 100}%）`)
  } else {
    ok(`字号分布集中：${m.fontSize.kinds} 种，前 4 种覆盖 ${(m.fontSize.cover * 100).toFixed(0)}%`)
  }

  if (m.family.kinds > th.familyMax) {
    warn(`字体族混用 ${m.family.kinds} 种（${topNames(m.family, 3)}），超过 ${th.familyMax} 种通常是失控而非分工`)
  } else {
    ok(`字体族 ${m.family.kinds} 种（${topNames(m.family, 2)}）`)
  }

  if (m.bgLum.kinds > th.bgLumMax) {
    warn(`背景灰阶 ${m.bgLum.kinds} 层，大量一次性色值绕过了 token（参照站量级约 20）`)
  } else if (m.bgLum.kinds < th.bgLumMin) {
    warn(`背景灰阶仅 ${m.bgLum.kinds} 层，画面会显得平、压不出层级`)
  } else {
    ok(`背景灰阶 ${m.bgLum.kinds} 层`)
  }

  if (m.fgLum.kinds < th.fgLumMin) {
    warn(`文字灰阶仅 ${m.fgLum.kinds} 层，主次文本没有拉开`)
  }

  if (m.duration.kinds > th.durationKindsMax) {
    warn(`动效时长 ${m.duration.kinds} 种，未收敛到 token 档位`)
  }

  return out
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
    { name: '动效覆盖率', cur: motionRate(m) * 100, ref: motionRate(base) * 100, unit: '%', higherIsBetter: true },
    { name: '字号集中度', cur: m.fontSize.cover * 100, ref: base.fontSize.cover * 100, unit: '%', higherIsBetter: true },
    { name: '字号种类', cur: m.fontSize.kinds, ref: base.fontSize.kinds },
    { name: '字体族', cur: m.family.kinds, ref: base.family.kinds },
    { name: '背景灰阶层', cur: m.bgLum.kinds, ref: base.bgLum.kinds },
    { name: '文字灰阶层', cur: m.fgLum.kinds, ref: base.fgLum.kinds },
    { name: '动效时长种类', cur: m.duration.kinds, ref: base.duration.kinds },
    { name: '阴影种类', cur: m.shadow.kinds, ref: base.shadow.kinds },
  ]
}
