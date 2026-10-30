#!/usr/bin/env node
/**
 * skills/ 与 docs/ 的链接检查。
 *
 * 为什么要单独一个门禁：2026-10-30 迁移时把 skills 里的 ../../docs/x.md 相对链接
 * 改成绝对 URL，第一次替换的正则写错，全部塌成 `blob/main/../`（HTTP 404）；
 * 而当时的「无断链」检查只解析相对路径，把这个坏 URL 当成本地路径放过了。
 * 两条教训各占一个断言：
 *   1. 本仓的绝对链接必须匹配预期形态（不能带 ..、不能缺文件名）；
 *   2. 相对链接必须在同一次运行里真实存在。
 *
 * 外部来源链接（上游 skill、官方文档）只做格式检查，不要求可达，避免网络抖动
 * 阻断 CI；本仓链接额外要求 HTTP 200（可用 --offline 关闭）。
 *
 * 用法：
 *   node scripts/check-links.mjs            # 相对链接 + 本仓链接形态
 *   node scripts/check-links.mjs --offline  # 跳过本仓链接的 HTTP 可达性检查
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OFFLINE = process.argv.includes('--offline')
const OWN_PREFIX = 'https://github.com/webkubor/frontend-contrast-guard/blob/main/'
const OWN_DOC = /^https:\/\/github\.com\/webkubor\/frontend-contrast-guard\/blob\/main\/[A-Za-z0-9._/-]+\.md$/

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (name.endsWith('.md')) out.push(p)
  }
  return out
}

const files = [...walk(join(ROOT, 'skills')), ...walk(join(ROOT, 'docs'))]
const errors = []
const ownUrls = new Set()
const LINK = /\[[^\]]*\]\(([^)\s]+)\)/g

for (const file of files) {
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(LINK)) {
    const raw = m[1]
    const target = raw.split('#')[0]
    if (!target || target.includes('<') || target.startsWith('mailto:')) continue
    if (target.includes('github.com/webkubor/frontend-contrast-guard')) {
      if (!OWN_DOC.test(target)) {
        errors.push(`${relative(ROOT, file)}: 本仓链接形态非法 → ${target}`)
      } else {
        ownUrls.add(target)
      }
      continue
    }
    if (/^[a-z]+:/i.test(target) || target.startsWith('/')) continue
    if (!existsSync(resolve(dirname(file), target))) {
      errors.push(`${relative(ROOT, file)}: 相对链接不存在 → ${target}`)
    }
  }
}

if (!OFFLINE && ownUrls.size) {
  for (const url of ownUrls) {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) errors.push(`本仓链接不可达 (${res.status}) → ${url}`)
  }
}

if (errors.length) {
  console.error('✗ 链接检查失败：')
  for (const e of errors) console.error(`  ${e}`)
  process.exit(1)
}
console.log(`✓ 链接检查通过：${files.length} 个文件，相对链接可达，本仓链接形态与可达性正常`)
