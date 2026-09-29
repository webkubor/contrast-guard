# contrast-guard

<!-- bloom-series-nav -->

<table align="center">
<tr>
<td align="center" width="33%"><a href="https://github.com/webkubor/typora-Bloom-theme">🌸 Bloom for Typora</a><br/><sub>24 themes</sub></td>
<td align="center" width="33%"><a href="https://github.com/webkubor/dsh-bloom-theme">🌊 Bloom for DSH</a><br/><sub>4 palettes</sub></td>
<td align="center" width="33%"><b>🛡️ contrast-guard</b><br/><sub>color guardrail · current</sub></td>
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

There's also a [`measure`](#measure-rendered-visual-metrics) sub-command for **rendered visual measurement** — `check` verifies the color values, `measure` checks how many font sizes this page actually used, how many grey levels are spread, how many elements have real motion. It needs a browser, but the driver is auto-detected at runtime — **`check` stays zero-dep and runs naked in CI**.

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
npm i -D contrast-guard
```

## Usage

```bash
npx contrast-guard --init     # generate config template
npx contrast-guard            # check, exit 1 if anything fails
npx contrast-guard --json     # machine-readable output
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
import { check, solveLightness, contrast, parseColor } from 'contrast-guard'

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

## measure: rendered visual metrics

`check` answers **"is this color value right"**, `measure` answers **"how much"** — how many font sizes this page actually used, how many grey levels it spread, how many elements actually animate.

It's needed because **every ugly page passes each check individually**. Each color value is a valid token, each radius is whitelisted, but a screen with 9 font sizes and only 2 grey levels and 11 spacings — each one passes alone, together it's ugly. Binary gates structurally can't catch this.

```bash
contrast-guard measure https://linear.app --save linear   # measure a reference site, save baseline
contrast-guard measure http://localhost:5173 --vs linear  # measure your page, compare item by item
contrast-guard measure --baselines                        # list saved baselines
```

```
Criteria
  ⚠  motion is almost absent: only 12/6438 elements have transition (0.19%). Defining a motion token ≠ using one
  ✓  font-size distribution is concentrated: 10 sizes, top 4 cover 96%
  ⚠  background greys: 60 layers, lots of one-off values bypassing tokens (reference: ~20)

Compared to baseline: linear
                          this run   linear
  motion coverage           0.2%      9.0%  ← significant gap
  background grey levels       60        22
```

**Thresholds come from measurement, not gut feel.** During calibration, two intuitive heuristics got thrown out:

- **"Fewer font sizes is better" is wrong** — Linear measures 14, more than many mediocre sites. The robust criterion is **distribution concentration** (top-4 coverage). Picking "≤5 sizes" would fail a benchmark site on day one.
- **Border-radius / shadow / spacing variety has no discriminative power** — the same benchmark had 20 radii and 14 shadows, also high. These become lateral references, never alerts.

So there's one hard usage rule: **measure a reference site and save it as a baseline first, then measure yours.** Without a reference, there's no criterion; "ugly" or "a bit fancier" are zero-information adjectives for a tool or an AI. With a measurable reference, they're not.

You can also attach a **style profile** (`profile` field: typography / color / layout / motion / signatureMoves) capturing what the metrics can't see but a screenshot can. Numbers answer "how far off"; the profile answers "which *kind* of off" — especially `signatureMoves`, which is where style identity comes from. Re-measuring won't overwrite a profile you've already filled in.

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

Together with [**vite-plugin-agent-eyes**](https://github.com/webkubor/vite-plugin-agent-eyes),
this is two links in the same chain. The failure modes they catch don't overlap — **each link catches what the previous one can't**:

| When | Tool | Catches | If missed |
|---|---|---|---|
| While writing code | agent-eyes `agentSizeWatch` | Files piling up | CSS becomes a swamp; one fix breaks three |
| Before `git commit` | agent-eyes `agentGuard` `cssVars` | `var(--undeclared-variable)` | Whole declaration fails: `z-index` reverts to `auto`, radius to 0, **tsc / ESLint / build all pass** |
| CI | **contrast-guard `check`** | Variable exists but contrast fails | Text unreadable, a11y fail |
| Page running | **contrast-guard `measure`** | Values all pass but used chaotically | Each item is "right" alone, ugly together |
| When something breaks | agent-eyes runtime log / screenshots | Runtime errors, login state, API failures | Agent can only guess |

The escalation is clear: **variable doesn't exist** (agent-eyes) → **variable exists but value is wrong** (check) → **value is fine but usage is chaotic** (measure). None of these three error out, none fail the build — they just fail in different ways.

agent-eyes' roadmap mentions "DOM snapshots don't contain computed styles; visual issues still need CDP screenshots" — `measure` collects exactly the rendered computed-style statistics that fills that gap.

## License

[MIT](./LICENSE)