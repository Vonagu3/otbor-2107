/* Панель педагога: вход через Supabase Auth, коды участников, ответы, автопроверка, экспорт. */
(function () {
  const CFG = window.OTBOR_CONFIG || {};
  const URL0 = (CFG.supabaseUrl || '').replace(/\/+$/, '');
  const ANON = CFG.supabaseAnonKey || '';
  const TABLE = CFG.table || 'answers';
  const ORDER = {"опросник": ["code", "klass", "exp_scratch", "exp_scratch_time", "exp_scratch_what", "exp_python", "exp_python_time", "exp_python_what", "exp_kotlin", "exp_kotlin_time", "exp_kotlin_what", "exp_other_name", "exp_other", "exp_other_time", "exp_other_what", "exp_tables", "exp_tables_time", "exp_tables_what", "exp_ai_user", "exp_ai_user_time", "exp_ai_user_what", "exp_ai_dev", "exp_ai_dev_time", "exp_ai_dev_what", "exp_arduino", "exp_arduino_time", "exp_arduino_what", "exp_design", "exp_design_time", "exp_design_what", "circles", "link", "self_code", "self_data", "self_speak", "self_design", "self_finish", "self_search", "rank_business", "rank_ai", "rank_data", "rank_research", "role_ideas", "role_maker", "role_coord", "role_research", "role_design", "role_speaker", "proud", "problem", "why", "stuck", "finish", "important", "hours", "trips", "other_activities", "pc_home"], "срез": ["code", "klass", "A1a", "A1b", "A2a", "A2b", "A3a", "A3b", "A4a", "A4a_rule", "A4b", "A5a", "A5b", "A6a1", "A6a2", "A6b", "B1", "B2", "B3a", "B3b_prints", "B3b_fix", "C1", "C2a_client", "C2a_sum", "C2b", "C2c", "C3a", "C3b1", "C3b2", "C3c", "D1", "D2", "E", "F"]};
  const LABELS = {"code": "Код участника", "klass": "Класс", "exp_scratch": "Опыт: Scratch", "exp_scratch_time": "Scratch: сколько", "exp_scratch_what": "Scratch: что делал", "exp_python": "Опыт: Python", "exp_python_time": "Python: сколько", "exp_python_what": "Python: что делал", "exp_kotlin": "Опыт: Kotlin", "exp_kotlin_time": "Kotlin: сколько", "exp_kotlin_what": "Kotlin: что делал", "exp_other_name": "Другой язык: какой", "exp_other": "Опыт: другой язык", "exp_other_time": "Другой язык: сколько", "exp_other_what": "Другой язык: что делал", "exp_tables": "Опыт: таблицы", "exp_tables_time": "Таблицы: сколько", "exp_tables_what": "Таблицы: что делал", "exp_ai_user": "Опыт: нейросети как пользователь", "exp_ai_user_time": "Нейросети-пользователь: сколько", "exp_ai_user_what": "Нейросети-пользователь: что делал", "exp_ai_dev": "Опыт: обучал модель / pandas", "exp_ai_dev_time": "Модели/pandas: сколько", "exp_ai_dev_what": "Модели/pandas: что делал", "exp_arduino": "Опыт: Arduino/роботы", "exp_arduino_time": "Arduino: сколько", "exp_arduino_what": "Arduino: что делал", "exp_design": "Опыт: сайты/дизайн", "exp_design_time": "Дизайн: сколько", "exp_design_what": "Дизайн: что делал", "circles": "Кружки, курсы, олимпиады", "link": "Ссылка на работы", "self_code": "Самооценка: код", "self_data": "Самооценка: данные", "self_speak": "Самооценка: выступаю", "self_design": "Самооценка: красиво", "self_finish": "Самооценка: довожу до конца", "self_search": "Самооценка: ищу сам", "rank_business": "Место: приложения для бизнеса", "rank_ai": "Место: ИИ", "rank_data": "Место: анализ данных", "rank_research": "Место: проекты-исследования", "role_ideas": "Роль: генератор идей", "role_maker": "Роль: реализатор", "role_coord": "Роль: координатор", "role_research": "Роль: исследователь", "role_design": "Роль: оформитель", "role_speaker": "Роль: докладчик", "proud": "Проект, которым горжусь", "problem": "Какую проблему хочу решить", "why": "Зачем команда, цель на год", "stuck": "Если не получается", "finish": "Доделываю до конца", "important": "Важнее в команде", "hours": "Часов в неделю", "trips": "Готов к выездам", "other_activities": "Другие кружки и секции", "pc_home": "Компьютер дома", "A1a": "A1а", "A1b": "A1б", "A2a": "A2а: программа", "A2b": "A2б: другая программа?", "A3a": "A3а", "A3b": "A3б", "A4a": "A4а: число", "A4a_rule": "A4а: правило", "A4b": "A4б", "A5a": "A5а", "A5b": "A5б", "A6a1": "A6а: способ 1", "A6a2": "A6а: способ 2", "A6b": "A6б", "B1": "B1", "B2": "B2", "B3a": "B3а", "B3b_prints": "B3б: печатает", "B3b_fix": "B3б: исправление", "C1": "C1", "C2a_client": "C2а: клиент", "C2a_sum": "C2а: сумма", "C2b": "C2б", "C2c": "C2в", "C3a": "C3а: правило", "C3b1": "C3б: сообщение 1", "C3b2": "C3б: сообщение 2", "C3c": "C3в", "D1": "D1", "D2": "D2", "E": "E", "F": "F"};
  const $ = id => document.getElementById(id);

  // ---------- сессия (только в пределах вкладки) ----------
  const SKEY = 'otbor2107_teacher_session';
  let session = null;
  try { session = JSON.parse(sessionStorage.getItem(SKEY) || 'null'); localStorage.removeItem(SKEY); } catch (e) {}
  function setSession(s) { session = s; try { s ? sessionStorage.setItem(SKEY, JSON.stringify(s)) : sessionStorage.removeItem(SKEY); } catch (e) {} }
  async function auth(path, body) {
    const r = await fetch(URL0 + '/auth/v1/' + path, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error_description || j.msg || j.message || ('HTTP ' + r.status));
    return j;
  }
  async function login(email, password) {
    const j = await auth('token?grant_type=password', { email, password });
    setSession({ access_token: j.access_token, refresh_token: j.refresh_token, exp: Date.now() + (j.expires_in - 60) * 1000, email: j.user && j.user.email });
  }
  async function ensureToken() {
    if (!session) throw new Error('no session');
    if (Date.now() < session.exp) return session.access_token;
    const j = await auth('token?grant_type=refresh_token', { refresh_token: session.refresh_token });
    setSession({ access_token: j.access_token, refresh_token: j.refresh_token, exp: Date.now() + (j.expires_in - 60) * 1000, email: session.email });
    return session.access_token;
  }
  async function rest(path, opt = {}) {
    const token = await ensureToken();
    const r = await fetch(URL0 + '/rest/v1/' + path, Object.assign({}, opt, { headers: Object.assign({ apikey: ANON, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, opt.headers || {}) }));
    if (r.status === 401) { setSession(null); showLogin('Сессия истекла, войдите снова.'); throw new Error('401'); }
    if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + (await r.text()).slice(0, 200));
    return r;
  }

  // ---------- автопроверка (та же логика, что в собрать_ответы.py) ----------
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase().replace(/ё/g, 'е');
  const num = s => { const m = String(s || '').match(/-?\d+(?:[.,]\d+)?/); return m ? parseFloat(m[0].replace(',', '.')) : null; };
  const words = s => norm(s).match(/[а-я]+/g) || [];
  function check(d) {
    const r = [];
    const eq = (k, ok) => r.push([k, !!ok]);
    eq('A1а=18', num(d.A1a) === 18);
    eq('A1б=33', num(d.A1b) === 33);
    eq('A2а=ППВВП', norm(d.A2a).replace(/[^а-я]/g, '') === 'ппввп');
    eq('A2б=нет', norm(d.A2b).startsWith('нет') || norm(d.A2b).includes('единствен'));
    eq('A3а=больше', norm(d.A3a).includes('больш'));
    const a3b = norm(d.A3b); eq('A3б=≤10', ['<=', '≤', '11', '10 не', 'не напечатает 10', 'до 9'].some(k => a3b.includes(k)));
    eq('A4а=33', num(d.A4a) === 33);
    eq('A4б=ПРИВЕТ', norm(d.A4b) === 'привет');
    eq('A5а порядок', words(d.A5a).join(',') === 'петрова,яшина,абрамов,иванов,ким');
    const a5b = new Set(words(d.A5b)); eq('A5б={Абрамов,Иванов,Ким}', a5b.size === 3 && a5b.has('абрамов') && a5b.has('иванов') && a5b.has('ким'));
    eq('A6а1=1000', num(d.A6a1) === 1000);
    const n2 = num(d.A6a2); eq('A6а2≈10', n2 !== null && n2 >= 7 && n2 <= 12);
    eq('B3а=8 2', String(d.B3a || '').replace(/\D/g, '') === '82');
    eq('B3б печатает 4', num(d.B3b_prints) === 4);
    eq('B3б +=', String(d.B3b_fix || '').includes('+=') || norm(d.B3b_fix).includes('total + i'));
    eq('C2а=Ким', norm(d.C2a_client).includes('ким'));
    eq('C2а=3850', num(d.C2a_sum) === 3850);
    eq('C2б содержит 6', (String(d.C2b || '').match(/\d+/g) || []).includes('6'));
    const c2c = String(d.C2c || ''); eq('C2в 10 и 11', c2c.includes('10') && c2c.includes('11'));
    eq('C3б1=спам', norm(d.C3b1) === 'спам');
    eq('C3б2=не спам', norm(d.C3b2) === 'не спам');
    return r;
  }

  // ---------- фамилии: только в браузере педагога ----------
  let names = {};
  try { names = JSON.parse(sessionStorage.getItem('otbor2107_names') || '{}'); } catch (e) {}
  const nameOf = code => names[String(code || '').toUpperCase()] || '';
  function parseNames(text) {
    const lines = text.replace(/^\ufeff/, '').split(/\r?\n/).filter(l => l.trim());
    const delim = (text.match(/;/g) || []).length >= (text.match(/,/g) || []).length ? ';' : ',';
    const out = {};
    for (const line of lines.slice(1)) {
      const cells = []; let cur = '', inq = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { if (inq && line[i + 1] === '"') { cur += '"'; i++; } else inq = !inq; }
        else if (ch === delim && !inq) { cells.push(cur); cur = ''; }
        else cur += ch;
      }
      cells.push(cur);
      const code = (cells[0] || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      const name = (cells[2] || '').trim();
      if (code && name) out[code] = name;
    }
    return out;
  }
  $('names-btn').addEventListener('click', () => $('names-file').click());
  $('names-file').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    names = parseNames(await f.text());
    try { sessionStorage.setItem('otbor2107_names', JSON.stringify(names)); } catch (er) {}
    $('names-btn').textContent = 'Фамилии: ' + Object.keys(names).length;
    e.target.value = '';
    render(); showDetail();
  });
  if (Object.keys(names).length) $('names-btn').textContent = 'Фамилии: ' + Object.keys(names).length;

  // ---------- данные ----------
  let rows = [], codes = [];
  let tab = 'срез';
  let showAll = false;
  let selectedId = null;
  const fmt = t => { const d = new Date(t); return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }); };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  async function load() {
    $('refresh').disabled = true;
    try {
      const [ra, rc] = await Promise.all([rest(TABLE + '?select=*&order=created_at.desc&limit=5000'), rest('codes?select=*&order=created_at.asc,code.asc&limit=5000')]);
      rows = await ra.json(); codes = await rc.json();
      rows.forEach(x => { x.ts = x.updated_at || x.created_at; });
      $('status').textContent = 'Обновлено ' + new Date().toLocaleTimeString('ru-RU');
      render();
    } catch (e) { if (e.message !== '401') $('status').textContent = 'Ошибка загрузки: ' + e.message; }
    finally { $('refresh').disabled = false; }
  }
  function visible() {
    let list = rows.filter(r => r.form === tab);
    if (!showAll) { const seen = new Set(); list = list.filter(r => { if (seen.has(r.code)) return false; seen.add(r.code); return true; }); }
    const q = norm($('search').value);
    if (q) list = list.filter(r => norm(r.code + ' ' + r.klass + ' ' + nameOf(r.code)).includes(q));
    return list;
  }
  function render() {
    const qSet = new Set(rows.filter(r => r.form === 'опросник').map(r => r.code));
    const sSet = new Set(rows.filter(r => r.form === 'срез').map(r => r.code));
    $('stat-codes').textContent = codes.length;
    $('stat-q').textContent = qSet.size;
    $('stat-s').textContent = sSet.size;
    $('stat-both').textContent = [...qSet].filter(k => sSet.has(k)).length;
    ['срез', 'опросник', 'коды'].forEach(t => $('tab-' + t).classList.toggle('active', tab === t));
    $('answers-view').hidden = tab === 'коды';
    $('codes-view').hidden = tab !== 'коды';
    if (tab === 'коды') { renderCodes(qSet, sSet); return; }
    const list = visible();
    const head = tab === 'срез'
      ? '<th>Код</th><th>Ученик</th><th>Класс</th><th>Отправлено</th><th class="c">Авто ✓ из 21</th><th class="c">Заполнено</th><th></th>'
      : '<th>Код</th><th>Ученик</th><th>Класс</th><th>Отправлено</th><th class="c">Часов</th><th class="c">Выезды</th><th class="c">Код</th><th class="c">Данные</th><th class="c">Выступаю</th><th>Роли</th><th>№1</th><th></th>';
    let html = '<tr>' + head + '</tr>';
    for (const r of list) {
      const d = r.data || {};
      const filled = Object.keys(d).filter(k => k !== 'code' && k !== 'klass' && d[k] !== '').length;
      const total = ORDER[tab].length - 2;
      let cells;
      if (tab === 'срез') {
        const ok = check(d).filter(x => x[1]).length;
        const cls = ok >= 15 ? 'good' : ok >= 9 ? 'mid' : '';
        cells = `<td class="c"><span class="score ${cls}">${ok}</span></td><td class="c">${filled}/${total}</td>`;
      } else {
        const roles = ['ideas:идеи', 'maker:реализатор', 'coord:координатор', 'research:исследователь', 'design:оформитель', 'speaker:докладчик'].filter(x => d['role_' + x.split(':')[0]] === 'да').map(x => x.split(':')[1]).join(', ');
        const first = ['rank_business:бизнес', 'rank_ai:ИИ', 'rank_data:данные', 'rank_research:исследования'].filter(x => d[x.split(':')[0]] === '1').map(x => x.split(':')[1]).join('/');
        cells = `<td class="c">${esc(d.hours)}</td><td class="c">${esc(d.trips)}</td><td class="c">${esc(d.self_code)}</td><td class="c">${esc(d.self_data)}</td><td class="c">${esc(d.self_speak)}</td><td>${esc(roles)}</td><td>${esc(first)}</td>`;
      }
      const times = fmt(r.ts) + ((r.submissions || 1) > 1 ? ' <span class="muted">×' + r.submissions + '</span>' : '');
      html += `<tr data-id="${r.id}" class="${r.id === selectedId ? 'sel' : ''}"><td><b class="mono">${esc(r.code)}</b></td><td>${esc(nameOf(r.code)) || '<span class="muted">—</span>'}</td><td>${esc(r.klass)}</td><td class="muted">${times}</td>${cells}<td><button class="mini" data-del="${r.id}" title="Удалить запись">✕</button></td></tr>`;
    }
    if (!list.length) html += '<tr><td colspan="12" class="muted">Пока нет ответов</td></tr>';
    $('grid').innerHTML = html;
    $('grid').querySelectorAll('tr[data-id]').forEach(tr => tr.addEventListener('click', e => { if (e.target.dataset.del) return; selectedId = +tr.dataset.id; render(); showDetail(); }));
    $('grid').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async e => {
      e.stopPropagation();
      const r = rows.find(x => x.id === +b.dataset.del);
      if (!confirm(`Удалить запись ${r.code} (${r.form}, ${fmt(r.ts)})? Это нельзя отменить.`)) return;
      try { await rest(TABLE + '?id=eq.' + r.id, { method: 'DELETE' }); rows = rows.filter(x => x.id !== r.id); if (selectedId === r.id) selectedId = null; render(); showDetail(); }
      catch (err) { alert('Не удалось удалить: ' + err.message); }
    }));
  }
  function showDetail() {
    const r = rows.find(x => x.id === selectedId);
    const box = $('detail');
    if (!r) { box.hidden = true; return; }
    box.hidden = false;
    const d = r.data || {};
    let h = `<div class="dhead"><div><b class="mono">${esc(r.code)}</b>${nameOf(r.code) ? ' · <b>' + esc(nameOf(r.code)) + '</b>' : ''} · ${esc(r.klass)} · ${esc(r.form)} · ${fmt(r.ts)}</div><button class="mini" id="close-detail">Закрыть</button></div>`;
    if (r.form === 'срез') h += '<div class="checks">' + check(d).map(([k, ok]) => `<span class="${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'} ${esc(k)}</span>`).join('') + '</div>';
    h += '<dl>';
    for (const k of ORDER[r.form]) {
      if (k === 'code' || k === 'klass') continue;
      const v = d[k];
      h += `<dt>${esc(LABELS[k] || k)}</dt><dd>${v ? esc(v) : '<span class="muted">—</span>'}</dd>`;
    }
    h += '</dl>';
    box.innerHTML = h;
    $('close-detail').addEventListener('click', () => { selectedId = null; render(); showDetail(); });
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------- коды участников ----------
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без 0/O, 1/I
  function makeCode() { const a = new Uint32Array(5); crypto.getRandomValues(a); return [...a].map(x => ALPHABET[x % ALPHABET.length]).join(''); }
  function renderCodes(qSet, sSet) {
    const q = norm($('search').value);
    const list = codes.filter(c => !q || norm(c.code + ' ' + (c.klass || '') + ' ' + nameOf(c.code)).includes(q));
    let html = '<tr><th>Код</th><th>Ученик</th><th>Класс</th><th class="c">Опросник</th><th class="c">Срез</th><th>Создан</th><th></th></tr>';
    for (const c of list) {
      html += `<tr><td><b class="mono">${esc(c.code)}</b></td><td>${esc(nameOf(c.code)) || '<span class="muted">—</span>'}</td><td>${esc(c.klass || '')}</td><td class="c">${qSet.has(c.code) ? '✓' : '<span class="muted">—</span>'}</td><td class="c">${sSet.has(c.code) ? '✓' : '<span class="muted">—</span>'}</td><td class="muted">${fmt(c.created_at)}</td><td><button class="mini" data-delcode="${esc(c.code)}" title="Удалить код">✕</button></td></tr>`;
    }
    if (!list.length) html += '<tr><td colspan="7" class="muted">Кодов пока нет. Сгенерируйте их выше.</td></tr>';
    $('codes-grid').innerHTML = html;
    $('codes-grid').querySelectorAll('[data-delcode]').forEach(b => b.addEventListener('click', async () => {
      const code = b.dataset.delcode;
      if (!confirm(`Удалить код ${code}? Ответы с этим кодом останутся, но новые отправки с ним не примутся.`)) return;
      try { await rest('codes?code=eq.' + encodeURIComponent(code), { method: 'DELETE' }); codes = codes.filter(c => c.code !== code); render(); }
      catch (err) { alert('Не удалось удалить: ' + err.message); }
    }));
  }
  $('gen-btn').addEventListener('click', async () => {
    const n = Math.max(1, Math.min(200, parseInt($('gen-count').value, 10) || 0));
    const klass = $('gen-klass').value.trim();
    const existing = new Set(codes.map(c => c.code));
    const fresh = [];
    while (fresh.length < n) { const c = makeCode(); if (!existing.has(c)) { existing.add(c); fresh.push({ code: c, klass: klass || null }); } }
    $('gen-msg').textContent = 'Сохраняем…';
    try {
      await rest('codes', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(fresh) });
      $('gen-msg').textContent = 'Создано кодов: ' + n + (klass ? ' для класса ' + klass : '') + '.';
      await load();
    } catch (err) { $('gen-msg').textContent = 'Ошибка: ' + err.message; }
  });
  async function deleteCodes(list, what) {
    if (!list.length) { alert('Нечего удалять: ' + what + ' нет.'); return; }
    if (!confirm(`Удалить ${what}: ${list.length} шт.? Ответы, отправленные с этими кодами, останутся в базе, но новые отправки с ними приниматься не будут.`)) return;
    try {
      for (let i = 0; i < list.length; i += 100) {
        const chunk = list.slice(i, i + 100).map(c => encodeURIComponent(c)).join(',');
        await rest('codes?code=in.(' + chunk + ')', { method: 'DELETE' });
      }
      await load();
    } catch (err) { alert('Не удалось удалить: ' + err.message); }
  }
  $('codes-del-all').addEventListener('click', () => deleteCodes(codes.map(c => c.code), 'все коды'));
  $('codes-del-unused').addEventListener('click', () => {
    const used = new Set(rows.map(r => r.code));
    deleteCodes(codes.filter(c => !used.has(c.code)).map(c => c.code), 'неиспользованные коды');
  });
  $('codes-csv').addEventListener('click', () => {
    const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const lines = [['код', 'класс', 'фамилия имя'].map(q).join(';')].concat(codes.map(c => [c.code, c.klass || '', nameOf(c.code)].map(q).join(';')));
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'коды_имена.csv'; document.body.appendChild(a); a.click(); a.remove();
  });
  $('codes-print').addEventListener('click', () => {
    const q = norm($('search').value);
    const list = codes.filter(c => !q || norm(c.code + ' ' + (c.klass || '')).includes(q));
    const w = window.open('', '_blank');
    const slip = c => `<div class="slip"><div class="l">Код участника${c.klass ? ' · ' + esc(c.klass) : ''}</div><div class="c">${esc(c.code)}</div></div>`;
    w.document.write(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Коды участников</title><style>
      body{font-family:-apple-system,Segoe UI,Arial,sans-serif;margin:10mm}
      .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6mm}
      .slip{border:1px dashed #888;border-radius:4mm;padding:5mm;text-align:center;page-break-inside:avoid}
      .l{font-size:10pt;color:#555}.c{font:bold 22pt Menlo,Consolas,monospace;letter-spacing:.15em;margin:2mm 0}.s{font-size:9pt;color:#555}
      @media print{body{margin:6mm}}</style></head><body><div class="grid">${list.map(slip).join('')}</div><script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  });

  // ---------- экспорт ответов ----------
  function csv(kind) {
    const list = rows.filter(r => r.form === kind);
    const seen = new Set(); const latest = [];
    for (const r of list) { if (seen.has(r.code)) continue; seen.add(r.code); latest.push(r); }
    const cols = ['code', 'фамилия', 'klass', '_отправлено', ...ORDER[kind].filter(k => k !== 'code' && k !== 'klass')];
    const extra = kind === 'срез' ? check({}).map(x => 'авто: ' + x[0]).concat(['авто: верных из 21']) : [];
    const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const lines = [cols.concat(extra).map(q).join(';')];
    for (const r of latest) {
      const d = Object.assign({}, r.data, { code: r.code, фамилия: nameOf(r.code), klass: r.klass, _отправлено: fmt(r.ts) });
      const vals = cols.map(c => d[c]);
      if (kind === 'срез') { const ch = check(r.data || {}); vals.push(...ch.map(x => x[1] ? '✓' : '✗'), ch.filter(x => x[1]).length); }
      lines.push(vals.map(q).join(';'));
    }
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'сводка_' + kind + '.csv'; document.body.appendChild(a); a.click(); a.remove();
  }

  // ---------- UI ----------
  function showLogin(msg) { $('login').hidden = false; $('app').hidden = true; $('login-msg').textContent = msg || ''; }
  function showApp() { $('login').hidden = true; $('app').hidden = false; $('who').textContent = session.email || ''; load(); }
  $('login-form').addEventListener('submit', async e => {
    e.preventDefault(); $('login-msg').textContent = 'Входим…';
    try { await login($('email').value.trim(), $('password').value); showApp(); }
    catch (err) { $('login-msg').textContent = 'Не удалось войти: ' + err.message; }
  });
  $('logout').addEventListener('click', () => { setSession(null); showLogin(); });
  $('refresh').addEventListener('click', load);
  $('search').addEventListener('input', render);
  $('showall').addEventListener('change', e => { showAll = e.target.checked; render(); });
  ['срез', 'опросник', 'коды'].forEach(t => $('tab-' + t).addEventListener('click', () => { tab = t; selectedId = null; render(); showDetail(); }));
  $('csv-срез').addEventListener('click', () => csv('срез'));
  $('csv-опросник').addEventListener('click', () => csv('опросник'));
  setInterval(() => { if (!$('app').hidden && document.visibilityState === 'visible') load(); }, 30000);
  let lastActive = Date.now();
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(ev => document.addEventListener(ev, () => { lastActive = Date.now(); }, { passive: true }));
  setInterval(() => { if (!$('app').hidden && Date.now() - lastActive > 30 * 60 * 1000) { setSession(null); showLogin('Вы вышли автоматически после 30 минут бездействия.'); } }, 60000);

  if (!URL0 || !ANON) showLogin('В _config.js не настроен Supabase.');
  else if (session) showApp(); else showLogin();
})();
