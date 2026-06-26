import { init as initData } from './data.js';
import { init as initMap, refresh as refreshMap } from './map.js';
import { init as initNarrative, showEntry } from './narrative.js';
import { initWaveform } from './audio.js';
import { init as initTimeline } from './timeline.js';
import { init as initCharts } from './charts.js';
import { init as initFx } from './fx.js';
import { init as initFilters } from './filters.js';

async function bootstrap() {
  await initData();

  initMap(entry => {
    showEntry(entry);
    initWaveform(entry);
  });

  initNarrative(_chapter => {
    // chapter change — fx and timeline already subscribe via data event bus
  });

  // FX must init before filters (filters imports setReducedMotion from fx)
  initFx();

  initTimeline();
  initCharts();

  // Filters last — needs data + all modules ready
  initFilters();

  refreshMap();
}

bootstrap().catch(err => console.error('Bootstrap failed:', err));
