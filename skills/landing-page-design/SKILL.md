---
name: landing-page-design
description: "Complete system for building high converting landing pages: intake questions, page structure, layout selection, conversion copywriting, SEO, plus project-led visual decisions. Use for landing page strategy, marketing structure, conversion copy and optional visual recipes."
version: 1.0.0
license: MIT (上游 https://github.com/elayadesign/ai-design-skills)
---

通用前端研发唯一入口：[Frontend Flow](../../docs/frontend-flow.md)。项目品牌、组件库、域名和发布规则从项目读取。


# Landing Page Design

A landing page is not a homepage. A homepage serves multiple intents. A landing page wins one intent:

**one offer → one audience → one primary action.**

This skill has two halves. **Part A** decides what the page says and how it is structured. **Part B** applies the project visual system. Work through A before touching B.

## Scope

Apply to landing pages and marketing sites. The [Flow](../../docs/frontend-flow.md), project contract and user requirements govern scope and acceptance; this skill supplies methods rather than a universal style.

**Companion skill.** For upgrading an *existing* site rather than building a new one, use `redesign-existing-projects` ([github.com/elayadesign/redesign-skill](https://github.com/elayadesign/redesign-skill)). It diagnoses generic patterns and defers to this file for every concrete value.

---

# 按需参考

- [风格菜单](references/style-anchors.md)：新设计选择方向，无默认风格。
- [内容纪律](references/content-discipline.md)：真实主张、可理解文案和演示标识。
- [单尺原则](references/single-ruler-principle.md)：统一语义 token，避免框架与自定义尺度冲突。
- [三轨分离](references/three-track-separation.md)：按变更职责组织产品、设计与交互文档。
- [元信息条模板](templates/inject-bar.js)：仅适用于明确需要作品集元信息的演示页；使用前按项目配色、可访问性和路由改造，不自动注入产品。

# PART A — Strategy and structure

## A1. Intake

Gather these before designing or writing. Ask only for what is missing, and ask in one batch rather than one question at a time.

**Purpose**
- What is the ONE primary action? (trial, demo, buy, waitlist, download)
- What is the offer, exactly what do they get?
- What counts as a conversion? (click, signup, purchase)

**Audience and context**
- Who is the ICP?
- What problem are they trying to solve?
- Top three objections, meaning why they do not convert today
- Traffic source: ads, search, social, email
- What do visitors already know when they land?

**Proof and assets**
- Proof points: logos, testimonials, numbers, case studies
- Screenshots, demo video, product GIFs
- Guarantees, refund terms, cancellation terms

**Constraints**
- Brand voice: casual or professional
- Design direction: minimal editorial, playful 3D, glass UI
- Mobile priority?

If the user cannot answer, make a reasonable assumption, state it in one line, and continue. Do not stall the build.

## A2. Page structure

**Above the fold (required)**
1. Headline, outcome plus audience
2. Subheadline, clarifies how and adds specificity
3. Primary CTA, clear verb plus what they get
4. One proof signal, logo strip, stat, or short testimonial
5. Hero visual, product screenshot or video, or a strong illustration

**Mid page (the argument)**
6. Problem to solution, one section
7. Benefits, three to five, outcome driven
8. How it works, three steps
9. Social proof, testimonials or a case study

**Bottom (objection handling)**
10. FAQ, six to twelve questions
11. Risk reversal, trial, cancel anytime, guarantee
12. Final CTA, identical to the top

An optional tagline reveal can reinforce a narrative when the content and motion budget justify it; see the upstream visual recipe.

## A3. Layout selection

Pick one and say why.

| Type | Use when |
|---|---|
| **A. Classic hero plus sections** | The product is understandable from a hero screenshot. Most common. |
| **B. Long form story** | You need to educate and overcome skepticism. |
| **C. Minimal conversion page** | High intent traffic (email to known users), or a short offer like a download or waitlist. |
| **D. Comparison page** | Search intent includes alternatives ("X vs Y", "best for"). Usually paired with SEO pages. |

## A4. Conversion rules

**Match message to source.** If traffic comes from ads, mirror the ad headline in the hero and keep the same promise and visual tone.

**Make the next step obvious.** One primary CTA. Never place competing CTAs above the fold.

**Write benefit first.** Features are what it does. Benefits are what that means for them.

**Be specific.**
- ❌ "Save time and streamline"
- ✅ "Cut your weekly reporting from 4 hours to 15 minutes"

**Reduce risk.** Explain actual trial, cancellation or guarantee terms where the product offers them; never invent commitments.

**Treat objections as a section, not a footnote.** Move the FAQ earlier for high friction offers. Put proof directly beside the claim it supports.

## A5. Copywriting

**Headline formulas**
- "{Outcome} without {pain}"
- "The {category} for {audience}"
- "Ship {result} in {time}"

**Subheadline.** One or two sentences. Clarify what it is and who it is for.

**CTA.** Verb plus what they get. Never "Learn more" or "Submit". Use "Start free trial", "Book a demo", "Get the checklist".

**Benefit bullets.** Bold benefit, then the proof or detail. Example: **Faster iteration** — generate three layout variants in one click.

Follow the project language and voice. Review wrapping with real content; preserve meaningful punctuation.

## A6. Build order

Work section by section, in this order:

1. Hero
2. Benefits
3. How it works
4. Proof
5. FAQ
6. Final CTA

Never rebuild the whole page on each iteration. Section by section keeps control and keeps diffs reviewable.

## A7. SEO and AEO

**Do not index** ad only campaign pages or highly time bound offers. Use `noindex` or keep them behind a non indexed path.

**Do index** evergreen offers and pages where search intent matches the promise. Add a clear title and meta description, internal links from the homepage and feature pages, and the FAQ in plain question and answer form for AEO. Add FAQ schema if appropriate.

## A8. Pitfalls

- Too many CTAs above the fold
- Vague value prop: "streamline", "optimize"
- A large feature list with no outcomes
- Proof buried at the bottom
- Mobile layout that breaks readability
- No clear next step

---

# PART B — Project visual system

Use the project's design contract, components and semantic tokens. For an existing design, preserve its typography, spacing, colors, radii and interaction intent; for a new design, explain choices in relation to the audience and primary task.

- **Typography and spacing:** define semantic roles and a consistent scale suited to real content, language, zoom and supported viewports. No global font whitelist, font count or fixed size is required.
- **Surfaces and layout:** choose borders, gradients, materials and nested radii intentionally. `inner radius = outer radius − gap` can help nested curves align; validate visually rather than apply it mechanically.
- **Icons and components:** reuse the project's library or native semantic elements. Keep accessible labels, keyboard operation and visible focus.
- **Motion:** add it where it explains feedback, state or narrative. Choose timing by travel distance and task, profile expensive effects, and provide a reduced-motion equivalent. Static pages are valid.
- **Content:** use supplied proof and truthful claims. Mark mock data and fictional identities as demonstrations; do not fabricate customer endorsements, prices or metrics as facts.
- **States:** cover the states applicable to each component, including focus, pending, empty and error where relevant. A spinner, skeleton, inline notice or native control may be appropriate for the task.
- **Delivery:** validate navigation, forms, meaningful image alternatives, semantics, responsive behavior and project-specific legal/SEO requirements.

For a deliberately selected visual direction, consult the [style menu](references/style-anchors.md). The [upstream visual recipe](references/upstream-visual-recipe.md) retains concrete navigation, nesting and tagline reveal techniques as optional examples, including historical values; it does not define project-independent gates.

---

# Output format

When generating a landing page from scratch, return these in order before writing code:

1. **Page outline** — sections and their order
2. **Hero copy** — headline, subheadline, CTA, proof line
3. **Benefits** — three to five outcome driven bullets
4. **How it works** — three steps
5. **FAQ** — six to twelve questions and answers
6. **SEO / AEO** — index or noindex recommendation, plus title and meta if indexed
7. **Layout recommendation** — A, B, C, or D, and why

Then build section by section per A6.

---

# Quick checklist

**Strategy**
- [ ] One offer, one audience, one primary action
- [ ] No competing CTAs above the fold
- [ ] Supported specifics instead of vague claims
- [ ] Actual risk and commitment terms are clear
- [ ] Proof sits next to the claim it supports
- [ ] Layout type chosen deliberately

**Visual and delivery**
- [ ] Project typography, spacing, surfaces, icons and components are respected
- [ ] Hierarchy and wrapping work with real content at supported viewports and zoom
- [ ] Motion has a purpose and a reduced-motion equivalent where applicable
- [ ] Claims, testimonials and metrics are supported; demo content is marked
- [ ] Applicable interaction, loading, empty and error states are verified
- [ ] Navigation, forms, semantics, alternatives and project shipping requirements are checked

---

## Credits

Parts of this skill were adapted from [taste-skill](https://github.com/Leonxlnx/taste-skill) by Leon Lin ([@LexnLin](https://x.com/LexnLin)), MIT licensed. Its redesign audit structure, content realism checks, and motion and navigation ideas informed the matching sections here, which have since been rewritten.

<details>
<summary>taste-skill license</summary>

```
MIT License

Copyright (c) 2026 Leonxlnx

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
</details>
