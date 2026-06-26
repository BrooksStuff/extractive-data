# Changes

---

## 2026-06-14

### Phase 1 — Data Infrastructure

**`data/facilities.json`** — Six seed facility records: Meta Hyperion (Richland), Entergy Project Everest gas plants (Richland), Amazon NW Louisiana campuses (Caddo, Bossier), Hut 8 AI Campus (West Feliciana), Rapides Parish AI campus (undisclosed operator). Fields include lat/lng, MW capacity, water usage, investment USD, tax incentives, status, and source references.

**`data/chapters.json`** — Eight chapter arc: Digital Cancer Alley, The Grid, The Water, The Land, The Money, Northwest Louisiana, Resistance, What Comes Next. Each chapter includes map center coordinates, zoom level, GeoJSON overlay path, and ambient audio field.

**`data/entries.json`** — Seven seed entries covering: LPSC gas plant vote (policy-event), Meta water well flagging (water-impact), $3.3B sales tax exemption (tax-incentive), Entergy ITEP filing (tax-incentive), ratepayer stranded-cost report (rate-impact), Amazon water concessions (policy-event), Digital Cancer Alley framing (environmental).

**`data/sources.json`** — Eleven sourced records linking journalism, advocacy, and academic sources to entries and facilities. Includes The Lens, Fortune, Louisiana Illuminator, Alliance for Affordable Energy, Tulane Water Law Center, nola.com.

**`src/data.js`** — Data layer: `Promise.all` fetch of four JSON files, `sessionStorage` cache, reactive event bus (`on`/`emit`), `getFiltered()` and `getFacilitiesFiltered()` with category/parish/operator/date/text filters, `setFilters()` for filter state updates.

---

### Phase 2 — Map Foundation

**`index.html`** — Full page scaffold: narrative panel, Leaflet map div, p5.js FX canvas, D3 timeline strip, filter bar. CDN-loaded: Leaflet 1.9.4, MarkerCluster, D3 v7, p5 1.11.0, Howler 2.2.4.

**`style.css`** — Dark industrial theme (ochre accent `#c8b560`, black background). Fixed layout: 360px left panel, map fills remaining viewport, 80px timeline strip, 44px filter bar at bottom. Category color system. Responsive breakpoint for mobile (panel stacks above map).

**`vite.config.js`** — Vite config: root `.`, publicDir `assets`, dev server on port 5173.

**`src/map.js`** — Leaflet map module: Stadia/Stamen Toner basemap, facility markers (colored squares sized by MW), entry markers (colored circles by category), MarkerCluster for entries, popup on click, tooltip on facility hover, `flyTo()` for chapter transitions, `loadOverlay()` for per-chapter GeoJSON layers, reactive refresh on filter change.

---

### Phase 3 — Narrative + Audio

**`src/narrative.js`** — Scrollytelling panel: chapter blocks rendered from `chapters.json`, IntersectionObserver triggers `flyTo` + overlay swap + ambient audio on scroll, dot-nav for direct chapter jump, entry detail view (title, meta, body, image carousel, audio player, source links), keyboard-accessible close button.

**`src/audio.js`** — Howler.js ambient audio engine: `playAmbient()` fades in on chapter change, `stopAmbient()` fades out; `initWaveform()` creates p5.js sketch analyzing per-entry `<audio>` element via Web Audio API analyser node, draws time-domain waveform in ochre on black canvas.

**`src/main.js`** — Bootstrap: `initData()` → `initMap(onEntryClick)` → `initNarrative(onChapterChange)` → `refreshMap()`. Entry click opens detail panel and initializes waveform. Chapter change callback wired for future timeline/fx hooks.

---

### Phase 4 — D3 Timeline + Charts

**`src/data.js`** (edit) — Exported `emit` from the event bus so cross-module events (`audioPlay`) can be fired without importing the full data module from non-data contexts.

**`src/timeline.js`** — D3 time-scale spanning all facility announcement dates and entry event dates. Two swim lanes: facility announcements (ochre diamonds, top) and effect events (category-colored circles, bottom). D3 brush selection fires `setFilters({ dateMin, dateMax })` to synchronize map marker visibility. Gridlines in dark gray. Debounced window-resize re-render.

**`src/charts.js`** — Three horizontal D3 bar charts rendered in a collapsible overlay panel (280px, right side): (1) Power capacity in MW per facility with New Orleans average baseline (~340 MW); (2) Water usage in MGal/yr with Monroe city estimate baseline; (3) Public subsidies in USD (Meta $3.3B sales tax exemption, Entergy $237M ITEP). Bars animate in on open. Panel toggles via "Charts" button in filter bar.

**`index.html`** (edit) — Added `#charts-panel` div with three chart containers; "Charts" and "FX" toggle buttons added to filter bar.

**`style.css`** (edit) — Charts panel fixed-right positioning, chart section layout, D3 axis/brush/selection overrides for dark theme.

---

### Phase 5 — p5.js Visual Layer

**`src/fx.js`** — p5.js instance-mode sketch replacing the `#fx-canvas` placeholder. Transparent canvas overlay covers the map area. Four effects: (1) **Heat shimmer** — Perlin-noise-driven oscillating rings around `under-construction` and `operational` facilities; (2) **Vapour plumes** — upward-drifting particle system from all facility positions, noise-steered horizontal drift; (3) **Flow particles** — ochre dots moving from Entergy gas plants (facility_002) to Meta Hyperion (facility_001) representing power flow; (4) **Waveform rings** — expanding ochre circles emitted from entry coordinates on `audioPlay` events, sourced from the `data.js` event bus. `setReducedMotion(bool)` pauses the p5 loop entirely. Canvas auto-resizes on window resize.

**`src/audio.js`** (edit) — `initWaveform(entry)` now accepts the entry object; on audio play, calls `emit('audioPlay', entry)` via data.js event bus so fx.js can position waveform rings at the correct map coordinates. Reuses a single `AudioContext` across entries to avoid browser context limits.

---

### Phase 6 — Filters + Polish

**`src/filters.js`** — Populates all filter UI: category toggle buttons (only for categories present in loaded data), parish dropdown (unique parishes from facilities), operator dropdown, debounced text search (250ms). Reads URL params on init to restore filter state across page loads; writes params via `history.replaceState` on every filter change. Wires `#reduced-motion-btn` to `fx.js` `setReducedMotion()`.

**`src/main.js`** (edit) — Wires all six modules in correct order: data → map → narrative → fx → timeline → charts → filters → refreshMap. `initWaveform(entry)` now receives the entry object. fx initializes before filters (filters imports `setReducedMotion` from fx).

**Build** — `vite build` completes clean: 12 modules, 20KB JS bundle, no errors.
