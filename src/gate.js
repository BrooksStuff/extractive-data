// SHA-256 hex of your chosen password.
// Generate with: crypto.subtle.digest('SHA-256', new TextEncoder().encode('YOUR_PASSWORD'))
//   .then(b => console.log(Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,'0')).join('')))
const PASSWORD_HASH = '5f431e1ecfc89c41ad05a29bac3650094ae367cf60d97bbc26d5e818ebe9795a';

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function checkGate() {
  if (sessionStorage.getItem('dev-auth') === '1') return;

  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.id = 'gate-overlay';
    overlay.innerHTML = `
      <div id="gate-box">
        <div id="gate-title">Extractive Data</div>
        <div id="gate-subtitle">Development Preview</div>
        <form id="gate-form">
          <input id="gate-input" type="password" placeholder="Access code"
                 autocomplete="current-password" spellcheck="false" />
          <button type="submit">Enter &rarr;</button>
        </form>
        <p id="gate-error" hidden>Incorrect access code.</p>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('gate-visible')));
    document.getElementById('gate-input').focus();

    document.getElementById('gate-form').addEventListener('submit', async e => {
      e.preventDefault();
      const hash = await sha256(document.getElementById('gate-input').value);
      if (hash === PASSWORD_HASH) {
        sessionStorage.setItem('dev-auth', '1');
        overlay.classList.add('gate-out');
        overlay.addEventListener('transitionend', () => { overlay.remove(); resolve(); }, { once: true });
      } else {
        document.getElementById('gate-error').hidden = false;
        const input = document.getElementById('gate-input');
        input.value = '';
        input.focus();
      }
    });
  });
}
