# figsniff

> Reverse-engineer any website's design system — colors, typography, spacing, components, and libraries.

**figsniff** is an open-source CLI tool and Node.js library that dissects the visual design of any website. Point it at a URL and get back a complete design system snapshot: color palette, font stack, spacing scale, border radii, shadows, breakpoints, component styles, animations, detected libraries, and icon sets — all in a beautiful dark-themed HTML report or structured JSON.

No AI required. Pure CSS/DOM extraction via Playwright.

---

## Demo

```bash
figsniff https://tailwindcss.com
```

```bash
  figsniff  design extractor
  ─────────────────────────────────────────
  Target  https://tailwindcss.com
  Output  ./figsniff-output
  Format  html, json
  ─────────────────────────────────────────

✔ Scan complete!

  Design System
  ─────────────────────────────────────────
  🎨 Colors         30 unique
  🔤 Fonts          Inter, Plex Mono, system-ui
  📐 Spacing        33 values
  ⬜ Border Radii   6px, 8px, 12px, 16px, 32px
  🗂️  Breakpoints   40rem, 48rem, 64rem

  Libraries Detected
  ─────────────────────────────────────────
  ✓ Tailwind CSS
  ✓ Next.js
```

---

## Features

| Category | What it extracts |
|---|---|
| **Colors** | All colors grouped by role (background, text, border) with hex values, frequency count, and visual palette strip |
| **Typography** | Font families, size scale, font weights, line heights, letter spacings |
| **Spacing** | Unified spacing scale — padding, margin, gap values sorted and deduplicated |
| **Borders** | Border radii (with visual preview), border widths, border styles |
| **Shadows** | Box shadows and text shadows with live visual preview |
| **Layout** | Media query breakpoints, flex/grid usage count, container max-widths |
| **Components** | Buttons, inputs, cards, navbars, modals, badges, links — with computed style table and live button preview |
| **Animations** | Transitions, transforms, `@keyframe` names, durations, easing functions |
| **Libraries** | 25+ signatures: React, Next.js, Vue, Nuxt, Angular, Svelte, Tailwind, Bootstrap, MUI, Chakra, Ant Design, Styled Components, Emotion, Redux, Google Fonts, Font Awesome, and more |
| **Icons** | Inline SVG count, SVG sprites, Font Awesome, Material Icons, Bootstrap Icons, image icons |

---

## Install

### Global CLI

```bash
npm install -g figsniff
# or
pnpm add -g figsniff
```

> **First run**: Playwright needs a Chromium browser.
> ```bash
> npx playwright install chromium
> ```

### In a project

```bash
pnpm add figsniff
# or
npm install figsniff
```

---

## CLI Usage

```bash
figsniff <url> [options]
```

### Options

| Flag | Default | Description |
|---|---|---|
| `-o, --out <dir>` | `./figsniff-output` | Output directory |
| `-f, --format <formats>` | `html,json` | Output formats, comma-separated |
| `--wait <ms>` | `2000` | Extra wait time after page load |
| `--width <px>` | `1440` | Viewport width |
| `--height <px>` | `900` | Viewport height |
| `--headed` | `false` | Show the browser window |

### Examples

```bash
# Basic scan — outputs HTML + JSON report
figsniff https://stripe.com

# JSON only, custom output directory
figsniff https://vercel.com --format json --out ./reports

# Wait longer for heavy SPAs (React, Next.js)
figsniff https://linear.app --wait 4000

# See the browser while it works
figsniff https://github.com --headed

# HTML report only
figsniff https://figma.com --format html
```

---

## Library Usage

```ts
import { sniff } from "figsniff";

const result = await sniff({ url: "https://stripe.com" });

// Colors
console.log(result.colors.palette);          // ["#635bff", "#0a2540", ...]
console.log(result.colors.backgrounds);      // ColorInfo[]

// Typography
console.log(result.typography.fontFamilies); // ["Sohne", "system-ui"]
console.log(result.typography.fontSizes);    // ["12px", "14px", "16px", ...]

// Spacing scale
console.log(result.spacing.unique);          // ["4px", "8px", "16px", ...]

// Libraries
console.log(result.libraries);
// [{ name: "React", confidence: "certain", evidence: "..." }]

// Components
console.log(result.components.buttons);      // ComponentInfo[]
```

### All options

```ts
import { sniff, FigsniffOptions } from "figsniff";

const result = await sniff({
  url: "https://example.com",
  waitMs: 3000,          // wait after load
  viewportWidth: 1440,
  viewportHeight: 900,
  headless: true,        // false to see browser
});
```

### Generate reports programmatically

```ts
import { sniff, writeReports, generateHtmlReport } from "figsniff";

const result = await sniff({ url: "https://example.com" });

// Write HTML + JSON to disk
const output = await writeReports(result, "./output", ["html", "json"]);
console.log(output.htmlPath); // /path/to/report.html

// Get raw HTML string
const html = generateHtmlReport(result);
```

---

## Output

### HTML Report

A self-contained dark-themed HTML file with:

- **Sticky sidebar** with section navigation
- **Color swatches** — visual preview with hex value and usage frequency
- **Palette strip** — top colors in one horizontal bar
- **Font preview** — each font family rendered live
- **Font size scale** — visual size ladder
- **Spacing scale** — bar visualization per value
- **Border radius demos** — live box previews
- **Shadow demos** — live box/text previews
- **Breakpoint table** — min/max-width with color coding
- **Component cards** — computed style table + live button previews
- **Library cards** — with confidence level badges

### JSON Output

Structured data suitable for programmatic use, design token generation, or feeding into other tools.

```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "scannedAt": "2026-02-23T12:46:54.000Z",
  "durationMs": 3279,
  "colors": {
    "palette": ["#0a0a0a", "#ffffff"],
    "backgrounds": [...],
    "texts": [...],
    "borders": [...]
  },
  "typography": {
    "fontFamilies": ["Inter", "system-ui"],
    "fontSizes": ["12px", "14px", "16px"],
    "fontWeights": ["400", "600", "700"],
    "lineHeights": ["1.5", "1.75"],
    "letterSpacings": ["-0.01em"]
  },
  "spacing": {
    "paddings": ["8px", "16px", "24px"],
    "margins": ["0px", "8px"],
    "gaps": ["8px", "16px"],
    "unique": ["4px", "8px", "12px", "16px", "24px"]
  },
  "borders": { "radii": ["4px", "8px"], "widths": ["1px"], "styles": ["solid"] },
  "shadows": { "boxShadows": [...], "textShadows": [] },
  "layout": {
    "breakpoints": [{ "value": "768px", "type": "min-width" }],
    "flexUsage": 142,
    "gridUsage": 18,
    "containerWidths": ["1280px", "960px"]
  },
  "components": { "buttons": [...], "inputs": [...], "cards": [...] },
  "animations": { "transitions": [...], "keyframes": [...] },
  "libraries": [
    { "name": "React", "confidence": "certain", "evidence": "..." }
  ],
  "icons": [{ "type": "svg-inline", "count": 34 }],
  "meta": { "stylesheetCount": 3, "ruleCount": 1204, "elementCount": 891 }
}
```

---

## How it works

1. **Playwright** launches a headless Chromium browser and loads the target URL
2. Waits for `networkidle` + optional extra delay (for SPAs that render lazily)
3. All 10 extractors run **in parallel** inside the browser via `page.evaluate()`
4. Results are aggregated, deduplicated, and sorted
5. Reports are written to disk

No AI, no external API calls. Everything happens locally in your browser.

---

## Detected Libraries

figsniff has signatures for 25+ libraries:

**CSS Frameworks** — Tailwind CSS, Bootstrap, Material UI, Chakra UI, Ant Design, shadcn/ui  
**JS Frameworks** — React, Next.js, Vue.js, Nuxt.js, Angular, Svelte, Remix, Gatsby  
**CSS-in-JS** — Styled Components, Emotion  
**State** — Redux  
**Icons** — Font Awesome, Lucide, Heroicons, Material Icons, Bootstrap Icons  
**Fonts** — Google Fonts  
**Analytics** — Google Analytics, Google Tag Manager  
**Build tools** — Webpack, Vite  

Confidence levels: `certain` / `likely` / `possible`

---

## Limitations

- **Auth-gated pages** — figsniff only scans public pages (no cookie/session injection yet)
- **Canvas-based UIs** — design tokens inside WebGL/Canvas are not extractable
- **CSS-in-JS runtime styles** — Styled Components and Emotion generate class names at runtime; some values may be missed depending on what is rendered
- **Rate limiting** — aggressive sites may block headless browsers

---

## Contributing

Pull requests are welcome. To add a new library signature, edit `src/extractors/libraries.ts` and add an entry to the `SIGNATURES` array.

```ts
{
  name: "My Library",
  checks: [
    { type: "global", value: "MyLib" },
    { type: "class", value: "mylib-" },
  ],
  confidence: "certain",
}
```

Check types: `global` · `class` · `attribute` · `script` · `link` · `meta` · `selector`

---

## License

MIT
