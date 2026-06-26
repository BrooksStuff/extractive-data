import { getState, getSource } from './data.js';
import { flyTo, loadOverlay } from './map.js';
import { playAmbient, stopAmbient } from './audio.js';

let _activeChapterId = null;
let _observer = null;
let _onChapterChange = null;

export function init(onChapterChange) {
  _onChapterChange = onChapterChange;
  const { chapters } = getState();

  const nav = document.getElementById('chapter-nav');
  const list = document.getElementById('chapter-list');

  const sorted = [...chapters].sort((a, b) => a.order - b.order);

  sorted.forEach(ch => {
    // dot nav
    const dot = document.createElement('button');
    dot.className = 'chapter-dot';
    dot.dataset.id = ch.id;
    dot.title = ch.title;
    dot.addEventListener('click', () => scrollToChapter(ch.id));
    nav.appendChild(dot);

    // chapter block
    const block = document.createElement('div');
    block.className = 'chapter-block';
    block.dataset.id = ch.id;
    block.innerHTML = `<h2>${ch.order}. ${ch.title}</h2><p>${ch.body}</p>`;
    block.addEventListener('click', () => activateChapter(ch));
    list.appendChild(block);
  });

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

  list.querySelectorAll('.chapter-block').forEach(el => _observer.observe(el));

  document.getElementById('entry-close').addEventListener('click', closeEntry);

  if (sorted.length) activateChapter(sorted[0], false);
}

function activateChapter(ch, scroll = true) {
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

  if (scroll) scrollToChapter(ch.id);
}

function scrollToChapter(id) {
  const el = document.querySelector(`.chapter-block[data-id="${id}"]`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function showEntry(entry) {
  const panel = document.getElementById('narrative-panel');
  const chapterList = document.getElementById('chapter-list');
  const detail = document.getElementById('entry-detail');

  chapterList.hidden = true;
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
  document.getElementById('chapter-list').hidden = false;
  document.getElementById('entry-detail').hidden = true;
}
