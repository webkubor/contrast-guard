/**
 * 浏览器驱动探测。
 *
 * 计量必须在真实渲染后的页面上做，所以需要一个浏览器。但本包的承诺是
 * **零依赖**——所以浏览器驱动一律做**运行时探测**，绝不写进 dependencies：
 * 装了什么就用什么，都没装就明确报错告诉用户装哪个。
 *
 * `contrast-guard check`（静态对比度）完全不碰这里，仍然零依赖、CI 里裸跑。
 */
import { spawn } from 'node:child_process'
import { METRIC_SCRIPT } from './metric.js'

/** which/where 的跨平台版本，避免为一次探测引入依赖 */
function hasBin(name) {
  return new Promise((res) => {
    const p = spawn(process.platform === 'win32' ? 'where' : 'which', [name], { stdio: 'ignore' })
    p.on('close', (code) => res(code === 0))
    p.on('error', () => res(false))
  })
}

async function hasModule(name) {
  try { await import(name); return true } catch { return false }
}

/**
 * 探测可用驱动。ego-browser 优先——它复用用户已登录的浏览器状态，
 * 能直接量需要登录才看得到的页面（控制台、后台），playwright 得自己处理鉴权。
 */
export async function detectDriver() {
  if (await hasBin('ego-browser')) return 'ego'
  if (await hasModule('playwright')) return 'playwright'
  return null
}

function run(cmd, args, input) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args)
    let out = '', err = ''
    // ego-browser 的 cliLog 写的是 stderr，两路都得收，否则永远拿不到结果
    p.stdout.on('data', (d) => { out += d })
    p.stderr.on('data', (d) => { err += d })
    p.on('error', rej)
    p.on('close', (code) => code === 0 ? res(out + err) : rej(new Error(err || `exit ${code}`)))
    if (input) { p.stdin.write(input); p.stdin.end() }
  })
}

/** 从混杂输出里挑出最后一行合法 JSON */
function lastJSON(text) {
  let found = null
  for (const line of text.split('\n')) {
    const s = line.trim()
    if (s.startsWith('{') && s.endsWith('}')) {
      try { found = JSON.parse(s) } catch { /* 不是完整 JSON，继续找 */ }
    }
  }
  return found
}

async function measureWithEgo(url, { timeout = 25, settle = 2 } = {}) {
  // ⚠️ ego-browser 的 wait() 单位是**秒**不是毫秒。wait(500) 是 8 分钟，
  // 会表现成「打开页面挂起」——页面其实早开好了，卡的是这句 sleep。
  //
  // openOrReuseTab 的 wait:true 在有长连接/轮询的站点上可能永远等不到 idle，
  // 所以 try 住：超时也继续量，此时页面通常早就可用了。
  const script = `
const t = await useOrCreateTaskSpace('contrast-guard-measure')
try { await openOrReuseTab(${JSON.stringify(url)}, { wait: true, timeout: ${timeout} }) } catch (e) { }
await wait(${settle})
const d = await js(${'`'}${METRIC_SCRIPT}${'`'})
try { d.url = (await pageInfo()).url } catch (e) { d.url = ${JSON.stringify(url)} }
cliLog(JSON.stringify(d))
`
  const raw = await run('ego-browser', ['nodejs'], script)
  const data = lastJSON(raw)
  if (!data) throw new Error(`未取到计量结果。原始输出:\n${raw.trim()}`)
  return data
}

async function measureWithPlaywright(url, { timeout = 25, settle = 2 } = {}) {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeout * 1000 })
    await page.waitForTimeout(settle * 1000)
    const data = await page.evaluate(METRIC_SCRIPT)
    data.url = page.url()
    return data
  } finally {
    await browser.close()
  }
}

// 导航失败的最终 URL 判据。抽出来是为了能不起浏览器就测。
export function navigationFailed(finalURL) {
  return /^(chrome-error:|about:blank)/.test(finalURL || '')
}

export async function measure(url, opts = {}) {
  const driver = opts.driver || (await detectDriver())
  if (!driver) {
    throw new Error(
      '需要一个浏览器驱动才能做渲染后计量，两个都没检测到。\n' +
      '  · ego-browser（推荐，复用已登录状态，能量需要登录的页面）\n' +
      '  · playwright：npm i -D playwright && npx playwright install chromium\n' +
      '静态对比度检查不需要浏览器，contrast-guard check 仍可直接用。'
    )
  }
  const data = driver === 'ego'
    ? await measureWithEgo(url, opts)
    : await measureWithPlaywright(url, opts)

  // 导航失败时浏览器停在错误页，而错误页**有**可见元素，下面的 visible 兜底抓不到，
  // 于是量出一份错误页的指标被当成页面指标（2026-09-03 踩过：终端 curl 200、
  // ego-browser 手开能渲染，cs ui 却出 chrome-error 的数）。按最终 URL 判死。
  if (navigationFailed(data.url)) {
    throw new Error(
      `页面没打开成功，浏览器停在 ${data.url}——量到的是错误页不是你的页面。\n` +
      '  · 本地预览：确认 dev server 还在跑，端口与路径对得上\n' +
      '  · localhost 打不开时改用 127.0.0.1（驱动与 server 不在同一解析视角）'
    )
  }
  if (!data.visible) {
    throw new Error('页面没有可见元素——可能没加载完、需要登录，或 URL 打错了')
  }
  data.driver = driver
  return data
}
