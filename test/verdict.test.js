/** 渲染计量观察、显式限值与基线辅助函数的回归测试。 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import {
  THRESHOLDS, verdicts, compare, topNames,
  baselineDir, saveBaseline, loadBaseline, listBaselines,
} from '../src/measure/verdict.js'

const dist = (kinds, cover = 1) => ({ kinds, cover, top: kinds ? [{ v: 'sample', n: 10 }] : [] })
const sample = (overrides = {}) => ({
  visible: 100, textEls: 10, motionEls: 0,
  fontSize: dist(1), family: dist(1), bgLum: dist(1), fgLum: dist(1),
  duration: dist(0, 0), shadow: dist(0, 0), ...overrides,
})

test('plain monochrome designs with no motion produce observations without warnings', () => {
  const rows = verdicts(sample())
  assert.equal(rows.length, 6)
  assert.equal(new Set(rows.map((row) => row.ruleId)).size, 6)
  for (const row of rows) {
    assert.equal(row.level, 'ok')
    assert.equal(row.assessment, 'observation')
    assert.ok(row.ruleId.startsWith('measure.'))
    assert.ok(row.observed)
    assert.ok(row.source)
    assert.ok(row.nextCheck)
    assert.doesNotMatch(row.text, /失控|碎片化|健康线|平庸|压不出|偏低|缺失/)
  }
  assert.match(rows[0].text, /0\.0%/)
})

test('high counts and dispersed fonts also stay neutral by default', () => {
  const rows = verdicts(sample({
    fontSize: dist(20, 0.3), family: dist(8), bgLum: dist(80), duration: dist(20),
  }))
  assert.ok(rows.every((row) => row.level === 'ok' && row.assessment === 'observation'))
})

test('zero samples and missing distributions report unknown even with configured limits', () => {
  const rows = verdicts({ visible: 0, textEls: 0, motionEls: 0 }, THRESHOLDS)
  assert.ok(rows.every((row) => row.assessment === 'unknown' && row.level === 'ok'))
  assert.ok(rows.every((row) => /未知/.test(row.text)))
  assert.ok(rows.every((row) => Object.hasOwn(row, 'observed') && row.source && row.nextCheck))
  const emptyText = verdicts(sample({ textEls: 0 }))
  assert.equal(emptyText.find((row) => row.ruleId === 'measure.font-size').assessment, 'unknown')
  assert.equal(emptyText.find((row) => row.ruleId === 'measure.foreground-luminance').assessment, 'unknown')
  assert.equal(verdicts(sample({ bgLum: dist(0) }))[3].assessment, 'unknown')
})

test('only explicit finite configured thresholds warn and identify their source', () => {
  const rows = verdicts(sample(), { motionRateLow: 0.03, bgLumMin: 4 })
  assert.deepEqual(rows.filter((row) => row.level === 'warn').map((row) => row.ruleId), [
    'measure.motion', 'measure.background-luminance',
  ])
  assert.ok(rows.filter((row) => row.level === 'warn').every((row) =>
    row.assessment === 'observation' && /调用方配置限值/.test(row.text)))
  assert.match(rows[0].text, /motionRateLow ≥ 0.03/)
  assert.ok(verdicts(sample(), { familyMax: 1 }).every((row) => row.level === 'ok'))
  assert.ok(verdicts(sample(), { familyMax: NaN }).every((row) => row.level === 'ok'))
  assert.equal(THRESHOLDS.motionRateDead, 0.01)
  assert.equal(THRESHOLDS.fontCoverMin, 0.8)
})

test('legacy threshold keys support caller-selected upper and lower limits', () => {
  const rows = verdicts(sample({
    family: dist(3), fontSize: dist(10, 0.5), bgLum: dist(50), duration: dist(9),
  }), THRESHOLDS)
  assert.ok(rows.every((row) => row.level === 'warn'))
  assert.match(rows[1].text, /fontCoverMin ≥ 0.8/)
  assert.match(rows[2].text, /familyMax ≤ 2/)
  assert.match(rows[3].text, /bgLumMax ≤ 40/)
  assert.match(rows[4].text, /fgLumMin ≥ 3/)
  assert.match(rows[5].text, /durationKindsMax ≤ 8/)
})

test('rule IDs remain stable across sample values and explicit thresholds', () => {
  const ids = (rows) => rows.map((row) => row.ruleId)
  assert.deepEqual(ids(verdicts(sample())), ids(verdicts(sample({ visible: 0, textEls: 0 }), THRESHOLDS)))
})

test('compare reports signed neutral deltas without ranking motion or font coverage', () => {
  const current = sample({ motionEls: 10, fontSize: dist(5, 0.5), family: dist(2) })
  const base = sample({ motionEls: 20, fontSize: dist(3, 1) })
  const rows = compare(current, base)
  assert.equal(rows.length, 8)
  assert.equal(rows[0].delta, -10)
  assert.equal(rows[1].delta, -50)
  assert.equal(rows[2].delta, 2)
  assert.equal(rows[3].delta, 1)
  assert.equal(rows[0].unit, '%')
  for (const row of rows) {
    assert.equal(Object.hasOwn(row, 'higherIsBetter'), false)
    assert.equal(row.delta, row.cur - row.ref)
  }
})

test('topNames preserves ordering, defaults, and truncation', () => {
  assert.equal(topNames({}), '')
  assert.equal(topNames({ top: [{ v: 'abcdef' }, { v: 'second' }] }, 1, 4), 'abc…')
  assert.equal(topNames({ top: [{ v: 'first' }, { v: 'second' }] }), 'first / second')
})

test('baseline path, save, load, sorting and profile preservation remain intact', () => {
  const dir = mkdtempSync(join(tmpdir(), 'contrast-verdict-'))
  try {
    assert.equal(baselineDir('/project'), resolve('/project', '.contrast-guard', 'baselines'))
    assert.equal(baselineDir('/project', dir), dir)
    assert.deepEqual(listBaselines(join(dir, 'missing')), [])
    const profile = { focus: 'content' }
    const path = saveBaseline('z', { ...sample(), profile }, dir)
    assert.equal(path, join(dir, 'z.json'))
    saveBaseline('z', sample({ motionEls: 2 }), dir)
    assert.deepEqual(loadBaseline('z', dir).profile, profile)
    assert.equal(loadBaseline('z', dir).motionEls, 2)
    saveBaseline('a', sample(), dir)
    writeFileSync(join(dir, 'broken.json'), '{')
    writeFileSync(join(dir, 'ignore.txt'), 'ignore')
    assert.deepEqual(listBaselines(dir).map((item) => item.name), ['a', 'z'])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
