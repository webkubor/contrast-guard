/** UI review CLI：非交互创建契约或核验证据报告，HOLD 退出 1、格式错误退出 2。 */
import { readFileSync, writeFileSync } from 'node:fs'
import { reviewTemplate, evaluateReview } from './review.js'

export function runReview(args) {
  try {
    if (args[0] === '--init') {
      const file = args[1] || 'ui-review.json'
      writeFileSync(file, JSON.stringify(reviewTemplate(), null, 2) + '\n', { flag: 'wx' })
      console.log(`Created ${file}; initial status is HOLD until evidence and review are recorded.`)
      return 0
    }
    const file = args.find(value => !value.startsWith('--'))
    if (!file) throw new Error('Usage: contrast-guard review <ui-review.json> [--json] | review --init [file]')
    const report = evaluateReview(JSON.parse(readFileSync(file, 'utf8')))
    if (args.includes('--json')) console.log(JSON.stringify(report, null, 2))
    else {
      console.log(`UI review: ${report.decision}`)
      console.log(report.meaning)
      for (const blocker of report.blockers) console.log(`  HOLD: ${blocker}`)
      for (const action of report.nextActions) console.log(`  ${action.id}: ${action.change}\n    Verify: ${action.verify}`)
    }
    return report.decision === 'PASS' ? 0 : 1
  } catch (error) {
    console.error(`Review input error: ${error.message}`)
    return 2
  }
}
