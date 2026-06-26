# Design: Light Theme, Splash Page, Icon Badge Markers

**Date:** 2026-06-26  
**Project:** Field Poetics — Louisiana Datacenter Proliferation  
**Scope:** Three coordinated visual changes to the existing Vite/Vanilla JS app

---

## 1. Light Theme Overhaul

### Direction
Industrial / technical aesthetic: cool neutral grey, signal red, monospace type throughout.

### CSS Variable Changes (`style.css`)

| Variable | Old | New |
|---|---|---|
| `--bg` | `#0d0d0d` | `#ebebeb` |
| `--surface` | `#141414` | `#f5f5f5` |
| `--border` | `#2a2a2a` | `#cccccc` |
| `--text` | `#e0ddd8` | `#111111` |
| `--muted` | `#888888` | `#666666` |
| `--accent` | `#c8b560` | `#cc2200` |

**Font family:** Raleway (Google Fonts), loaded in `index.html` via `<link>` — weights 300, 400, 600, 700, 800. Applied globally via `font-family: 'Raleway', sans-serif` on `html, body`. Hierarchy expressed through weight variation: 800 for primary titles, 700 for section headings, 600 for labels/tags, 400 for body, 300 for muted/secondary text. No monospace anywhere.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700;800&display=swap" rel="stylesheet">
```

### Downstream color references to update
- `src/timeline.js`: any hardcoded hex colors for axis text, gridlines, brush — replace with CSS var references or matching light-theme values
- `src/charts.js`: axis text color, bar fill references — same
- `src/fx.js`: p5.js background call uses `#111` — update to `#ebebeb`; ochre particle colors (`#c8b560`) update to `#cc2200`
- Leaflet popups: already use CSS vars; will follow automatically
- D3 brush `.selection` fill and `.handle` fill: update from ochre to `#cc2200`

### Category colors
Unchanged — they are functional/semantic and remain as defined. The 12 `--cat-*` variables stay.

---

## 2. Splash Page

### Layout
Two-column fixed overlay (`position: fixed; inset: 0; z-index: 2000`). Sits above all map/panel content. Background: `var(--bg)`.

**Left column (55%):** separated from right by a `2px solid #cc2200` vertical rule.
- Logo image (`<img>` from `SPLASH_LOGO` path)
- Title: `EXTRACTIVE DATA` — uppercase, bold, monospace
- Subtitle: `Louisiana Datacenter Proliferation` — weight 300, uppercase, letter-spacing, `#cc2200`
- Framing copy: `$60B in datacenter investment. 10 gas plants. 500M gal/yr. $3.3B in tax exemptions.`
- Enter button: `ENTER MAP →` — black background, white text, monospace

**Right column (45%):**
Four stat blocks, each with a large figure and small uppercase label, separated by `1px solid var(--border)`:
1. `$60B` / total investment — figure in `#cc2200`
2. `10` / new gas plants
3. `500M` / gal/yr aquifer draw
4. `$3.3B` / tax exemptions

### Logo configuration
`src/splash.js` exports a `SPLASH_LOGO` constant at the top of the file:
```js
const SPLASH_LOGO = 'assets/logo.svg'; // set to null to hide
```
Set to `null` to suppress the logo area entirely. No other code change needed.

### Animation (Staggered Reveal)

All elements start hidden. On mount, CSS transitions fire in sequence:

| Element | Property | Delay | Duration |
|---|---|---|---|
| Left panel | `opacity 0→1`, `translateX(-12px→0)` | 0ms | 500ms ease |
| Stat 1 | `opacity 0→1`, `translateY(6px→0)` | 300ms | 400ms ease |
| Stat 2 | same | 700ms | 400ms ease |
| Stat 3 | same | 1100ms | 400ms ease |
| Stat 4 | same | 1500ms | 400ms ease |
| Enter button | `opacity 0→1` | 2000ms | 400ms ease |

### Dismissal
The Enter button is **disabled** until `enableEnter()` is called from `main.js` (after all modules are initialized). Once enabled, clicking Enter triggers a 400ms `opacity 1→0` transition on `#splash-screen`, then `display: none`. This prevents a race condition where the user could dismiss the splash before the map is ready.

### Integration with main.js
```js
// main.js — new order
import { initSplash } from './splash.js';

async function bootstrap() {
  const { done: splashDone, enable: enableEnter } = initSplash(); // animation starts immediately
  await initData();
  initMap(...);
  // ... rest of init ...
  refreshMap();
  enableEnter();      // map is ready — unlock the Enter button
  await splashDone;   // wait for user to click Enter before resolving bootstrap
}
```
`initSplash()` returns `{ done: Promise, enable: Function }`. The Enter button renders immediately with a `disabled` state and transitions to active when `enable()` is called. If the user clicks Enter quickly, they see the animation play out and the button appears, but cannot dismiss until data is ready.

### New file
`src/splash.js` — self-contained; no dependencies on other src modules except optionally `data.js` for live stat counts.

---

## 3. Icon Badge Markers

### System
Both facility and entry markers use Leaflet `L.divIcon` with a circular badge. A white circle with a colored ring, SVG icon centered inside.

### Facility markers
- **Size:** 40×40px outer diameter
- **Ring:** `border: {weight}px solid #cc2200`; weight scales linearly from **2px** (min MW in dataset) to **5px** (max MW). Calculated in `map.js` at render time from the loaded facility set.
- **Icon source:** `assets/icons/facility-{type}.svg` where `type` ∈ `datacenter | gas-plant | transmission | cooling`
- **Placeholder:** if icon file is absent, renders an inline SVG of the first two uppercase letters of the type in `#cc2200`

### Entry markers
- **Size:** 28×28px outer diameter
- **Ring:** `border: 2px solid {categoryColor}` (fixed weight); color from the `--cat-*` CSS variable for the entry's category
- **Icon source:** `assets/icons/entry-{category}.svg` where `category` is the entry's category slug
- **Placeholder:** if icon file is absent, renders a solid 8px circle in the category color

### Icon file convention
- All icons: SVG, `viewBox="0 0 24 24"`, monochrome (single path/shape, no hardcoded fill colors — the marker ring provides the color)
- Drop a file into `assets/icons/` to activate it; no code change required
- Filename must match the type/category slug exactly (lowercase, hyphenated)

### Placeholder SVGs to create at implementation time
16 files needed for full placeholder coverage:

**Facility (4):**
- `facility-datacenter.svg`
- `facility-gas-plant.svg`
- `facility-transmission.svg`
- `facility-cooling.svg`

**Entry (12):**
- `entry-power-infrastructure.svg`
- `entry-rate-impact.svg`
- `entry-water-impact.svg`
- `entry-air-quality.svg`
- `entry-displacement.svg`
- `entry-tax-incentive.svg`
- `entry-policy-event.svg`
- `entry-community-testimony.svg`
- `entry-resistance.svg`
- `entry-field-recording.svg`
- `entry-environmental.svg`
- `entry-economic-effect.svg`

Placeholders are simple geometric SVGs (square for facilities, circle for entries) sufficient for a working map before real icons are designed.

---

## Implementation Order

1. Theme overhaul (`style.css` + downstream JS color references)
2. Placeholder icon SVGs (`assets/icons/`)
3. Splash page (`src/splash.js` + `index.html` + `main.js` wiring)
4. Marker redesign (`src/map.js`)
