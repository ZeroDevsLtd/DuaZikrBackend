'use strict';

// ---------- helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const main = () => $('#main');
const LANG_NAMES = { en: 'English', bn: 'Bangla', ar: 'Arabic', de: 'German', ur: 'Urdu', es: 'Spanish', id: 'Indonesian' };
const RTL = new Set(['ar', 'ur']);
let ME = null;

const store = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
  },
};

function toast(message, isError = false) {
  const el = $('#toast');
  el.textContent = message;
  el.className = `toast${isError ? ' err' : ''}`;
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (el.hidden = true), isError ? 5000 : 2500);
}

function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d) ? '—' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function errorText(json, status) {
  if (!json) return `HTTP ${status}`;
  if (json.message) return json.message;
  const first = Object.entries(json).find(([, v]) => Array.isArray(v));
  return first ? `${first[0]}: ${first[1].join(', ')}` : `HTTP ${status}`;
}

async function api(method, path, body) {
  const res = await fetch(`/admin/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (res.status === 401 && path !== '/login') {
    showLogin();
    throw new Error('Session expired, please sign in again');
  }
  if (!res.ok) throw new Error(errorText(json, res.status));
  return json;
}

function langBadges(langs) {
  return (langs || []).map((l) => `<span class="badge lang">${esc(l)}</span>`).join('');
}

// ---------- auth / boot ----------
function showLogin() {
  $('#app-view').hidden = true;
  $('#login-view').hidden = false;
}

async function boot() {
  try {
    ME = await api('GET', '/me');
  } catch {
    showLogin();
    return;
  }
  $('#login-view').hidden = true;
  $('#app-view').hidden = false;
  $('#whoami').textContent = ME.username;
  route();
}

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  $('#login-error').hidden = true;
  try {
    await api('POST', '/login', { username: form.get('username'), password: form.get('password') });
    e.target.reset();
    boot();
  } catch (err) {
    $('#login-error').textContent = err.message;
    $('#login-error').hidden = false;
  }
});

$('#logout').addEventListener('click', async () => {
  await api('POST', '/logout').catch(() => {});
  showLogin();
});

window.addEventListener('hashchange', route);

function route() {
  if (!ME) return;
  const [view = 'dashboard', action, id] = location.hash.replace(/^#/, '').split('/');
  $$('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.view === view));
  const views = { dashboard, duas, categories, ads, users, devices, tester };
  const render = views[view] || dashboard;
  main().innerHTML = '<div class="empty">Loading…</div>';
  Promise.resolve(render(action, id && decodeURIComponent(id))).catch((err) => {
    main().innerHTML = `<div class="card error">${esc(err.message)}</div>`;
  });
}

// ---------- dashboard ----------
async function dashboard() {
  const s = await api('GET', '/stats');
  const c = s.counts;
  const tile = (label, value) => `<div class="card stat"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div></div>`;
  main().innerHTML = `
    <div class="page-head"><h1>Dashboard</h1></div>
    <div class="stack">
      <div class="stats">
        ${tile('Duas', c.duas)}${tile('Published', c.published)}${tile('In review', c.in_review)}${tile('Drafts', c.drafts)}
        ${tile('Categories', c.categories)}${tile('Active ads', c.active_ads)}${tile('Users', c.users)}${tile('Devices', c.devices)}
      </div>
      <div class="grid-2">
        <div class="card">
          <h3>Translation coverage</h3>
          <p class="muted">Duas with a translation in each language (of ${esc(c.duas)}).</p>
          <div class="table-wrap"><table><thead><tr><th>Language</th><th class="num">Duas</th><th class="num">Coverage</th></tr></thead><tbody>
          ${ME.languages
            .map((l) => {
              const n = s.translations.find((t) => t.lang === l)?.count ?? 0;
              return `<tr><td>${esc(LANG_NAMES[l] || l)} <span class="muted">(${esc(l)})</span></td><td class="num">${n}</td><td class="num">${c.duas ? Math.round((n / c.duas) * 100) : 0}%</td></tr>`;
            })
            .join('')}
          </tbody></table></div>
        </div>
        <div class="card">
          <h3>Most viewed</h3>
          <p class="muted">Counts from the public API.</p>
          <div class="table-wrap"><table><thead><tr><th>Dua</th><th class="num">Views</th><th class="num">Favorites</th></tr></thead><tbody>
          ${s.popular.map((p) => `<tr class="clickable" data-href="#duas/edit/${encodeURIComponent(p.id)}"><td>${esc(p.title || p.id)}</td><td class="num">${p.view_count}</td><td class="num">${p.favorite_count}</td></tr>`).join('') || '<tr><td colspan="3" class="empty">No data yet</td></tr>'}
          </tbody></table></div>
        </div>
      </div>
    </div>`;
  bindRowLinks();
}

function bindRowLinks() {
  $$('tr[data-href]').forEach((tr) => tr.addEventListener('click', () => (location.hash = tr.dataset.href)));
}

// ---------- duas ----------
async function loadCategories() {
  return api('GET', '/categories');
}

async function duas(action, id) {
  if (action === 'new' || action === 'edit') return duaForm(action === 'edit' ? id : null);
  const cats = await loadCategories();
  const saved = JSON.parse(store.get('duaFilters') || '{}');
  main().innerHTML = `
    <div class="page-head"><h1>Duas</h1><a class="btn primary" href="#duas/new">New dua</a></div>
    <div class="toolbar">
      <input id="f-q" type="search" placeholder="Search title, text, translation, id…" value="${esc(saved.q || '')}">
      <select id="f-cat"><option value="">All categories</option><option value="none">No category</option>
        ${cats.map((c) => `<option value="${c.id}">${esc(c.name.en || c.slug)}</option>`).join('')}</select>
      <select id="f-status"><option value="">Any status</option>${ME.options.statuses.map((s) => `<option>${esc(s)}</option>`).join('')}</select>
      <select id="f-type"><option value="">Any type</option>${ME.options.types.map((t) => `<option>${esc(t)}</option>`).join('')}</select>
    </div>
    <div id="dua-table"></div>`;
  $('#f-cat').value = saved.category_id || '';
  $('#f-status').value = saved.status || '';
  $('#f-type').value = saved.type || '';

  const load = async () => {
    const filters = { q: $('#f-q').value, category_id: $('#f-cat').value, status: $('#f-status').value, type: $('#f-type').value };
    store.set('duaFilters', JSON.stringify(filters));
    const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
    const rows = await api('GET', `/duas${qs ? `?${qs}` : ''}`);
    $('#dua-table').innerHTML = rows.length
      ? `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Title</th><th>Category</th><th>Type</th><th>Status</th><th>Languages</th><th class="num">Views</th><th>Updated</th></tr></thead><tbody>
        ${rows
          .map(
            (r) => `<tr class="clickable" data-href="#duas/edit/${encodeURIComponent(r.id)}">
            <td><code>${esc(r.id)}</code></td>
            <td>${esc(r.title_en)}${r.title_bn ? `<div class="muted">${esc(r.title_bn)}</div>` : ''}</td>
            <td>${esc(r.category_name || '—')}</td>
            <td>${esc(r.type)}</td>
            <td><span class="badge ${esc(r.status)}">${esc(r.status)}</span>${r.reviewed_by ? `<div class="muted">✓ ${esc(r.reviewed_by)}</div>` : ''}</td>
            <td>${langBadges(r.languages)}</td>
            <td class="num">${r.view_count}</td>
            <td class="muted">${fmtDate(r.updated_at)}</td></tr>`,
          )
          .join('')}</tbody></table></div><p class="muted">${rows.length} dua(s)</p>`
      : '<div class="card empty">No duas match these filters.</div>';
    bindRowLinks();
  };
  let timer;
  $('#f-q').addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(load, 250);
  });
  ['#f-cat', '#f-status', '#f-type'].forEach((s) => $(s).addEventListener('change', load));
  await load();
}

function languageTabs(languages, primary, renderPane, hasContent) {
  const tabs = languages
    .map(
      (l, i) =>
        `<button type="button" data-lang="${l}" class="${i === 0 ? 'active' : ''}">${esc(LANG_NAMES[l] || l)}${hasContent(l) ? '<span class="dot" title="Has content"></span>' : ''}${primary.includes(l) ? '' : ' <span class="muted">(extra)</span>'}</button>`,
    )
    .join('');
  const panes = languages.map((l, i) => `<div class="stack lang-pane" data-lang="${l}" ${i === 0 ? '' : 'hidden'}>${renderPane(l)}</div>`).join('');
  return `<div class="tabs">${tabs}</div>${panes}`;
}

function bindTabs(root) {
  $$('.tabs button', root).forEach((btn) =>
    btn.addEventListener('click', () => {
      $$('.tabs button', root).forEach((b) => b.classList.toggle('active', b === btn));
      $$('.lang-pane', root).forEach((p) => (p.hidden = p.dataset.lang !== btn.dataset.lang));
    }),
  );
}

function orderedLanguages() {
  return [...ME.primaryLanguages, ...ME.languages.filter((l) => !ME.primaryLanguages.includes(l))];
}

async function duaForm(id) {
  const [cats, dua] = await Promise.all([loadCategories(), id ? api('GET', `/duas/${encodeURIComponent(id)}`) : null]);
  const d = dua || { type: 'hadith', status: 'draft', priority: 3, frequency: 'daily', difficulty: 'beginner', estimated_time: '00:00:30', translations: {} };
  const tr = d.translations || {};
  const val = (k) => esc(d[k] ?? '');
  const opt = (list, current) => list.map((v) => `<option ${v === current ? 'selected' : ''}>${esc(v)}</option>`).join('');
  const list = (arr) => esc((arr || []).join('\n'));
  const field = (lang, name, label, rows = 3) => {
    const dir = RTL.has(lang) && name !== 'transliteration' ? 'rtl' : 'auto';
    const v = esc(tr[lang]?.[name] ?? '');
    return name === 'title'
      ? `<label>${label}<input name="tr.${lang}.${name}" dir="${dir}" value="${v}"></label>`
      : `<label>${label}<textarea name="tr.${lang}.${name}" rows="${rows}" dir="${dir}">${v}</textarea></label>`;
  };

  main().innerHTML = `
    <div class="page-head">
      <h1>${id ? `Edit dua <code>${esc(id)}</code>` : 'New dua'}</h1>
      <a class="btn ghost" href="#duas">← Back to list</a>
    </div>
    <form id="dua-form" class="stack">
      <fieldset><legend>Basics</legend>
        <div class="grid-4">
          <label>ID <span class="hint">Letters, numbers, - and _. The app stores favorites by this id.</span><input name="id" required value="${val('id')}"></label>
          <label>Category<select name="category_id"><option value="">— None —</option>${cats.map((c) => `<option value="${c.id}" ${c.id === d.category_id ? 'selected' : ''}>${esc(c.name.en || c.slug)}</option>`).join('')}</select></label>
          <label>Type<select name="type">${opt(ME.options.types, d.type)}</select></label>
          <label>Priority <span class="hint">1 = highest</span><input name="priority" type="number" min="1" max="5" value="${val('priority')}"></label>
        </div>
        <label>Arabic text<textarea name="arabic_text" class="arabic" dir="rtl" rows="4" required>${val('arabic_text')}</textarea></label>
      </fieldset>

      <fieldset><legend>Review &amp; publishing</legend>
        <div class="grid-3">
          <label>Status <span class="hint">Only "published" appears in the app.</span><select name="status">${opt(ME.options.statuses, d.status)}</select></label>
          <label>Reviewed by <span class="hint">Scholar who approved the content</span><input name="reviewed_by" value="${val('reviewed_by')}"></label>
          <label>Authenticity <span class="hint">e.g. Sahih, Hasan, Quran</span><input name="authenticity" value="${val('authenticity')}"></label>
        </div>
        ${d.reviewed_at ? `<p class="muted">Reviewed ${fmtDate(d.reviewed_at)}</p>` : ''}
      </fieldset>

      <fieldset><legend>Translations</legend>
        <p class="muted">English title is required. Empty languages fall back to English in the app.</p>
        <div id="dua-langs">${languageTabs(
          orderedLanguages(),
          ME.primaryLanguages,
          (l) => `${field(l, 'title', 'Title')}${field(l, 'transliteration', 'Transliteration')}${field(l, 'translation', 'Translation', 4)}${field(l, 'benefits', 'Benefits')}${field(l, 'explanation', 'Explanation')}`,
          (l) => Boolean(tr[l]?.title),
        )}</div>
      </fieldset>

      <fieldset><legend>Reference</legend>
        <label>Source <span class="hint">Shown to users, e.g. "Sahih Muslim 2723" or "Quran 2:255"</span><input name="source" value="${val('source')}"></label>
        <div class="grid-3">
          <label>Quran surah<input name="quran_surah" type="number" min="1" max="114" value="${val('quran_surah')}"></label>
          <label>Quran ayah<input name="quran_ayah" type="number" min="1" value="${val('quran_ayah')}"></label>
          <label>Quran juz<input name="quran_juz" type="number" min="1" max="30" value="${val('quran_juz')}"></label>
        </div>
        <div class="grid-3">
          <label>Hadith book<input name="hadith_book" value="${val('hadith_book')}"></label>
          <label>Hadith chapter<input name="hadith_chapter" value="${val('hadith_chapter')}"></label>
          <label>Hadith number<input name="hadith_number" value="${val('hadith_number')}"></label>
        </div>
      </fieldset>

      <fieldset><legend>Usage</legend>
        <div class="grid-3">
          <label>Frequency<select name="frequency">${opt(ME.options.frequencies, d.frequency)}</select></label>
          <label>Difficulty<select name="difficulty">${opt(ME.options.difficulties, d.difficulty)}</select></label>
          <label>Estimated time <span class="hint">hh:mm:ss</span><input name="estimated_time" value="${val('estimated_time')}"></label>
        </div>
        <div class="grid-3">
          <label>When to recite <span class="hint">One per line</span><textarea name="when_to_recite" rows="3">${list(d.when_to_recite)}</textarea></label>
          <label>Tags <span class="hint">One per line or comma-separated</span><textarea name="tags" rows="3">${list(d.tags)}</textarea></label>
          <label>Related dua IDs <span class="hint">One per line</span><textarea name="related_duas" rows="3">${list(d.related_duas)}</textarea></label>
        </div>
      </fieldset>

      <fieldset><legend>Audio</legend>
        <div class="grid-3">
          <label>Audio URL<input name="audio_url" type="url" value="${val('audio_url')}"></label>
          <label>Reciter<input name="reciter" value="${val('reciter')}"></label>
          <label>Duration <span class="hint">hh:mm:ss</span><input name="audio_duration" value="${val('audio_duration')}"></label>
        </div>
      </fieldset>

      <fieldset><legend>Internal notes</legend>
        <textarea name="notes" rows="2">${val('notes')}</textarea>
      </fieldset>

      <div class="form-actions">
        ${id ? '<button type="button" id="dua-delete" class="btn danger">Delete</button>' : ''}
        ${id ? `<a class="btn" href="/api/dua/${encodeURIComponent(id)}/" target="_blank" rel="noopener">View API JSON</a>` : ''}
        <button type="submit" class="btn primary">${id ? 'Save changes' : 'Create dua'}</button>
      </div>
    </form>`;

  const form = $('#dua-form');
  bindTabs($('#dua-langs'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const body = { translations: {} };
    for (const [key, value] of fd.entries()) {
      if (key.startsWith('tr.')) {
        const [, lang, name] = key.split('.');
        (body.translations[lang] ||= {})[name] = value;
      } else {
        body[key] = value;
      }
    }
    const btn = $('button[type=submit]', form);
    btn.disabled = true;
    try {
      const saved = id
        ? await api('PUT', `/duas/${encodeURIComponent(id)}`, body)
        : await api('POST', '/duas', body);
      toast('Saved');
      location.hash = `#duas/edit/${encodeURIComponent(saved.id)}`;
      if (saved.id === id) route();
    } catch (err) {
      toast(err.message, true);
    } finally {
      btn.disabled = false;
    }
  });

  $('#dua-delete')?.addEventListener('click', async () => {
    if (!confirm(`Delete dua "${id}"? This cannot be undone.`)) return;
    try {
      await api('DELETE', `/duas/${encodeURIComponent(id)}`);
      toast('Deleted');
      location.hash = '#duas';
    } catch (err) {
      toast(err.message, true);
    }
  });
}

// ---------- categories ----------
async function categories(action, id) {
  const cats = await loadCategories();
  const editing = action === 'edit' ? cats.find((c) => String(c.id) === id) : action === 'new' ? { name: {}, description: {}, sort_order: cats.length + 1 } : null;

  main().innerHTML = `
    <div class="page-head"><h1>Categories</h1>${editing ? '' : '<a class="btn primary" href="#categories/new">New category</a>'}</div>
    ${editing ? categoryForm(editing) : ''}
    <div class="table-wrap"><table><thead><tr><th>#</th><th>Name</th><th>Slug</th><th>Icon</th><th>Languages</th><th class="num">Duas</th></tr></thead><tbody>
    ${cats
      .map(
        (c) => `<tr class="clickable" data-href="#categories/edit/${c.id}">
        <td class="num">${c.sort_order}</td>
        <td><span class="swatch" style="background:${/^#[0-9a-f]{6}$/i.test(c.color) ? c.color : 'transparent'}"></span>${esc(c.name.en)}${c.name.bn ? `<div class="muted">${esc(c.name.bn)}</div>` : ''}</td>
        <td><code>${esc(c.slug)}</code></td><td>${esc(c.icon)}</td>
        <td>${langBadges(Object.keys(c.name).filter((l) => c.name[l]))}</td>
        <td class="num">${c.dua_count}</td></tr>`,
      )
      .join('')}
    </tbody></table></div>`;
  bindRowLinks();
  if (!editing) return;

  const form = $('#cat-form');
  bindTabs(form);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const body = { translations: {} };
    for (const [key, value] of fd.entries()) {
      if (key.startsWith('tr.')) {
        const [, lang, name] = key.split('.');
        (body.translations[lang] ||= {})[name] = value;
      } else body[key] = value;
    }
    try {
      editing.id ? await api('PUT', `/categories/${editing.id}`, body) : await api('POST', '/categories', body);
      toast('Saved');
      location.hash = '#categories';
    } catch (err) {
      toast(err.message, true);
    }
  });
  $('#cat-delete')?.addEventListener('click', async () => {
    if (!confirm(`Delete category "${editing.name.en}"? Its duas become uncategorized.`)) return;
    try {
      await api('DELETE', `/categories/${editing.id}`);
      toast('Deleted');
      location.hash = '#categories';
    } catch (err) {
      toast(err.message, true);
    }
  });
}

function categoryForm(c) {
  const v = (x) => esc(x ?? '');
  return `<form id="cat-form" class="card stack" style="margin-bottom:16px">
    <h2>${c.id ? `Edit “${esc(c.name.en)}”` : 'New category'}</h2>
    <div class="grid-4">
      <label>Slug <span class="hint">lowercase-with-dashes</span><input name="slug" required value="${v(c.slug)}"></label>
      <label>Icon <span class="hint">Ionicons name, e.g. sunny</span><input name="icon" value="${v(c.icon)}"></label>
      <label>Color<input name="color" placeholder="#4CAF50" value="${v(c.color)}"></label>
      <label>Sort order<input name="sort_order" type="number" value="${v(c.sort_order)}"></label>
    </div>
    ${languageTabs(
      orderedLanguages(),
      ME.primaryLanguages,
      (l) => `<div class="grid-2"><label>Name<input name="tr.${l}.name" dir="${RTL.has(l) ? 'rtl' : 'auto'}" value="${v(c.name?.[l])}"></label>
        <label>Description<input name="tr.${l}.description" dir="${RTL.has(l) ? 'rtl' : 'auto'}" value="${v(c.description?.[l])}"></label></div>`,
      (l) => Boolean(c.name?.[l]),
    )}
    <div class="form-actions">
      ${c.id ? '<button type="button" id="cat-delete" class="btn danger">Delete</button>' : ''}
      <a class="btn ghost" href="#categories">Cancel</a>
      <button class="btn primary" type="submit">Save</button>
    </div>
  </form>`;
}

// ---------- ads ----------
async function ads(action, id) {
  const rows = await api('GET', '/ads');
  const editing = action === 'edit' ? rows.find((a) => a.id === id) : action === 'new' ? { is_active: 1, priority: rows.length + 1, action_color: '#2c5530', text_color: '#495057', title_color: '#2c5530', icon_color: '#2c5530' } : null;
  main().innerHTML = `
    <div class="page-head"><h1>Ads</h1>${editing ? '' : '<a class="btn primary" href="#ads/new">New ad</a>'}</div>
    <p class="muted">Shown in the app's home carousel. Keep them away from worship content and never misleading.</p>
    ${editing ? adForm(editing) : ''}
    <div class="table-wrap"><table><thead><tr><th class="num">Priority</th><th>Title</th><th>Text</th><th>Link</th><th>Status</th></tr></thead><tbody>
    ${rows
      .map(
        (a) => `<tr class="clickable" data-href="#ads/edit/${encodeURIComponent(a.id)}">
        <td class="num">${a.priority}</td><td>${esc(a.title)}</td><td class="truncate">${esc(a.text)}</td>
        <td class="truncate"><code>${esc(a.link)}</code></td>
        <td><span class="badge ${a.is_active ? 'active' : 'inactive'}">${a.is_active ? 'active' : 'inactive'}</span></td></tr>`,
      )
      .join('') || '<tr><td colspan="5" class="empty">No ads</td></tr>'}
    </tbody></table></div>`;
  bindRowLinks();
  if (!editing) return;

  const form = $('#ad-form');
  const preview = () => {
    const fd = Object.fromEntries(new FormData(form).entries());
    const safe = (c) => (/^#[0-9a-f]{6}$/i.test(c) ? c : '#888888');
    $('#ad-preview').innerHTML = `<div class="preview-ad">
      <div class="icon" style="background:${safe(fd.icon_color)}">${esc((fd.icon_name || '?').slice(0, 1).toUpperCase())}</div>
      <div style="flex:1"><div style="font-weight:700;color:${safe(fd.title_color)}">${esc(fd.title)}</div>
      <div style="color:${safe(fd.text_color)}">${esc(fd.text)}</div></div>
      <span class="btn small" style="background:${safe(fd.action_color)};color:#fff;border-color:transparent">${esc(fd.action_text)}</span></div>`;
  };
  form.addEventListener('input', preview);
  preview();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(form).entries());
    body.is_active = form.elements.namedItem('is_active').checked;
    try {
      editing.id ? await api('PUT', `/ads/${encodeURIComponent(editing.id)}`, body) : await api('POST', '/ads', body);
      toast('Saved');
      location.hash = '#ads';
    } catch (err) {
      toast(err.message, true);
    }
  });
  $('#ad-delete')?.addEventListener('click', async () => {
    if (!confirm(`Delete ad "${editing.title}"?`)) return;
    try {
      await api('DELETE', `/ads/${encodeURIComponent(editing.id)}`);
      toast('Deleted');
      location.hash = '#ads';
    } catch (err) {
      toast(err.message, true);
    }
  });
}

function adForm(a) {
  const v = (k) => esc(a[k] ?? '');
  return `<form id="ad-form" class="card stack" style="margin-bottom:16px">
    <h2>${a.id ? `Edit “${esc(a.title)}”` : 'New ad'}</h2>
    <div class="grid-3">
      <label>ID<input name="id" required value="${v('id')}"></label>
      <label>Priority <span class="hint">Lower shows first</span><input name="priority" type="number" value="${v('priority')}"></label>
      <label class="check"><input name="is_active" type="checkbox" ${a.is_active ? 'checked' : ''}> Active</label>
    </div>
    <div class="grid-2">
      <label>Title<input name="title" required value="${v('title')}"></label>
      <label>Button text<input name="action_text" required value="${v('action_text')}"></label>
    </div>
    <label>Text<input name="text" required value="${v('text')}"></label>
    <div class="grid-2">
      <label>Link<input name="link" type="url" required value="${v('link')}"></label>
      <label>Icon <span class="hint">Ionicons name</span><input name="icon_name" required value="${v('icon_name')}"></label>
    </div>
    <div class="grid-4">
      <label>Title color<input name="title_color" value="${v('title_color')}"></label>
      <label>Text color<input name="text_color" value="${v('text_color')}"></label>
      <label>Button color<input name="action_color" value="${v('action_color')}"></label>
      <label>Icon color<input name="icon_color" value="${v('icon_color')}"></label>
    </div>
    <div><div class="muted" style="margin-bottom:6px">Preview</div><div id="ad-preview"></div></div>
    <div class="form-actions">
      ${a.id ? '<button type="button" id="ad-delete" class="btn danger">Delete</button>' : ''}
      <a class="btn ghost" href="#ads">Cancel</a>
      <button class="btn primary" type="submit">Save</button>
    </div>
  </form>`;
}

// ---------- users & devices ----------
async function users() {
  const rows = await api('GET', '/users');
  main().innerHTML = `
    <div class="page-head"><h1>Users</h1><span class="muted">${rows.length} account(s) · sign-up is optional in the app</span></div>
    ${
      rows.length
        ? `<div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th class="num">Age</th><th>Gender</th><th class="num">Favorites</th><th>Joined</th><th>Last seen</th><th></th></tr></thead><tbody>
      ${rows
        .map(
          (u) => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.phone || '—')}</td><td class="num">${esc(u.age ?? '—')}</td>
          <td>${esc(u.gender || '—')}</td><td class="num">${u.favorites}</td><td class="muted">${fmtDate(u.created_at)}</td><td class="muted">${fmtDate(u.last_seen)}</td>
          <td><button class="btn danger small" data-del="${u.id}" data-email="${esc(u.email)}">Delete</button></td></tr>`,
        )
        .join('')}</tbody></table></div>`
        : '<div class="card empty">No users yet.</div>'
    }`;
  $$('button[data-del]').forEach((b) =>
    b.addEventListener('click', async () => {
      if (!confirm(`Permanently delete ${b.dataset.email} and their synced data?`)) return;
      try {
        await api('DELETE', `/users/${b.dataset.del}`);
        toast('User deleted');
        route();
      } catch (err) {
        toast(err.message, true);
      }
    }),
  );
}

async function devices() {
  const rows = await api('GET', '/devices');
  main().innerHTML = `
    <div class="page-head"><h1>Devices</h1><span class="muted">${rows.length} registered for push</span></div>
    ${
      rows.length
        ? `<div class="table-wrap"><table><thead><tr><th>Token</th><th>Platform</th><th>App version</th><th>Locale</th><th>User</th><th>Registered</th><th>Last update</th></tr></thead><tbody>
      ${rows
        .map(
          (d) => `<tr><td><code>${esc(d.token_preview)}</code></td><td>${esc(d.platform)}</td><td>${esc(d.app_version || '—')}</td>
          <td>${esc(d.locale || '—')}</td><td>${esc(d.user_email || 'guest')}</td><td class="muted">${fmtDate(d.created_at)}</td><td class="muted">${fmtDate(d.updated_at)}</td></tr>`,
        )
        .join('')}</tbody></table></div>`
        : '<div class="card empty">No devices yet. The app registers one after it gets a push token.</div>'
    }`;
}

// ---------- API tester ----------
const SAMPLE_PASSWORD = 'test-pass-123';
const ENDPOINTS = [
  { group: 'Content', method: 'GET', path: '/api/' },
  { group: 'Content', method: 'GET', path: '/api/getalldua/' },
  { group: 'Content', method: 'GET', path: '/api/getallcategory/' },
  { group: 'Content', method: 'GET', path: '/api/getallads' },
  { group: 'Content', method: 'GET', path: '/api/dua/q1/' },
  { group: 'Content', method: 'GET', path: '/api/category/morning/' },
  { group: 'Content', method: 'GET', path: '/api/search/?q=morning' },
  { group: 'Content', method: 'GET', path: '/api/popular/?limit=5' },
  { group: 'Content', method: 'GET', path: '/api/type/quranic/' },
  { group: 'Content', method: 'GET', path: '/api/difficulty/beginner/' },
  { group: 'Content', method: 'POST', path: '/api/favorite/q1/' },
  { group: 'Content', method: 'GET', path: '/api/info/' },
  { group: 'Auth', method: 'POST', path: '/api/auth/signup/', body: () => ({ name: 'Test User', email: `test_${Date.now()}@example.com`, password: SAMPLE_PASSWORD, password_confirm: SAMPLE_PASSWORD, age: 25, gender: 'M' }) },
  { group: 'Auth', method: 'POST', path: '/api/auth/login/', body: () => ({ email: store.get('testerEmail') || 'test@example.com', password: SAMPLE_PASSWORD }) },
  { group: 'Auth', method: 'GET', path: '/api/auth/profile/', auth: true },
  { group: 'Auth', method: 'PATCH', path: '/api/auth/profile/', auth: true, body: () => ({ name: 'Renamed User', phone: '+8801700000000' }) },
  { group: 'Auth', method: 'GET', path: '/api/auth/me/', auth: true },
  { group: 'Auth', method: 'POST', path: '/api/auth/change-password/', auth: true, body: () => ({ old_password: SAMPLE_PASSWORD, new_password: SAMPLE_PASSWORD, new_password_confirm: SAMPLE_PASSWORD }) },
  { group: 'Auth', method: 'POST', path: '/api/auth/logout/', auth: true, body: () => ({}) },
  { group: 'Auth', method: 'DELETE', path: '/api/auth/account/', auth: true, body: () => ({ password: SAMPLE_PASSWORD }) },
  { group: 'User data', method: 'POST', path: '/api/device/register/', body: () => ({ device_token: `tester-${Date.now()}`, platform: 'android', app_version: '1.0.0', package: 'com.zerodevs.duazikr', locale: 'bn-BD' }) },
  { group: 'User data', method: 'GET', path: '/api/favorites/', auth: true },
  { group: 'User data', method: 'PUT', path: '/api/favorites/', auth: true, body: () => ({ dua_ids: ['q1', 'h1'] }) },
  { group: 'User data', method: 'POST', path: '/api/favorites/q2/', auth: true },
  { group: 'User data', method: 'DELETE', path: '/api/favorites/q2/', auth: true },
];

function tester() {
  const groups = [...new Set(ENDPOINTS.map((e) => e.group))];
  main().innerHTML = `
    <div class="page-head"><h1>API tester</h1>
      <button id="run-all" class="btn">Run all GET content endpoints</button></div>
    <p class="muted">Calls the public API exactly like the app does. Sign up or log in here and the token is filled in automatically
    (sent as <code>Authorization: Token …</code>).</p>
    <div class="grid-2 tester-grid">
      <div class="card endpoint-list">
        ${groups
          .map(
            (g) => `<h3 style="margin:8px 0 4px">${esc(g)}</h3>${ENDPOINTS.map((e, i) => (e.group === g ? `<div class="endpoint" data-i="${i}"><span class="method ${e.method}">${e.method}</span><span class="path">${esc(e.path)}</span>${e.auth ? ' <span class="badge">token</span>' : ''}</div>` : '')).join('')}`,
          )
          .join('')}
      </div>
      <div class="card stack">
        <div class="request-line">
          <select id="t-method">${['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => `<option>${m}</option>`).join('')}</select>
          <input id="t-path" value="/api/getalldua/">
          <button id="t-send" class="btn primary">Send</button>
        </div>
        <label>Token <span class="hint">Filled after signup/login. Clear it to call as a guest.</span><input id="t-token" value="${esc(store.get('testerToken') || '')}"></label>
        <label>JSON body<textarea id="t-body" rows="6" style="font-family:var(--mono)"></textarea></label>
        <div class="status-line" id="t-status"></div>
        <pre class="response" id="t-response">Pick an endpoint on the left, then Send.</pre>
      </div>
    </div>`;

  $$('.endpoint').forEach((el) =>
    el.addEventListener('click', () => {
      const e = ENDPOINTS[Number(el.dataset.i)];
      $$('.endpoint').forEach((x) => x.classList.toggle('active', x === el));
      $('#t-method').value = e.method;
      $('#t-path').value = e.path;
      $('#t-body').value = e.body ? JSON.stringify(e.body(), null, 2) : '';
    }),
  );
  $('#t-token').addEventListener('change', (e) => store.set('testerToken', e.target.value.trim()));
  $('#t-send').addEventListener('click', sendRequest);
  $('#t-path').addEventListener('keydown', (e) => e.key === 'Enter' && sendRequest());
  $('#run-all').addEventListener('click', runAllGets);
}

async function sendRequest() {
  const method = $('#t-method').value;
  const path = $('#t-path').value.trim();
  const token = $('#t-token').value.trim();
  const rawBody = $('#t-body').value.trim();
  let body;
  if (rawBody && method !== 'GET') {
    try {
      body = JSON.stringify(JSON.parse(rawBody));
    } catch {
      toast('Body is not valid JSON', true);
      return;
    }
  }
  if (!path.startsWith('/')) {
    toast('Path must start with /', true);
    return;
  }
  $('#t-status').textContent = 'Sending…';
  const started = performance.now();
  try {
    const res = await fetch(path, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Token ${token}` } : {}) },
      body,
    });
    const ms = Math.round(performance.now() - started);
    const text = await res.text();
    let pretty = text;
    let json = null;
    try {
      json = JSON.parse(text);
      pretty = JSON.stringify(json, null, 2);
    } catch { /* not JSON */ }
    $('#t-status').innerHTML = `<span class="${res.ok ? 'status-ok' : 'status-err'}">${res.status} ${esc(res.statusText)}</span><span>${ms} ms</span><span>${(text.length / 1024).toFixed(1)} KB</span>`;
    $('#t-response').textContent = pretty.length > 200000 ? `${pretty.slice(0, 200000)}\n… (truncated)` : pretty;
    if (json?.token) {
      $('#t-token').value = json.token;
      store.set('testerToken', json.token);
      if (json.user?.email) store.set('testerEmail', json.user.email);
      toast('Token saved for authenticated calls');
    }
    if (res.ok && /\/auth\/(logout|account)/.test(path)) {
      $('#t-token').value = '';
      store.set('testerToken', '');
    }
  } catch (err) {
    $('#t-status').innerHTML = `<span class="status-err">${esc(err.message)}</span>`;
  }
}

async function runAllGets() {
  const list = ENDPOINTS.filter((e) => e.method === 'GET' && !e.auth);
  $('#t-status').textContent = `Running ${list.length} requests…`;
  const lines = [];
  for (const e of list) {
    const started = performance.now();
    try {
      const res = await fetch(e.path);
      lines.push(`${res.ok ? '✓' : '✗'} ${res.status}  ${String(Math.round(performance.now() - started)).padStart(4)} ms  ${e.path}`);
    } catch (err) {
      lines.push(`✗ ERR  ${e.path}  ${err.message}`);
    }
  }
  const failed = lines.filter((l) => l.startsWith('✗')).length;
  $('#t-status').innerHTML = failed ? `<span class="status-err">${failed} failed</span>` : '<span class="status-ok">All passed</span>';
  $('#t-response').textContent = lines.join('\n');
}

boot();
