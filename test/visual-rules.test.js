/** 规则库不可仅靠口号演进：每条保留适用域、反例、来源和升级证据要求。 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const registry = JSON.parse(readFileSync(new URL('../docs/visual-rules.json', import.meta.url), 'utf8'))
test('rule registry retains provenance, counterexamples and lifecycle', () => {
  assert.equal(registry.schemaVersion, 1)
  assert.equal(new Set(registry.rules.map(row => row.id)).size, registry.rules.length)
  for (const row of registry.rules) {
    assert.match(row.version, /^\d+\.\d+\.\d+$/)
    assert(['proposed', 'trial', 'stable', 'deprecated'].includes(row.status))
    for (const key of ['appliesWhen', 'observation', 'impact', 'hypothesis', 'positiveCase', 'counterexample', 'promotionEvidence']) {
      assert(row[key]?.trim(), `${row.id} missing ${key}`)
    }
    for (const key of ['changes', 'verify', 'sources']) assert(row[key]?.length, `${row.id} missing ${key}`)
  }
})
