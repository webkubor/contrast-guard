# 上游视觉配方（可选历史参考）

来源：Elaya 的 [ai-design-skills](https://github.com/elayadesign/ai-design-skills)，MIT；署名与许可见[主技能](../SKILL.md#credits)。以下保留上游独有的具体布局、嵌套圆角、导航与逐词揭示实现思路。

这是一套特定审美的配方，不是全局标准。文中 only/never/mandatory/always 等措辞仅描述采用该配方时的原始选择，不能覆盖项目契约、既定设计、用户要求或[评审标准](../../../docs/frontend-review-standard.md)。字体白名单、固定尺寸、色板、必加动效及虚构内容不作为验收门槛；生产内容必须真实，演示数据须明确标识。可单独借鉴方法，不必整套采用。

# PART B — Visual system

Every visual value must resolve through these rules instead of being invented ad hoc.

## B1. Typography

### Fonts

**Palette examples for this recipe:** Geist, Manrope, Geist Mono, Poppins.

Other projects may use Inter, Roboto, Arial, Open Sans, Helvetica or any suitable face.

**Never use italic fonts** anywhere in the interface.

**One typeface per site.** Do not pair two fonts unless the prompt explicitly asks for it. Geist Mono is allowed alongside a primary font only for code, data, or numeric UI where a monospace is functionally required.

**Never use ultra bold weights** (900 / black). Cap at semibold or bold.

### Copy rules

**No hyphens in text.** Do not use `-` inside body copy, headings, or labels. Rewrite the phrase instead.

**No orphaned words.** A single word must never sit alone on the last line. Apply `text-wrap: balance` for headings and `text-wrap: pretty` for body copy.

### Type scale

Always resolve font sizes to Tailwind's default type scale. Never leave arbitrary values in place, including `text-[19px]`, `font-size: 22px`, or `1.4rem`.

If an existing size does not land exactly on a step, snap it to the **closest step below**, taking both the size and its paired line height.

| Class | Size | Line height |
|---|---|---|
| `text-xs` | 12px (0.75rem) | 16px |
| `text-sm` | 14px (0.875rem) | 20px |
| `text-base` | 16px (1rem) | 24px |
| `text-lg` | 18px (1.125rem) | 28px |
| `text-xl` | 20px (1.25rem) | 28px |
| `text-2xl` | 24px (1.5rem) | 32px |
| `text-3xl` | 30px (1.875rem) | 36px |
| `text-4xl` | 36px (2.25rem) | 40px |
| `text-5xl` | 48px (3rem) | 1 |
| `text-6xl` | 60px (3.75rem) | 1 |
| `text-7xl` | 72px (4.5rem) | 1 |
| `text-8xl` | 96px (6rem) | 1 |
| `text-9xl` | 128px (8rem) | 1 |

Do not combine scale snapping with independently set custom line heights elsewhere in an audit. Tracking and line height may only be adjusted **within** the value the matched step already provides, so the two rules never fight each other.

### Button type

- Main buttons: `text-base` (16px), semibold.
- Smaller header buttons: `text-sm` (14px), semibold.

## B2. Spacing

Only these values. Nothing between them, nothing outside them.

| Token | Value |
|---|---|
| Spacing-0 | 0 |
| Spacing-25 | 2px |
| Spacing-50 | 4px |
| Spacing-75 | 8px |
| Spacing-100 | 12px |
| Spacing-200 | 16px |
| Spacing-300 | 24px |
| Spacing-400 | 32px |
| Spacing-500 | 40px |
| Spacing-600 | 48px |
| Spacing-700 | 64px |
| Spacing-800 | 80px |
| Spacing-900 | 96px |

**Main buttons:** 8px vertical padding, 12px horizontal padding.

## B3. Corner radius

Only use Tailwind's radius values.

**Nested radius formula.** When a shape sits inside another shape and the gap between them is **less than 32px**:

```
inner radius = outer radius − gap
```

Apply this only when the result is **greater than 2**. Below that, leave the inner shape square or unchanged.

Example: an outer card at `rounded-2xl` (16px) with 8px of internal padding gives an inner element an 8px radius (`rounded-lg`).

## B4. Borders and backgrounds

- **Never apply a border to only one side of a card.** Borders go all the way around or not at all.
- **Never use gradients in backgrounds.** Backgrounds are flat.

### Dark mode background colors

Use only these:

`#000000` · `#181818` · `#1F1F1F` · `#272727` · `#313131` · `#131209`

## B5. Hero section

### Heading color

- **Dark theme:** left to right gradient on the heading text, `#FFFFFF` → `#9B9B9B`.
- **Light theme:** left to right gradient on the heading text, `#000000` → `#666666`.

This is the one place gradients are used, and only on text, never on the background.

### Layout

- Heading and subheading both get a **max width of 680px**.
- Read the heading copy and insert line breaks at **meaningful** points.
- Never break a line in a way that cuts a phrase awkwardly or makes the sentence harder to read. Break where the thought breaks.

## B6. Icons

**Use:** Phosphor, Solar, or Iconamoon.

Other project icon sets, including Material Icons and Material Symbols, are valid.

## B7. Motion

Motion should feel weighted and decelerate into place. Never ship a browser default curve (`ease`, `linear`, `ease-in-out`).

**Base curve:** `ease-[cubic-bezier(0.22,1,0.36,1)]` with `duration-500` for layout and position changes. Color and opacity shifts on hover may use `duration-300`, never shorter than 200ms.

Animate only `transform` and `opacity`. Never animate `top`, `left`, `width`, or `height`.

Respect `prefers-reduced-motion`: replace movement with a plain opacity change.

### Navigation

**Resting state.** A compact bar that floats off the top edge rather than sitting flush against it, centered and sized to its content. It uses a translucent surface over a background blur so page content stays faintly visible behind it. Spacing comes from B2, radius from B3.

**Menu toggle.** The open and close icon transforms between its two states instead of swapping instantly. Use an icon from B6 or draw the lines yourself; either way the change is animated with the base curve.

**Mobile menu.** Opens as a full height panel, not a small dropdown. The panel background uses the theme's base surface at high opacity with a strong blur.

**Link entrance.** Links inside the open menu arrive one after another in reading order, each moving up a short distance (Spacing-300, 24px) while fading in. Step each item 60ms after the previous one and cap the total sequence at 400ms so long menus never feel slow.

### Scroll reveals

Sections entering the viewport rise a short distance (Spacing-400, 32px) and fade from 0 to full opacity over 600 to 800ms on the base curve. Reveal each section once; do not replay on scroll back up.

Trigger reveals with `IntersectionObserver` or Framer Motion's `whileInView`. Never attach work to an unthrottled `window.addEventListener('scroll')`, since it runs on every frame and drags down mobile performance.

---

## B8. Content realism

Every piece of sample content should read like it came from a real product with real users.

- **Write the copy.** No placeholder Latin, no "Your headline here". Draft real sentences in the product's voice.
- **People.** Give testimonials and team members full, specific names that fit the product's audience and region. Never reuse one face for two people.
- **Brands and logos.** Invent names that sound like they belong in the product's industry. A logistics tool's customers sound like logistics companies, not generic tech startups.
- **Numbers.** Avoid suspiciously round figures. Pricing should look like real pricing, metrics should carry a decimal or an odd final digit, and dates across a list should vary.
- **Banned filler words.** Do not write "revolutionize", "supercharge", "cutting edge", "effortless", "transform your workflow", "take it to the next level", "harness the power", or "world class". Say what the product does in plain terms instead.
- **Sentence case** for headings and buttons.
- **System messages.** Confirmations are calm and specific ("Invoice sent to Dana"). Errors say what failed and what to do next ("Upload failed. The file is over 20 MB."). No cute interjections, no exclamation marks.

## B9. States

Every interactive element ships with its full state set:

- **Hover** — background shift, slight scale, or translate
- **Active** — `scale(0.98)` or `translateY(1px)` for physical feedback
- **Focus** — a visible focus ring. Accessibility requirement, not optional.
- **Loading** — skeleton loaders shaped like the real layout, not circular spinners
- **Empty** — a composed "getting started" view, never a blank panel
- **Error** — inline and specific. Never `window.alert()`.

No dead links. A button pointing at `#` is either linked or visually disabled. The current page must be indicated in the navigation.

## B10. Ship requirements

Things that get forgotten and make a page feel unfinished:

- Privacy policy and terms links in the footer
- A custom, branded 404
- Client side form validation for email format and required fields
- A skip to content link for keyboard users
- Cookie consent where the jurisdiction requires it
- A branded favicon
- `<title>`, meta description, `og:image`, and social sharing tags
- Alt text on every meaningful image
- Semantic HTML: `<nav>`, `<main>`, `<article>`, `<aside>`, `<section>`
- A way back from every page

## B11. Tagline reveal section (optional recipe)

This recipe includes one large type section stating the core benefit or tagline, separate from the hero. It sits further down the page as its own moment, not stacked directly under the hero.

**Copy**
- Minimum two lines of text.
- A benefit statement or tagline, written in the voice of A5, not a generic section heading.

**Typography**
- Size `text-4xl` to `text-6xl` depending on line count, following the B1 type scale.
- Max width capped like the hero, so lines break at meaningful points per B5.

**Animation**
- Text starts in a subtle, muted tone, roughly 25 to 35% opacity of the theme's base text color.
- As the section scrolls into view, each word transitions individually from that muted tone to the full text color, in reading order.
- Words activate one at a time as they cross a trigger line, not the entire block flipping at once. The transition uses the base curve from B7, never a linear fade.
- Implement with `IntersectionObserver` per word, or a single scroll listener throttled through `requestAnimationFrame`. Never an unthrottled `window.addEventListener('scroll')`, per B7.

---

