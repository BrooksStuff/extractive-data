const SPLASH_LOGO = 'assets/logo.svg'; // set to null to hide logo

export function initSplash() {
  let _resolve;
  const done = new Promise(resolve => { _resolve = resolve; });

  const screen = document.createElement('div');
  screen.id = 'splash-screen';
  screen.innerHTML = `
    <div class="splash-left">
      ${SPLASH_LOGO
        ? `<img class="splash-logo" src="${SPLASH_LOGO}" alt="" onerror="this.style.display='none'">`
        : ''}
      <div>
        <div class="splash-title">Extractive Data</div>
        <div class="splash-subtitle">Louisiana Datacenter Proliferation</div>
      </div>
      <div>
        <p class="splash-copy">$60B in datacenter investment. 10 gas plants. 500M&nbsp;gal/yr. $3.3B in tax exemptions.</p>
        <button class="splash-enter" disabled>Enter Map →</button>
      </div>
    </div>
    <div class="splash-right">
      <div class="splash-stat">
        <div class="splash-stat-num splash-stat-accent">$60B</div>
        <div class="splash-stat-label">Total investment</div>
      </div>
      <div class="splash-stat">
        <div class="splash-stat-num">10</div>
        <div class="splash-stat-label">New gas plants</div>
      </div>
      <div class="splash-stat">
        <div class="splash-stat-num">500M</div>
        <div class="splash-stat-label">Gal / yr aquifer draw</div>
      </div>
      <div class="splash-stat">
        <div class="splash-stat-num">$3.3B</div>
        <div class="splash-stat-label">Tax exemptions</div>
      </div>
    </div>
  `;
  document.body.appendChild(screen);

  // Two rAF calls ensure the browser has painted the initial opacity:0 state
  // before adding the class that triggers the CSS transition.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    screen.classList.add('splash-running');
  }));

  // After 2s, show the button dimly to signal "loading…"
  setTimeout(() => {
    if (!screen.isConnected) return;
    const btn = screen.querySelector('.splash-enter');
    btn.style.transition = 'opacity 0.4s ease';
    btn.style.opacity = '0.35';
  }, 2000);

  screen.querySelector('.splash-enter').addEventListener('click', () => {
    screen.classList.add('splash-out');
    screen.addEventListener('transitionend', () => {
      screen.remove();
      _resolve();
    }, { once: true });
  });

  return {
    done,
    enable() {
      const btn = screen.querySelector('.splash-enter');
      btn.disabled = false;
      btn.style.transition = 'opacity 0.25s ease, background-color 0.2s ease';
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    },
  };
}
