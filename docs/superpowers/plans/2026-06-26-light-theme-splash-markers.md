# Light Theme, Splash Page & Icon Badge Markers — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retheme the app from dark-ochre to light grey/red (Raleway), add a two-column animated splash page, and replace primitive SVG markers with circular Icon Badge markers backed by swappable icon files in `assets/icons/`.

**Architecture:** CSS variable overhaul cascades through the entire app; hardcoded hex values in three JS files need targeted fixes. The splash page is a self-contained `src/splash.js` module appended to the DOM before data loads, dismissed via an `enable()` / `done` Promise pair. Markers are rebuilt as Leaflet `L.divIcon` circular badges with `<img>` tags pointing to `assets/icons/` — replacing a placeholder means dropping a file, no code change.

**Tech Stack:** Vite, Vanilla JS ES modules, Leaflet 1.9, D3 v7, p5.js 1.11, Raleway via Google Fonts CDN

---

### Task 1: Google Fonts

**Files:**
- Modify: `index.html` (head section, before `style.css` link)

- [ ] **Step 1: Add Raleway preconnect + stylesheet links**

In `index.html`, insert these three lines immediately before `<link rel="stylesheet" href="style.css" />`:

```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700;800&display=swap" rel="stylesheet">
```

The full `<head>` block should now look like:

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Extractive Data — Louisiana Datacenter Proliferation</title>

  <!-- Leaflet -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />

  <!-- Raleway -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700;800&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="style.css" />
</head>
```

- [ ] **Step 2: Verify font loads**

Run `npm run dev` and open http://localhost:5173. Open DevTools → Network → filter by "raleway". Confirm the font CSS request returns 200. The page still looks dark (that's fine — theme comes next).

---

### Task 2: CSS Light Theme Overhaul

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Replace CSS variables block**

Replace the entire `:root { ... }` block (lines 3–25) with:

```css
:root {
  --panel-w: 360px;
  --timeline-h: 80px;
  --filter-h: 44px;
  --bg: #ebebeb;
  --surface: #f5f5f5;
  --border: #cccccc;
  --text: #111111;
  --muted: #666666;
  --accent: #cc2200;
  --cat-power: #e05c3a;
  --cat-water: #4a9fd4;
  --cat-tax: #cc2200;
  --cat-policy: #9b59b6;
  --cat-community: #2ecc71;
  --cat-resistance: #e74c3c;
  --cat-environment: #1abc9c;
  --cat-displacement: #e67e22;
  --cat-economic: #97cf89;
  --cat-rate: #e05c3a;
  --cat-air: #95a5a6;
  --cat-recording: #3498db;
}
```

- [ ] **Step 2: Update html, body font**

Replace:
```css
html, body {
  height: 100%;
  overflow: hidden;
  font-family: 'Helvetica', sans-serif;
  background: var(--bg);
  color: var(--text);
}
```

With:
```css
html, body {
  height: 100%;
  overflow: hidden;
  font-family: 'Raleway', sans-serif;
  background: var(--bg);
  color: var(--text);
}
```

- [ ] **Step 3: Update narrative header font weights**

Replace:
```css
#narrative-header h1 {
  font-size: 1.1rem;
  font-weight: bolder;
  letter-spacing: 0.04em;
  color: var(--accent);
  text-transform: uppercase;
}

.subtitle {
  font-size: 0.72rem;
  color: var(--muted);
  margin-top: 3px;
  letter-spacing: 0.02em;
}
```

With:
```css
#narrative-header h1 {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--accent);
  text-transform: uppercase;
}

.subtitle {
  font-size: 0.72rem;
  font-weight: 300;
  color: var(--muted);
  margin-top: 3px;
  letter-spacing: 0.02em;
}
```

- [ ] **Step 4: Update chapter block + entry heading font weights**

Replace:
```css
.chapter-block h2 {
  font-size: 0.9rem;
  font-weight: normal;
  color: var(--accent);
  margin-bottom: 8px;
  letter-spacing: 0.03em;
}
```

With:
```css
.chapter-block h2 {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 8px;
  letter-spacing: 0.03em;
}
```

Replace:
```css
#entry-title {
  font-size: 0.95rem;
  font-weight: normal;
  line-height: 1.4;
  color: var(--text);
}
```

With:
```css
#entry-title {
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--text);
}
```

- [ ] **Step 5: Update charts panel heading weights**

Replace:
```css
#charts-header h3 {
  font-size: 0.78rem;
  font-weight: normal;
  letter-spacing: 0.04em;
  color: var(--accent);
  text-transform: uppercase;
}
```

With:
```css
#charts-header h3 {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--accent);
  text-transform: uppercase;
}
```

Replace:
```css
.chart-section h4 {
  font-size: 0.68rem;
  font-weight: normal;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}
```

With:
```css
.chart-section h4 {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}
```

- [ ] **Step 6: Update D3 brush colours**

Replace:
```css
/* D3 brush */
.selection { fill: rgba(200, 181, 96, 0.15); stroke: #c8b560; stroke-width: 1; }
.handle { fill: #c8b560; opacity: 0.6; }
```

With:
```css
/* D3 brush */
.selection { fill: rgba(204, 34, 0, 0.1); stroke: #cc2200; stroke-width: 1; }
.handle { fill: #cc2200; opacity: 0.6; }
```

- [ ] **Step 7: Update Leaflet container background**

Replace:
```css
.leaflet-container {
  background: #111;
  font-family: inherit;
}
```

With:
```css
.leaflet-container {
  background: #e8e8e8;
  font-family: inherit;
}
```

- [ ] **Step 8: Update cat-btn active state**

The `.cat-btn.active { background: currentColor; color: var(--bg); }` already uses `var(--bg)`. With `--bg` now `#ebebeb`, active button text will be light grey on a coloured background. Add an explicit weight override so labels stay legible:

Replace:
```css
.cat-btn.active { background: currentColor; color: var(--bg); }
```

With:
```css
.cat-btn.active { background: currentColor; color: #fff; }
```

- [ ] **Step 9: Add cluster icon styles**

Append to `style.css` (after the existing `.leaflet-container` block):

```css
/* ── Marker cluster icons ────────────────────────── */
.cluster-wrap {
  background: transparent;
}
.cluster-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  font-family: inherit;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
```

- [ ] **Step 10: Add charts-btn style**

In the `/* ── Filter bar ── */` section, add after `#reduced-motion-btn`:

```css
#charts-btn {
  background: none;
  border: 1px solid var(--border);
  color: var(--muted);
  font-family: inherit;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 6px;
  cursor: pointer;
  border-radius: 2px;
}
#charts-btn:hover { color: var(--text); }
```

- [ ] **Step 11: Verify light theme**

With `npm run dev` running, open http://localhost:5173. Confirm: grey background, red accents, Raleway font in the panel. The map tiles will still be dark (basemap swap is in Task 7).

---

### Task 3: Splash Page CSS

**Files:**
- Modify: `style.css` (append to end)

- [ ] **Step 1: Append splash styles**

Add to the very end of `style.css`:

```css
/* ── Splash screen ───────────────────────────────── */

#splash-screen {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: var(--bg);
  display: flex;
}

.splash-left {
  width: 55%;
  padding: 56px 48px;
  border-right: 2px solid var(--accent);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  opacity: 0;
  transform: translateX(-12px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
#splash-screen.splash-running .splash-left {
  opacity: 1;
  transform: translateX(0);
}

.splash-right {
  width: 45%;
  padding: 56px 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

.splash-logo {
  width: 64px;
  height: auto;
  margin-bottom: 28px;
  display: block;
}

.splash-title {
  font-size: 2.6rem;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.02em;
  line-height: 1;
}

.splash-subtitle {
  font-size: 0.72rem;
  font-weight: 300;
  color: var(--accent);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-top: 8px;
}

.splash-copy {
  font-size: 0.88rem;
  font-weight: 400;
  color: var(--muted);
  line-height: 1.65;
  margin-bottom: 28px;
}

.splash-enter {
  background: var(--text);
  color: var(--bg);
  border: none;
  padding: 11px 28px;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: not-allowed;
  opacity: 0;
  align-self: flex-start;
}
.splash-enter:not(:disabled):hover {
  background: var(--accent);
}

/* Stat blocks */
.splash-stat {
  padding: 18px 0;
  border-bottom: 1px solid var(--border);
  opacity: 0;
  transform: translateY(6px);
}
.splash-stat:last-child { border-bottom: none; }

#splash-screen.splash-running .splash-stat:nth-child(1) {
  animation: splashStatIn 0.4s ease 0.3s forwards;
}
#splash-screen.splash-running .splash-stat:nth-child(2) {
  animation: splashStatIn 0.4s ease 0.7s forwards;
}
#splash-screen.splash-running .splash-stat:nth-child(3) {
  animation: splashStatIn 0.4s ease 1.1s forwards;
}
#splash-screen.splash-running .splash-stat:nth-child(4) {
  animation: splashStatIn 0.4s ease 1.5s forwards;
}

@keyframes splashStatIn {
  to { opacity: 1; transform: translateY(0); }
}

.splash-stat-num {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.02em;
  line-height: 1;
}
.splash-stat-accent { color: var(--accent); }

.splash-stat-label {
  font-size: 0.68rem;
  font-weight: 300;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-top: 5px;
}

/* Dismissal fade */
#splash-screen.splash-out {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
}
```

- [ ] **Step 2: No visual verification yet** — splash is JS-driven; it will appear after Task 4.

---

### Task 4: Splash Page JS

**Files:**
- Create: `src/splash.js`

- [ ] **Step 1: Create src/splash.js**

```js
const SPLASH_LOGO = 'assets/logo.svg'; // set to null to hide logo

export function initSplash() {
  let _resolve;
  const done = new Promise(resolve => { _resolve = resolve; });

  const screen = document.createElement('div');
  screen.id = 'splash-screen';
  screen.innerHTML = `
    <div class="splash-left">
      ${SPLASH_LOGO
        ? `<img class="splash-logo" src="${SPLASH_LOGO}" alt="" onerror="this.style.display='none'">`
        : ''}
      <div>
        <div class="splash-title">Extractive Data</div>
        <div class="splash-subtitle">Louisiana Datacenter Proliferation</div>
      </div>
      <div>
        <p class="splash-copy">$60B in datacenter investment. 10 gas plants. 500M&nbsp;gal/yr. $3.3B in tax exemptions.</p>
        <button class="splash-enter" disabled>Enter Map →</button>
      </div>
    </div>
    <div class="splash-right">
      <div class="splash-stat">
        <div class="splash-stat-num splash-stat-accent">$60B</div>
        <div class="splash-stat-label">Total investment</div>
      </div>
      <div class="splash-stat">
        <div class="splash-stat-num">10</div>
        <div class="splash-stat-label">New gas plants</div>
      </div>
      <div class="splash-stat">
        <div class="splash-stat-num">500M</div>
        <div class="splash-stat-label">Gal / yr aquifer draw</div>
      </div>
      <div class="splash-stat">
        <div class="splash-stat-num">$3.3B</div>
        <div class="splash-stat-label">Tax exemptions</div>
      </div>
    </div>
  `;
  document.body.appendChild(screen);

  // Two rAF calls ensure the browser has painted the initial opacity:0 state
  // before adding the class that triggers the CSS transition.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    screen.classList.add('splash-running');
  }));

  // After 2s, show the button dimly to signal "loading…"
  setTimeout(() => {
    if (!screen.isConnected) return;
    const btn = screen.querySelector('.splash-enter');
    btn.style.transition = 'opacity 0.4s ease';
    btn.style.opacity = '0.35';
  }, 2000);

  screen.querySelector('.splash-enter').addEventListener('click', () => {
    screen.classList.add('splash-out');
    screen.addEventListener('transitionend', () => {
      screen.remove();
      _resolve();
    }, { once: true });
  });

  return {
    done,
    enable() {
      const btn = screen.querySelector('.splash-enter');
      btn.disabled = false;
      btn.style.transition = 'opacity 0.25s ease, background-color 0.2s ease';
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    },
  };
}
```

---

### Task 5: Wire Splash into main.js

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: Update main.js**

Replace the entire contents of `src/main.js` with:

```js
import { init as initData } from './data.js';
import { init as initMap, refresh as refreshMap } from './map.js';
import { init as initNarrative, showEntry } from './narrative.js';
import { initWaveform } from './audio.js';
import { init as initTimeline } from './timeline.js';
import { init as initCharts } from './charts.js';
import { init as initFx } from './fx.js';
import { init as initFilters } from './filters.js';
import { initSplash } from './splash.js';

async function bootstrap() {
  const { done: splashDone, enable: enableEnter } = initSplash();

  await initData();

  initMap(entry => {
    showEntry(entry);
    initWaveform(entry);
  });

  initNarrative(_chapter => {});

  initFx();
  initTimeline();
  initCharts();
  initFilters();
  refreshMap();

  enableEnter();
  await splashDone;
}

bootstrap().catch(err => console.error('Bootstrap failed:', err));
```

- [ ] **Step 2: Verify splash**

Open http://localhost:5173. The splash screen should appear immediately, animate in (left panel slides, stats rise), then the Enter button dims in at ~2s. After data loads (~instant on localhost), the button should brighten to full opacity. Click Enter — the splash fades out and the map is visible. Confirm the map is fully loaded when Enter is clicked.

---

### Task 6: Placeholder SVG Icons

**Files:**
- Create: `assets/icons/` directory + 16 SVG files

All facility placeholders use a simple server rack shape; all entry placeholders use a filled circle. Both use `#333` as the icon color (visible against the white badge background).

- [ ] **Step 1: Create the icons directory**

```
mkdir assets\icons
```

- [ ] **Step 2: Create facility placeholder SVGs (4 files)**

`assets/icons/facility-datacenter.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round">
  <rect x="3" y="4" width="18" height="5" rx="1"/>
  <rect x="3" y="10" width="18" height="5" rx="1"/>
  <rect x="3" y="16" width="18" height="4" rx="1"/>
  <circle cx="19" cy="6.5" r="1" fill="#333" stroke="none"/>
  <circle cx="19" cy="12.5" r="1" fill="#333" stroke="none"/>
</svg>
```

`assets/icons/facility-gas-plant.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round">
  <path d="M12 3v4M8 7h8v11H8z"/>
  <path d="M10 18v2M14 18v2"/>
  <path d="M8 11h8M8 14h8"/>
</svg>
```

`assets/icons/facility-transmission.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round">
  <path d="M5 4l4 6H4l4 6M19 4l-4 6h5l-4 6"/>
  <line x1="9" y1="10" x2="15" y2="10"/>
  <line x1="9" y1="16" x2="15" y2="16"/>
</svg>
```

`assets/icons/facility-cooling.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round">
  <circle cx="12" cy="12" r="4"/>
  <line x1="12" y1="2" x2="12" y2="7"/>
  <line x1="12" y1="17" x2="12" y2="22"/>
  <line x1="2" y1="12" x2="7" y2="12"/>
  <line x1="17" y1="12" x2="22" y2="12"/>
  <line x1="4.9" y1="4.9" x2="8.3" y2="8.3"/>
  <line x1="15.7" y1="15.7" x2="19.1" y2="19.1"/>
  <line x1="19.1" y1="4.9" x2="15.7" y2="8.3"/>
  <line x1="8.3" y1="15.7" x2="4.9" y2="19.1"/>
</svg>
```

- [ ] **Step 3: Create entry placeholder SVGs (12 files)**

Each is a single filled circle. They are functionally identical placeholders — the ring color differentiates entries, the icon will be replaced later with a meaningful symbol.

`assets/icons/entry-power-infrastructure.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#333"/></svg>
```

Create identical files for the remaining 11 entry categories (copy the same SVG content to each):

- `assets/icons/entry-rate-impact.svg`
- `assets/icons/entry-water-impact.svg`
- `assets/icons/entry-air-quality.svg`
- `assets/icons/entry-displacement.svg`
- `assets/icons/entry-tax-incentive.svg`
- `assets/icons/entry-policy-event.svg`
- `assets/icons/entry-community-testimony.svg`
- `assets/icons/entry-resistance.svg`
- `assets/icons/entry-field-recording.svg`
- `assets/icons/entry-environmental.svg`
- `assets/icons/entry-economic-effect.svg`

---

### Task 7: Icon Badge Markers + Basemap

**Files:**
- Modify: `src/map.js`

- [ ] **Step 1: Replace makeFacilityIcon**

Replace the existing `makeFacilityIcon` function (lines 46–61) with:

```js
function makeFacilityIcon(facility, minMW, maxMW) {
  const mw = facility.capacity_mw || 0;
  const ringWeight = (minMW === maxMW || maxMW === 0)
    ? 3
    : Math.round(2 + ((mw - minMW) / (maxMW - minMW)) * 3);
  const type = facility.type || 'datacenter';
  const iconPath = `assets/icons/facility-${type}.svg`;
  const html = `
    <div style="
      width:40px;height:40px;border-radius:50%;
      background:#fff;
      border:${ringWeight}px solid #cc2200;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 1px 4px rgba(0,0,0,0.18);
    ">
      <img src="${iconPath}" width="20" height="20" alt="" style="display:block;">
    </div>`;
  return L.divIcon({
    html,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
}
```

- [ ] **Step 2: Replace makeEntryIcon**

Replace the existing `makeEntryIcon` function (lines 32–44) with:

```js
function makeEntryIcon(category) {
  const color = categoryColor(category);
  const iconPath = `assets/icons/entry-${category}.svg`;
  const html = `
    <div style="
      width:28px;height:28px;border-radius:50%;
      background:#fff;
      border:2px solid ${color};
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 1px 3px rgba(0,0,0,0.15);
    ">
      <img src="${iconPath}" width="13" height="13" alt="" style="display:block;opacity:0.6;">
    </div>`;
  return L.divIcon({
    html,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}
```

- [ ] **Step 3: Update renderFacilities to pre-calculate MW range**

Replace the `renderFacilities` function (lines 110–133) with:

```js
function renderFacilities() {
  const facilities = getFacilitiesFiltered().filter(f => f.lat && f.lng);
  const mwVals = facilities.map(f => f.capacity_mw).filter(Boolean);
  const minMW = mwVals.length ? Math.min(...mwVals) : 0;
  const maxMW = mwVals.length ? Math.max(...mwVals) : 1;

  facilities.forEach(f => {
    const icon = makeFacilityIcon(f, minMW, maxMW);
    const marker = L.marker([f.lat, f.lng], { icon });

    const mwLabel = f.capacity_mw ? `${f.capacity_mw} MW` : 'capacity TBD';
    const investLabel = f.investment_usd
      ? `$${(f.investment_usd / 1e9).toFixed(1)}B`
      : 'investment TBD';

    marker.bindTooltip(
      `<div class="facility-tooltip">
        <strong>${f.name}</strong><br/>
        ${f.operator} &middot; ${f.parish} Parish<br/>
        ${mwLabel} &middot; ${investLabel}<br/>
        <em>${f.status}</em>
      </div>`,
      { className: '', direction: 'top', sticky: true }
    );

    _facilityLayer.addLayer(marker);
  });
}
```

- [ ] **Step 4: Switch basemap to Stamen Toner (light)**

In the `init` function, replace:

```js
  L.tileLayer(
    'https://tiles.stadiamaps.com/tiles/stamen_toner_blacklite/{z}/{x}/{y}{r}.png',
    {
      attribution:
        '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://openstreetmap.org/">OpenStreetMap</a>',
      maxZoom: 18,
    }
  ).addTo(_map);
```

With:

```js
  L.tileLayer(
    'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png',
    {
      attribution:
        '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://openstreetmap.org/">OpenStreetMap</a>',
      maxZoom: 18,
    }
  ).addTo(_map);
```

- [ ] **Step 5: Update GeoJSON overlay accent colour**

In `loadOverlay`, replace:

```js
        style: {
          color: '#c8b560',
```

With:

```js
        style: {
          color: '#cc2200',
```

- [ ] **Step 6: Verify markers and basemap**

Open http://localhost:5173, dismiss the splash. Confirm: Stamen Toner tiles (black/white), circular white-background badges for facility markers (red rings of varying weight), circular badges for entry markers (category-coloured rings), placeholder circle/rack icons inside each badge.

---

### Task 8: Fix D3 Colors — timeline.js

**Files:**
- Modify: `src/timeline.js`

- [ ] **Step 1: Update facility diamond colour**

Replace (line 85):
```js
    .attr('fill', '#c8b560')
```

With:
```js
    .attr('fill', '#cc2200')
```

- [ ] **Step 2: Update lane label colours**

Replace both label `attr('fill', ...)` calls (lines 64 and 68):

```js
  _svg.append('text')
    .attr('x', 4).attr('y', LANE_FAC + 3)
    .attr('fill', '#444').attr('font-size', 8).attr('font-family', 'inherit')
    .text('FACILITIES');

  _svg.append('text')
    .attr('x', 4).attr('y', LANE_ENT + 3)
    .attr('fill', '#444').attr('font-size', 8).attr('font-family', 'inherit')
    .text('EVENTS');
```

With:
```js
  _svg.append('text')
    .attr('x', 4).attr('y', LANE_FAC + 3)
    .attr('fill', '#666').attr('font-size', 8).attr('font-family', 'inherit')
    .text('FACILITIES');

  _svg.append('text')
    .attr('x', 4).attr('y', LANE_ENT + 3)
    .attr('fill', '#666').attr('font-size', 8).attr('font-family', 'inherit')
    .text('EVENTS');
```

- [ ] **Step 3: Verify timeline**

Open http://localhost:5173. Scroll to the bottom timeline strip. Facility diamonds should be red; entry circles should be category-coloured; the axis ticks and lane labels should be legible on the light grey background.

---

### Task 9: Fix D3 Colors — charts.js

**Files:**
- Modify: `src/charts.js`

- [ ] **Step 1: Update ACCENT and DIM constants**

Replace (lines 6–7):
```js
const ACCENT = '#c8b560';
const DIM = '#333';
```

With:
```js
const ACCENT = '#cc2200';
const DIM = '#666';
```

- [ ] **Step 2: Update hardcoded fill colours for bar labels**

Replace (line 58):
```js
    .attr('fill', '#999').attr('font-size', 9).attr('font-family', 'inherit')
```

With:
```js
    .attr('fill', '#666').attr('font-size', 9).attr('font-family', 'inherit')
```

Replace (line 77):
```js
    .attr('fill', '#888').attr('font-size', 8).attr('font-family', 'inherit')
```

With:
```js
    .attr('fill', '#555').attr('font-size', 8).attr('font-family', 'inherit')
```

- [ ] **Step 3: Update tax data bar colour**

Replace (line 136):
```js
    { label: 'Meta — sales tax (20yr)', value: 3300, color: '#c8b560' },
```

With:
```js
    { label: 'Meta — sales tax (20yr)', value: 3300, color: '#cc2200' },
```

- [ ] **Step 4: Verify charts**

Open http://localhost:5173, dismiss splash, click the Charts button. All bars should render on the light panel. Red accent bars, legible axis labels, baseline reference lines visible.

---

### Task 10: Fix p5.js Colors — fx.js

**Files:**
- Modify: `src/fx.js`

- [ ] **Step 1: Update heat shimmer stroke**

Replace (line 133):
```js
    p.stroke(224, 92, 58, alpha);
```

With:
```js
    p.stroke(204, 34, 0, alpha);
```

- [ ] **Step 2: Update vapour particle fill** (darken for visibility on light bg)

Replace (line 159):
```js
    p.fill(200, 200, 210, this.life * 35);
```

With:
```js
    p.fill(100, 100, 110, this.life * 50);
```

- [ ] **Step 3: Update flow particle fill** (was ochre, now red)

Replace (line 179):
```js
    p.fill(200, 181, 96, alpha);
```

With:
```js
    p.fill(204, 34, 0, alpha);
```

- [ ] **Step 4: Update waveform ring stroke** (was white-on-dark, now red-on-light)

Replace (line 108):
```js
        p.stroke(255, 255, 255, ring.life * 200);
```

With:
```js
        p.stroke(204, 34, 0, ring.life * 180);
```

- [ ] **Step 5: Final full verification**

Open http://localhost:5173. Walk through the full app:
1. Splash animates in correctly; Enter button dims at 2s, brightens on data ready
2. Dismiss splash → map visible, light Stamen Toner tiles
3. Left panel: Raleway font, red accents, grey background
4. Map markers: circular badges, red-ringed facilities (larger = more MW), category-ringed entries
5. Click an entry marker → popup opens, entry detail panel slides in
6. Scroll timeline → D3 brush works, facility diamonds are red
7. Click Charts → light panel, legible bar charts with red accents
8. Toggle FX off/on → p5 canvas heat shimmer and particles visible against light bg
9. Category filter toggles → entries filter on map and timeline
