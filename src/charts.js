import { getState } from './data.js';

const M = { top: 4, right: 16, bottom: 4, left: 112 };
const BAR_H = 14;
const BAR_GAP = 6;
const ACCENT = '#c8b560';
const DIM = '#333';

function svgHeight(n) { return M.top + n * (BAR_H + BAR_GAP) - BAR_GAP + M.bottom + 20; }

function hbar(svgEl, data, xDomain, baseline, baselineLabel, fmtTick, fmtVal) {
  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();

  const w = svgEl.parentElement.clientWidth - 28;
  const h = svgHeight(data.length);
  svg.attr('width', w).attr('height', h);

  const x = d3.scaleLinear().domain([0, xDomain]).range([M.left, w - M.right]);

  // Axis
  const axisG = svg.append('g')
    .attr('class', 'chart-axis')
    .attr('transform', `translate(0,${h - 20})`);
  axisG.call(
    d3.axisBottom(x)
      .ticks(4)
      .tickFormat(fmtTick)
      .tickSize(-(h - M.top - 24))
  );

  // Baseline reference line
  if (baseline != null) {
    const bx = x(baseline);
    svg.append('line')
      .attr('x1', bx).attr('x2', bx)
      .attr('y1', M.top).attr('y2', h - 20)
      .attr('stroke', '#e05c3a').attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');
    svg.append('text')
      .attr('x', bx + 3).attr('y', M.top + 9)
      .attr('fill', '#e05c3a').attr('font-size', 8).attr('font-family', 'inherit')
      .text(baselineLabel);
  }

  const rows = svg.selectAll('.bar-row')
    .data(data)
    .join('g')
    .attr('class', 'bar-row')
    .attr('transform', (_, i) => `translate(0,${M.top + i * (BAR_H + BAR_GAP)})`);

  // Labels
  rows.append('text')
    .attr('x', M.left - 4)
    .attr('y', BAR_H / 2 + 1)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('fill', '#999').attr('font-size', 9).attr('font-family', 'inherit')
    .text(d => d.label);

  // Bars
  rows.append('rect')
    .attr('x', M.left)
    .attr('y', 0)
    .attr('width', 0)
    .attr('height', BAR_H)
    .attr('fill', d => d.color || ACCENT)
    .attr('rx', 1)
    .transition().duration(600)
    .attr('width', d => Math.max(2, x(d.value) - M.left));

  // Value labels
  rows.append('text')
    .attr('x', d => Math.max(M.left + 4, x(d.value)) + 4)
    .attr('y', BAR_H / 2 + 1)
    .attr('dominant-baseline', 'middle')
    .attr('fill', '#888').attr('font-size', 8).attr('font-family', 'inherit')
    .text(d => fmtVal(d.value));
}

export function render() {
  const { facilities } = getState();

  // ── Power chart ──────────────────────────────────
  const powerData = facilities
    .filter(f => f.capacity_mw)
    .map(f => ({
      label: f.operator === 'Entergy Louisiana' ? 'Entergy (gas plants)' : f.name.split(' ').slice(0, 2).join(' '),
      value: f.capacity_mw,
      color: f.type === 'gas-plant' ? '#e05c3a' : ACCENT,
    }));

  // New Orleans average ~340 MW ("Hyperion = 3× New Orleans")
  const NO_BASELINE = 340;
  powerData.push({ label: 'New Orleans avg', value: NO_BASELINE, color: DIM });

  const maxPower = d3.max(powerData, d => d.value) * 1.15;

  hbar(
    document.getElementById('chart-power-svg'),
    powerData,
    maxPower,
    NO_BASELINE,
    'New Orleans avg',
    v => `${d3.format('.0f')(v / 1000)}GW`,
    v => `${v} MW`,
  );

  // ── Water chart ──────────────────────────────────
  const waterData = facilities
    .filter(f => f.water_mgal_yr)
    .map(f => ({
      label: f.name.split(' ').slice(0, 2).join(' '),
      value: f.water_mgal_yr,
      color: '#4a9fd4',
    }));

  // Monroe, LA municipal water ~35 MGal/yr as local comparison
  const WATER_CITY = 35;
  waterData.push({ label: 'Monroe city (est)', value: WATER_CITY, color: DIM });

  const maxWater = d3.max(waterData, d => d.value) * 1.15;

  hbar(
    document.getElementById('chart-water-svg'),
    waterData,
    maxWater,
    WATER_CITY,
    'Monroe city (est)',
    v => `${v}M gal`,
    v => `${v}M gal/yr`,
  );

  // ── Tax/subsidy chart ─────────────────────────────
  const taxData = [
    { label: 'Meta — sales tax (20yr)', value: 3300, color: '#c8b560' },
    { label: 'Entergy — ITEP (10yr)',   value: 237,  color: '#e05c3a' },
  ];
  const maxTax = d3.max(taxData, d => d.value) * 1.15;

  hbar(
    document.getElementById('chart-tax-svg'),
    taxData,
    maxTax,
    null, null,
    v => `$${d3.format('.1f')(v / 1000)}B`,
    v => `$${d3.format(',.0f')(v)}M`,
  );
}

export function init() {
  const btn = document.getElementById('charts-btn');
  const panel = document.getElementById('charts-panel');
  const closeBtn = document.getElementById('charts-close');

  btn.addEventListener('click', () => {
    const hidden = panel.hidden;
    panel.hidden = !hidden;
    if (!panel.hidden) render();
  });

  closeBtn.addEventListener('click', () => { panel.hidden = true; });
}
