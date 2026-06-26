import { getState, setFilters } from './data.js';

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

const M = { top: 6, right: 20, bottom: 18, left: 58 };
const LANE_FAC = 18;   // y for facility row
const LANE_ENT = 46;   // y for entry row

let _x, _brush, _brushG, _svg, _wrap;

function catColor(cat) { return CATEGORY_COLORS[cat] || '#666'; }

function getWidth() { return _wrap.clientWidth; }

function buildScale(width) {
  const { facilities, entries } = getState();
  const dates = [
    ...facilities.map(f => f.date_announced),
    ...entries.map(e => e.date),
  ].filter(Boolean).map(d => new Date(d));
  const minDate = d3.min(dates) || new Date('2024-01-01');
  const maxDate = new Date('2027-06-01');
  return d3.scaleTime()
    .domain([minDate, maxDate])
    .range([M.left, width - M.right]);
}

function render() {
  const width = getWidth();
  const height = _wrap.clientHeight;

  _svg.selectAll('*').remove();
  _svg.attr('width', width).attr('height', height);

  _x = buildScale(width);

  // Gridlines + axis
  _svg.append('g')
    .attr('class', 'timeline-axis')
    .attr('transform', `translate(0,${height - M.bottom})`)
    .call(
      d3.axisBottom(_x)
        .ticks(Math.max(3, Math.floor(width / 120)))
        .tickSize(-(height - M.top - M.bottom))
        .tickFormat(d3.timeFormat('%b %Y'))
    );

  // Lane labels
  _svg.append('text')
    .attr('x', 4).attr('y', LANE_FAC + 3)
    .attr('fill', '#666').attr('font-size', 8).attr('font-family', 'inherit')
    .text('FACILITIES');

  _svg.append('text')
    .attr('x', 4).attr('y', LANE_ENT + 3)
    .attr('fill', '#666').attr('font-size', 8).attr('font-family', 'inherit')
    .text('EVENTS');

  const { facilities, entries } = getState();

  // Facility marks (diamonds)
  const facData = facilities.filter(f => f.date_announced && f.visible);
  _svg.selectAll('.fac-mark')
    .data(facData)
    .join('path')
    .attr('class', 'fac-mark')
    .attr('d', f => {
      const cx = _x(new Date(f.date_announced));
      const s = 5;
      return `M${cx},${LANE_FAC - s} L${cx + s},${LANE_FAC} L${cx},${LANE_FAC + s} L${cx - s},${LANE_FAC} Z`;
    })
    .attr('fill', '#cc2200')
    .attr('opacity', 0.85)
    .append('title')
    .text(f => `${f.name}\n${f.date_announced}`);

  // Entry marks (circles)
  const entData = entries.filter(e => e.date && e.visible);
  _svg.selectAll('.ent-mark')
    .data(entData)
    .join('circle')
    .attr('class', 'ent-mark')
    .attr('cx', e => _x(new Date(e.date)))
    .attr('cy', LANE_ENT)
    .attr('r', 4)
    .attr('fill', e => catColor(e.category))
    .attr('opacity', 0.85)
    .append('title')
    .text(e => `${e.title}\n${e.date}`);

  // Brush
  _brush = d3.brushX()
    .extent([[M.left, M.top], [width - M.right, height - M.bottom]])
    .on('end', ({ selection }) => {
      if (!selection) {
        setFilters({ dateMin: null, dateMax: null });
      } else {
        const [d0, d1] = selection.map(_x.invert);
        setFilters({
          dateMin: d0.toISOString().slice(0, 10),
          dateMax: d1.toISOString().slice(0, 10),
        });
      }
    });

  _brushG = _svg.append('g').attr('class', 'brush').call(_brush);
}

export function init() {
  _wrap = document.getElementById('timeline-wrap');
  _svg = d3.select('#timeline');
  render();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 150);
  });
}

export function clearBrush() {
  if (_brushG && _brush) _brushG.call(_brush.move, null);
}
