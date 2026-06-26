import { getFiltered, getFacilitiesFiltered, on } from './data.js';

const CATEGORY_COLORS = {
  'power-infrastructure': '#e05c3a',
  'rate-impact':          '#e05c3a',
  'water-impact':         '#4a9fd4',
  'air-quality':          '#95a5a6',
  'displacement':         '#e67e22',
  'tax-incentive':        '#c8b560',
  'policy-event':         '#9b59b6',
  'economic-effect':      '#f39c12',
  'community-testimony':  '#2ecc71',
  'resistance':           '#e74c3c',
  'field-recording':      '#3498db',
  'environmental':        '#1abc9c',
};

const OPERATOR_COLORS = {
  'Meta':             '#0082fb',
  'Amazon':           '#ff9900',
  'Hut 8':            '#888',
  'Entergy Louisiana':'#e05c3a',
  'undisclosed':      '#555',
};

let _map, _entryLayer, _facilityLayer, _overlayLayer, _onEntryClick;

function categoryColor(cat) {
  return CATEGORY_COLORS[cat] || '#888';
}

function makeEntryIcon(category) {
  const color = categoryColor(category);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
    <circle cx="6" cy="6" r="5" fill="${color}" fill-opacity="0.85" stroke="#0d0d0d" stroke-width="1"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -8],
  });
}

function makeFacilityIcon(operator, mw) {
  const color = OPERATOR_COLORS[operator] || '#888';
  const size = mw ? Math.max(14, Math.min(36, 14 + mw / 60)) : 16;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect x="1" y="1" width="${size - 2}" height="${size - 2}"
      rx="2" fill="${color}" fill-opacity="0.75"
      stroke="#0d0d0d" stroke-width="1.5"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 2],
  });
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
    'https://tiles.stadiamaps.com/tiles/stamen_toner_blacklite/{z}/{x}/{y}{r}.png',
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
  getFacilitiesFiltered().forEach(f => {
    if (!f.lat || !f.lng) return;
    const icon = makeFacilityIcon(f.operator, f.capacity_mw);
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
          color: '#c8b560',
          weight: 1.5,
          fillOpacity: 0.08,
          opacity: 0.6,
        },
      }).addTo(_map);
    })
    .catch(() => {});
}

export function getMap() {
  return _map;
}
