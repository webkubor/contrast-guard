/** setup 的纯逻辑：依赖清单、包管理器探测、vite.config 幂等改写、scripts 注入。无 IO，便于测试。 */

/** setup 引导接入的 vite 插件。import 写法与各自 README 的推荐用法一致。 */
export const SETUP_PLUGINS = [
  {
    pkg: 'vite-plugin-agent-eyes',
    importStatement: "import { agentEyes } from 'vite-plugin-agent-eyes'",
    pluginEntry: '...agentEyes()',
  },
  {
    pkg: 'vite-plugin-refresh-guard',
    importStatement: "import { refreshGuard } from 'vite-plugin-refresh-guard'",
    pluginEntry: 'refreshGuard()',
  },
]

/** 自我安装走 GitHub git 源：本 CLI 按体系惯例经 git 分发，不依赖 npm registry。 */
export const SELF_DEP = 'github:webkubor/frontend-contrast-guard'

export const SETUP_SCRIPTS = { 'contrast:check': 'contrast-guard check' }

export const CONFIG_TEMPLATE = {
  files: ['src/**/*.css'],
  pairs: [
    { fg: 'text', bg: 'bg', min: 7, label: '正文' },
    { fg: 'accent', bg: 'bg', min: 4.5, label: '链接/主色' },
  ],
}

/** 锁文件优先级：pnpm > yarn > npm（package-lock 或无锁文件时默认 npm）。 */
export function detectPackageManager(filenames) {
  if (filenames.includes('pnpm-lock.yaml')) return 'pnpm'
  if (filenames.includes('yarn.lock')) return 'yarn'
  return 'npm'
}

/** 生成各包管理器的 devDependency 安装命令（数组形式，直接给 spawnSync）。 */
export function installArgs(pm, includeSelf) {
  const deps = SETUP_PLUGINS.map((p) => p.pkg)
  if (includeSelf) deps.push(SELF_DEP)
  if (pm === 'pnpm') return ['pnpm', 'add', '-D', ...deps]
  if (pm === 'yarn') return ['yarn', 'add', '--dev', ...deps]
  return ['npm', 'install', '-D', ...deps]
}

/** 往 scripts 注入 contrast:check；已存在的不覆盖。返回新对象与实际新增键。 */
export function injectScripts(scripts = {}) {
  const added = Object.keys(SETUP_SCRIPTS).filter((key) => !(key in scripts))
  const next = { ...scripts }
  for (const key of added) next[key] = SETUP_SCRIPTS[key]
  return { scripts: next, added }
}

/** 从随包分发的技能库挑出目标项目还没有的：已存在的不覆盖（项目侧可能改过）。 */
export function selectSkills(bundled, existing) {
  return {
    toInstall: bundled.filter((name) => !existing.includes(name)),
    skipped: bundled.filter((name) => existing.includes(name)),
  }
}

/**
 * 幂等改写 vite.config 内容：为未接线的插件补 import 与 plugins 注册。
 * 已含某插件（以包名出现为准）则跳过该插件；找不到可用的 plugins 锚点时
 * 不改文件，只在 notes 里给手动片段——宁可不动，也不产出跑不起来的配置。
 */
export function rewriteViteConfig(content) {
  const notes = []
  const todos = SETUP_PLUGINS.filter((p) => !content.includes(p.pkg))
  if (todos.length === 0) return { content, changed: false, notes: ['插件均已接线，无需改动'] }

  const entries = todos.map((p) => p.pluginEntry)

  // 先找 plugins 锚点；没有再退而求其次往 defineConfig({ 后补一个 plugins 键
  const anchor = /plugins\s*:\s*\[/.exec(content)
  let next = content
  let wired = false
  if (anchor) {
    const at = anchor.index + anchor[0].length
    const multiline = /^\s*\n/.test(next.slice(at))
    const piece = multiline ? `\n    ${entries.join(',\n    ')},` : ` ${entries.join(', ')},`
    next = next.slice(0, at) + piece + next.slice(at)
    wired = true
  } else {
    const def = /defineConfig\s*\(\s*\{/.exec(next)
    if (def) {
      const at = def.index + def[0].length
      next = next.slice(0, at) + `\n  plugins: [${entries.join(', ')}],` + next.slice(at)
      wired = true
    } else {
      notes.push(`未找到 plugins 数组或 defineConfig({，请手动加入 plugins：${entries.join(', ')}`)
    }
  }

  if (!wired) return { content, changed: false, notes }

  // import 插到最后一个顶层 import 之后；没有 import 则放 shebang 之后
  const lines = next.split('\n')
  let at = -1
  for (let i = 0; i < lines.length; i++) if (/^import[\s{]/.test(lines[i])) at = i
  if (at === -1) at = lines[0] && lines[0].startsWith('#!') ? 1 : 0
  else at = at + 1
  lines.splice(at, 0, ...todos.map((p) => p.importStatement))
  next = lines.join('\n')

  return { content: next, changed: true, notes }
}
