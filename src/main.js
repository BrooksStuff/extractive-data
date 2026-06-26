import { init as initData } from './data.js';
import { init as initMap, refresh as refreshMap } from './map.js';
import { init as initNarrative, showEntry } from './narrative.js';
import { initWaveform } from './audio.js';
import { init as initTimeline } from './timeline.js';
import { init as initCharts } from './charts.js';
import { init as initFx } from './fx.js';
import { init as initFilters } from './filters.js';
import { initSplash } from './splash.js';

async function bootstrap() {
  const { done: splashDone, enable: enableEnter } = initSplash();

  await initData();

  initMap(entry => {
    showEntry(entry);
    initWaveform(entry);
  });

  initNarrative(_chapter => {});

  initFx();
  initTimeline();
  initCharts();
  initFilters();
  refreshMap();

  enableEnter();
  await splashDone;
}

bootstrap().catch(err => console.error('Bootstrap failed:', err));
