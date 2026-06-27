import { getState, getSource, setFilters } from './data.js';
import { CATEGORIES } from './filters.js';
import { redraw as redrawTimeline } from './timeline.js';
import { flyTo, loadOverlay, setLayerVisible, setIdentifyEnabled, toggleUserOverlay } from './map.js';
import { playAmbient, stopAmbient } from './audio.js';

let _activeChapterId = null;
let _hasCompleted = false;
let _lastChapterId = null;
let _mode = 'chapters';
let _timelineVisible = false;
let _observer = null;
let _onChapterChange = null;

function setTimelineVisible(show) {
  document.getElementById('timeline-wrap').hidden = !show;
  document.documentElement.style.setProperty('--timeline-h', show ? '80px' : '0px');
}

function _buildExplorePanel() {
  const panel = document.createElement('div');
  panel.id = 'explore-panel';
  panel.hidden = true;
  panel.innerHTML = `
    <div class="explore-toolbar">
      <button id="btn-chapters">&#8592; Chapters</button>
      <button id="btn-timeline">Timeline</button>
      <button id="charts-btn">Charts</button>
      <button id="reduced-motion-btn" title="Toggle visual effects">FX</button>
    </div>
    <div class="explore-search">
      <input id="search-input" type="search" placeholder="Search entries…" aria-label="Search entries" />
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
      <div class="layer-section">
        <h3 class="layer-section-title">Filter</h3>
        <div class="filter-selects">
          <label class="sr-only" for="parish-select">Parish</label>
          <select id="parish-select"><option value="">All parishes</option></select>
          <label class="sr-only" for="operator-select">Operator</label>
          <select id="operator-select"><option value="">All operators</option></select>
        </div>
      </div>
    </div>`;
  return panel;
}

function _enterExploreMode() {
  _mode = 'explore';
  document.getElementById('chapter-list').hidden = true;
  document.getElementById('chapter-nav').hidden = true;
  document.getElementById('explore-panel').hidden = false;
  setIdentifyEnabled(true);
}

function _enterChapterMode() {
  _mode = 'chapters';
  _timelineVisible = false;
  setTimelineVisible(false);
  setIdentifyEnabled(false);
  document.getElementById('explore-panel').hidden = true;
  document.getElementById('chapter-list').hidden = false;
  document.getElementById('chapter-nav').hidden = false;
  const btnTimeline = document.getElementById('btn-timeline');
  if (btnTimeline) {
    btnTimeline.textContent = 'Show Timeline';
    btnTimeline.classList.remove('active');
  }
  // Restore scroll position to the active chapter
  const activeBlock = document.querySelector('.chapter-block.active');
  if (activeBlock) activeBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function init(onChapterChange) {
  _onChapterChange = onChapterChange;
  setTimelineVisible(false);
  const { chapters } = getState();

  const panelToggle = document.getElementById('panel-toggle');
  panelToggle.addEventListener('click', () => {
    const hidden = document.body.classList.toggle('panel-hidden');
    panelToggle.innerHTML = hidden ? '&#8250;' : '&#8249;';
    panelToggle.setAttribute('aria-label', hidden ? 'Show sidebar' : 'Hide sidebar');
  });

  const nav = document.getElementById('chapter-nav');
  const list = document.getElementById('chapter-list');

  const sorted = [...chapters].sort((a, b) => a.order - b.order);
  _lastChapterId = sorted[sorted.length - 1].id;

  sorted.forEach(ch => {
    // chapter block (created first so dot scroll handler can close over it)
    const block = document.createElement('div');
    block.className = 'chapter-block';
    block.dataset.id = ch.id;
    block.innerHTML = `<h2>${ch.order}. ${ch.title}</h2><p>${ch.body}</p>`;
    block.addEventListener('click', () => activateChapter(ch));
    list.appendChild(block);

    // dot nav — clicking scrolls the block into view; observer handles activation
    const dot = document.createElement('button');
    dot.className = 'chapter-dot';
    dot.dataset.id = ch.id;
    dot.title = ch.title;
    dot.addEventListener('click', () => block.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    nav.appendChild(dot);
  });

  // IntersectionObserver: activate chapter when its block is ≥50% visible in the list
  _observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.dataset.id;
      const ch = sorted.find(c => c.id === id);
      if (ch && ch.id !== _activeChapterId) activateChapter(ch);
    });
  }, { root: list, rootMargin: '-40% 0px -40% 0px', threshold: 0 });

  sorted.forEach(ch => {
    const block = list.querySelector(`.chapter-block[data-id="${ch.id}"]`);
    if (block) _observer.observe(block);
  });

  const beginBtn = document.createElement('button');
  beginBtn.id = 'begin-exploring';
  beginBtn.hidden = true;
  beginBtn.textContent = 'Begin Exploring →';
  beginBtn.addEventListener('click', () => {
    if (typeof _enterExploreMode === 'function') _enterExploreMode();
  });
  list.appendChild(beginBtn);

  const explorePanel = _buildExplorePanel();
  document.getElementById('narrative-panel').appendChild(explorePanel);
  explorePanel.querySelector('#btn-chapters').addEventListener('click', _enterChapterMode);

  const btnTimeline = explorePanel.querySelector('#btn-timeline');
  btnTimeline.addEventListener('click', () => {
    _timelineVisible = !_timelineVisible;
    setTimelineVisible(_timelineVisible);
    if (_timelineVisible) redrawTimeline();
    btnTimeline.textContent = _timelineVisible ? 'Hide Timeline' : 'Show Timeline';
    btnTimeline.classList.toggle('active', _timelineVisible);
  });

  explorePanel.querySelectorAll('.layer-toggle-rows input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => setLayerVisible(cb.dataset.layer, cb.checked));
  });

  let _activeCat = null;
  const catWrap = explorePanel.querySelector('#explore-categories');
  const { entries: dataEntries } = getState();
  const presentCats = new Set(dataEntries.map(e => e.category));

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


  fetch('assets/geojson/index.json')
    .then(r => r.ok ? r.json() : [])
    .then(overlays => {
      if (!overlays.length) return;
      const section = document.createElement('div');
      section.className = 'layer-section';
      section.innerHTML = '<h3 class="layer-section-title">Overlays</h3>';
      const rows = document.createElement('div');
      rows.className = 'layer-toggle-rows';
      overlays.forEach(({ url, label, labels, hide }) => {
        const overlayConfig = { label, labels: labels || {}, hide: hide || [] };
        const lbl = document.createElement('label');
        lbl.className = 'layer-toggle-row';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.addEventListener('change', () => toggleUserOverlay(url, cb.checked, overlayConfig));
        lbl.appendChild(cb);
        lbl.appendChild(document.createTextNode(' ' + label));
        rows.appendChild(lbl);
      });
      section.appendChild(rows);
      explorePanel.querySelector('.explore-layers').appendChild(section);
    })
    .catch(() => {});

  document.getElementById('entry-close').addEventListener('click', closeEntry);

  if (sorted.length) activateChapter(sorted[0]);
}

function activateChapter(ch) {
  _activeChapterId = ch.id;

  document.querySelectorAll('.chapter-block').forEach(el => {
    el.classList.toggle('active', el.dataset.id === ch.id);
  });
  document.querySelectorAll('.chapter-dot').forEach(el => {
    el.classList.toggle('active', el.dataset.id === ch.id);
  });

  flyTo(ch.map_center_lat, ch.map_center_lng, ch.zoom);
  loadOverlay(ch.overlay, ch.overlay_label);

  if (ch.audio_ambient) playAmbient(ch.audio_ambient);
  else stopAmbient();

  if (_onChapterChange) _onChapterChange(ch);

  if (ch.id === _lastChapterId && !_hasCompleted) {
    _hasCompleted = true;
    const beginBtn = document.getElementById('begin-exploring');
    if (beginBtn) beginBtn.hidden = false;
  }
}

export function showEntry(entry) {
  const detail = document.getElementById('entry-detail');

  if (_mode === 'explore') {
    document.getElementById('explore-panel').hidden = true;
  } else {
    document.getElementById('chapter-list').hidden = true;
  }
  detail.hidden = false;

  document.getElementById('entry-title').textContent = entry.title;
  document.getElementById('entry-meta').textContent = [
    entry.category,
    entry.date,
    entry.affected_community,
  ].filter(Boolean).join(' · ');

  document.getElementById('entry-body').textContent = entry.body || '';

  const imgWrap = document.getElementById('entry-images');
  imgWrap.innerHTML = '';
  (entry.images || []).forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    img.loading = 'lazy';
    imgWrap.appendChild(img);
  });

  const audioWrap = document.getElementById('entry-audio-wrap');
  if (entry.audio) {
    document.getElementById('entry-audio').src = entry.audio;
    document.getElementById('entry-audio-label').textContent = entry.audio_label || '';
    audioWrap.hidden = false;
  } else {
    audioWrap.hidden = true;
  }

  const sourcesList = document.getElementById('entry-sources');
  sourcesList.innerHTML = '';
  const { sources } = getState();
  (entry.sources || []).forEach(sid => {
    const src = sources.find(s => s.id === sid);
    if (!src) return;
    const li = document.createElement('li');
    li.innerHTML = src.url
      ? `<a href="${src.url}" target="_blank" rel="noopener">${src.title}</a> — ${src.author}`
      : `${src.title} — ${src.author}`;
    sourcesList.appendChild(li);
  });
}

export function closeEntry() {
  document.getElementById('entry-detail').hidden = true;
  if (_mode === 'explore') {
    document.getElementById('explore-panel').hidden = false;
  } else {
    document.getElementById('chapter-list').hidden = false;
  }
}

