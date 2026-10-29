(() => {
  const $ = (id) => document.getElementById(id);
  const cfg = window.ONTIME_SUPABASE;
  const CATS = [
    ['basico', 'Básico'],
    ['intermediario', 'Intermediário'],
    ['avancado', 'Avançado'],
    ['destaques', 'Destaques'],
    ['motions', 'Motions'],
  ];
  const ASSETS = '../assets/portfolio/';
  const PLAY = '<svg width="20" height="20" viewBox="0 0 20 20" fill="#fff" aria-hidden="true"><path d="M6 3.5v13l11-6.5z"/></svg>';
  const mmss = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const show = (id, on) => { $(id).hidden = !on; };

  if (!cfg || !cfg.url || !cfg.anonKey || !window.supabase) {
    show('setup', true);
    return;
  }
  const sb = window.supabase.createClient(cfg.url, cfg.anonKey);
  let videos = [];
  let filter = 'all';
  let query = '';
  let toastTimer = 0;

  const cat = (v) => v.categories[0] || '';
  const LEVEL = { basico: 'Básico', intermediario: 'Intermediário', avancado: 'Avançado' };
  const pad = (n) => String(n).padStart(2, '0');
  const rank = (v, byClient) => {
    const c = cat(v);
    const same = videos.filter((x) => cat(x) === c && (!byClient || (x.client || '') === (v.client || ''))).sort((a, b) => a.position - b.position);
    return same.findIndex((x) => x.id === v.id) + 1;
  };
  const autoTitle = (v) => {
    const c = cat(v);
    if (LEVEL[c]) return 'Vídeo ' + pad(rank(v)) + ' · ' + LEVEL[c];
    if (c === 'destaques') return v.client || 'Destaque';
    if (c === 'motions') return v.client || 'Motion';
    return v.id;
  };
  const autoSub = (v) => {
    const c = cat(v);
    if (LEVEL[c]) return 'Edição nível ' + LEVEL[c].toLowerCase();
    if (c === 'destaques') return 'Vídeo ' + pad(rank(v, true)) + ' · Destaque';
    if (c === 'motions') return 'Motion ' + pad(rank(v, true));
    return '';
  };
  const poster = (v) => v.poster || ASSETS + v.id + '.jpg';
  const source = (v) => v.src || ASSETS + v.id + '.mp4';
  const sorter = () => (filter === 'home' ? (a, b) => a.home_pos - b.home_pos : (a, b) => a.position - b.position);
  const visible = () => videos.filter(matches).sort(sorter());

  const toast = (msg, err) => {
    const t = $('toast');
    t.textContent = msg;
    t.classList.toggle('is-err', !!err);
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), err ? 4500 : 1600);
  };

  const save = async (v, patch, quiet) => {
    const before = { ...v };
    Object.assign(v, patch);
    const { data, error } = await sb.from('videos').update(patch).eq('id', v.id).select();
    if (error || !data || !data.length) {
      Object.assign(v, before);
      toast(error ? 'Não salvou: ' + error.message : 'Sem permissão. Seu usuário precisa estar na lista de administradores.', true);
      render();
      return false;
    }
    if (!quiet) toast('Salvo');
    renderChips();
    renderWarn();
    return true;
  };

  function matches(v) {
    if (filter === 'none' && v.categories.length) return false;
    if (filter === 'home' && !v.home) return false;
    if (CATS.some(([k]) => k === filter) && !v.categories.includes(filter)) return false;
    const q = query.trim().toLowerCase();
    if (q && ![v.title, v.client, v.id, autoTitle(v)].some((x) => (x || '').toLowerCase().includes(q))) return false;
    return true;
  }

  const renderChips = () => {
    const defs = [['all', 'Todos', videos.length]]
      .concat(CATS.map(([k, n]) => [k, n, videos.filter((v) => v.categories.includes(k)).length]))
      .concat([['none', 'Fora do site', videos.filter((v) => !v.categories.length).length], ['home', 'Home', videos.filter((v) => v.home).length]]);
    $('chips').innerHTML = defs.map(([k, n, c]) => '<button type="button" data-k="' + k + '" class="' + (filter === k ? 'is-on' : '') + '">' + n + ' <small>' + c + '</small></button>').join('');
  };

  const renderWarn = () => {
    const n = videos.filter((v) => v.home).length;
    const w = $('home-warn');
    w.hidden = n === 3;
    w.textContent = n === 3 ? '' : 'Na home aparecem até 6 vídeos. Hoje há ' + n + ' marcados. O ideal são 3.';
  };

  const card = (v) => {
    const a = document.createElement('article');
    a.className = 'adm__card' + (v.home ? ' is-home' : '');
    a.dataset.id = v.id;
    const options = '<option value=""' + (cat(v) ? '' : ' selected') + '>Fora do site</option>' +
      CATS.map(([k, n]) => '<option value="' + k + '"' + (cat(v) === k ? ' selected' : '') + '>' + n + '</option>').join('');
    a.innerHTML =
      '<div class="adm__media"><img src="' + esc(poster(v)) + '" alt="" loading="lazy">' +
      '<span class="adm__dur">' + mmss(v.duration) + '</span>' +
      '<button class="play" type="button" aria-label="Ver o vídeo">' + PLAY + '</button></div>' +
      '<div class="adm__body">' +
      '<label>Onde aparece<select data-cat>' + options + '</select></label>' +
      '<label class="adm__switch"><input type="checkbox" data-home' + (v.home ? ' checked' : '') + '><span>Mostrar na home</span></label>' +
      '<label>Nome<input type="text" data-title value="' + esc(v.title != null ? v.title : autoTitle(v)) + '" placeholder="Nome que aparece no cartão" maxlength="80"></label>' +
      '<label>Descrição<input type="text" data-subtitle value="' + esc(v.subtitle != null ? v.subtitle : autoSub(v)) + '" placeholder="Texto pequeno abaixo do nome" maxlength="120"></label>' +
      '<div class="adm__move"><button type="button" data-up aria-label="Mover para cima">↑ Subir</button><button type="button" data-down aria-label="Mover para baixo">↓ Descer</button></div>' +
      (v.id.startsWith('extra-') ? '<button type="button" class="adm__del" data-del>Excluir vídeo</button>' : '') +
      '</div>';
    return a;
  };

  function render() {
    renderChips();
    renderWarn();
    const list = $('list');
    list.innerHTML = '';
    visible().forEach((v) => list.appendChild(card(v)));
    if (!list.children.length) list.innerHTML = '<p class="adm__empty">Nenhum vídeo aqui.</p>';
  }

  const load = async () => {
    const { data, error } = await sb.from('videos').select('*').order('position', { ascending: true });
    if (error) { toast('Erro ao carregar: ' + error.message, true); return; }
    videos = data;
    render();
  };

  const move = async (v, dir) => {
    const arr = visible();
    const i = arr.findIndex((x) => x.id === v.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    const other = arr[j];
    if (filter === 'home') {
      [arr[i], arr[j]] = [arr[j], arr[i]];
      const jobs = [];
      arr.forEach((x, k) => { if (x.home_pos !== k + 1) jobs.push(save(x, { home_pos: k + 1 }, true)); });
      await Promise.all(jobs);
    } else {
      const a = v.position;
      const b = other.position;
      await Promise.all([save(v, { position: b }, true), save(other, { position: a }, true)]);
    }
    toast('Salvo');
    render();
  };

  $('chips').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-k]');
    if (!b) return;
    filter = b.dataset.k;
    render();
  });
  $('search').addEventListener('input', (e) => { query = e.target.value; render(); });

  $('list').addEventListener('click', (e) => {
    const cardEl = e.target.closest('.adm__card');
    if (!cardEl) return;
    const v = videos.find((x) => x.id === cardEl.dataset.id);
    if (e.target.closest('[data-up]')) { move(v, -1); return; }
    if (e.target.closest('[data-down]')) { move(v, 1); return; }
    if (e.target.closest('[data-del]')) { remove(v); return; }
    const btn = e.target.closest('.play');
    if (!btn) return;
    const media = btn.closest('.adm__media');
    document.querySelectorAll('.adm__media.is-playing').forEach((m) => { m.classList.remove('is-playing'); m.querySelector('video')?.remove(); });
    const vid = document.createElement('video');
    vid.src = source(v);
    vid.controls = true;
    vid.autoplay = true;
    vid.playsInline = true;
    media.append(vid);
    media.classList.add('is-playing');
  });

  $('list').addEventListener('change', async (e) => {
    const el = e.target;
    const cardEl = el.closest('.adm__card');
    const v = cardEl && videos.find((x) => x.id === cardEl.dataset.id);
    if (!v) return;
    if ('cat' in el.dataset) {
      await save(v, { categories: el.value ? [el.value] : [] });
      if (filter !== 'all' && filter !== 'home') render();
    } else if ('home' in el.dataset) {
      const patch = { home: el.checked };
      if (el.checked && !v.home_pos) patch.home_pos = Math.max(0, ...videos.map((x) => x.home_pos)) + 1;
      if (await save(v, patch)) { cardEl.classList.toggle('is-home', v.home); if (filter === 'home') render(); }
    } else if ('title' in el.dataset) {
      const val = el.value.trim();
      await save(v, { title: !val || val === autoTitle(v) ? null : val });
    } else if ('subtitle' in el.dataset) {
      const val = el.value.trim();
      await save(v, { subtitle: !val || val === autoSub(v) ? null : val });
    }
  });

  /* ---------- Adicionar e excluir ---------- */
  const dlg = $('add-dlg');
  const MAX = 50 * 1024 * 1024;
  let picked = null;
  const msg = (t) => { $('add-msg').textContent = t || ''; };
  $('add-cat').innerHTML = '<option value="">Fora do site</option>' + CATS.map(([k, n]) => '<option value="' + k + '">' + n + '</option>').join('');

  const resetAdd = () => {
    $('add-form').reset();
    picked = null;
    $('add-prev').hidden = true;
    msg('');
    $('add-save').disabled = false;
    $('add-save').textContent = 'Publicar';
  };
  $('add-btn').addEventListener('click', () => { resetAdd(); dlg.showModal(); });
  $('add-close').addEventListener('click', () => dlg.close());
  $('add-cancel').addEventListener('click', () => dlg.close());

  const probe = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.src = url;
    v.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não consegui ler esse vídeo.')); };
    v.onloadedmetadata = () => { v.currentTime = Math.max(0.1, Math.min(2, (v.duration || 0) / 3)); };
    v.onseeked = () => {
      const w = 576;
      const h = Math.round((v.videoHeight * w) / (v.videoWidth || w)) || 1024;
      const cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      cv.getContext('2d').drawImage(v, 0, 0, w, h);
      cv.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve({ file, blob, duration: Math.round(v.duration) || 1, width: v.videoWidth, height: v.videoHeight });
        else reject(new Error('Não consegui gerar a capa.'));
      }, 'image/jpeg', 0.85);
    };
  });

  $('add-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    picked = null;
    $('add-prev').hidden = true;
    msg('');
    if (!file) return;
    if (file.size > MAX) {
      msg('Esse arquivo tem ' + Math.round(file.size / 1048576) + ' MB e o limite é 50 MB. Reduza o vídeo ou use o endereço de um arquivo já hospedado.');
      e.target.value = '';
      return;
    }
    msg('Lendo o vídeo...');
    try {
      picked = await probe(file);
    } catch (err) { msg(err.message); return; }
    msg('');
    $('add-poster').src = URL.createObjectURL(picked.blob);
    $('add-meta').textContent = mmss(picked.duration) + ' · ' + picked.width + 'x' + picked.height + ' · ' + (file.size / 1048576).toFixed(1) + ' MB';
    $('add-prev').hidden = false;
    if (!$('add-name').value) $('add-name').value = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  });

  const friendly = (err) => {
    const m = (err && err.message) || '';
    if (/bucket not found/i.test(m)) return 'O armazenamento ainda não foi criado no Supabase. Rode o SQL de armazenamento e tente de novo.';
    if (/row-level security|not allowed|permission|unauthorized/i.test(m)) return 'Sem permissão para enviar arquivos. Confira o SQL de armazenamento e se o seu usuário é administrador.';
    if (/exceed|too large|payload/i.test(m)) return 'O arquivo é maior que o limite do Supabase (50 MB no plano gratuito).';
    return 'Não deu certo: ' + m;
  };

  $('add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    msg('');
    const url = $('add-url').value.trim();
    const purl = $('add-purl').value.trim();
    if (!picked && !(url && purl)) { msg('Escolha o arquivo do vídeo, ou preencha os endereços do vídeo e da capa.'); return; }
    const btn = $('add-save');
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    const fail = (text) => { msg(text); btn.disabled = false; btn.textContent = 'Publicar'; };
    const id = 'extra-' + Date.now().toString(36);
    const store = sb.storage.from('videos');
    let src = url;
    let poster = purl;
    let duration = parseInt($('add-dur').value, 10) || 30;
    let width = 576;
    let height = 1024;
    const uploaded = [];
    if (picked) {
      const up = await store.upload(id + '.mp4', picked.file, { contentType: picked.file.type || 'video/mp4' });
      if (up.error) { fail(friendly(up.error)); return; }
      uploaded.push(id + '.mp4');
      const upp = await store.upload(id + '.jpg', picked.blob, { contentType: 'image/jpeg' });
      if (upp.error) { await store.remove(uploaded); fail(friendly(upp.error)); return; }
      uploaded.push(id + '.jpg');
      src = store.getPublicUrl(id + '.mp4').data.publicUrl;
      poster = store.getPublicUrl(id + '.jpg').data.publicUrl;
      duration = picked.duration;
      width = picked.width;
      height = picked.height;
    }
    const c = $('add-cat').value;
    const home = $('add-home').checked;
    const row = {
      id,
      title: $('add-name').value.trim() || null,
      subtitle: $('add-sub').value.trim() || null,
      categories: c ? [c] : [],
      home,
      home_pos: home ? videos.reduce((m, x) => Math.max(m, x.home_pos), 0) + 1 : 0,
      position: videos.reduce((m, x) => Math.max(m, x.position), 0) + 1,
      duration,
      width,
      height,
      src,
      poster,
    };
    const { data, error } = await sb.from('videos').insert(row).select();
    if (error || !data || !data.length) {
      if (uploaded.length) await store.remove(uploaded);
      fail(error ? 'Não salvou: ' + error.message : 'Sem permissão. Seu usuário precisa estar na lista de administradores.');
      return;
    }
    videos.push(data[0]);
    filter = 'all';
    query = '';
    $('search').value = '';
    render();
    dlg.close();
    toast('Vídeo publicado');
  });

  const remove = async (v) => {
    if (!confirm('Excluir este vídeo? Ele sai do site e o arquivo é apagado do armazenamento.')) return;
    const { error } = await sb.from('videos').delete().eq('id', v.id);
    if (error) { toast('Não excluiu: ' + error.message, true); return; }
    try { await sb.storage.from('videos').remove([v.id + '.mp4', v.id + '.jpg']); } catch (err) { /* arquivo já removido */ }
    videos = videos.filter((x) => x.id !== v.id);
    toast('Excluído');
    render();
  };

  let lastUid;
  const enter = async (session) => {
    const uid = session ? session.user.id : null;
    if (uid === lastUid) return;
    lastUid = uid;
    if (!session) {
      show('panel', false); show('user', false); show('login', true);
      return;
    }
    show('login', false); show('panel', true); show('user', true);
    $('user-mail').textContent = session.user.email;
    await load();
  };

  $('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('login-btn');
    btn.disabled = true;
    $('login-msg').textContent = '';
    const { error } = await sb.auth.signInWithPassword({ email: $('email').value.trim(), password: $('password').value });
    btn.disabled = false;
    if (error) $('login-msg').textContent = 'E-mail ou senha incorretos.';
  });

  $('logout').addEventListener('click', () => sb.auth.signOut());

  sb.auth.onAuthStateChange((_event, session) => { enter(session); });
  sb.auth.getSession().then(({ data }) => enter(data.session));
})();
