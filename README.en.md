<h1 align="center">🛡️ frontend-contrast-guard</h1>

<p align="center">
  <strong>Contrast checks, CSS measurements, and recorded UI review evidence.</strong><br>
  Static color pairs · Computed-style distributions · Declared review evidence<br>
  <i>静态查色彩配对 · 采样 CSS 分布 · 核验声明范围内的评审证据</i>
</p>

<p align="center">
  <a href="https://github.com/webkubor/frontend-contrast-guard/blob/main/LICENSE"><img src="https://img.shields.io/github/license/webkubor/frontend-contrast-guard?style=for-the-badge&color=gold" alt="License"></a>
  <a href="https://github.com/webkubor/frontend-contrast-guard/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/webkubor/frontend-contrast-guard/ci.yml?style=for-the-badge&color=4c9a6b" alt="CI"></a>
  <a href="https://www.npmjs.com/package/frontend-contrast-guard"><img src="https://img.shields.io/npm/v/frontend-contrast-guard?style=for-the-badge&color=cb3837" alt="npm"></a>
  <a href="https://www.npmjs.com/package/frontend-contrast-guard"><img src="https://img.shields.io/npm/dm/frontend-contrast-guard?style=for-the-badge&color=cb3837" alt="npm downloads"></a>
  <a href="https://github.com/webkubor/frontend-contrast-guard"><img src="https://img.shields.io/github/stars/webkubor/frontend-contrast-guard?style=for-the-badge&color=coral" alt="Stars"></a>
  <a href="https://github.com/webkubor/frontend-contrast-guard"><img src="https://img.shields.io/badge/JavaScript-333333?style=for-the-badge" alt="Tech"></a>
</p>

<p align="center">
  <a href="README.md">中文</a> · <a href="CHANGELOG.md">Changelog</a> · <a href="docs/frontend-review-standard.md">Frontend Review Standard (SSOT)</a>
</p>

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/webkubor/free-imgbed@main/frontend-contrast-guard/hero-terminal.svg" alt="frontend-contrast-guard terminal preview" width="800" style="border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,0.5);">
</p>

---

## One frontend development Flow

This repository owns the [frontend development Flow](docs/frontend-flow.md): scope → design/restore → implement → compare/fix → accept → deliver. Load [skills](skills/) as needed. `ui-restore` adds reference-led UI restoration, CSS source tracing, and regression-scope verification.

Brand styles, assets, domains, accounts, and release policies stay in each project. CS only routes here. Skills are distributed from Git; the npm CLI continues to ship `src/docs`. Installed copies are not a second source of truth.

## 🏆 Why This

| Task | Command / protocol | Result and boundary |
|---|---|---|
| Fix failing color pairs | `check` | Solves target lightness while retaining hue and chroma for declared pairs |
| Understand styles used on a page | `measure` | Samples computed-style distributions; neutral observations by default |
| Validate UI review records | `review` | Checks contract, declared coverage, seven assessments, findings and verification evidence |
| Organize responsive and interaction review | [Review standard](docs/frontend-review-standard.md) | A person or agent executes the viewport, theme and state protocol; the CLI does not capture this matrix automatically |

---

<!-- bloom-series-nav -->

<table align="center">
<tr>
<td align="center" width="33%"><a href="https://github.com/webkubor/typora-Bloom-theme">🌸 Bloom for Typora</a><br/><sub>24 themes</sub></td>
<td align="center" width="33%"><a href="https://github.com/webkubor/dsh-bloom-theme">🌊 Bloom for DSH</a><br/><sub>4 palettes</sub></td>
<td align="center" width="33%"><b>🛡️ frontend-contrast-guard</b><br/><sub>visual & contrast guardrail</sub></td>
</tr>
</table>

<p align="center">
  <sub>One Morandi design language — two themes, and the tool that keeps their colors honest.<br/>
  <i>同一套莫兰迪设计语言：两个宿主的主题，加一个守住它们配色的工具。</i></sub>
</p>


Turn color-contrast checking into a CI guardrail. **When something fails, it tells you what to change it to** — not just a red ❌.

OKLCH supported. **Zero dependencies.** The `check` core is 11.6 KB.

```
✗ 1 pair below threshold (48 checked)

  theme-src/root-petal.css  link / accent
    #e63f9f on #fef6f9   3.55:1  threshold 4.5
    → change to L=58% (#d0268c, 4.55:1, darken 6 pts)
      oklch(64% 0.22 350)
```

There's also a [`measure`](#measure-rendered-visual-metrics) sub-command for **rendered visual measurement** — `check` verifies the color values, `measure` checks how many font sizes this page actually used, how many grey levels are spread, how many elements declare transition durations. It needs a browser, but the driver is auto-detected at runtime — **`check` stays zero-dep and runs naked in CI**.

## Why this exists

Existing contrast tools all answer "did it pass?" — but the time-consuming part is the *next* step: **"what should I change it to?"**

After hearing "3.02:1, fails", a human still has to eyeball: darken a bit? how much? does the hue drift? and re-measure. Tolerable for a handful of values across one theme; for 24 themes that's hundreds of manual guesses.

`contrast-guard` does that step in one shot: keep hue and chroma, solve the lightness that *just* crosses the threshold, and output something like `L=58%, darken 6 pts` that you can paste into code.

This tool came out of a real incident: in [typora-Bloom-theme](https://github.com/webkubor/typora-Bloom-theme) (90★), 6 of 24 themes had link colors under WCAG AA — and nobody noticed. Four layers of failure stacked: the checklist missed the `accent` row, the check never ran in CI, the new workflow was silently swallowed by `.gitignore`. **Fixed that, then extracted this package.**

## Comparison

| | Size | Deps | OKLCH | Scans palette files | Gives the fix |
|---|---|---|---|---|---|
| **contrast-guard** | **11.6 KB** | **0** | ✅ | ✅ | ✅ |
| wcag-contrast | 24 KB | 1 | ❌ | ❌ | ❌ |
| color-contrast-checker | 36 KB | 0 | ❌ | ❌ | ❌ |
| a11y-color-contrast | 71 KB | 0 | ❌ | ❌ | ❌ |
| chroma-js | 388 KB | 0 | ✅ | ❌ | ❌ |
| culori | 1082 KB | 0 | ✅ | ❌ | ❌ |

> Size is for the `check` path's source (aligned with the libraries in the table). `measure` is a separate path, only loaded when called — it doesn't affect `check`'s size or zero-dep guarantee.

Other tools are "give me two colors, I'll compute the ratio" libraries; the real scenario is "a pile of palette files + a set of rules + run in CI".

**Why OKLCH matters**: modern themes commonly define palettes in OKLCH (perceptually uniform, no lightness jumps between modes). Most contrast tools only understand hex/rgb — so palettes written in OKLCH fall right into the blind spot.

## Install

```bash
npm i -D frontend-contrast-guard
```

The package is `frontend-contrast-guard`. Both `frontend-contrast-guard` and `contrast-guard` invoke the same CLI; examples use the shorter alias.

## Usage

```bash
npx contrast-guard --init     # generate config template
npx contrast-guard            # check, exit 1 if anything fails
npx contrast-guard --json     # machine-readable output
contrast-guard review --init ui-review.json  # create a review template
contrast-guard review ui-review.json --json  # validate recorded evidence
```

`contrast.config.json`:

```json
{
  "files": ["theme-src/root-*.css", "src/tokens.js"],
  "pairs": [
    { "fg": "text",      "bg": "bg", "min": 7,   "label": "body text" },
    { "fg": "text-semi", "bg": "bg", "min": 4.5, "label": "secondary text" },
    { "fg": "accent",    "bg": "bg", "min": 4.5, "label": "links / accent" }
  ]
}
```

**`pairs` must list every foreground that's actually read.** In the incident above, the three text classes all passed with margin (body 12.9–16.1); the only thing that failed was `accent` — and that's the only thing in body copy that's clickable. The gap is always in the row the checklist missed.

### Wire into CI

```yaml
- run: npx contrast-guard
```

### Programmatic API

```js
import { check, solveLightness, contrast, parseColor } from 'frontend-contrast-guard'

const { results, failed } = check({
  files: ['theme-src/root-petal.css'],
  pairs: [{ fg: 'accent', bg: 'bg', min: 4.5 }],
})

// Or just the solver
const bg = parseColor('oklch(98% 0.01 350)')
solveLightness('oklch(64% 0.22 350)', bg, 4.5)
// → { L: 58, ratio: 4.55, hex: '#d0268c', delta: -6 }
```

## Supported syntax

**Color values**: `oklch()` · `#rgb` · `#rrggbb` · `rgb()` · `rgba()` (with alpha, composited against background)

**Sources**: CSS custom properties; inline color objects in JS/JSON. Both supported because real projects split palettes across both — that theme had 16 palettes in CSS and 8 inline in JS; humans edit from two entry points, but checking only one of them.

`var(--x)` references are auto-dereferenced (up to 5 levels).

## review: product contract and review loop

```bash
contrast-guard review --init ui-review.json
contrast-guard review ui-review.json --json
```

Successful initialization exits `0`, creates an incomplete template that evaluates to `HOLD`, and does not overwrite an existing file. Evaluation exits **`0`: PASS (recorded evidence satisfies the gate); `1`: HOLD; `2`: input error**, including file access, JSON and schema errors.

Write an explicit design contract: product, user, job, primary action, first-read object, density, signature and constraints. Declare routes, themes, widths and states in `scope`, with a rationale. Default widths are `390 / 768 / 1280 / 1600`, themes are light/dark, and the state is default. This four-viewport × theme × state matrix is a **declared review protocol**, not an automatically captured responsive audit. Add relevant breakpoint boundaries, loading, empty, error and interaction states; record actual width and height in the evidence.

The seven assessment dimensions are:

| JSON dimension | Review focus |
|---|---|
| `product-fit` | Fit between the product task, content pattern and density |
| `hierarchy` | First-read focus and information priority |
| `typography` | Type roles, readability and hierarchy |
| `spacing-layout` | Alignment, proximity, spacing, composition and responsive layout |
| `color-tokens` | Color semantics, readable pairs and token provenance |
| `components-states` | Component consistency, feedback and state coverage |
| `distinctiveness` | Task-relevant product identity, imagery and honest content |

Reviewers capture screenshots separately, open and inspect each one, then record screenshot references, revision, route, theme, viewport, state, capture time, reviewer, observation, page `scrollWidth` and `reviewed` status. Each dimension needs evidence, an observation, rationale and passing decision. Findings specify observation, impact, hypothesis, rule ID, a **concrete token/component change and verification method**, rather than a request to “make it polished.”

Resolved findings require comparable before/after iterations: identical route, theme, state, width and height; different revisions; both records marked reviewed; an improved result and passing guards. Also hold data and capture conditions constant and actually verify interactions, readability, keyboard access and reduced-motion behavior. Open critical/major findings, incomplete dimensions, missing declared evidence, recorded page overflow or resolutions without valid verification produce HOLD. Minor findings may remain as explicit follow-up work.

For example (a hypothetical proposal): if action buttons squeeze a long title at 390px in dark mode, change the `ToolRow` title track to `minmax(0, 1fr)` and allow actions to wrap. Compare different revisions with identical data, state and viewport; verify the title and actions remain fully accessible, no page overflow appears, and keyboard access and light mode still work. Record the result after actual verification; a proposal is not an observed improvement.

`review` **reads JSON evidence; it does not browse the page, open or analyze screenshots, or verify screenshot files exist or were inspected**. PASS means evidence completeness and the recorded review decision. It is neither an automated beauty score nor proof that screenshots were actually inspected. See [review CLI fields and a real trial](docs/review-cli.md), and the [Frontend Review Standard](docs/frontend-review-standard.md) for execution, and [Rule Evolution](docs/rule-evolution.md) for versions, positive and counterexamples, the `proposed → trial → stable → deprecated` lifecycle, trial budgets and rollback.

## measure: rendered visual metrics

`measure` samples computed styles on the current page: font-size distributions, font families, foreground/background luminance and transition durations. Motion coverage means the fraction of sampled elements declaring nonzero transition durations; it does not establish that animation played or feedback worked.

```bash
contrast-guard measure https://linear.app --save linear   # save a reference sample
contrast-guard measure http://localhost:5173 --vs linear  # compare distributions and deltas
contrast-guard measure --baselines                        # list baselines
```

By default, `src/measure/verdict.js` labels valid samples `observation` and missing samples `unknown`. Only thresholds explicitly supplied by a caller produce configuration warnings. Default results are neutral observations, not aesthetic failures. Font concentration, gray levels, family counts and motion coverage have no universal passing threshold. More motion is not universally better; zero transitions may suit the product and reduced-motion needs.

Baseline differences suggest questions to investigate. Similarity to a reference does not prove quality, and a difference is not a failure; explain comparability of tasks, content and sampling conditions. Computed-style distributions do not trace variable provenance and cannot prove hardcoding or token drift. Check definitions, references and component semantic mappings separately.

`measure` is not a full responsive or interaction audit and does not calculate true rendered foreground/background contrast pairs. It does not replace checks for transparency, background images, states, focus, keyboard access or screen readers. `check` validates configured color pairs; actual interfaces still need evidence capture and inspection under the review protocol.

A baseline may include a manually authored `profile` (typography / color / layout / motion / signatureMoves), recording observations from actual image inspection. Re-measuring preserves an existing profile; it remains a reviewer-authored record.

### Browser driver (zero-dep boundary)

`measure` needs a browser, but **the driver is detected at runtime, not in `dependencies`**:

| Driver | Notes |
|---|---|
| [ego-browser](https://github.com/ego-browser) | Preferred. Reuses logged-in state, can measure pages that need auth |
| playwright | `npm i -D playwright && npx playwright install chromium` |

If neither is installed, `measure` errors clearly with install instructions — **`check` is unaffected**: it doesn't load that code path at all, still zero-dep, still runs naked in CI.

## Runtime

Targets **Node ≥ 18**. Pure ESM. The `check` path is **zero-dependency**, so **Bun also runs it directly** (verified on Bun 1.3, all tests pass). `measure` additionally needs a browser driver — see above.

Why Node and not Bun as the official target: this package is a CI guardrail consumed by other projects; it shouldn't force the consumer to switch runtimes. GitHub Actions ships Node by default; Bun would require an extra `setup-bun` step.

## Companion: the same front-end quality chain

Together with [**vite-plugin-agent-eyes**](https://github.com/webkubor/vite-plugin-agent-eyes), these tools provide different evidence:

| When | Tool | Role |
|---|---|---|
| While writing code | agent-eyes `agentSizeWatch` | Flags file size |
| Before `git commit` | agent-eyes `agentGuard` `cssVars` | Checks undeclared CSS variable references |
| CI | **contrast-guard `check`** | Checks declared color pairs and suggests fixes |
| Page running | **contrast-guard `measure`** | Supplies computed-style sample distributions and baseline deltas |
| UI review | **contrast-guard `review`** | Validates recorded contracts, screenshot evidence, findings and comparable verification |
| Debugging and evidence capture | agent-eyes runtime logs / screenshots | Supplies runtime errors, login state and API failure clues |

Statistics, screenshots and task verification complement each other. Screenshots still need actual inspection; passing a partial automated check does not establish a complete UI or accessibility audit.

## License

[MIT](./LICENSE)