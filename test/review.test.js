/** 视觉评审证据门禁：空报告 HOLD、可比复测、缺失/伪通过反例与 CLI 退出码。 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { reviewTemplate, evaluateReview, DIMENSIONS } from '../src/review.js'

function fixture() {
  const data = reviewTemplate()
  data.contract = Object.fromEntries(Object.keys(data.contract).map(key => [key, `Explained ${key}`]))
  data.scope = { revision: 'rev1', routes: ['/'], themes: ['light'], widths: [390], states: ['default'], rationale: 'Changed narrow screen; full theme matrix reviewed separately.' }
  data.evidence = [{
    id: 'before', route: '/', theme: 'light', width: 390, height: 844, state: 'default',
    screenshot: 'screens/before.png', revision: 'rev1', reviewer: 'reviewer-a',
    observation: 'Primary action and title are legible in the screenshot.',
    capturedAt: '2026-10-26T13:00:00Z', status: 'reviewed', scrollWidth: 390,
  }]
  data.assessments = DIMENSIONS.map(dimension => ({
    dimension, status: 'pass', evidenceIds: ['before'],
    observation: `Observed ${dimension}`, rationale: 'Supports the declared user task.',
  }))
  return data
}
const finding = () => ({
  id: 'F1', ruleId: 'layout.primary-object', severity: 'major', status: 'open', evidenceIds: ['before'],
  observation: 'Long tool name wraps into a single-letter column.', impact: 'Users cannot identify the tool.',
  hypothesis: 'Badge consumes title space.', change: 'Give title a flexible track and move badge to the next line.',
  verify: 'Check long names at 390px in both themes, before and after filtering.',
})

test('template cannot pass by merely being generated', () => {
  const report = evaluateReview(reviewTemplate())
  assert.equal(report.decision, 'HOLD')
  assert.equal(report.missing.length, 8)
  assert.match(report.meaning, /not an automated beauty score/)
})
test('fully scoped, recorded review can pass without an invented score', () => {
  const data = fixture(), snapshot = JSON.stringify(data)
  const report = evaluateReview(data)
  assert.equal(report.decision, 'PASS')
  assert.equal(report.score, undefined)
  assert.equal(JSON.stringify(data), snapshot)
})
test('page overflow blocks while internal scroller is not counted as page overflow', () => {
  const data = fixture()
  data.evidence[0].scrollWidth = 537
  assert.equal(evaluateReview(data).decision, 'HOLD')
  data.evidence[0].scrollWidth = 390
  data.evidence[0].internalScrollWidth = 827
  assert.equal(evaluateReview(data).decision, 'PASS')
})
test('pending screenshots and unsupported design dimensions hold', () => {
  const data = fixture()
  data.evidence[0].status = 'pending'
  assert.equal(evaluateReview(data).decision, 'HOLD')
  data.evidence[0].status = 'reviewed'
  data.assessments[0].rationale = ''
  assert.equal(evaluateReview(data).decision, 'HOLD')
})
test('resolved finding requires same-context before/after with new revision and guards', () => {
  const data = fixture()
  data.findings = [{ ...finding(), status: 'resolved' }]
  assert.equal(evaluateReview(data).decision, 'HOLD')
  data.evidence.push({ ...data.evidence[0], id: 'after', revision: 'rev2', screenshot: 'screens/after.png' })
  data.scope.revision = 'rev2'
  data.assessments.forEach(row => { row.evidenceIds = ['after'] })
  data.iterations = [{ id: 'I1', findingId: 'F1', before: 'before', after: 'after', change: 'Title track fixed', outcome: 'Long name readable', guardObservation: 'Action still reachable; no overflow', guardsPassed: true, result: 'improved' }]
  assert.equal(evaluateReview(data).decision, 'PASS')
  data.evidence[1].theme = 'dark'
  assert.equal(evaluateReview(data).decision, 'HOLD')
  data.evidence[1].theme = 'light'
  data.iterations[0].guardsPassed = false
  assert.equal(evaluateReview(data).decision, 'HOLD')
})
test('unrelated and stale iterations cannot resolve a current issue', () => {
  const data = fixture()
  data.findings = [{ ...finding(), status: 'resolved' }]
  data.evidence.push({ ...data.evidence[0], id: 'other-before', route: '/unrelated', revision: 'old1' })
  data.evidence.push({ ...data.evidence[0], id: 'other-after', route: '/unrelated', revision: 'rev1' })
  const iteration = { id: 'I1', findingId: 'F1', before: 'other-before', after: 'other-after', change: 'Changed other page', outcome: 'Looks better', guardObservation: 'No overflow', guardsPassed: true, result: 'improved' }
  data.iterations = [iteration]
  assert.equal(evaluateReview(data).decision, 'HOLD')
  data.iterations = [{ ...iteration, before: 'before', after: 'other-after' }]
  data.evidence[2] = { ...data.evidence[0], id: 'other-after', revision: 'old2' }
  assert.equal(evaluateReview(data).decision, 'HOLD')
})
test('missing evidence references, duplicate IDs and invalid dimensions are input errors', () => {
  const data = fixture()
  data.assessments[0].evidenceIds = ['invented']
  assert.throws(() => evaluateReview(data), /unknown evidence/)
  data.assessments[0].evidenceIds = ['before']
  data.evidence.push({ ...data.evidence[0] })
  assert.throws(() => evaluateReview(data), /unique/)
})
test('malformed contract types are input errors rather than review holds', () => {
  for (const contract of [42, [], 'malformed', { product: 42 }]) {
    const data = fixture()
    data.contract = contract
    assert.throws(() => evaluateReview(data), /must be/)
  }
})
test('old revision screenshots cannot satisfy current revision coverage', () => {
  const data = fixture()
  data.scope.revision = 'new-build'
  const report = evaluateReview(data)
  assert.equal(report.decision, 'HOLD')
  assert.equal(report.missing.length, 1)
})
test('open major finding exposes concrete change and verification direction', () => {
  const data = fixture()
  data.findings = [finding()]
  const report = evaluateReview(data)
  assert.equal(report.decision, 'HOLD')
  assert.match(report.nextActions[0].change, /flexible track/)
  assert.match(report.nextActions[0].verify, /390px/)
})
test('CLI reports incomplete review as exit 1 and malformed input as exit 2', () => {
  const dir = mkdtempSync(join(tmpdir(), 'visual-review-'))
  const cli = new URL('../src/cli.js', import.meta.url).pathname
  try {
    const path = join(dir, 'review.json')
    writeFileSync(path, JSON.stringify(reviewTemplate()))
    const hold = spawnSync(process.execPath, [cli, 'review', path, '--json'], { encoding: 'utf8' })
    assert.equal(hold.status, 1)
    assert.equal(JSON.parse(hold.stdout).decision, 'HOLD')
    writeFileSync(path, '{}')
    assert.equal(spawnSync(process.execPath, [cli, 'review', path]).status, 2)
    writeFileSync(path, JSON.stringify(fixture()))
    assert.equal(spawnSync(process.execPath, [cli, 'review', path]).status, 0)
    assert.equal(spawnSync(process.execPath, [cli, 'review', '--init', path]).status, 2)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
