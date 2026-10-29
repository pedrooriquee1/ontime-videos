(() => {
  const BASE = document.currentScript ? document.currentScript.src.replace(/consent\.js.*$/, '') : '/';
  const KEY = 'ontime-consent';
  const MAX_AGE = 365 * 24 * 60 * 60 * 1000;

  const read = () => {
    try {
      const c = JSON.parse(localStorage.getItem(KEY));
      return c && Date.now() - c.ts < MAX_AGE ? c : null;
    } catch (e) {
      return null;
    }
  };

  const save = (stats, marketing) => {
    const c = { necessary: true, stats, marketing, ts: Date.now() };
    try {
      localStorage.setItem(KEY, JSON.stringify(c));
    } catch (e) {}
    window.ontimeConsent = c;
    document.dispatchEvent(new CustomEvent('ontime:consent', { detail: c }));
  };

  window.ontimeConsent = read();
  if (window.ontimeConsent) document.dispatchEvent(new CustomEvent('ontime:consent', { detail: window.ontimeConsent }));

  let box;
  const close = () => { box.hidden = true; };

  const build = () => {
    box = document.createElement('div');
    box.className = 'cookie';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-labelledby', 'cookie-title');
    box.hidden = true;
    box.innerHTML =
      '<h2 id="cookie-title">Sua privacidade importa</h2>' +
      '<p>Usamos cookies estritamente necessários para o site funcionar. Os de estatísticas e marketing só são ativados com o seu consentimento. Saiba mais na <a href="' + BASE + 'politica-de-cookies/">Política de Cookies</a> e na <a href="' + BASE + 'politica-de-privacidade/">Política de Privacidade</a>.</p>' +
      '<div class="cookie__opts" hidden>' +
      '<label><input type="checkbox" checked disabled> <span><b>Necessários</b>: sempre ativos; guardam a sua escolha e garantem a segurança.</span></label>' +
      '<label><input type="checkbox" data-k="stats"> <span><b>Estatísticas</b>: medem a audiência de forma agregada.</span></label>' +
      '<label><input type="checkbox" data-k="marketing"> <span><b>Marketing</b>: medem campanhas e anúncios.</span></label>' +
      '</div>' +
      '<div class="cookie__actions">' +
      '<button type="button" class="is-primary" data-a="all">Aceitar todos</button>' +
      '<button type="button" data-a="none">Recusar não essenciais</button>' +
      '<button type="button" data-a="custom">Personalizar</button>' +
      '</div>';
    document.body.append(box);

    const opts = box.querySelector('.cookie__opts');
    const custom = box.querySelector('[data-a="custom"]');
    box.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-a]');
      if (!btn) return;
      const a = btn.dataset.a;
      if (a === 'all') { save(true, true); close(); }
      else if (a === 'none') { save(false, false); close(); }
      else if (opts.hidden) {
        opts.hidden = false;
        custom.textContent = 'Salvar escolhas';
        custom.classList.add('is-primary');
      } else {
        save(box.querySelector('[data-k="stats"]').checked, box.querySelector('[data-k="marketing"]').checked);
        close();
      }
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && window.ontimeConsent) close();
    });
  };

  const open = () => {
    if (!box) build();
    const c = window.ontimeConsent;
    box.querySelector('[data-k="stats"]').checked = !!(c && c.stats);
    box.querySelector('[data-k="marketing"]').checked = !!(c && c.marketing);
    box.hidden = false;
    box.querySelector('.is-primary').focus({ preventScroll: true });
  };

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-cookie-settings]')) open();
  });

  if (!window.ontimeConsent) setTimeout(open, 600);
})();
