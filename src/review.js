/** 产品视觉评审：把设计契约、截图证据、具体整改与复测串成可审计的报告。
 *  不生成美感分数；PASS 仅表示所声明范围的评审记录完整，不代替人眼判断。
 */
export const REVIEW_VERSION = 1
export const DIMENSIONS = [
  'product-fit', 'hierarchy', 'typography', 'spacing-layout',
  'color-tokens', 'components-states', 'distinctiveness',
]
const filled = value => typeof value === 'string' && value.trim().length > 0
const requireText = (value, name) => {
  if (!filled(value)) throw new Error(`${name} must be a non-empty string`)
}
const unique = (rows, name) => {
  if (new Set(rows.map(row => row.id)).size !== rows.length) throw new Error(`${name} ids must be unique`)
}

/** 初始契约始终 HOLD；待真实截图、人工观察与复测填入后再评估。 */
export function reviewTemplate() {
  return {
    schemaVersion: REVIEW_VERSION,
    contract: {
      product: '', user: '', job: '', primaryAction: '', firstRead: '',
      density: '', signature: '', constraints: '',
    },
    scope: {
      revision: '', routes: ['/'], themes: ['light', 'dark'], widths: [390, 768, 1280, 1600],
      states: ['default'], rationale: 'Add changed interaction, empty, loading and error states; explain scope choices.',
    },
    evidence: [],
    assessments: DIMENSIONS.map(dimension => ({
      dimension, status: 'unreviewed', evidenceIds: [], observation: '', rationale: '',
    })),
    findings: [],
    iterations: [],
  }
}

/** 校验输入结构；空契约是待完成工作，错误类型或无效枚举则是格式错误。 */
export function validateReview(input) {
  if (!input || input.schemaVersion !== REVIEW_VERSION) throw new Error('Unsupported review schemaVersion')
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  if (!object(input.contract) || !object(input.scope)) throw new Error('contract and scope must be objects')
  for (const [key, value] of Object.entries(input.contract)) {
    if (typeof value !== 'string') throw new Error(`contract.${key} must be a string`)
  }
  for (const key of ['revision', 'rationale']) {
    if (input.scope[key] !== undefined && typeof input.scope[key] !== 'string') throw new Error(`scope.${key} must be a string`)
  }
  for (const key of ['routes', 'themes', 'widths', 'states']) {
    const values = input.scope[key]
    if (!Array.isArray(values) || !values.length) throw new Error(`scope.${key} must be non-empty`)
    if (new Set(values).size !== values.length) throw new Error(`scope.${key} contains duplicates`)
    for (const value of values) {
      if (key === 'widths' ? !Number.isInteger(value) || value < 1 : !filled(value)) {
        throw new Error(`Invalid scope.${key} value`)
      }
    }
  }
  for (const key of ['evidence', 'assessments', 'findings', 'iterations']) {
    if (!Array.isArray(input[key])) throw new Error(`${key} must be an array`)
    for (const row of input[key]) if (!row || typeof row !== 'object') throw new Error(`Invalid ${key} record`)
  }
  for (const key of ['evidence', 'findings', 'iterations']) {
    unique(input[key], key)
    for (const row of input[key]) requireText(row.id, `${key}.id`)
  }
  for (const row of input.evidence) {
    for (const key of ['route', 'theme', 'state', 'screenshot', 'revision', 'reviewer', 'observation', 'capturedAt']) {
      requireText(row[key], `evidence.${row.id}.${key}`)
    }
    if (!Number.isInteger(row.width) || row.width < 1 || !Number.isInteger(row.height) || row.height < 1) {
      throw new Error(`evidence.${row.id} requires positive width and height`)
    }
    if (!Number.isFinite(Date.parse(row.capturedAt))) throw new Error(`Invalid evidence.${row.id}.capturedAt`)
    if (!['pending', 'reviewed'].includes(row.status)) throw new Error(`Invalid evidence.${row.id}.status`)
    if (!Number.isFinite(row.scrollWidth) || row.scrollWidth < 0) throw new Error(`Invalid evidence.${row.id}.scrollWidth`)
  }
  const evidenceIds = new Set(input.evidence.map(row => row.id))
  const references = (ids, name) => {
    if (!Array.isArray(ids)) throw new Error(`${name} must be an array`)
    for (const id of ids) if (!evidenceIds.has(id)) throw new Error(`${name}: unknown evidence ${id}`)
  }
  for (const row of input.assessments) {
    if (!DIMENSIONS.includes(row.dimension)) throw new Error(`Unknown dimension ${row.dimension}`)
    if (!['pass', 'hold', 'unreviewed'].includes(row.status)) throw new Error(`Invalid assessment status ${row.status}`)
    references(row.evidenceIds, `assessment.${row.dimension}.evidenceIds`)
  }
  if (new Set(input.assessments.map(row => row.dimension)).size !== input.assessments.length) {
    throw new Error('assessment dimensions must be unique')
  }
  for (const row of input.findings) {
    if (!['critical', 'major', 'minor'].includes(row.severity)) throw new Error(`Invalid finding severity ${row.severity}`)
    if (!['open', 'resolved'].includes(row.status)) throw new Error(`Invalid finding status ${row.status}`)
    for (const key of ['ruleId', 'observation', 'impact', 'hypothesis', 'change', 'verify']) requireText(row[key], `finding.${row.id}.${key}`)
    references(row.evidenceIds, `finding.${row.id}.evidenceIds`)
  }
  const findingIds = new Set(input.findings.map(row => row.id))
  for (const row of input.iterations) {
    if (!findingIds.has(row.findingId)) throw new Error(`iteration.${row.id}: unknown finding`)
    references([row.before, row.after], `iteration.${row.id}`)
    for (const key of ['change', 'outcome', 'guardObservation']) requireText(row[key], `iteration.${row.id}.${key}`)
    if (!['improved', 'regressed', 'inconclusive'].includes(row.result)) throw new Error(`Invalid iteration.${row.id}.result`)
    if (typeof row.guardsPassed !== 'boolean') throw new Error(`iteration.${row.id}.guardsPassed must be boolean`)
  }
}

const sameContext = (a, b) => ['route', 'theme', 'state', 'width', 'height'].every(key => a[key] === b[key])

/** 根据显式范围判证据完整性；审美结论来自有署名、有截图的人工 assessment。 */
export function evaluateReview(input) {
  validateReview(input)
  const blockers = []
  for (const key of ['product', 'user', 'job', 'primaryAction', 'firstRead', 'density', 'signature', 'constraints']) {
    if (!filled(input.contract[key])) blockers.push(`Design contract missing: ${key}`)
  }
  if (!filled(input.scope.rationale)) blockers.push('Explain the declared review scope')
  if (!filled(input.scope.revision)) blockers.push('Declare the target revision for this review')
  const reviewed = input.evidence.filter(row => row.status === 'reviewed' && row.revision === input.scope.revision)
  const missing = []
  for (const route of input.scope.routes) for (const theme of input.scope.themes) {
    for (const width of input.scope.widths) for (const state of input.scope.states) {
      if (!reviewed.some(row => row.route === route && row.theme === theme && row.width === width && row.state === state)) {
        missing.push({ route, theme, width, state })
      }
    }
  }
  if (missing.length) blockers.push(`${missing.length} declared screen states lack reviewed screenshot evidence`)
  for (const row of reviewed) if (row.scrollWidth > row.width) blockers.push(`Page overflow: ${row.id} (${row.scrollWidth} > ${row.width})`)
  for (const dimension of DIMENSIONS) {
    const row = input.assessments.find(item => item.dimension === dimension)
    if (!row || row.status !== 'pass' || !filled(row.observation) || !filled(row.rationale) || !row.evidenceIds.length ||
        row.evidenceIds.some(id => !reviewed.some(e => e.id === id))) blockers.push(`Design dimension incomplete or held: ${dimension}`)
  }
  const evidence = new Map(input.evidence.map(row => [row.id, row]))
  const verified = new Set()
  for (const row of input.iterations) {
    const before = evidence.get(row.before), after = evidence.get(row.after)
    const finding = input.findings.find(item => item.id === row.findingId)
    const valid = finding.evidenceIds.includes(row.before) && sameContext(before, after) &&
      before.revision !== after.revision && after.revision === input.scope.revision &&
      before.status === 'reviewed' && after.status === 'reviewed' && row.guardsPassed && row.result === 'improved'
    if (valid) verified.add(row.findingId)
    else blockers.push(`Iteration lacks comparable improvement evidence: ${row.id}`)
  }
  for (const row of input.findings) {
    if (!row.evidenceIds.length) blockers.push(`Finding has no evidence: ${row.id}`)
    if (row.status === 'resolved' && !verified.has(row.id)) blockers.push(`Resolution has no verified iteration: ${row.id}`)
    if (row.status === 'open' && row.severity !== 'minor') blockers.push(`Unresolved ${row.severity} finding: ${row.id}`)
  }
  return {
    schemaVersion: REVIEW_VERSION, decision: blockers.length ? 'HOLD' : 'PASS',
    meaning: 'Evidence completeness and recorded review decision; not an automated beauty score or proof that screenshots were actually inspected.',
    blockers, missing, findings: input.findings, iterations: input.iterations,
    nextActions: input.findings.filter(row => row.status === 'open').map(row => ({
      id: row.id, severity: row.severity, change: row.change, verify: row.verify,
    })),
  }
}
