/** setup CLI：把 contrast-guard 本体、体系技能库、配套 vite 插件与 logo skill 引导装进当前 Vite 项目。 */
import { readFileSync, writeFileSync, copyFileSync, existsSync, readdirSync, mkdirSync, cpSync } from 'node:fs'
import { resolve, basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import {
  rewriteViteConfig, injectScripts, detectPackageManager, installArgs, selectSkills,
  SETUP_PLUGINS, SELF_DEP, CONFIG_TEMPLATE,
} from './setup.js'

const SKILL_REPO = 'https://github.com/webkubor/logo-brand-designer.git'
const VITE_CONFIGS = ['vite.config.js', 'vite.config.ts', 'vite.config.mjs', 'vite.config.mts']

function stamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

export function runSetup(args, cwd = process.cwd()) {
  const flags = {
    install: !args.includes('--skip-install'),
    config: !args.includes('--skip-config'),
    scripts: !args.includes('--skip-scripts'),
    skill: !args.includes('--skip-skill'),
    self: !args.includes('--skip-self'),
  }
  const dry = args.includes('--dry-run')

  try {
    // 1. 前置检查：必须是含 vite 依赖的 Node 项目
    const pkgPath = resolve(cwd, 'package.json')
    if (!existsSync(pkgPath)) throw new Error('未找到 package.json：请在项目根目录运行 setup')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    const hasVite = ['dependencies', 'devDependencies', 'peerDependencies'].some((k) => pkg[k] && 'vite' in pkg[k])
    if (!hasVite) throw new Error('package.json 依赖里没有 vite：setup 面向 Vite 项目')
    const pm = detectPackageManager(readdirSync(cwd))

    // 2. 安装依赖（失败则中止，不动 vite 配置，避免产出跑不起来的接线）
    let installNote = '跳过（--skip-install）'
    if (flags.install) {
      const cmd = installArgs(pm, flags.self)
      installNote = cmd.join(' ')
      if (!dry) {
        const r = spawnSync(cmd[0], cmd.slice(1), { cwd, stdio: 'inherit' })
        if (r.status !== 0) throw new Error(`依赖安装失败：${cmd[0]} 退出码 ${r.status}；vite 配置未改动`)
      }
    }

    // 3. vite.config 接线（先备份再改写，幂等可重复跑）
    const configNotes = []
    if (flags.config) {
      const file = VITE_CONFIGS.map((f) => resolve(cwd, f)).find(existsSync)
      if (!file) {
        configNotes.push(`未找到 ${VITE_CONFIGS.join('/')}，请手动把 ${SETUP_PLUGINS.map((p) => p.pluginEntry).join('、')} 加入 plugins`)
      } else {
        const { content, changed, notes } = rewriteViteConfig(readFileSync(file, 'utf8'))
        if (changed) {
          if (!dry) {
            copyFileSync(file, `${file}.cg-backup-${stamp()}`)
            writeFileSync(file, content)
            configNotes.push(`已接线 ${basename(file)}（原文件备份为 *.cg-backup-*）`)
          } else configNotes.push(`[dry-run] 将改写 ${basename(file)}`)
        } else configNotes.push('vite 配置无需改动')
        configNotes.push(...notes)
      }
    } else configNotes.push('跳过（--skip-config）')

    // 4. package.json 注入 scripts（不覆盖已有键）。
    // 安装步骤会改写 package.json（写入 devDependencies），必须重读最新内容再写回，
    // 否则会用安装前的旧快照把新装的依赖声明冲掉。
    let scriptsNote = '跳过（--skip-scripts）'
    if (flags.scripts) {
      const fresh = JSON.parse(readFileSync(pkgPath, 'utf8'))
      const { scripts, added } = injectScripts(fresh.scripts)
      if (added.length) {
        fresh.scripts = scripts
        if (!dry) writeFileSync(pkgPath, JSON.stringify(fresh, null, 2) + '\n')
        scriptsNote = dry
          ? `[dry-run] 将新增 ${added.map((k) => `${k} → ${fresh.scripts[k]}`).join('、')}`
          : `新增 ${added.map((k) => `${k} → ${fresh.scripts[k]}`).join('、')}`
      } else scriptsNote = 'contrast:check 已存在，未改动'
    }

    // 5. contrast.config.json 模板
    const cfgPath = resolve(cwd, 'contrast.config.json')
    let cfgNote = '已存在，未改动'
    if (!existsSync(cfgPath)) {
      if (!dry) writeFileSync(cfgPath, JSON.stringify(CONFIG_TEMPLATE, null, 2) + '\n')
      cfgNote = dry
        ? '[dry-run] 将生成 contrast.config.json 模板'
        : '已生成模板（files/pairs 改成你的变量名后运行 contrast:check）'
    }

    // 6. 技能库落进项目 .zcode/skills：
    //    6a 随包分发的体系 skills/ 直接复制（无需网络，已存在跳过不覆盖）
    //    6b logo-brand-designer 独立仓库，git 克隆
    const skillNotes = []
    if (flags.skill) {
      const skillsRoot = resolve(cwd, '.zcode/skills')
      const bundledRoot = fileURLToPath(new URL('../skills/', import.meta.url))
      if (existsSync(bundledRoot)) {
        const bundled = readdirSync(bundledRoot, { withFileTypes: true })
          .filter((d) => d.isDirectory()).map((d) => d.name).sort()
        const existing = existsSync(skillsRoot) ? readdirSync(skillsRoot) : []
        const { toInstall, skipped } = selectSkills(bundled, existing)
        if (!dry) {
          for (const name of toInstall) {
            mkdirSync(skillsRoot, { recursive: true })
            cpSync(join(bundledRoot, name), join(skillsRoot, name), { recursive: true })
          }
        }
        skillNotes.push(dry
          ? `[dry-run] 将复制 ${toInstall.length} 个体系 skill${toInstall.length ? '：' + toInstall.join('、') : ''}${skipped.length ? `；已存在跳过 ${skipped.length} 个` : ''}`
          : `体系 skill 复制 ${toInstall.length} 个${skipped.length ? `、跳过已存在 ${skipped.length} 个` : ''} → .zcode/skills/（随 git 共享给团队）`)
      }
      const logoDest = join(skillsRoot, 'logo-brand-designer')
      if (existsSync(logoDest)) {
        skillNotes.push('logo-brand-designer 已存在')
      } else if (spawnSync('git', ['--version']).status !== 0) {
        skillNotes.push(`未找到 git，手动执行：git clone --depth 1 ${SKILL_REPO} .zcode/skills/logo-brand-designer`)
      } else if (dry) {
        skillNotes.push('[dry-run] 将克隆 logo-brand-designer 到 .zcode/skills/')
      } else {
        mkdirSync(skillsRoot, { recursive: true })
        const r = spawnSync('git', ['clone', '--depth', '1', SKILL_REPO, logoDest], { cwd, stdio: 'inherit' })
        skillNotes.push(r.status === 0
          ? 'logo-brand-designer 已克隆到 .zcode/skills/'
          : `克隆失败，手动执行：git clone --depth 1 ${SKILL_REPO} .zcode/skills/logo-brand-designer`)
      }
    } else skillNotes.push('跳过（--skip-skill）')

    // 7. 摘要与后续指引
    console.log('\n前端工程体系 setup 结果：')
    console.log(`  依赖安装     ${installNote}`)
    for (const n of configNotes) console.log(`  vite 配置    ${n}`)
    console.log(`  scripts      ${scriptsNote}`)
    console.log(`  配色配置     ${cfgNote}`)
    for (const n of skillNotes) console.log(`  skill        ${n}`)
    console.log(`
CI 接入（GitHub Actions step 示例）：
  - run: ${pm} install
  - run: ${pm} run contrast:check

cs 工具链（可选，setup 不自动安装）：
  cs-mcp     curl -fsSL https://raw.githubusercontent.com/webkubor/cs-mcp/main/install.sh | bash
  ego-browser  参考 https://lite.ego.app

说明：本 CLI 经 GitHub git 源分发（${SELF_DEP}），不依赖 npm registry；两个 vite 插件来自 npm。`)
    return 0
  } catch (error) {
    console.error(`Setup error: ${error.message}`)
    return 2
  }
}
