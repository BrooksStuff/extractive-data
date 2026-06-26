import { getFiltered, getFacilitiesFiltered, on } from './data.js';

const CATEGORY_COLORS = {
  'power-infrastructure': '#e05c3a',
  'rate-impact':          '#e05c3a',
  'water-impact':         '#4a9fd4',
  'air-quality':          '#95a5a6',
  'displacement':         '#e67e22',
  'tax-incentive':        '#cc2200',
  'policy-event':         '#9b59b6',
  'economic-effect':      '#f39c12',
  'community-testimony':  '#2ecc71',
  'resistance':           '#e74c3c',
  'field-recording':      '#3498db',
  'environmental':        '#1abc9c',
};

let _map, _entryLayer, _facilityLayer, _overlayLayer, _onEntryClick;
let _overlaysVisible = true;
let _identifyEnabled = false;
const _userOverlays = new Map();

function categoryColor(cat) {
  return CATEGORY_COLORS[cat] || '#888';
}

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

export function setIdentifyEnabled(enabled) {
  _identifyEnabled = enabled;
  document.getElementById('map').classList.toggle('identify-mode', enabled);
}

export function init(onEntryClick) {
  _onEntryClick = onEntryClick;

  _map = L.map('map', {
    center: [31.0, -91.8],
    zoom: 7,
    zoomControl: false,
  });

  L.control.zoom({ position: 'bottomright' }).addTo(_map);

  // Stamen Toner via Stadia (Stamen tiles now hosted by Stadia)
  L.tileLayer(
    'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png',
    {
      attribution:
        '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://openstreetmap.org/">OpenStreetMap</a>',
      maxZoom: 18,
    }
  ).addTo(_map);

  _entryLayer = L.markerClusterGroup({
    maxClusterRadius: 40,
    showCoverageOnHover: false,
    iconCreateFunction(cluster) {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div class="cluster-icon">${count}</div>`,
        className: 'cluster-wrap',
        iconSize: [28, 28],
      });
    },
  }).addTo(_map);

  _facilityLayer = L.layerGroup().addTo(_map);

  on('filter', () => refresh());
  on('ready', () => refresh());
}

export function refresh() {
  _entryLayer.clearLayers();
  _facilityLayer.clearLayers();
  renderFacilities();
  renderEntries();
}

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

function renderEntries() {
  getFiltered().forEach(entry => {
    if (!entry.lat || !entry.lng) return;
    const icon = makeEntryIcon(entry.category);
    const marker = L.marker([entry.lat, entry.lng], { icon });

    marker.bindPopup(
      `<div class="popup-category">${entry.category}</div>
       <div class="popup-title">${entry.title}</div>
       <div class="popup-date">${entry.date || ''}</div>`,
      { closeButton: false, maxWidth: 220 }
    );

    marker.on('click', () => {
      if (_onEntryClick) _onEntryClick(entry);
    });

    _entryLayer.addLayer(marker);
  });
}

export function flyTo(lat, lng, zoom) {
  _map.flyTo([lat, lng], zoom, { duration: 1.2 });
}

export function loadOverlay(url, label) {
  if (_overlayLayer) {
    _map.removeLayer(_overlayLayer);
    _overlayLayer = null;
  }
  if (!url) return;
  fetch(url)
    .then(r => r.ok ? r.json() : null)
    .then(geojson => {
      if (!geojson) return;
      _overlayLayer = L.geoJSON(geojson, {
        style: {
          color: '#cc2200',
          weight: 1.5,
          fillOpacity: 0.08,
          opacity: 0.6,
        },
      });
      if (_overlaysVisible) _map.addLayer(_overlayLayer);
    })
    .catch(() => {});
}

export function getMap() {
  return _map;
}

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
    _userOverlays.forEach(({ layer }) => {
      if (show) _map.addLayer(layer);
      else _map.removeLayer(layer);
    });
  }
}

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
