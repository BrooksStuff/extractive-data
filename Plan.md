# Field Poetics: Louisiana Datacenter Proliferation
## Narrative Interactive Mapping System — Implementation Plan

---

## Research Focus

An investigative, narrative web mapping system documenting the societal effects of datacenter proliferation across Louisiana. The state has become a flashpoint for Big Tech infrastructure investment — Meta's $30B "Hyperion" campus in Richland Parish, Amazon's $12B campuses in Caddo and Bossier Parishes, Hut 8's $10B AI campus in West Feliciana Parish, and a $3.6B complex in Rapides Parish — totaling over $60B in a single rural state. These facilities are driving new gas plant construction, aquifer depletion, ratepayer cost socialization, and displacement of Black and working-class communities in a corridor already known as "Cancer Alley." This system maps those effects as spatial, temporal, and narrative evidence.

---

## Precedent Systems

| Project | What it demonstrates |
|---|---|
| [forensic-architecture/timemap](https://github.com/forensic-architecture/timemap) | Sheets-driven incident map with Leaflet + D3 timeline; primary structural model |
| [forensic-architecture/datasheet-server](https://github.com/forensic-architecture/datasheet-server) | Reference for JSON schema structure and API shape (not used directly) |
| [HandsOnDataViz/leaflet-storymaps-with-google-sheets](https://github.com/HandsOnDataViz/leaflet-storymaps-with-google-sheets) | Scroll-driven narrative + multimedia markers |
| [jakobzhao/storymap](https://github.com/jakobzhao/storymap) | Chapter-based digital storytelling over web maps |
| [digidem/maplibre-storymap](https://github.com/digidem/maplibre-storymap) | Scrollytelling with chapter-triggered map transitions |

---

## Technology Stack

| Layer | Technology | Role |
|---|---|---|
| **Map** | [Leaflet.js](https://leafletjs.com/) v1.9 | Parish boundaries, facility markers, GeoJSON overlays |
| **Data Viz** | [D3.js](https://d3js.org/) v7 | Timeline, power/water/tax bar charts, choropleth, brush filter |
| **Visual FX** | [p5.js](https://p5js.org/) v1.11 | Heat shimmer over facilities, data-flow particles, waveform rings |
| **Data** | Static JSON files (git-tracked) | Four files in `data/`; edited directly and version-controlled |
| **Audio** | Howler.js + Web Audio API | Field recordings, testimony audio, waveform visualization |
| **Frontend** | Vanilla JS (ES modules) + Vite | No framework overhead |
| **Basemap** | OpenStreetMap / Stamen Toner (configurable) | Cartographic base; Toner emphasizes industrial infrastructure |

---

## Active Facilities & Projects (Seed Data)

| Facility | Operator | Parish | Scale | Status |
|---|---|---|---|---|
| Hyperion | Meta | Richland | $30B, ~3× New Orleans power use | Under construction |
| Project Everest | Meta | Richland | 10 gas plants (Entergy) | Permitted 2025 |
| NW Louisiana Campus | Amazon | Caddo + Bossier | $12B | Announced 2026 |
| AI Infrastructure Campus | Hut 8 | West Feliciana | $10B | Planned |
| AI Data Center Campus | undisclosed | Rapides | $3.6B | Announced 2026 |

---

## Data Model (JSON Schema)

All data lives as static JSON files in `data/`. Each file is an array of objects. Fields marked `array` in the Type column are JSON arrays of strings.

### `data/facilities.json`
One object per datacenter or associated infrastructure (gas plants, transmission lines).

| Column | Type | Description |
|---|---|---|
| `id` | string | Unique ID (`facility_001`) |
| `name` | string | Facility or project name |
| `operator` | string | `Meta`, `Amazon`, `Hut 8`, `Entergy`, etc. |
| `type` | string | `datacenter`, `gas-plant`, `transmission`, `cooling` |
| `parish` | string | Louisiana parish name |
| `lat` | float | Latitude |
| `lng` | float | Longitude |
| `capacity_mw` | float | Power draw in megawatts |
| `water_mgal_yr` | float | Water consumption (millions of gallons/year) |
| `investment_usd` | float | Announced investment in USD |
| `tax_incentives_usd` | float | Total public subsidy (ITEP + sales tax exemptions) |
| `status` | string | `announced`, `permitted`, `under-construction`, `operational` |
| `date_announced` | ISO date | Date project was publicly announced |
| `date_operational` | ISO date | Expected or actual operational date |
| `images` | array | Satellite imagery, facility photos (URLs) |
| `sources` | array | `source_id` references into `sources.json` |
| `visible` | boolean | Toggle visibility without deletion |

### `data/entries.json`
Societal effect records — one object per documented incident, testimony, policy event, or field observation.

| Column | Type | Description |
|---|---|---|
| `id` | string | Unique ID (`entry_001`) |
| `title` | string | Short descriptive title |
| `body` | text | Full narrative (Markdown supported) |
| `lat` | float | Latitude of the effect (not the facility) |
| `lng` | float | Longitude |
| `date` | ISO date | Date of event or documentation |
| `category` | string | See taxonomy below |
| `tags` | array | Free-form tags for filtering |
| `facility_id` | string | Links to an object in `facilities.json` (can be null) |
| `affected_community` | string | Name of community/neighborhood bearing the effect |
| `affected_population` | string | Descriptor: `low-income`, `Black`, `rural`, `agricultural`, etc. |
| `images` | array | Documentary images (URLs) |
| `audio` | URL | Field recording, interview, or ambient audio |
| `audio_label` | string | Caption for audio |
| `chapter` | string | Scrollytelling chapter assignment |
| `sources` | array | `source_id` references into `sources.json` |
| `visible` | boolean | Toggle visibility without deletion |

#### Entry Category Taxonomy

| Category | Description |
|---|---|
| `power-infrastructure` | New gas plant construction, grid strain events, transmission routing |
| `rate-impact` | Utility rate increases, stranded cost risk, LPSC proceedings |
| `water-impact` | Aquifer draw, well registrations, water quality degradation, agricultural effect |
| `air-quality` | Emissions from new gas generation, cooling tower particulates |
| `displacement` | Rising rents, rezoning, property acquisition, community disruption |
| `tax-incentive` | ITEP awards, sales tax exemptions, cost-benefit analysis |
| `policy-event` | LPSC votes, permit approvals, legislative action, zoning changes |
| `economic-effect` | Job promises vs. reality, local economic impact claims |
| `community-testimony` | Resident accounts, public comment, interview excerpt |
| `resistance` | Community organizing, legal challenges, protest, advocacy |
| `field-recording` | Ambient documentary audio (cooling towers, generators, community meetings) |
| `environmental` | Heat island, light pollution, noise, ecological disruption |

### `data/chapters.json`
Defines the scrollytelling narrative arc.

| Column | Type | Description |
|---|---|---|
| `id` | string | Chapter slug (`ch_01`) |
| `title` | string | Chapter heading |
| `body` | text | Framing narrative text (Markdown) |
| `map_center_lat` | float | Map pans here when chapter activates |
| `map_center_lng` | float | — |
| `zoom` | int | Map zoom level |
| `overlay` | URL | GeoJSON overlay for this chapter (aquifer, Cancer Alley, parish bounds) |
| `overlay_label` | string | Legend label for overlay |
| `audio_ambient` | URL | Ambient audio for chapter (e.g., Atchafalaya field recording) |
| `order` | int | Sequence order |

#### Proposed Chapter Arc

| # | Title | Geographic Focus | Thematic Focus |
|---|---|---|---|
| 1 | Digital Cancer Alley | Statewide | Framing: Louisiana as sacrifice zone; industrial heritage |
| 2 | The Grid | Richland Parish | Entergy gas plant approvals, LPSC vote, ratepayer exposure |
| 3 | The Water | Mississippi Alluvial Aquifer | Aquifer depletion, 500-600M gal/yr, agricultural harm |
| 4 | The Land | Richland / West Feliciana | Displacement, rezoning, land acquisition |
| 5 | The Money | Statewide | $3.3B tax exemptions, ITEP, promised jobs vs. reality |
| 6 | Northwest | Caddo / Bossier Parishes | Amazon campuses; power and water claims |
| 7 | Resistance | Statewide | AAE, LPSC dissent (Commissioner Lewis), community action |
| 8 | What Comes Next | Statewide | Regulatory trajectory, climate risk, stranded asset exposure |

### `data/sources.json`
Research bibliography and public record tracking.

| Column | Type | Description |
|---|---|---|
| `id` | string | Source ID (`src_001`) |
| `entry_ids` | array | Entry or facility IDs this source supports |
| `title` | string | Source title |
| `author` | string | Author, agency, or outlet |
| `date` | ISO date | Publication or record date |
| `type` | string | `journalism`, `regulatory-filing`, `interview`, `field-recording`, `academic`, `satellite` |
| `url` | URL | Link to source |
| `notes` | text | Research annotation |

---

## System Architecture

```
┌───────────────────────────────────────────────────┐
│              data/ (git-tracked JSON)             │
│  facilities.json  entries.json                    │
│  chapters.json    sources.json                    │
└──────────────────────┬────────────────────────────┘
                       │ fetch() static assets
┌──────────────────────▼────────────────────────────┐
│                  Frontend (Browser)               │
│                                                   │
│  ┌──────────┐   ┌──────────┐   ┌──────────────┐  │
│  │ Leaflet  │   │   D3     │   │     p5.js    │  │
│  │  Map     │   │ Charts + │   │  Heat/Particle│ │
│  │          │   │ Timeline │   │  FX Canvas   │  │
│  └──────────┘   └──────────┘   └──────────────┘  │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │         Narrative Scroll Panel              │  │
│  │  chapter text · images · audio player       │  │
│  └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
```

---

## GeoJSON Layers

These layers are loaded per-chapter or toggled via the filter panel:

| Layer | Source | Activated in |
|---|---|---|
| Louisiana parish boundaries | Census TIGER/Line | All chapters |
| Cancer Alley industrial corridor | EPA / ProPublica EJScreen export | Chapter 1 |
| Mississippi Alluvial Aquifer extent | USGS | Chapter 3 |
| Entergy transmission expansion routes | LPSC filings (digitized) | Chapter 2 |
| Facility footprints | Satellite trace (Google Earth) | All chapters |
| Affected community polygons | Manual research | Chapters 4, 6 |

---

## Frontend Modules

### 1. Map Layer (`map.js` — Leaflet)
- Parish boundary GeoJSON as base overlay; choropleth option (power increase % by parish)
- Two marker types: `facility` markers (facility icon, sized by MW) and `entry` markers (category-colored)
- Marker clustering for dense entry areas
- Click → opens detail panel; hover → tooltip with title, category, date
- `flyTo` triggered by chapter scroll and timeline brush

### 2. Timeline (`timeline.js` — D3)
- Horizontal axis spanning full date range of entries and facility announcements
- Two swim lanes: **policy/permit events** (top) and **community/effect events** (bottom)
- Brush selection filters visible markers on map
- Color-coded by category; hover shows entry preview

### 3. Narrative Panel (`narrative.js`)
- Scroll-driven chapter progression via Intersection Observer
- Each chapter triggers: map pan/zoom (`flyTo`), overlay swap, ambient audio swap
- Entry detail view: title, body text, image carousel, audio player, linked sources
- Keyboard navigation (arrow keys for chapter, ESC to close detail)

### 4. Comparative Charts (`charts.js` — D3)
Domain-specific visualizations, rendered in a collapsible side panel:
- **Power draw bar chart**: MW per facility vs. New Orleans annual consumption baseline
- **Water usage comparison**: MGal/yr per facility vs. local municipal draw
- **Tax incentive flow**: Sankey diagram — public subsidies per operator
- **Rate impact projection**: ratepayer cost increase over time (stranded asset scenarios)

### 5. Audio Player (`audio.js` — Howler.js)
- Per-entry audio clips (field recordings, interviews, public comment recordings)
- Ambient chapter audio (fades on chapter transition)
- p5.js waveform visualizer on `<canvas>` above player

### 6. Visual Effects Layer (`fx.js` — p5.js)
All effects render on a transparent canvas above the Leaflet map:
- **Heat shimmer**: distortion field over operational/under-construction facility markers
- **Data-flow particles**: streams between facility markers and linked gas plant markers
- **Waveform rings**: pulse outward from audio-tagged entries during playback
- **Cooling tower vapor plumes**: animated upward drift from facility positions
- All effects respect a `reducedMotion` accessibility flag

### 7. Filter + Search (`filters.js` — D3)
- Category toggle buttons (icon + label)
- Parish dropdown filter
- Operator filter (Meta, Amazon, Hut 8, Entergy, etc.)
- Free-text search over `title` + `body` + `affected_community`
- URL state persistence (`?category=water-impact&parish=Richland&date=2024`)

### 8. Data Layer (`data.js`)
- `Promise.all` fetches the four static JSON files on load
- Caches to `sessionStorage` to avoid re-fetching on soft reload
- Exposes reactive event bus; all modules subscribe to filter change events

---

## File Structure

```
field-poetics/
├── index.html
├── style.css
├── vite.config.js
├── src/
│   ├── main.js           # bootstrap: fetch → init all modules
│   ├── data.js           # API fetch, cache, reactive event bus
│   ├── map.js            # Leaflet map, facilities + entries markers, overlays
│   ├── timeline.js       # D3 dual-lane timeline + brush
│   ├── charts.js         # D3 power/water/tax/rate comparative charts
│   ├── narrative.js      # Scrollytelling panel, chapter triggers
│   ├── audio.js          # Howler.js engine, ambient + per-entry clips
│   ├── fx.js             # p5.js heat/particle/waveform effects
│   └── filters.js        # Category/parish/operator toggles, search, URL state
├── assets/
│   ├── icons/            # SVG marker icons per category + facility type
│   ├── geojson/          # Parish bounds, aquifer, Cancer Alley, transmission routes
│   └── fonts/
└── data/
    ├── facilities.json   # Datacenter and infrastructure records
    ├── entries.json      # Societal effect events and testimony
    ├── chapters.json     # Scrollytelling chapter definitions
    └── sources.json      # Research bibliography
```

---

## Implementation Phases

### Phase 1 — Data Infrastructure
- [ ] Author `data/facilities.json` with seed records for the five active projects
- [ ] Author `data/chapters.json` with the eight-chapter arc (stubs; body text added iteratively)
- [ ] Create empty `data/entries.json` and `data/sources.json` with correct array structure
- [ ] Collect and clean GeoJSON layers (parish bounds from Census TIGER, aquifer from USGS)
- [ ] Build `data.js`: `Promise.all` fetch of four files, `sessionStorage` cache, event bus

### Phase 2 — Map Foundation
- [ ] `index.html` scaffold; Leaflet, D3, p5 via Vite
- [ ] `map.js`: tile layer, parish GeoJSON, facility markers (sized by MW), entry markers
- [ ] Category icons and marker clustering
- [ ] Layer toggle control for GeoJSON overlays

### Phase 3 — Narrative + Audio
- [ ] `narrative.js`: chapter scroll panel, Intersection Observer triggers, `flyTo` on chapter change
- [ ] Entry detail view with image carousel and source links
- [ ] `audio.js`: Howler.js player, field recording clips

### Phase 4 — D3 Timeline + Charts
- [ ] `timeline.js`: dual swim-lane axis, brush filter, animated transitions
- [ ] `charts.js`: power draw bar chart, water usage comparison, tax incentive flow
- [ ] Brush selection synced to map filter state

### Phase 5 — p5.js Visual Layer
- [ ] `fx.js`: transparent canvas, heat shimmer over facilities
- [ ] Data-flow particle streams between linked markers
- [ ] Waveform rings triggered by audio playback
- [ ] Cooling tower vapor plume animation
- [ ] `reducedMotion` toggle

### Phase 6 — Filters + Polish
- [ ] `filters.js`: category toggles, parish/operator dropdowns, text search, URL state
- [ ] Mobile-responsive layout (map + panel stack on small screens)
- [ ] Accessibility audit (ARIA, keyboard nav, color contrast)
- [ ] Performance pass (marker virtualization for dense entries, lazy image loading)

---

## Key Design Decisions

**Why four sheets instead of three?**
Separating `facilities` (infrastructure records with quantitative data: MW, MGal/yr, USD) from `entries` (effect events and testimony) preserves the distinction between what has been built and what it has done. Facilities are relatively stable records; entries accumulate continuously.

**Why Stamen Toner as default basemap?**
Toner's high-contrast black-and-white style emphasizes roads, railways, and industrial infrastructure without the visual noise of satellite or color tile layers. It makes the Cancer Alley corridor and the Entergy transmission grid legible. Researchers can switch to satellite for facility verification.

**Why D3 charts alongside the map?**
The quantitative dimension — 3× New Orleans power use, $3.3B in tax exemptions, 500–600M gallons/year — is as important as the spatial one. Bar charts and flow diagrams make scale legible in ways that map markers cannot.

**Why p5.js for FX?**
The heat shimmer and vapor plume effects are generative and frame-by-frame; they cannot be expressed as SVG data bindings. p5.js on a separate canvas element keeps this layer fully decoupled from D3's SVG and Leaflet's DOM without conflict.

**Why static JSON instead of Google Sheets?**
The data is small and slow-moving — a handful of facilities, entries accumulating over months. Static JSON files checked into git give a natural audit trail (every added entry is a commit with a timestamp), require no server, no API keys, and no rate limits. The whole project deploys as a static site to GitHub Pages or Netlify. The Forensic Architecture Sheets pattern is the right model for large teams logging incidents concurrently; for this project it would add infrastructure complexity without benefit.

---

## Key Sources & Context Links

**Journalism & Advocacy**
- [The Lens: "Data centers spark fears of a 'Digital Cancer Alley' in Louisiana"](https://thelensnola.org/2025/09/25/data-centers-spark-fears-of-a-digital-cancer-alley-in-louisiana/)
- [Unicorn Riot: "Data Centers, the Climate Crisis, and Community Defense"](https://unicornriot.ninja/2025/data-centers-the-climate-crisis-and-community-defense/)
- [Alliance for Affordable Energy: "Meta's Mega Data Center Could Strain Louisiana's Grid"](https://www.all4energy.org/watchdog/metas-mega-data-center-could-strain-la-grid/)
- [Invest Louisiana: "Louisiana's Data Center Incentives: Big Promises, Bigger Questions"](https://investlouisiana.org/louisianas-data-center-incentives-big-promises-bigger-questions/)
- [Fortune: "Meta's $10 billion Louisiana data center is getting $3.3 billion in tax breaks"](https://fortune.com/2026/05/14/meta-data-center-tax-break-hyperion-louisiana/)
- [Louisiana Illuminator: "Amazon says it will limit water use, pay for power"](https://lailluminator.com/2026/02/23/amazon-data-center/)
- [nola.com: "How much water will Meta's Louisiana data center use?"](https://www.nola.com/news/environment/meta-louisiana-data-center-water-ai/article_d27dea17-d571-453c-b5a5-0deb571ea272.html)
- [Tulane Water Law Center: "The Thirstiest of Us All"](https://www.tulanewater.org/post/the-thirstiest-of-us-all-data-centers-and-the-impact-of-their-unsustainable-water-use)
- [Lincoln Parish Journal: "Rate payers could be left with half the cost"](https://lincolnparishjournal.com/2026/06/11/as-larger-ai-data-centers-race-into-louisiana-new-report-finds-rate-payers-could-be-left-with-half-the-cost/)

**Regulatory**
- [LPSC approval for Meta/Entergy infrastructure (Entergy press release)](https://www.entergy.com/news/entergy-louisiana-receives-lpsc-approval-for-major-infrastructure-investments-to-support-metas-data-center-and-improve-reliability)
- [Louisiana ITEP overview — LED](https://www.opportunitylouisiana.gov/incentive/industrial-tax-exemption)

**Precedent Code**
- [forensic-architecture/timemap](https://github.com/forensic-architecture/timemap)
- [HandsOnDataViz/leaflet-storymaps-with-google-sheets](https://github.com/HandsOnDataViz/leaflet-storymaps-with-google-sheets)
- [jakobzhao/storymap](https://github.com/jakobzhao/storymap)

**Libraries**
- [Leaflet.js](https://leafletjs.com/) · [D3.js](https://d3js.org/) · [p5.js](https://p5js.org/) · [Howler.js](https://howlerjs.com/)
