/** 编程 API —— 供 CI 脚本或其它工具（如 project-maturity-audit）直接调用 */
export { check } from './check.js'
export { parseColor, contrast, oklchToRgb, solveLightness, toHex, luminance } from './color.js'
export { extractCss, extractJs, extractFile, resolveVar } from './extract.js'
