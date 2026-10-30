/** transition 声明计量反例：逗号分隔的全零时长不应计成动效。 */
import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { METRIC_SCRIPT } from '../src/measure/metric.js'

const sample = transitionDuration => {
  const element = { childNodes: [{ nodeType: 3, textContent: 'Sample' }] }
  const style = {
    display: 'block', visibility: 'visible', opacity: '1', borderRadius: '0px',
    transitionDuration, transitionTimingFunction: 'ease', boxShadow: 'none',
    gap: 'normal', paddingTop: '0px', backgroundColor: 'rgb(255,255,255)',
    color: 'rgb(0,0,0)', fontSize: '14px', fontWeight: '400', fontFamily: 'sans-serif',
  }
  return vm.runInNewContext(METRIC_SCRIPT, {
    performance: { now: () => 0 },
    document: { querySelectorAll: () => [element] },
    getComputedStyle: () => style,
  })
}
test('all-zero transition list remains a zero declaration count', () => {
  assert.equal(sample('0s, 0s').motionEls, 0)
  assert.equal(sample('0s').motionEls, 0)
})
test('mixed duration list counts one element, not multiple transitions', () => {
  assert.equal(sample('0s, 150ms').motionEls, 1)
  assert.equal(sample('0.2s, 0s').motionEls, 1)
})
