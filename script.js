const BASE = document.currentScript ? document.currentScript.src.replace(/script\.js.*$/, '') : '/';
const heights = [10, 18, 28, 16, 34, 22, 12, 26, 38, 20, 14, 30, 24, 16, 36, 28, 12, 22, 32, 18, 26, 14, 30, 20];
const wave = document.querySelector('.wave');
if (wave) heights.forEach((h, i) => {
  const bar = document.createElement('span');
  bar.style.height = h + 'px';
  bar.style.animationDelay = (i % 8) * 0.15 + 's';
  wave.appendChild(bar);
});
const items = document.querySelectorAll('.reveal');
items.forEach((el) => {
  const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
  el.style.setProperty('--d', sibs.indexOf(el) * 0.1 + 's');
});
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
items.forEach((el) => io.observe(el));
document.querySelectorAll('.cta h2').forEach((h2) => {
  const lines = ['Estratégia. Alcance.', 'Autoridade. Vendas.'];
  h2.setAttribute('aria-label', lines.join(' '));
  h2.innerHTML = '<span class="l1" aria-hidden="true"></span><br><span class="g l2" aria-hidden="true"></span><i class="caret" aria-hidden="true"></i>';
  const [l1, l2] = [h2.querySelector('.l1'), h2.querySelector('.l2')];
  const caret = h2.querySelector('.caret');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    l1.textContent = lines[0]; l2.textContent = lines[1]; caret.remove(); return;
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const type = async (el, text) => { for (const ch of text) { el.textContent += ch; await wait(65); } };
  const erase = async (el) => { while (el.textContent) { el.textContent = el.textContent.slice(0, -1); await wait(32); } };
  const run = async () => {
    for (;;) {
      l1.after(caret); await type(l1, lines[0]); await wait(250);
      h2.append(caret); await type(l2, lines[1]); await wait(2400);
      await erase(l2); l1.after(caret); await erase(l1); await wait(600);
    }
  };
  const start = new IntersectionObserver((es) => {
    if (es[0].isIntersecting) { start.disconnect(); run(); }
  }, { threshold: 0.4 });
  start.observe(h2);
});
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', e.clientX - r.left + 'px');
    card.style.setProperty('--my', e.clientY - r.top + 'px');
  });
});
document.querySelectorAll('.hero__bg video').forEach((v) => {
  v.muted = true;
  const start = () => { v.play().catch(() => {}); };
  start();
  v.addEventListener('canplay', start, { once: true });
  ['touchstart', 'pointerdown', 'scroll', 'keydown'].forEach((ev) => {
    addEventListener(ev, () => { if (v.paused) start(); }, { once: true, passive: true });
  });
});
document.querySelectorAll('.testi__list').forEach((list) => {
  const cols = [...list.children];
  const copy = () => cols.map((c) => {
    const n = c.cloneNode(true);
    n.setAttribute('aria-hidden', 'true');
    n.querySelectorAll('img').forEach((i) => { i.alt = ''; i.loading = 'eager'; });
    n.querySelectorAll('.reveal').forEach((f) => f.classList.add('in'));
    return n;
  });
  const set = (nodes, hidden) => {
    const s = document.createElement('div');
    s.className = 'testi__set';
    if (hidden) s.setAttribute('aria-hidden', 'true');
    s.append(...nodes);
    return s;
  };
  const track = document.createElement('div');
  track.className = 'testi__track';
  track.append(set([...cols, ...copy()]), set([...copy(), ...copy()], true));
  list.classList.add('is-marquee');
  list.append(track);
});
const stopVideos = (except) => {
  document.querySelectorAll('.vcard__media.is-playing,.fb-vid.is-playing').forEach((m) => {
    if (m === except) return;
    m.classList.remove('is-playing');
    m.querySelector('video')?.remove();
  });
};
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.play[data-video]');
  if (!btn) return;
  const media = btn.closest('.vcard__media,.fb-vid');
  stopVideos(media);
  const v = document.createElement('video');
  v.src = btn.dataset.video;
  v.controls = media.classList.contains('vcard__media');
  v.autoplay = true;
  v.playsInline = true;
  v.setAttribute('playsinline', '');
  v.addEventListener('ended', () => { media.classList.remove('is-playing'); v.remove(); });
  if (!v.controls) v.addEventListener('click', () => { if (v.paused) v.play(); else v.pause(); });
  media.append(v);
  media.classList.add('is-playing');
  v.play().catch(() => {});
});
document.querySelectorAll('.pf-tabs').forEach((tabs) => {
  const list = document.querySelector('.pf-vids');
  if (!list) return;
  const desc = document.getElementById('pf-desc');
  const descs = JSON.parse(list.dataset.descs || '{}');
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-f]');
    if (!b) return;
    stopVideos();
    tabs.querySelectorAll('button').forEach((x) => {
      const on = x === b;
      x.classList.toggle('is-on', on);
      x.setAttribute('aria-selected', String(on));
    });
    const f = b.dataset.f;
    list.querySelectorAll('.vcard').forEach((c) => {
      c.hidden = f === 'all' ? ['destaques', 'motions'].includes(c.dataset.level) || c.dataset.dup === '1' : c.dataset.level !== f;
      if (!c.hidden) c.classList.add('in');
    });
    desc.textContent = descs[f] || '';
  });
  const fromHash = () => {
    const b = tabs.querySelector('button[data-f="' + location.hash.slice(1) + '"]');
    if (!b) return;
    b.click();
    tabs.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  fromHash();
  addEventListener('hashchange', fromHash);
});
