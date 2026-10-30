const { spawnSync } = require('node:child_process');

// Usage: node page-check.cjs <URL>
// 诊断「页面访问不了」：加载页面、抓 console 错误、网络 404、截图

const url = process.argv[2];
if (!url) { console.error('Usage: node page-check.cjs <URL>'); process.exit(1); }

const egoProgram = `
const task = await useOrCreateTaskSpace('frontend page check')
await openOrReuseTab(${JSON.stringify(url)}, { wait: true, timeout: 30 })
cliLog('PAGE: ' + JSON.stringify(await pageInfo()))
cliLog('\\nPAGE_TEXT:\\n' + (await snapshotText()).slice(0, 1500))
cliLog('\\nEVENTS:\\n' + JSON.stringify(await drainEvents(), null, 2).slice(0, 4000))
cliLog('\\nSCREENSHOT: ' + await captureScreenshot())
await completeTaskSpace(task.id, { keep: false })
`;

const result = spawnSync('ego-browser', ['nodejs'], { input: egoProgram, encoding: 'utf8', stdio: ['pipe', 'inherit', 'inherit'] });
process.exit(result.status || 0);
