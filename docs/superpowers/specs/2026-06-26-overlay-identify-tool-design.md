# Overlay Identify Tool — Design Spec

**Goal:** In free exploration mode, clicking a GeoJSON overlay feature opens a scrollable popup showing its `feature.properties` as key/value pairs, with optional per-overlay field renaming and suppression configured in `geojson/index.json`.

**Architecture:** Identify state is a boolean flag in `map.js` (`_identifyEnabled`). `narrative.js` toggles it when switching modes. Click handlers are bound to each overlay feature at layer creation time and no-op when identify is off. Popup is a standard Leaflet popup rendered at click latlng.

**Tech stack:** Leaflet `onEachFeature`, `L.popup`, CSS custom cursor via data URI, extended `geojson/index.json`.

---

## 1. Cursor

The default `#map` cursor is a **standard arrow pointer** shape (mimicking the OS default cursor), rendered as an SVG data URI with black fill and white stroke (~1.5px), hotspot at the arrow tip (1, 1). In identify mode (`#map.identify-mode` class), the cursor switches to `crosshair`. `map.js`'s `setIdentifyEnabled()` adds/removes the class.

```css
#map {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='20'%3E%3Cpath d='M1 1 L1 14 L4 11 L7 17 L9 16 L6 10 L10 10 Z' fill='%23111' stroke='%23fff' stroke-width='1.5' stroke-linejoin='round' stroke-linecap='round'/%3E%3C/svg%3E") 1 1, default;
}
#map.identify-mode {
  cursor: crosshair;
}
```

## 2. `geojson/index.json` schema

Two new optional fields per overlay entry:

```json
[
  {
    "url": "geojson/cancer_alley.geojson",
    "label": "Cancer Alley Corridor",
    "labels": { "PARISH_NM": "Parish", "TOTAL_POP": "Population" },
    "hide":   ["OBJECTID", "FID", "Shape_Area", "Shape_Length"]
  },
  {
    "url": "geojson/la_aquifers.geojson",
    "label": "Louisiana Aquifers"
  }
]
```

- `labels` — optional object mapping raw property keys to display names. Missing keys show with their raw name.
- `hide` — optional array of property keys to suppress entirely.
- Both fields are omitted when not needed; existing entries require no changes.

## 3. `map.js` changes

### New module-level state
```js
let _identifyEnabled = false;
```

### New export
```js
export function setIdentifyEnabled(enabled) {
  _identifyEnabled = enabled;
  document.getElementById('map').classList.toggle('identify-mode', enabled);
}
```

### `_userOverlays` type change
Currently `Map<url, L.geoJSON>`. Changes to `Map<url, { layer, config }>` where `config = { label, labels, hide }`.

All existing callers of `_userOverlays` (in `setLayerVisible`) update accordingly.

### `toggleUserOverlay(url, show, config)` — new signature
`config` is `{ label, labels, hide }` (all optional). When `show` is true and URL is not already loaded:

```js
const layer = L.geoJSON(geojson, {
  style: { color: '#cc2200', weight: 1.5, fillOpacity: 0.08, opacity: 0.6 },
  onEachFeature(feature, featureLayer) {
    featureLayer.on('click', e => {
      if (!_identifyEnabled) return;
      L.DomEvent.stopPropagation(e);
      const props = feature.properties || {};
      const hide = new Set(config.hide || []);
      const labels = config.labels || {};
      const keys = Object.keys(props).filter(k => !hide.has(k));
      const html = _buildIdentifyPopup(config.label || 'Feature', keys, props, labels);
      L.popup({ maxWidth: 280, className: 'overlay-identify-popup' })
        .setLatLng(e.latlng)
        .setContent(html)
        .openOn(_map);
    });
  }
});
_userOverlays.set(url, { layer, config });
```

When `show` is false, existing removal logic unchanged except reading `.layer` from the stored object.

### `_buildIdentifyPopup(title, keys, props, labels)` — private helper
Returns an HTML string:

```js
function _buildIdentifyPopup(title, keys, props, labels) {
  if (!keys.length) {
    return `<div class="identify-popup-wrap">
      <div class="identify-popup-title">${title}</div>
      <p class="identify-no-attrs">No attributes configured for this layer.</p>
    </div>`;
  }
  const rows = keys.map(k => {
    const display = labels[k] || k;
    const val = props[k] ?? '—';
    return `<tr><td class="attr-key">${display}</td><td class="attr-val">${val}</td></tr>`;
  }).join('');
  return `<div class="identify-popup-wrap">
    <div class="identify-popup-title">${title}</div>
    <div class="identify-table-scroll">
      <table class="identify-table"><tbody>${rows}</tbody></table>
    </div>
  </div>`;
}
```

## 4. `narrative.js` changes

- Import `setIdentifyEnabled` from `./map.js`.
- `_enterExploreMode()`: call `setIdentifyEnabled(true)`.
- `_enterChapterMode()`: call `setIdentifyEnabled(false)`.
- In the overlay browser fetch block, change:
  ```js
  cb.addEventListener('change', () => toggleUserOverlay(url, cb.checked));
  ```
  to:
  ```js
  const overlayConfig = { label, labels: item.labels, hide: item.hide };
  cb.addEventListener('change', () => toggleUserOverlay(url, cb.checked, overlayConfig));
  ```
  (destructure `{ url, label, labels, hide }` from each item in the `overlays` array)

## 5. `style.css` changes

### Custom cursor (default)
```css
#map {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='20'%3E%3Cpath d='M1 1 L1 14 L4 11 L7 17 L9 16 L6 10 L10 10 Z' fill='%23111' stroke='%23fff' stroke-width='1.5' stroke-linejoin='round' stroke-linecap='round'/%3E%3C/svg%3E") 1 1, default;
}
#map.identify-mode {
  cursor: crosshair;
}
```

### Identify popup
```css
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

## 6. Error / edge cases

- Feature with `null` properties → treated as empty → "No attributes configured" message.
- All properties hidden by `hide` list → same "No attributes configured" message.
- Overlay toggled off while popup is open → Leaflet auto-closes popup when layer is removed from map (existing Leaflet behavior).
- `config` missing entirely (called without third arg) → defaults to `{ label: 'Feature', labels: {}, hide: [] }`, shows all properties.

---

## Files touched

| File | Change |
|------|--------|
| `assets/geojson/index.json` | Add optional `labels` and `hide` per entry |
| `src/map.js` | Add `_identifyEnabled`, `setIdentifyEnabled()`, `_buildIdentifyPopup()`, update `toggleUserOverlay()`, update `_userOverlays` reads in `setLayerVisible()` |
| `src/narrative.js` | Import `setIdentifyEnabled`, call in mode transitions, pass `overlayConfig` to `toggleUserOverlay` |
| `style.css` | Custom cursor rule, identify popup CSS block |
