(() => {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const run = (el) => {
    const end = parseInt(el.dataset.count, 10);
    if (reduce) { el.textContent = end; return; }
    const t0 = performance.now();
    const dur = 1100;
    const tick = (now) => {
      const k = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    };
    el.textContent = '0';
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      run(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
})();

(() => {
  const tabs = document.querySelector('[data-tab]')?.parentElement;
  if (!tabs) return;
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]');
    if (!b) return;
    tabs.querySelectorAll('button').forEach((x) => {
      const on = x === b;
      x.classList.toggle('is-on', on);
      x.setAttribute('aria-selected', String(on));
    });
    document.querySelectorAll('.pc-panel').forEach((p) => { p.hidden = p.dataset.panel !== b.dataset.tab; });
  });
})();
