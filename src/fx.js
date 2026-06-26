import { getState, on } from './data.js';
import { getMap } from './map.js';

let _reducedMotion = false;
let _p5 = null;

// Particle pools
const vapourParticles = [];
const flowParticles   = [];
const rings           = [];

const MAX_VAPOUR = 120;
const RING_MAX_R = 70;

// ── Public API ────────────────────────────────────

export function setReducedMotion(val) {
  _reducedMotion = val;
  if (_p5) {
    if (_reducedMotion) _p5.noLoop();
    else _p5.loop();
  }
}

export function getReducedMotion() { return _reducedMotion; }

export function init() {
  on('audioPlay', entry => {
    if (_reducedMotion || !_p5) return;
    const map = getMap();
    if (!map || !entry.lat || !entry.lng) return;
    const pt = map.latLngToContainerPoint([entry.lat, entry.lng]);
    rings.push({ x: pt.x, y: pt.y, r: 4, life: 1 });
  });

  const sketch = p => {
    let facilities = [];

    p.setup = () => {
      const placeholder = document.getElementById('fx-canvas');
      const mapEl = document.getElementById('map');
      const rect = mapEl.getBoundingClientRect();
      const c = p.createCanvas(rect.width, rect.height);
      placeholder.replaceWith(c.elt);
      c.elt.id = 'fx-canvas';
      p.pixelDensity(1);
      p.colorMode(p.RGB, 255, 255, 255, 255);
    };

    p.draw = () => {
      p.clear();
      if (_reducedMotion) return;

      const map = getMap();
      if (!map) return;

      facilities = getState().facilities.filter(f => f.lat && f.lng && f.visible);

      // ── Heat shimmer ─────────────────────────
      facilities
        .filter(f => f.status === 'under-construction' || f.status === 'operational')
        .forEach(f => {
          const pt = map.latLngToContainerPoint([f.lat, f.lng]);
          drawShimmer(p, pt.x, pt.y);
        });

      // ── Spawn vapour particles ────────────────
      if (p.frameCount % 3 === 0 && vapourParticles.length < MAX_VAPOUR) {
        facilities.forEach(f => {
          const pt = map.latLngToContainerPoint([f.lat, f.lng]);
          vapourParticles.push(new VapourParticle(p, pt.x, pt.y));
        });
      }

      // ── Update + draw vapour ──────────────────
      for (let i = vapourParticles.length - 1; i >= 0; i--) {
        const vp = vapourParticles[i];
        vp.update(p);
        vp.draw(p);
        if (vp.dead()) vapourParticles.splice(i, 1);
      }

      // ── Spawn + update flow particles ─────────
      // Connect Hyperion (facility_001) to its gas plants (facility_002)
      if (p.frameCount % 6 === 0 && flowParticles.length < 20) {
        const src = facilities.find(f => f.id === 'facility_002');
        const dst = facilities.find(f => f.id === 'facility_001');
        if (src && dst) {
          const a = map.latLngToContainerPoint([src.lat, src.lng]);
          const b = map.latLngToContainerPoint([dst.lat, dst.lng]);
          flowParticles.push(new FlowParticle(p, a.x, a.y, b.x, b.y));
        }
      }

      for (let i = flowParticles.length - 1; i >= 0; i--) {
        const fp = flowParticles[i];
        fp.update();
        fp.draw(p);
        if (fp.dead()) flowParticles.splice(i, 1);
      }

      // ── Waveform rings ────────────────────────
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.r += 1.8;
        ring.life = 1 - ring.r / RING_MAX_R;
        p.noFill();
        p.stroke(204, 34, 0, ring.life * 180);
        p.strokeWeight(1.5);
        p.circle(ring.x, ring.y, ring.r * 2);
        if (ring.r >= RING_MAX_R) rings.splice(i, 1);
      }
    };

    p.windowResized = () => {
      const mapEl = document.getElementById('map');
      const rect = mapEl.getBoundingClientRect();
      p.resizeCanvas(rect.width, rect.height);
    };
  };

  _p5 = new p5(sketch);
}

// ── Heat shimmer ──────────────────────────────────

function drawShimmer(p, cx, cy) {
  const t = p.frameCount * 0.025;
  p.noFill();
  for (let i = 1; i <= 4; i++) {
    const r = 18 + i * 7 + p.noise(cx * 0.008, cy * 0.008, t + i * 0.4) * 9;
    const alpha = 22 - i * 4;
    p.stroke(204, 34, 0, alpha);
    p.strokeWeight(1.2);
    p.circle(cx, cy, r * 2);
  }
}

// ── Particle classes ──────────────────────────────

class VapourParticle {
  constructor(p, x, y) {
    this.x = x + p.random(-6, 6);
    this.y = y;
    this.vx = p.random(-0.25, 0.25);
    this.vy = p.random(-0.9, -0.35);
    this.life = 1.0;
    this.size = p.random(2, 6);
    this._seed = p.random(0, 1000);
  }
  update(p) {
    const drift = (p.noise(this._seed, this.y * 0.008, p.frameCount * 0.008) - 0.5) * 0.5;
    this.x += this.vx + drift;
    this.y += this.vy;
    this.life -= 0.007;
  }
  draw(p) {
    p.noStroke();
    p.fill(100, 100, 110, this.life * 50);
    p.circle(this.x, this.y, this.size);
  }
  dead() { return this.life <= 0; }
}

class FlowParticle {
  constructor(p, x0, y0, x1, y1) {
    this.x0 = x0; this.y0 = y0;
    this.x1 = x1; this.y1 = y1;
    this.t = p.random(0, 0.3);
    this.speed = p.random(0.004, 0.008);
  }
  update() { this.t += this.speed; }
  draw(p) {
    if (this.t >= 1) return;
    const x = p.lerp(this.x0, this.x1, this.t);
    const y = p.lerp(this.y0, this.y1, this.t);
    const alpha = Math.sin(this.t * Math.PI) * 130;
    p.noStroke();
    p.fill(204, 34, 0, alpha);
    p.circle(x, y, 3);
  }
  dead() { return this.t >= 1; }
}
