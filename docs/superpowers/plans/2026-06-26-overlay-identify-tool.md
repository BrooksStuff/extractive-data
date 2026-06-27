# Overlay Identify Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In free exploration mode, clicking a GeoJSON overlay feature opens a scrollable Leaflet popup showing `feature.properties` as labelled key/value pairs, with optional per-overlay field renaming and suppression declared in `geojson/index.json`.

**Architecture:** `map.js` owns a boolean `_identifyEnabled` flag and all popup logic. `narrative.js` sets the flag when transitioning between chapter and explore modes. `_userOverlays` is extended from `Map<url, layer>` to `Map<url, { layer, config }>` so each overlay carries its field config at click time. The map also receives a custom CSS cursor (standard arrow pointer, black with white outline) replacing the default.

**Tech Stack:** Leaflet 1.9 (`onEachFeature`, `L.popup`, `L.DomEvent`), CSS `cursor: url()` data URI, Vanilla JS ES modules.

---

## Files touched

| File | Change |
|------|--------|
| `style.css` | Add custom cursor to `#map`, add identify popup CSS |
| `src/map.js` | Add `_identifyEnabled`, `setIdentifyEnabled()`, `_buildIdentifyPopup()`, update `toggleUserOverlay()` and `setLayerVisible()` |
| `src/narrative.js` | Import `setIdentifyEnabled`, call in mode transitions, pass `overlayConfig` to `toggleUserOverlay` |
| `assets/geojson/index.json` | Add optional `labels` and `hide` fields to show the schema |

---

## Task 1: Custom cursor and identify popup CSS

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Add custom cursor to `#map`**

  Find the existing `#map` rule (around line 51) and add the `cursor` property:

  ```css
  #map {
    position: fixed;
    top: 0;
    left: var(--panel-w);
    right: 0;
    bottom: calc(var(--timeline-h) + var(--filter-h));
    z-index: 1;
    cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='20'%3E%3Cpath d='M1 1 L1 15 L5 11 L8 18 L11 17 L7 10 L13 10 Z' fill='%23111' stroke='%23fff' stroke-width='1.5' stroke-linejoin='round' stroke-linecap='round'/%3E%3C/svg%3E") 1 1, default;
  }
  ```

  Also add the identify-mode override immediately after the `#map` block:

  ```css
  #map.identify-mode {
    cursor: crosshair;
  }
  ```

- [ ] **Step 2: Add identify popup CSS**

  Add the following block after the `.facility-tooltip` rule and before the `/* ── Utility ──` section:

  ```css
  /* ── Overlay identify popup ──────────────────────── */

  .overlay-identify-popup .leaflet-popup-content-wrapper {
    padding: 0;
    border-radius: 2px;
  }
  .overlay-identify-popup .leaflet-popup-content {
    margin: 0;
    width: auto !important;
  }
  .identify-popup-wrap {
    min-width: 180px;
    max-width: 280px;
  }
  .identify-popup-title {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--accent);
    padding: 8px 12px 6px;
    border-bottom: 1px solid var(--border);
  }
  .identify-table-scroll {
    max-height: 38vh;
    overflow-y: auto;
  }
  .identify-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.75rem;
  }
  .identify-table tr + tr { border-top: 1px solid var(--border); }
  .attr-key {
    padding: 5px 10px 5px 12px;
    color: var(--muted);
    font-weight: 600;
    white-space: nowrap;
    vertical-align: top;
  }
  .attr-val {
    padding: 5px 12px 5px 6px;
    color: var(--text);
    word-break: break-word;
  }
  .identify-no-attrs {
    font-size: 0.75rem;
    color: var(--muted);
    font-style: italic;
    padding: 10px 12px;
  }
  ```

- [ ] **Step 3: Verify cursor visually**

  Run `npm run dev`, open the map. The cursor should appear as a small black arrow with white outline when hovering over the map. The default browser cursor should be gone over the map area.

- [ ] **Step 4: Commit**

  ```bash
  git add style.css
  git commit -m "feat: custom arrow cursor and identify popup CSS"
  ```

---

## Task 2: Identify state and popup logic in `map.js`

**Files:**
- Modify: `src/map.js`

- [ ] **Step 1: Add `_identifyEnabled` flag**

  On line 19, after `let _overlaysVisible = true;`, add:

  ```js
  let _identifyEnabled = false;
  ```

- [ ] **Step 2: Add `_buildIdentifyPopup` private helper**

  Add this function after the `makeFacilityIcon` function (before `export function init`):

  ```js
  function _buildIdentifyPopup(title, keys, props, labels) {
    if (!keys.length) {
      return `<div class="identify-popup-wrap">
        <div class="identify-popup-title">${title}</div>
        <p class="identify-no-attrs">No attributes configured for this layer.</p>
      </div>`;
    }
    const rows = keys.map(k => {
      const display = labels[k] !== undefined ? labels[k] : k;
      const val = props[k] !== null && props[k] !== undefined ? props[k] : '—';
      return `<tr>
        <td class="attr-key">${display}</td>
        <td class="attr-val">${val}</td>
      </tr>`;
    }).join('');
    return `<div class="identify-popup-wrap">
      <div class="identify-popup-title">${title}</div>
      <div class="identify-table-scroll">
        <table class="identify-table"><tbody>${rows}</tbody></table>
      </div>
    </div>`;
  }
  ```

- [ ] **Step 3: Add `setIdentifyEnabled` export**

  Add this export after `export function getMap()`:

  ```js
  export function setIdentifyEnabled(enabled) {
    _identifyEnabled = enabled;
    document.getElementById('map').classList.toggle('identify-mode', enabled);
  }
  ```

- [ ] **Step 4: Fix `setLayerVisible` to read `{ layer }` from `_userOverlays`**

  The `_userOverlays` Map will store `{ layer, config }` objects after Task 2 Step 5 below. Update the forEach in `setLayerVisible` now so the two changes land in the same commit:

  Replace:
  ```js
  _userOverlays.forEach(layer => {
    if (show) _map.addLayer(layer);
    else _map.removeLayer(layer);
  });
  ```

  With:
  ```js
  _userOverlays.forEach(({ layer }) => {
    if (show) _map.addLayer(layer);
    else _map.removeLayer(layer);
  });
  ```

- [ ] **Step 5: Rewrite `toggleUserOverlay` to accept config and bind click handlers**

  Replace the entire existing `export function toggleUserOverlay(url, show)` with:

  ```js
  export function toggleUserOverlay(url, show, config = {}) {
    if (show) {
      if (_userOverlays.has(url)) return;
      fetch(url)
        .then(r => r.ok ? r.json() : null)
        .then(geojson => {
          if (!geojson) return;
          const hide = new Set(config.hide || []);
          const labels = config.labels || {};
          const title = config.label || 'Feature';
          const layer = L.geoJSON(geojson, {
            style: { color: '#cc2200', weight: 1.5, fillOpacity: 0.08, opacity: 0.6 },
            onEachFeature(feature, featureLayer) {
              featureLayer.on('click', e => {
                if (!_identifyEnabled) return;
                L.DomEvent.stopPropagation(e);
                const props = feature.properties || {};
                const keys = Object.keys(props).filter(k => !hide.has(k));
                const html = _buildIdentifyPopup(title, keys, props, labels);
                L.popup({ maxWidth: 280, className: 'overlay-identify-popup' })
                  .setLatLng(e.latlng)
                  .setContent(html)
                  .openOn(_map);
              });
            },
          });
          if (_overlaysVisible) _map.addLayer(layer);
          _userOverlays.set(url, { layer, config });
        })
        .catch(() => {});
    } else {
      const entry = _userOverlays.get(url);
      if (entry) {
        _map.removeLayer(entry.layer);
        _userOverlays.delete(url);
      }
    }
  }
  ```

- [ ] **Step 6: Verify no runtime errors**

  Run `npm run dev`. Open the browser console — no errors on load. Toggle an overlay on in explore mode, click a feature. Console should be clean (popup may not appear yet since `_identifyEnabled` is still always false — that wires up in Task 3).

- [ ] **Step 7: Commit**

  ```bash
  git add src/map.js
  git commit -m "feat: identify flag, popup builder, updated toggleUserOverlay"
  ```

---

## Task 3: Wire identify mode in `narrative.js`

**Files:**
- Modify: `src/narrative.js`

- [ ] **Step 1: Add `setIdentifyEnabled` to the import from `./map.js`**

  Line 4 currently reads:
  ```js
  import { flyTo, loadOverlay, setLayerVisible, toggleUserOverlay } from './map.js';
  ```

  Change to:
  ```js
  import { flyTo, loadOverlay, setLayerVisible, setIdentifyEnabled, toggleUserOverlay } from './map.js';
  ```

- [ ] **Step 2: Call `setIdentifyEnabled(true)` when entering explore mode**

  In `_enterExploreMode()`, add the call after `setFilterBarVisible(true)`:

  ```js
  function _enterExploreMode() {
    _mode = 'explore';
    document.getElementById('chapter-list').hidden = true;
    document.getElementById('chapter-nav').hidden = true;
    document.getElementById('explore-panel').hidden = false;
    document.getElementById('category-toggles').hidden = true;
    setFilterBarVisible(true);
    setIdentifyEnabled(true);
  }
  ```

- [ ] **Step 3: Call `setIdentifyEnabled(false)` when entering chapter mode**

  In `_enterChapterMode()`, add the call after `setFilterBarVisible(false)`:

  ```js
  function _enterChapterMode() {
    _mode = 'chapters';
    _timelineVisible = false;
    setTimelineVisible(false);
    setFilterBarVisible(false);
    setIdentifyEnabled(false);
    document.getElementById('explore-panel').hidden = true;
    document.getElementById('chapter-list').hidden = false;
    document.getElementById('chapter-nav').hidden = false;
    document.getElementById('category-toggles').hidden = false;
    const btnTimeline = document.getElementById('btn-timeline');
    if (btnTimeline) {
      btnTimeline.textContent = 'Show Timeline';
      btnTimeline.classList.remove('active');
    }
    const activeBlock = document.querySelector('.chapter-block.active');
    if (activeBlock) activeBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  ```

- [ ] **Step 4: Pass `overlayConfig` to `toggleUserOverlay` in the overlay browser**

  Find the overlay fetch block (around line 178). The `overlays.forEach` currently destructures `{ url, label }`. Update it to destructure all config fields and pass them through:

  Replace:
  ```js
  overlays.forEach(({ url, label }) => {
    const lbl = document.createElement('label');
    lbl.className = 'layer-toggle-row';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.addEventListener('change', () => toggleUserOverlay(url, cb.checked));
    lbl.appendChild(cb);
    lbl.appendChild(document.createTextNode(' ' + label));
    rows.appendChild(lbl);
  });
  ```

  With:
  ```js
  overlays.forEach(({ url, label, labels, hide }) => {
    const overlayConfig = { label, labels: labels || {}, hide: hide || [] };
    const lbl = document.createElement('label');
    lbl.className = 'layer-toggle-row';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.addEventListener('change', () => toggleUserOverlay(url, cb.checked, overlayConfig));
    lbl.appendChild(cb);
    lbl.appendChild(document.createTextNode(' ' + label));
    rows.appendChild(lbl);
  });
  ```

- [ ] **Step 5: End-to-end verify**

  Run `npm run dev`. Walk through the full flow:

  1. Advance through all chapters until "Begin Exploring →" appears, click it.
  2. In the explore panel, check an overlay checkbox. A GeoJSON layer should appear on the map.
  3. Click a feature on the overlay layer. A popup should appear with a title and a scrollable table of key/value pairs from `feature.properties`.
  4. If `feature.properties` is null or empty, the popup should read *"No attributes configured for this layer."*
  5. Click "← Chapters". Go back to chapter mode. Click a feature on any overlay that's still visible — no popup should appear.
  6. Verify the cursor is the custom black arrow on the map in both modes, and switches to crosshair in explore mode.

- [ ] **Step 6: Commit**

  ```bash
  git add src/narrative.js
  git commit -m "feat: wire identify mode enable/disable and overlay config passthrough"
  ```

---

## Task 4: Extend `geojson/index.json` with example config

**Files:**
- Modify: `assets/geojson/index.json`

- [ ] **Step 1: Add `labels` and `hide` fields to illustrate the schema**

  Replace the file contents with:

  ```json
  [
    {
      "url": "geojson/cancer_alley.geojson",
      "label": "Cancer Alley Corridor",
      "labels": {},
      "hide": ["OBJECTID", "FID", "Shape_Area", "Shape_Length"]
    },
    {
      "url": "geojson/la_aquifers.geojson",
      "label": "Louisiana Aquifers",
      "labels": {},
      "hide": ["OBJECTID", "FID", "Shape_Area", "Shape_Length"]
    }
  ]
  ```

  **Note for the developer:** Replace the `labels` object keys with actual property names from your GeoJSON files. For example, if `cancer_alley.geojson` has a property `PARISH_NM`, add `"PARISH_NM": "Parish"` to its `labels` object. Add any internal technical fields you don't want users to see to the `hide` array. Both fields are optional — remove either if not needed.

- [ ] **Step 2: Commit**

  ```bash
  git add assets/geojson/index.json
  git commit -m "feat: extend overlay index with identify config schema"
  ```
