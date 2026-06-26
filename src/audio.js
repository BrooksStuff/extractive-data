import { emit } from './data.js';

let _ambient = null;
let _ambientUrl = null;

export function playAmbient(url) {
  if (url === _ambientUrl && _ambient) {
    if (!_ambient.playing()) _ambient.play();
    return;
  }
  stopAmbient();
  _ambientUrl = url;
  _ambient = new Howl({ src: [url], loop: true, volume: 0, html5: true });
  _ambient.play();
  _ambient.fade(0, 0.35, 1500);
}

export function stopAmbient() {
  if (_ambient) {
    _ambient.fade(0.35, 0, 800);
    setTimeout(() => { if (_ambient) { _ambient.stop(); _ambient = null; } }, 850);
    _ambientUrl = null;
  }
}

let _p5Instance = null;
// AudioContext is reused across entries to avoid "too many contexts" errors
let _audioCtx = null;

export function initWaveform(entry) {
  const canvas = document.getElementById('waveform-canvas');
  const audioEl = document.getElementById('entry-audio');
  if (!canvas || !audioEl) return;

  if (_p5Instance) { _p5Instance.remove(); _p5Instance = null; }

  let analyser, dataArray;

  const sketch = p => {
    p.setup = () => {
      p.createCanvas(canvas.offsetWidth || 300, 60).parent(canvas.parentElement).id('waveform-p5');
      canvas.style.display = 'none';
      p.noLoop();
    };

    p.draw = () => {
      p.background(13, 13, 13);
      if (!analyser) return;
      analyser.getByteTimeDomainData(dataArray);
      p.stroke(200, 181, 96);
      p.strokeWeight(1.5);
      p.noFill();
      p.beginShape();
      for (let i = 0; i < dataArray.length; i++) {
        const x = p.map(i, 0, dataArray.length, 0, p.width);
        const y = p.map(dataArray[i], 0, 255, p.height, 0);
        p.vertex(x, y);
      }
      p.endShape();
    };
  };

  _p5Instance = new p5(sketch);

  const onPlay = () => {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (!analyser) {
      const source = _audioCtx.createMediaElementSource(audioEl);
      analyser = _audioCtx.createAnalyser();
      analyser.fftSize = 256;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);
      analyser.connect(_audioCtx.destination);
    }
    _p5Instance.loop();
    if (entry) emit('audioPlay', entry);
  };

  audioEl.addEventListener('play', onPlay);
  audioEl.addEventListener('pause', () => _p5Instance && _p5Instance.noLoop());
  audioEl.addEventListener('ended', () => _p5Instance && _p5Instance.noLoop());
}
