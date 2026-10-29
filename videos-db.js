(() => {
  const cfg = window.ONTIME_SUPABASE;
  if (!cfg || !cfg.url || !cfg.anonKey) return;
  const BASE = document.currentScript ? document.currentScript.src.replace(/videos-db\.js.*$/, '') : '/';
  const LEVELS = { basico: 'Básico', intermediario: 'Intermediário', avancado: 'Avançado' };
  const PLAY = '<svg width="20" height="20" viewBox="0 0 20 20" fill="#fff" aria-hidden="true"><path d="M6 3.5v13l11-6.5z"/></svg>';
  const mmss = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  const pad = (n) => String(n).padStart(2, '0');
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const byPos = (a, b) => a.position - b.position;

  const media = (v, alt, aria, style) => (
    '<div class="vcard__media"' + (style ? ' style="' + style + '"' : '') + '>' +
    '<img src="' + (v.poster || BASE + 'assets/portfolio/' + v.id + '.jpg') + '" width="' + v.width + '" height="' + v.height + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">' +
    '<span class="vcard__dur" aria-hidden="true">' + mmss(v.duration) + '</span>' +
    '<button class="play" type="button" data-video="' + (v.src || BASE + 'assets/portfolio/' + v.id + '.mp4') + '" aria-label="' + esc(aria) + '">' + PLAY + '</button></div>'
  );

  const gridCard = (v, cat, n, dup) => {
    let title;
    let sub;
    let alt;
    if (LEVELS[cat]) {
      title = 'Vídeo ' + pad(n) + ' · ' + LEVELS[cat];
      sub = 'Edição nível ' + LEVELS[cat].toLowerCase();
      alt = 'Prévia do vídeo ' + pad(n) + ', edição nível ' + LEVELS[cat].toLowerCase();
    } else if (cat === 'destaques') {
      title = v.client || 'Destaque';
      sub = 'Vídeo ' + pad(n) + ' · Destaque';
      alt = 'Prévia do vídeo ' + pad(n) + (v.client ? ' de ' + v.client : '');
    } else {
      title = v.client || 'Motion';
      sub = 'Motion ' + pad(n);
      alt = 'Prévia do motion ' + pad(n) + (v.client ? ' de ' + v.client : '');
    }
    if (v.title) title = v.title;
    if (v.subtitle) sub = v.subtitle;
    const wide = cat === 'motions' && v.width > v.height;
    const style = cat === 'motions' ? 'aspect-ratio:' + v.width + '/' + v.height : '';
    return '<article class="reveal vcard in' + (wide ? ' vcard--wide' : '') + '" data-level="' + cat + '"' + (dup ? ' data-dup="1"' : '') + ' hidden>' +
      media(v, alt, 'Reproduzir ' + title, style) +
      '<div class="vcard__txt"><b>' + esc(title) + '</b><p>' + esc(sub) + '</p></div></article>';
  };

  const homeCard = (v) => {
    const title = v.title || v.client || 'Vídeo editado';
    return '<article class="reveal vcard in" data-level="destaques">' +
      media(v, 'Prévia de vídeo editado' + (v.client ? ' para ' + v.client : ''), 'Reproduzir vídeo de ' + title, '') +
      '<div class="vcard__txt"><b>' + esc(title) + '</b><p>' + esc(v.subtitle || 'Destaque') + '</p></div></article>';
  };

  const renderGrid = (data) => {
    const list = document.querySelector('.pf-vids');
    const tabs = document.querySelector('.pf-tabs');
    if (!list || !tabs) return;
    const cats = [...tabs.querySelectorAll('button[data-f]')].map((b) => b.dataset.f).filter((f) => f !== 'all');
    const seen = new Set();
    const counts = {};
    let html = '';
    cats.forEach((cat) => {
      const vids = data.filter((v) => v.categories.includes(cat)).sort(byPos);
      counts[cat] = vids.length;
      const perClient = {};
      vids.forEach((v, k) => {
        let n = k + 1;
        if (cat === 'destaques' || cat === 'motions') {
          const key = v.client || '';
          perClient[key] = (perClient[key] || 0) + 1;
          n = perClient[key];
        }
        const dup = LEVELS[cat] ? seen.has(v.id) : false;
        if (LEVELS[cat]) seen.add(v.id);
        html += gridCard(v, cat, n, dup);
      });
    });
    list.innerHTML = html;
    counts.all = seen.size;
    tabs.querySelectorAll('button[data-f]').forEach((b) => {
      const c = counts[b.dataset.f] || 0;
      const small = b.querySelector('small');
      if (small) small.textContent = c;
      b.hidden = c === 0 && b.dataset.f !== 'all';
    });
    const active = tabs.querySelector('button.is-on') || tabs.querySelector('button[data-f="all"]');
    if (active) active.click();
  };

  const renderHome = (data) => {
    const list = document.querySelector('#portfolio .portfolio__list:not(.pf-vids)');
    if (!list) return;
    const vids = data.filter((v) => v.home).sort((a, b) => a.home_pos - b.home_pos).slice(0, 6);
    if (vids.length) list.innerHTML = vids.map(homeCard).join('');
  };

  fetch(cfg.url.replace(/\/$/, '') + '/rest/v1/videos?select=*&order=position.asc', {
    headers: cfg.anonKey.startsWith('eyJ') ? { apikey: cfg.anonKey, Authorization: 'Bearer ' + cfg.anonKey } : { apikey: cfg.anonKey },
  })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((data) => {
      if (!Array.isArray(data) || !data.length) return;
      renderGrid(data);
      renderHome(data);
    })
    .catch(() => {});
})();
