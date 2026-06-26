import { getState, setFilters, on } from './data.js';
import { setReducedMotion, getReducedMotion } from './fx.js';
import { clearBrush } from './timeline.js';

export const CATEGORIES = [
  { id: 'power-infrastructure', label: 'Power',       color: '#e05c3a' },
  { id: 'rate-impact',          label: 'Rates',        color: '#e05c3a' },
  { id: 'water-impact',         label: 'Water',        color: '#4a9fd4' },
  { id: 'air-quality',          label: 'Air',          color: '#95a5a6' },
  { id: 'displacement',         label: 'Displacement', color: '#e67e22' },
  { id: 'tax-incentive',        label: 'Tax',          color: '#cc2200' },
  { id: 'policy-event',         label: 'Policy',       color: '#9b59b6' },
  { id: 'economic-effect',      label: 'Economic',     color: '#f39c12' },
  { id: 'community-testimony',  label: 'Testimony',    color: '#2ecc71' },
  { id: 'resistance',           label: 'Resistance',   color: '#e74c3c' },
  { id: 'field-recording',      label: 'Recording',    color: '#3498db' },
  { id: 'environmental',        label: 'Environment',  color: '#1abc9c' },
];

let _activeCategory = null;

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function readURL() {
  const p = new URLSearchParams(window.location.search);
  return {
    category: p.get('category') || null,
    parish:   p.get('parish')   || null,
    operator: p.get('operator') || null,
    query:    p.get('q')        || null,
    dateMin:  p.get('dateMin')  || null,
    dateMax:  p.get('dateMax')  || null,
  };
}

function writeURL(filters) {
  const p = new URLSearchParams();
  if (filters.category) p.set('category', filters.category);
  if (filters.parish)   p.set('parish',   filters.parish);
  if (filters.operator) p.set('operator', filters.operator);
  if (filters.query)    p.set('q',        filters.query);
  if (filters.dateMin)  p.set('dateMin',  filters.dateMin);
  if (filters.dateMax)  p.set('dateMax',  filters.dateMax);
  const qs = p.toString();
  history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
}

export function init() {
  const { facilities, entries } = getState();

  // ── Category toggles ─────────────────────────────
  const presentCats = new Set(entries.map(e => e.category));
  const toggleWrap = document.getElementById('category-toggles');

  CATEGORIES.filter(c => presentCats.has(c.id)).forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn';
    btn.dataset.cat = cat.id;
    btn.textContent = cat.label;
    btn.style.color = cat.color;
    btn.addEventListener('click', () => {
      const same = _activeCategory === cat.id;
      _activeCategory = same ? null : cat.id;
      toggleWrap.querySelectorAll('.cat-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.cat === _activeCategory);
      });
      setFilters({ category: _activeCategory });
    });
    toggleWrap.appendChild(btn);
  });

  // ── Parish dropdown ───────────────────────────────
  const parishes = [...new Set([
    ...facilities.map(f => f.parish),
    ...entries.map(e => e.affected_community).filter(Boolean),
  ])].filter(Boolean).sort();

  // Use unique parishes from facilities only (cleaner)
  const facilityParishes = [...new Set(facilities.map(f => f.parish))].sort();
  const parishSel = document.getElementById('parish-select');
  facilityParishes.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p; opt.textContent = `${p} Parish`;
    parishSel.appendChild(opt);
  });
  parishSel.addEventListener('change', () => setFilters({ parish: parishSel.value || null }));

  // ── Operator dropdown ─────────────────────────────
  const operators = [...new Set(facilities.map(f => f.operator))].sort();
  const operSel = document.getElementById('operator-select');
  operators.forEach(op => {
    const opt = document.createElement('option');
    opt.value = op; opt.textContent = op;
    operSel.appendChild(opt);
  });
  operSel.addEventListener('change', () => setFilters({ operator: operSel.value || null }));

  // ── Search ────────────────────────────────────────
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', debounce(e => {
    setFilters({ query: e.target.value.trim() || null });
  }, 250));

  // ── Reduced motion toggle ─────────────────────────
  const rmBtn = document.getElementById('reduced-motion-btn');
  rmBtn.addEventListener('click', () => {
    const next = !getReducedMotion();
    setReducedMotion(next);
    rmBtn.style.opacity = next ? '0.4' : '1';
  });

  // ── URL state: read on init ───────────────────────
  const initial = readURL();
  if (Object.values(initial).some(Boolean)) {
    setFilters(initial);
    if (initial.category) {
      _activeCategory = initial.category;
      const btn = toggleWrap.querySelector(`[data-cat="${initial.category}"]`);
      if (btn) btn.classList.add('active');
    }
    if (initial.parish)   parishSel.value = initial.parish;
    if (initial.operator) operSel.value   = initial.operator;
    if (initial.query)    searchInput.value = initial.query;
  }

  // ── URL state: write on filter change ────────────
  on('filter', filters => writeURL(filters));
}
