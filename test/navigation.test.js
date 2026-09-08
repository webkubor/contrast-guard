import { test } from 'node:test'
import assert from 'node:assert/strict'
import { navigationFailed } from '../src/measure/driver.js'

test('导航失败的最终 URL 判死', () => {
  assert.ok(navigationFailed('chrome-error://chromewebdata/'))
  assert.ok(navigationFailed('about:blank'))
})

test('正常页面不误杀', () => {
  assert.ok(!navigationFailed('http://localhost:5173/'))
  assert.ok(!navigationFailed('https://linear.app'))
  // 站点自己的路径里出现 about 不算
  assert.ok(!navigationFailed('https://example.com/about'))
  // 取不到最终 URL 不在这里判死：driver 会回填请求 URL，真空页由 visible 兜底
  assert.ok(!navigationFailed(''))
})
