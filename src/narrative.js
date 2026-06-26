import { getState, getSource, setFilters } from './data.js';
import { CATEGORIES } from './filters.js';
import { redraw as redrawTimeline } from './timeline.js';
import { flyTo, loadOverlay, setLayerVisible, toggleUserOverlay } from './map.js';
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

function setFilterBarVisible(show) {
  document.getElementById('filter-bar').hidden = !show;
  document.documentElement.style.setProperty('--filter-h', show ? '44px' : '0px');
}

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

function _enterExploreMode() {
  _mode = 'explore';
  document.getElementById('chapter-list').hidden = true;
  document.getElementById('chapter-nav').hidden = true;
  document.getElementById('explore-panel').hidden = false;
  document.getElementById('category-toggles').hidden = true;
  setFilterBarVisible(true);
}

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

export function init(onChapterChange) {
  _onChapterChange = onChapterChange;
  setTimelineVisible(false);
  setFilterBarVisible(false);
  const { chapters } = getState();

  const nav = document.getElementById('chapter-nav');
  const list = document.getElementById('chapter-list');

  const sorted = [...chapters].sort((a, b) => a.order - b.order);
  _lastChapterId = sorted[sorted.length - 1].id;

  sorted.forEach(ch => {
    // dot nav
    const dot = document.createElement('button');
    dot.className = 'chapter-dot';
    dot.dataset.id = ch.id;
    dot.title = ch.title;
    dot.addEventListener('click', () => activateChapter(ch));
    nav.appendChild(dot);

    // chapter block
    const block = document.createElement('div');
    block.className = 'chapter-block';
    block.dataset.id = ch.id;
    block.innerHTML = `<h2>${ch.order}. ${ch.title}</h2><p>${ch.body}</p>`;
    block.addEventListener('click', () => activateChapter(ch));
    list.appendChild(block);
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


  fetch('geojson/index.json')
    .then(r => r.ok ? r.json() : [])
    .then(overlays => {
      if (!overlays.length) return;
      const section = document.createElement('div');
      section.className = 'layer-section';
      section.innerHTML = '<h3 class="layer-section-title">Overlays</h3>';
      const rows = document.createElement('div');
      rows.className = 'layer-toggle-rows';
      overlays.forEach(({ url, label }) => {
        const lbl = document.createElement('label');
        lbl.className = 'layer-toggle-row';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.addEventListener('change', () => toggleUserOverlay(url, cb.checked));
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
