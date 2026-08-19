/**
 * 执行检查：对每个来源、每条规则算对比度，不达标时反推建议值。
 */
import { parseColor, contrast, solveLightness, toHex } from './color.js'
import { extractFile, resolveVar } from './extract.js'

/**
 * @param {object} config
 * @param {string[]} config.files    要检查的文件（已展开的具体路径）
 * @param {Array<{fg:string,bg:string,min:number,label?:string}>} config.pairs
 * @returns {{results:Array, failed:number, checked:number}}
 */
export function check({ files, pairs }) {
  const results = []
  let failed = 0
  let checked = 0

  for (const file of files) {
    let vars
    try {
      vars = extractFile(file)
    } catch (err) {
      results.push({ file, error: err.message })
      failed++
      continue
    }

    for (const pair of pairs) {
      const fgRaw = resolveVar(vars, pair.fg)
      const bgRaw = resolveVar(vars, pair.bg)
      // 该文件没定义这组变量：跳过而非报错 —— 一个色板文件通常只覆盖部分变量
      if (!fgRaw || !bgRaw) continue

      const bg = parseColor(bgRaw)
      const fg = parseColor(fgRaw, bg)
      if (!fg || !bg) continue

      checked++
      const ratio = contrast(fg, bg)
      const pass = ratio >= pair.min
      if (!pass) failed++

      results.push({
        file,
        pair: pair.label || `${pair.fg} / ${pair.bg}`,
        fg: pair.fg,
        bg: pair.bg,
        fgValue: fgRaw,
        fgHex: toHex(fg),
        bgHex: toHex(bg),
        ratio,
        min: pair.min,
        pass,
        // 核心差异点：不达标时直接给出「改成多少」，而不是只报一个红叉
        suggestion: pass ? null : solveLightness(fgRaw, bg, pair.min),
      })
    }
  }

  return { results, failed, checked }
}
