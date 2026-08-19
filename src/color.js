/**
 * 颜色解析与 WCAG 对比度计算。零依赖。
 *
 * 支持 oklch() 是这个包存在的主要理由之一：现代主题普遍用 oklch 定义色板
 * （感知均匀、明暗切换不跳变），但多数对比度工具只认 hex/rgb，
 * 于是「用 oklch 写的色板」正好落在检查的盲区里。
 */

/** oklch → 线性 sRGB → gamma 编码的 sRGB，各分量 0..1 */
export function oklchToRgb(L, C, H) {
  const h = (H * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3

  const encode = (x) => {
    x = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(x, 0), 1 / 2.4) - 0.055
    return Math.min(1, Math.max(0, x))
  }
  return [
    encode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    encode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    encode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

/**
 * 解析颜色字符串 → [r,g,b]（0..1），无法识别返回 null。
 * 支持 oklch() / #rgb / #rrggbb / rgb() / rgba()。
 * rgba 带 alpha 时需要 backdrop 才能算出实际观感色，否则按不透明处理。
 */
export function parseColor(input, backdrop = null) {
  if (!input) return null
  const s = String(input).trim()

  const ok = s.match(/oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/i)
  if (ok) {
    const L = parseFloat(ok[1])
    return oklchToRgb(s.includes('%') ? L / 100 : L, parseFloat(ok[2]), parseFloat(ok[3]))
  }

  const hex6 = s.match(/^#([0-9a-f]{6})$/i)
  if (hex6) return [0, 2, 4].map((i) => parseInt(hex6[1].slice(i, i + 2), 16) / 255)

  const hex3 = s.match(/^#([0-9a-f]{3})$/i)
  if (hex3) return [0, 1, 2].map((i) => parseInt(hex3[1][i].repeat(2), 16) / 255)

  const rgb = s.match(/rgba?\(([^)]+)\)/i)
  if (rgb) {
    const parts = rgb[1].split(/[,\s/]+/).filter(Boolean).map(Number)
    const [r, g, b, a] = parts
    const base = [r / 255, g / 255, b / 255]
    if (a != null && a < 1 && backdrop) {
      return base.map((v, i) => v * a + backdrop[i] * (1 - a))
    }
    return base
  }

  return null
}

/** sRGB（0..1）→ oklch，用于对 hex/rgb 也能反推建议明度 */
export function rgbToOklch([r, g, b]) {
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const R = lin(r), G = lin(g), B = lin(b)

  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s

  const C = Math.sqrt(A * A + Bb * Bb)
  let H = (Math.atan2(Bb, A) * 180) / Math.PI
  if (H < 0) H += 360
  return { L, C, H }
}

/** WCAG 相对亮度 */
export function luminance([r, g, b]) {
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

/** WCAG 对比度，1..21 */
export function contrast(fg, bg) {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
  return (hi + 0.05) / (lo + 0.05)
}

export function toHex(rgb) {
  return '#' + rgb.map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('')
}

/**
 * 反推：保持色相与彩度不变，只调明度，求刚好达标的 oklch L 值。
 *
 * 这是本包最有用的一步。只报「不达标」，改的人还要自己试色；
 * 直接给出「L 压到多少」，才是能立刻执行的结论。
 * 走 0.5 步长而非二分，是为了输出人写得出来的整齐数值（58% 而不是 57.8342%）。
 *
 * @returns {{L:number, ratio:number, hex:string, delta:number} | null} 无解返回 null
 */
export function solveLightness(colorStr, bgRgb, min, { step = 0.5 } = {}) {
  let L0, C, H
  const m = String(colorStr).match(/oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/i)
  if (m) {
    L0 = parseFloat(m[1]); C = parseFloat(m[2]); H = parseFloat(m[3])
  } else {
    // hex / rgb 也要能给建议：编译后的成品几乎都是 hex，
    // 而那正是最需要建议值的场合（人看到的是 dist，改的是源码）。
    // 先转进 oklch 求解，输出时同时给回 hex，两边都能直接用。
    const rgb = parseColor(colorStr)
    if (!rgb) return null
    const o = rgbToOklch(rgb)
    L0 = o.L * 100; C = o.C; H = o.H
  }
  const bgLum = luminance(bgRgb)

  // 前景比背景暗就往下压，反之往上提
  const down = luminance(oklchToRgb(L0 / 100, C, H)) < bgLum
  for (let i = 1; i <= 200; i++) {
    const L = down ? L0 - i * step : L0 + i * step
    if (L <= 0 || L >= 100) break
    const rgb = oklchToRgb(L / 100, C, H)
    const r = contrast(rgb, bgRgb)
    // 留一点余量：卡在 4.4999 会因浮点显示成 4.50 却仍判失败
    if (r >= min + 0.01) {
      return { L: Number(L.toFixed(1)), ratio: r, hex: toHex(rgb), delta: Number((L - L0).toFixed(1)) }
    }
  }
  return null
}
