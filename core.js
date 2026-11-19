/* Shared behaviour: breathing graded lights, glass rim follows the pointer, reveal on scroll, copy email, local time. */
(() => {
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cs = getComputedStyle(document.documentElement);
  const ink = cs.getPropertyValue('--ink').trim() || '#050505';
  const cols = cs.getPropertyValue('--lights').split('|').map(s => s.trim().split(',').map(Number)).filter(c => c.length === 3);

  ['grain', 'grade'].forEach(c => { const d = document.createElement('div'); d.className = c; d.setAttribute('aria-hidden', 'true'); document.body.prepend(d); });
  const cv = document.createElement('canvas'); cv.id = 'scene'; cv.setAttribute('aria-hidden', 'true'); document.body.prepend(cv);
  const cx = cv.getContext('2d');
  let W, H;
  const size = () => { W = cv.width = Math.ceil(innerWidth / 10); H = cv.height = Math.ceil(innerHeight / 10); };
  size(); addEventListener('resize', size);
  const blobs = [
    { x: .78, y: .25, r: .55, s: .00011, p: 0, P: 9000, o: 0, on: .55, box: [.55, .95, .05, .45] },
    { x: .15, y: .8, r: .7, s: .00008, p: 2, P: 12000, o: 4200, on: .5, box: [0, .4, .55, .95] },
    { x: .5, y: .5, r: .35, s: .00015, p: 4, P: 7000, o: 2600, on: .45, box: [.25, .75, .2, .8] },
  ];
  const ease = u => u * u * (3 - 2 * u);
  const env = (b, t) => {
    if (rm) return .6;
    const cyc = Math.floor((t + b.o) / b.P), u = ((t + b.o) % b.P) / b.P;
    if (cyc !== b.cyc) { b.cyc = cyc; const [x0, x1, y0, y1] = b.box; b.x = x0 + Math.random() * (x1 - x0); b.y = y0 + Math.random() * (y1 - y0); }
    if (u > b.on) return .05;
    const v = u / b.on;
    return .05 + .95 * (v < .35 ? ease(v / .35) : v < .6 ? 1 : 1 - ease((v - .6) / .4));
  };
  const draw = t => {
    cx.globalCompositeOperation = 'source-over'; cx.fillStyle = ink; cx.fillRect(0, 0, W, H);
    cx.globalCompositeOperation = 'lighter';
    blobs.forEach((b, i) => {
      const e = env(b, t), [r, g, bl] = cols[i % cols.length] || [120, 120, 120];
      const x = (b.x + Math.sin(t * b.s + b.p) * .1) * W, y = (b.y + Math.cos(t * b.s * 1.3 + b.p) * .08) * H;
      const gr = cx.createRadialGradient(x, y, 0, x, y, b.r * Math.max(W, H) * (.85 + .15 * e));
      gr.addColorStop(0, `rgba(${r},${g},${bl},${(.32 * e).toFixed(3)})`); gr.addColorStop(.45, `rgba(${r},${g},${bl},${(.11 * e).toFixed(3)})`); gr.addColorStop(1, `rgba(${r},${g},${bl},0)`);
      cx.fillStyle = gr; cx.fillRect(0, 0, W, H);
    });
    if (!rm) requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);

  let px = -999, py = -999, q = false;
  addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; if (!q) { q = true; requestAnimationFrame(light); } }, { passive: true });
  function light() {
    q = false;
    document.querySelectorAll('.glass').forEach(g => { const r = g.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; g.style.setProperty('--mx', (px - r.left) + 'px'); g.style.setProperty('--my', (py - r.top) + 'px'); });
  }

  document.querySelectorAll('[data-stagger]').forEach(p => [...p.children].forEach((c, i) => { c.classList.add('rv'); c.style.setProperty('--d', (i * .08).toFixed(2) + 's'); }));
  if (!rm) {
    const items = [...document.querySelectorAll('.rv')].filter(el => el.getBoundingClientRect().top > innerHeight * .9);
    items.forEach(el => el.classList.add('pre'));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    items.forEach(el => io.observe(el));
  }

  const toast = document.createElement('div'); toast.className = 'toast glass'; toast.setAttribute('role', 'status'); document.body.append(toast);
  const say = m => { toast.textContent = m; toast.classList.add('show'); clearTimeout(say.t); say.t = setTimeout(() => toast.classList.remove('show'), 1800); };
  document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => {
    navigator.clipboard.writeText(b.dataset.copy).then(() => say('Email copied'), () => say(b.dataset.copy));
  }));

  const tick = () => { try {
    const s = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Karachi' }).format(new Date());
    document.querySelectorAll('[data-time]').forEach(el => el.textContent = s + ' PKT');
  } catch (e) {} };
  tick(); setInterval(tick, 15000);
})();
