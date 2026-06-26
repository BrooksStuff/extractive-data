const CACHE_KEY = 'fp_data_cache';
const FILES = ['facilities', 'entries', 'chapters', 'sources'];

const _listeners = {};
let _state = { facilities: [], entries: [], chapters: [], sources: [], filters: {} };

export function on(event, fn) {
  (_listeners[event] = _listeners[event] || []).push(fn);
}

export function emit(event, payload) {
  (_listeners[event] || []).forEach(fn => fn(payload));
}

export function getState() {
  return _state;
}

export function setFilters(filters) {
  _state.filters = { ..._state.filters, ...filters };
  emit('filter', _state.filters);
}

export function getFiltered() {
  const { category, parish, operator, query, dateMin, dateMax } = _state.filters;
  return _state.entries.filter(e => {
    if (!e.visible) return false;
    if (category && e.category !== category) return false;
    if (query) {
      const q = query.toLowerCase();
      if (
        !e.title.toLowerCase().includes(q) &&
        !(e.body || '').toLowerCase().includes(q) &&
        !(e.affected_community || '').toLowerCase().includes(q)
      ) return false;
    }
    if (dateMin && e.date < dateMin) return false;
    if (dateMax && e.date > dateMax) return false;
    return true;
  });
}

export function getFacilitiesFiltered() {
  const { operator, parish } = _state.filters;
  return _state.facilities.filter(f => {
    if (!f.visible) return false;
    if (operator && f.operator !== operator) return false;
    if (parish && f.parish !== parish) return false;
    return true;
  });
}

export function getChapter(id) {
  return _state.chapters.find(c => c.id === id);
}

export function getSource(id) {
  return _state.sources.find(s => s.id === id);
}

async function fetchAll() {
  const results = await Promise.all(
    FILES.map(name =>
      fetch(`data/${name}.json`).then(r => {
        if (!r.ok) throw new Error(`Failed to load data/${name}.json`);
        return r.json();
      })
    )
  );
  return Object.fromEntries(FILES.map((name, i) => [name, results[i]]));
}

export async function init() {
  const cached = sessionStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      Object.assign(_state, parsed);
      emit('ready', _state);
      return _state;
    } catch {}
  }

  const data = await fetchAll();
  Object.assign(_state, data);
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}
  emit('ready', _state);
  return _state;
}

export function bust() {
  sessionStorage.removeItem(CACHE_KEY);
}
