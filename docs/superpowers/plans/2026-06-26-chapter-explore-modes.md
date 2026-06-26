# Chapter Mode / Free Exploration Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a two-phase UX where users scroll through all chapters in a guided mode, then unlock a free exploration mode with layer toggles, a timeline toggle, and a return-to-chapters button.

**Architecture:** `narrative.js` owns all mode state (`_mode: 'chapters' | 'explore'`, `_hasCompleted`, `_timelineVisible`). CSS layout adapts dynamically: JS updates `--timeline-h` and `--filter-h` custom properties on `:root` so the map bottom recalculates without any class juggling. Layer visibility is a new export from `map.js`. Category constants are shared via a new `export` in `filters.js`.

**Tech Stack:** Vanilla JS ES modules, Leaflet 1.9, D3 v7, CSS custom properties.

---

## File Map

| File | Change |
|---|---|
| `src/timeline.js` | Export `redraw()` |
| `src/filters.js` | Export `CATEGORIES` array |
| `src/map.js` | Add `_overlaysVisible` state + export `setLayerVisible(type, bool)`, update `loadOverlay` |
| `src/narrative.js` | Add mode state, layout helpers, completion detection, explore panel, mode transitions, mode-aware entry show/close |
| `style.css` | Add explore panel, completion button, toolbar button, layer toggle, category toggle styles |

---

### Task 1: Export `redraw()` from timeline.js

**Files:**
- Modify: `src/timeline.js`

`render()` already exists in `timeline.js` but is module-private. When the timeline is hidden and then shown, `clientWidth` is 0 during the original `init()` call, so the SVG renders at zero width. Exposing `render()` as `redraw()` lets `narrative.js` trigger a correct re-render after making the panel visible.

- [ ] **Step 1: Add the export**

In `src/timeline.js`, add this line after the `clearBrush` export (end of file):

```js
export function redraw() { render(); }
```

- [ ] **Step 2: Verify**

Run `npm run dev`. App loads without errors. Timeline renders as before.

- [ ] **Step 3: Commit**

```bash
git add src/timeline.js
git commit -m "feat: export redraw() from timeline.js"
```

---

### Task 2: Export `CATEGORIES` from filters.js

**Files:**
- Modify: `src/filters.js`

`narrative.js` needs to render category toggles in the explore panel. Rather than duplicating the array, export it from `filters.js`.

- [ ] **Step 1: Add export keyword to the CATEGORIES declaration**

In `src/filters.js`, line 5 currently reads:

```js
const CATEGORIES = [
```

Change it to:

```js
export const CATEGORIES = [
```

- [ ] **Step 2: Verify**

Run `npm run dev`. App loads, no errors. Category buttons in filter bar still render correctly.

- [ ] **Step 3: Commit**

```bash
git add src/filters.js
git commit -m "feat: export CATEGORIES from filters.js"
```

---

### Task 3: Layer visibility API in map.js

**Files:**
- Modify: `src/map.js`

Adds `setLayerVisible(type, bool)` export for entries, facilities, and overlays. The overlay layer is special — it is created and destroyed by `loadOverlay()`, so a `_overlaysVisible` boolean tracks intent and `loadOverlay()` checks it before adding the layer to the map.

- [ ] **Step 1: Add `_overlaysVisible` state variable**

In `src/map.js`, the module-level variable declaration on line 18 currently reads:

```js
let _map, _entryLayer, _facilityLayer, _overlayLayer, _onEntryClick;
```

Change it to:

```js
let _map, _entryLayer, _facilityLayer, _overlayLayer, _onEntryClick;
let _overlaysVisible = true;
```

- [ ] **Step 2: Update `loadOverlay` to respect `_overlaysVisible`**

In `src/map.js`, find the `loadOverlay` function. Inside the fetch `.then` callback, the line that creates `_overlayLayer` calls `.addTo(_map)` directly, like:

```js
_overlayLayer = L.geoJSON(geojson, { ... }).addTo(_map);
```

Change it so the layer is only added when `_overlaysVisible` is true:

```js
_overlayLayer = L.geoJSON(geojson, { ... });
if (_overlaysVisible) _map.addLayer(_overlayLayer);
```

- [ ] **Step 3: Add `setLayerVisible` export**

At the bottom of `src/map.js`, add:

```js
export function setLayerVisible(type, show) {
  if (type === 'entries') {
    if (show) _map.addLayer(_entryLayer);
    else _map.removeLayer(_entryLayer);
  } else if (type === 'facilities') {
    if (show) _map.addLayer(_facilityLayer);
    else _map.removeLayer(_facilityLayer);
  } else if (type === 'overlays') {
    _overlaysVisible = show;
    if (_overlayLayer) {
      if (show) _map.addLayer(_overlayLayer);
      else _map.removeLayer(_overlayLayer);
    }
  }
}
```

- [ ] **Step 4: Verify**

Run `npm run dev`. App loads, map renders. Open the browser console and run:

```js
import('/src/map.js').then(m => m.setLayerVisible('entries', false))
```

Entry markers disappear. Run with `true` — they reappear.

- [ ] **Step 5: Commit**

```bash
git add src/map.js
git commit -m "feat: setLayerVisible() API in map.js"
```

---

### Task 4: Layout helpers in narrative.js + hide timeline/filterbar on init

**Files:**
- Modify: `src/narrative.js`

Chapter mode shows only the map and narrative panel. Timeline and filter bar are hidden. These helpers update both the DOM `hidden` attribute and the `:root` CSS custom property so the map `bottom` calculation (which uses `--timeline-h` and `--filter-h`) recalculates immediately.

Current `:root` values: `--timeline-h: 80px`, `--filter-h: 44px`.

- [ ] **Step 1: Add layout helper functions**

In `src/narrative.js`, add these two functions after the module-level variable declarations (after `let _onChapterChange = null;`, before `export function init`):

```js
function setTimelineVisible(show) {
  document.getElementById('timeline-wrap').hidden = !show;
  document.documentElement.style.setProperty('--timeline-h', show ? '80px' : '0px');
}

function setFilterBarVisible(show) {
  document.getElementById('filter-bar').hidden = !show;
  document.documentElement.style.setProperty('--filter-h', show ? '44px' : '0px');
}
```

- [ ] **Step 2: Call both at the start of `init()`**

In `src/narrative.js`, add these two lines at the very top of the `init()` function body, before `const { chapters } = getState();`:

```js
setTimelineVisible(false);
setFilterBarVisible(false);
```

- [ ] **Step 3: Verify layout**

Run `npm run dev`. The timeline bar and filter bar are no longer visible. The map fills the full browser height (minus the narrative panel). No console errors.

- [ ] **Step 4: Commit**

```bash
git add src/narrative.js
git commit -m "feat: hide timeline and filter bar in chapter mode"
```

---

### Task 5: Last-chapter detection + "Begin Exploring" button

**Files:**
- Modify: `src/narrative.js`
- Modify: `style.css`

When the user scrolls the last chapter block into view, a "Begin Exploring →" button fades in at the bottom of the chapter list. The button calls `_enterExploreMode()`, which is defined in the next task. A `typeof` guard prevents errors while Task 6 has not yet been applied.

- [ ] **Step 1: Add `_hasCompleted` module-level state**

In `src/narrative.js`, update the module-level variable declarations to:

```js
let _activeChapterId = null;
let _hasCompleted = false;
let _mode = 'chapters';
let _timelineVisible = false;
let _observer = null;
let _onChapterChange = null;
```

(`_mode` and `_timelineVisible` are used by later tasks — declare them all together here.)

- [ ] **Step 2: Append the "Begin Exploring" button to the chapter list**

In `src/narrative.js`, inside the `init()` function, after the `sorted.forEach(ch => { ... list.appendChild(block); });` loop, add:

```js
const beginBtn = document.createElement('button');
beginBtn.id = 'begin-exploring';
beginBtn.hidden = true;
beginBtn.textContent = 'Begin Exploring →';
beginBtn.addEventListener('click', () => {
  if (typeof _enterExploreMode === 'function') _enterExploreMode();
});
list.appendChild(beginBtn);
```

- [ ] **Step 3: Update the IntersectionObserver to detect last-chapter scroll**

In `src/narrative.js`, the IntersectionObserver setup currently reads:

```js
_observer = new IntersectionObserver(
  entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.dataset.id;
        const ch = chapters.find(c => c.id === id);
        if (ch && ch.id !== _activeChapterId) activateChapter(ch, false);
      }
    });
  },
  { root: list, threshold: 0.5 }
);
```

Replace with:

```js
const lastChapterId = sorted[sorted.length - 1].id;

_observer = new IntersectionObserver(
  entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.dataset.id;
        const ch = chapters.find(c => c.id === id);
        if (ch && ch.id !== _activeChapterId) activateChapter(ch, false);
        if (id === lastChapterId && !_hasCompleted) {
          _hasCompleted = true;
          beginBtn.hidden = false;
        }
      }
    });
  },
  { root: list, threshold: 0.5 }
);
```

- [ ] **Step 4: Add CSS for the button**

In `style.css`, find the `/* ── Entry detail */` comment. Add BEFORE it:

```css
/* ── Chapter completion button ──────────────────── */

#begin-exploring {
  display: block;
  width: calc(100% - 36px);
  margin: 20px 18px 32px;
  padding: 12px 16px;
  background: var(--accent);
  color: #fff;
  border: none;
  font-family: 'Raleway', sans-serif;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

#begin-exploring:hover { opacity: 0.85; }
```

- [ ] **Step 5: Verify**

Run `npm run dev`. Scroll to the last chapter in the narrative panel. The "Begin Exploring →" button appears at the bottom of the list. Clicking it does nothing yet (no error in console).

- [ ] **Step 6: Commit**

```bash
git add src/narrative.js style.css
git commit -m "feat: last-chapter detection and Begin Exploring button"
```

---

### Task 6: Explore panel DOM + mode transition functions

**Files:**
- Modify: `src/narrative.js`
- Modify: `style.css`

Builds the explore panel, implements `_enterExploreMode()` and `_enterChapterMode()`, and updates `showEntry()` / `closeEntry()` to be mode-aware. Category toggles and timeline wiring come in later tasks — this task establishes the structure and transitions.

- [ ] **Step 1: Add `_buildExplorePanel()` helper function**

Add this function to `src/narrative.js`, before `export function init`:

```js
function _buildExplorePanel() {
  const panel = document.createElement('div');
  panel.id = 'explore-panel';
  panel.hidden = true;
  panel.innerHTML = `
    <div class="explore-toolbar">
      <button id="btn-chapters">&#8592; Chapters</button>
      <button id="btn-timeline">Show Timeline</button>
    </div>
    <div class="explore-layers">
      <div class="layer-section">
        <h3 class="layer-section-title">Data Types</h3>
        <div class="layer-toggle-rows">
          <label class="layer-toggle-row">
            <input type="checkbox" data-layer="entries" checked> Entries
          </label>
          <label class="layer-toggle-row">
            <input type="checkbox" data-layer="facilities" checked> Facilities
          </label>
          <label class="layer-toggle-row">
            <input type="checkbox" data-layer="overlays" checked> Overlays
          </label>
        </div>
      </div>
      <div class="layer-section">
        <h3 class="layer-section-title">Categories</h3>
        <div id="explore-categories"></div>
      </div>
    </div>`;
  return panel;
}
```

- [ ] **Step 2: Implement `_enterExploreMode()`**

Add this function to `src/narrative.js`, after `_buildExplorePanel`:

```js
function _enterExploreMode() {
  _mode = 'explore';
  document.getElementById('chapter-list').hidden = true;
  document.getElementById('chapter-nav').hidden = true;
  document.getElementById('explore-panel').hidden = false;
  document.getElementById('category-toggles').hidden = true;
  setFilterBarVisible(true);
}
```

- [ ] **Step 3: Implement `_enterChapterMode()`**

Add this function after `_enterExploreMode`:

```js
function _enterChapterMode() {
  _mode = 'chapters';
  _timelineVisible = false;
  setTimelineVisible(false);
  setFilterBarVisible(false);
  document.getElementById('explore-panel').hidden = true;
  document.getElementById('chapter-list').hidden = false;
  document.getElementById('chapter-nav').hidden = false;
  document.getElementById('category-toggles').hidden = false;
  const btnTimeline = document.getElementById('btn-timeline');
  if (btnTimeline) {
    btnTimeline.textContent = 'Show Timeline';
    btnTimeline.classList.remove('active');
  }
}
```

- [ ] **Step 4: Attach explore panel and wire toolbar buttons in `init()`**

In `init()`, after the `list.appendChild(beginBtn);` line, add:

```js
const explorePanel = _buildExplorePanel();
document.getElementById('narrative-panel').appendChild(explorePanel);

explorePanel.querySelector('#btn-chapters').addEventListener('click', _enterChapterMode);
```

(The timeline button is wired in Task 9.)

- [ ] **Step 5: Update `showEntry()` to be mode-aware**

In `src/narrative.js`, the current `showEntry` export starts with:

```js
export function showEntry(entry) {
  const panel = document.getElementById('narrative-panel');
  const chapterList = document.getElementById('chapter-list');
  const detail = document.getElementById('entry-detail');

  chapterList.hidden = true;
  detail.hidden = false;
```

Replace those opening lines with:

```js
export function showEntry(entry) {
  const detail = document.getElementById('entry-detail');

  if (_mode === 'explore') {
    document.getElementById('explore-panel').hidden = true;
  } else {
    document.getElementById('chapter-list').hidden = true;
  }
  detail.hidden = false;
```

- [ ] **Step 6: Update `closeEntry()` to be mode-aware**

Replace the existing `closeEntry` export entirely:

```js
export function closeEntry() {
  document.getElementById('entry-detail').hidden = true;
  if (_mode === 'explore') {
    document.getElementById('explore-panel').hidden = false;
  } else {
    document.getElementById('chapter-list').hidden = false;
  }
}
```

- [ ] **Step 7: Add CSS for explore panel, toolbar, and layers**

In `style.css`, add BEFORE the `/* ── Chapter completion button */` section added in Task 5:

```css
/* ── Explore panel ───────────────────────────────── */

#explore-panel:not([hidden]) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.explore-toolbar {
  display: flex;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.explore-toolbar button {
  flex: 1;
  padding: 8px 10px;
  background: none;
  border: 1px solid var(--border);
  font-family: 'Raleway', sans-serif;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.explore-toolbar button:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.explore-toolbar button.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.explore-layers {
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px;
}

.layer-section {
  margin-bottom: 22px;
}

.layer-section-title {
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
  margin-bottom: 10px;
}

.layer-toggle-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.layer-toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 400;
  cursor: pointer;
  user-select: none;
}

.layer-toggle-row input[type="checkbox"] {
  accent-color: var(--accent);
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  cursor: pointer;
}
```

- [ ] **Step 8: Verify**

Run `npm run dev`. Scroll to the last chapter. Click "Begin Exploring →":
- Chapter list and dot nav hide; explore panel appears with toolbar + layer sections
- Filter bar becomes visible at bottom
- "← Chapters" returns to chapter scroll; filter bar hides; timeline hides if it was open
- Clicking an entry marker in explore mode shows entry detail; back button returns to explore panel

- [ ] **Step 9: Commit**

```bash
git add src/narrative.js style.css
git commit -m "feat: explore panel DOM and mode transitions"
```

---

### Task 7: Data type toggles wired to map layer visibility

**Files:**
- Modify: `src/narrative.js`

Wires the three data type checkboxes in the explore panel to `setLayerVisible()` from `map.js`.

- [ ] **Step 1: Import `setLayerVisible` in narrative.js**

In `src/narrative.js`, find the existing import from `./map.js`:

```js
import { flyTo, loadOverlay } from './map.js';
```

Change it to:

```js
import { flyTo, loadOverlay, setLayerVisible } from './map.js';
```

- [ ] **Step 2: Wire checkboxes in `init()`**

In `init()`, after the `explorePanel.querySelector('#btn-chapters').addEventListener(...)` line, add:

```js
explorePanel.querySelectorAll('.layer-toggle-rows input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', () => setLayerVisible(cb.dataset.layer, cb.checked));
});
```

- [ ] **Step 3: Verify**

Run `npm run dev`. Enter explore mode. Uncheck "Entries" — entry markers disappear. Uncheck "Facilities" — facility markers disappear. Uncheck "Overlays" — GeoJSON overlay (visible on chapters that have one) disappears. Re-checking each restores it.

- [ ] **Step 4: Commit**

```bash
git add src/narrative.js
git commit -m "feat: data type layer toggles wired to map"
```

---

### Task 8: Category toggles in explore panel

**Files:**
- Modify: `src/narrative.js`
- Modify: `style.css`

Renders category filter buttons inside `#explore-categories`. These call `setFilters({ category })` from `data.js`, exactly like the filter bar category buttons — the filter bar's `#category-toggles` is hidden in explore mode so there is no duplication.

- [ ] **Step 1: Import `CATEGORIES` and `setFilters` in narrative.js**

In `src/narrative.js`, update the imports:

```js
import { getState, getSource, setFilters } from './data.js';
import { CATEGORIES } from './filters.js';
```

- [ ] **Step 2: Populate `#explore-categories` in `init()`**

After the layer checkbox wiring from Task 7, add:

```js
let _activeCat = null;
const catWrap = explorePanel.querySelector('#explore-categories');
const { entries } = getState();
const presentCats = new Set(entries.map(e => e.category));

CATEGORIES.filter(c => presentCats.has(c.id)).forEach(cat => {
  const btn = document.createElement('button');
  btn.className = 'explore-cat-btn';
  btn.dataset.cat = cat.id;
  btn.textContent = cat.label;
  btn.style.setProperty('--cat-color', cat.color);
  btn.addEventListener('click', () => {
    const same = _activeCat === cat.id;
    _activeCat = same ? null : cat.id;
    catWrap.querySelectorAll('.explore-cat-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.cat === _activeCat);
    });
    setFilters({ category: _activeCat });
  });
  catWrap.appendChild(btn);
});
```

- [ ] **Step 3: Add CSS for category buttons**

In `style.css`, add after the `.layer-toggle-row input` rule (still in the explore panel section):

```css
#explore-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.explore-cat-btn {
  padding: 4px 10px;
  background: none;
  border: 1px solid var(--border);
  font-family: 'Raleway', sans-serif;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--cat-color, var(--text));
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.explore-cat-btn.active {
  background: var(--cat-color, var(--accent));
  color: #fff;
  border-color: var(--cat-color, var(--accent));
}

.explore-cat-btn:hover:not(.active) {
  background: color-mix(in srgb, var(--cat-color, var(--accent)) 12%, transparent);
}
```

- [ ] **Step 4: Verify**

Run `npm run dev`. Enter explore mode. Click a category button — it highlights and only entries of that category show on the map. Click it again — all entries restore. Colors match the category color used in the map markers.

- [ ] **Step 5: Commit**

```bash
git add src/narrative.js style.css
git commit -m "feat: category toggles in explore panel"
```

---

### Task 9: Timeline toggle button

**Files:**
- Modify: `src/narrative.js`

Wires the "Show Timeline" button in the explore toolbar. Uses the module-level `_timelineVisible` variable declared in Task 5. Calls `redrawTimeline()` after showing so the SVG renders at the correct width.

- [ ] **Step 1: Import `redraw` from timeline.js in narrative.js**

In `src/narrative.js`, add a new import line:

```js
import { redraw as redrawTimeline } from './timeline.js';
```

- [ ] **Step 2: Wire the timeline button in `init()`**

In `init()`, after the `#btn-chapters` event listener line, add:

```js
const btnTimeline = explorePanel.querySelector('#btn-timeline');
btnTimeline.addEventListener('click', () => {
  _timelineVisible = !_timelineVisible;
  setTimelineVisible(_timelineVisible);
  if (_timelineVisible) redrawTimeline();
  btnTimeline.textContent = _timelineVisible ? 'Hide Timeline' : 'Show Timeline';
  btnTimeline.classList.toggle('active', _timelineVisible);
});
```

- [ ] **Step 3: Verify**

Run `npm run dev`. Enter explore mode. Click "Show Timeline":
- Timeline bar appears at the bottom of the screen
- Map shrinks upward to accommodate
- Timeline SVG renders correctly (not zero-width)
- Button reads "Hide Timeline" and has active styling

Click "Hide Timeline":
- Timeline bar disappears
- Map fills the space again
- Button reads "Show Timeline"

Return to chapter mode via "← Chapters" — timeline hides, button resets to "Show Timeline" for next explore session.

- [ ] **Step 4: Commit**

```bash
git add src/narrative.js
git commit -m "feat: timeline toggle button in explore panel"
```
