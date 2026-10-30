/** setup 纯逻辑：包管理器探测、安装命令、scripts 注入、技能挑选与 vite.config 幂等改写。 */
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  detectPackageManager, installArgs, injectScripts, selectSkills, rewriteViteConfig, SETUP_PLUGINS, SELF_DEP,
} from '../src/setup.js'

test('selectSkills 只装缺失的 skill，已存在的跳过不覆盖', () => {
  const r = selectSkills(['apple-design', 'ui-review', 'ui-restore'], ['ui-review'])
  assert.deepEqual(r.toInstall, ['apple-design', 'ui-restore'])
  assert.deepEqual(r.skipped, ['ui-review'])
  assert.deepEqual(selectSkills([], ['x']).toInstall, [])
})

test('detectPackageManager 按锁文件优先级判定，无锁文件回落 npm', () => {
  assert.equal(detectPackageManager(['pnpm-lock.yaml', 'package-lock.json']), 'pnpm')
  assert.equal(detectPackageManager(['yarn.lock']), 'yarn')
  assert.equal(detectPackageManager(['package-lock.json']), 'npm')
  assert.equal(detectPackageManager(['src', 'README.md']), 'npm')
})

test('installArgs 覆盖三种包管理器，self 开关控制自我安装', () => {
  assert.deepEqual(installArgs('pnpm', true), ['pnpm', 'add', '-D', 'vite-plugin-agent-eyes', 'vite-plugin-refresh-guard', SELF_DEP])
  assert.deepEqual(installArgs('yarn', false), ['yarn', 'add', '--dev', 'vite-plugin-agent-eyes', 'vite-plugin-refresh-guard'])
  assert.deepEqual(installArgs('npm', false)[0], 'npm')
  assert.ok(installArgs('npm', true).join(' ').includes(SELF_DEP))
  assert.ok(!installArgs('npm', false).join(' ').includes(SELF_DEP))
})

test('injectScripts 只补缺失的键，不覆盖已有 scripts', () => {
  const first = injectScripts({ dev: 'vite' })
  assert.deepEqual(first.added, ['contrast:check'])
  assert.equal(first.scripts.dev, 'vite')
  assert.equal(first.scripts['contrast:check'], 'contrast-guard check')

  const again = injectScripts(first.scripts)
  assert.deepEqual(again.added, [])
  assert.equal(Object.keys(again.scripts).length, 2)
})

test('rewriteViteConfig 接线单行 plugins 数组并保持可解析', () => {
  const src = `import vue from '@vitejs/plugin-vue'\n\nexport default { plugins: [vue()] }\n`
  const { content, changed } = rewriteViteConfig(src)
  assert.ok(changed)
  for (const p of SETUP_PLUGINS) {
    assert.ok(content.includes(p.importStatement), `缺少 import：${p.pkg}`)
    assert.ok(content.includes(p.pluginEntry), `缺少注册：${p.pkg}`)
  }
  new Function(`return (${content.split('export default')[1].trim().replace(/;$/, '')})`) // 语法可解析
})

test('rewriteViteConfig 支持多行与空 plugins 数组', () => {
  const multi = rewriteViteConfig(`export default defineConfig({\n  plugins: [\n    vue(),\n  ],\n})`)
  assert.ok(multi.changed)
  assert.match(multi.content, /plugins: \[\n    \.\.\.agentEyes\(\),\n    refreshGuard\(\),\n    vue\(\),/)

  const empty = rewriteViteConfig('export default defineConfig({ plugins: [] })')
  assert.ok(empty.changed)
  assert.match(empty.content, /plugins: \[ \.\.\.agentEyes\(\), refreshGuard\(\),\]/)
})

test('rewriteViteConfig 无 plugins 键时补一个，无锚点时不改文件只给指引', () => {
  const noKey = rewriteViteConfig(`import { defineConfig } from 'vite'\n\nexport default defineConfig({\n  base: '/',\n})`)
  assert.ok(noKey.changed)
  assert.match(noKey.content, /plugins: \[\.\.\.agentEyes\(\), refreshGuard\(\)\],/)

  const noAnchor = rewriteViteConfig('export const config = { base: "/" }\n')
  assert.ok(!noAnchor.changed)
  assert.equal(noAnchor.content, 'export const config = { base: "/" }\n')
  assert.ok(noAnchor.notes.some((n) => n.includes('手动')))
})

test('rewriteViteConfig 幂等：对改写结果再跑一次不再改动', () => {
  const src = `import vue from '@vitejs/plugin-vue'\nexport default { plugins: [vue()] }\n`
  const once = rewriteViteConfig(src)
  const twice = rewriteViteConfig(once.content)
  assert.ok(once.changed)
  assert.ok(!twice.changed)
  assert.equal(twice.content, once.content)
})
