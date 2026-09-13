/* Общий код форм: автосохранение в браузере, отправка в Supabase, запасное сохранение файлом. */
(function () {
  const FORM = document.querySelector('form');
  const KIND = FORM.dataset.form || 'form';
  const KEY = 'otbor2107_' + KIND;
  const CFG = window.OTBOR_CONFIG || {};
  const ONLINE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);

  let clientId = null;
  try { clientId = localStorage.getItem('otbor2107_client'); } catch (e) {}
  if (!clientId) {
    clientId = (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2));
    try { localStorage.setItem('otbor2107_client', clientId); } catch (e) {}
  }

  function fields() {
    const out = {};
    for (const el of FORM.elements) {
      if (!el.name) continue;
      if (el.type === 'checkbox') out[el.name] = el.checked ? 'да' : '';
      else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; else if (!(el.name in out)) out[el.name] = ''; }
      else out[el.name] = el.value.trim();
    }
    return out;
  }
  function restore() {
    let saved; try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { saved = null; }
    if (!saved) return;
    for (const el of FORM.elements) {
      if (!el.name || !(el.name in saved)) continue;
      if (el.type === 'checkbox') el.checked = saved[el.name] === 'да';
      else if (el.type === 'radio') el.checked = saved[el.name] === el.value;
      else el.value = saved[el.name];
    }
  }
  function autosave() { try { localStorage.setItem(KEY, JSON.stringify(fields())); } catch (e) {} }
  FORM.addEventListener('input', autosave);
  FORM.addEventListener('change', autosave);
  restore();

  function labelFor(name) {
    const el = FORM.elements[name];
    const one = el && el.length !== undefined && !el.tagName ? el[0] : el;
    return (one && one.dataset && one.dataset.label) || name;
  }
  function readable(data, withJson) {
    const lines = [document.title, 'Дата: ' + new Date().toLocaleString('ru-RU'), ''];
    const seen = new Set();
    for (const el of FORM.elements) {
      if (!el.name || seen.has(el.name)) continue;
      seen.add(el.name);
      const v = data[el.name];
      const lab = labelFor(el.name);
      if (v && v.includes('\n')) lines.push(lab + ':\n' + v.split('\n').map(s => '    ' + s).join('\n'));
      else lines.push(lab + ': ' + (v || '—'));
    }
    if (withJson) { lines.push(''); lines.push('###JSON### ' + JSON.stringify(Object.assign({ _form: KIND }, data))); }
    return lines.join('\n');
  }
  function safeName(s) { return (s || 'без_имени').replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, ''); }
  const msg = document.getElementById('saved-msg');
  const saveBtn = document.getElementById('save-btn');
  if (ONLINE) saveBtn.hidden = true;   // показываем только в офлайн-режиме или после ошибки отправки
  const NEXT = KIND === 'опросник'
    ? ' <a href="02_срез.html">Перейти к шагу 2 →</a>'
    : ' <a href="index.html">На главную</a>';

  async function saveFile() {
    const data = fields();
    if (!data.fio) { alert('Сначала впиши фамилию и имя вверху страницы.'); FORM.elements.fio.focus(); return; }
    const fname = KIND + '_' + safeName(data.fio) + (data.klass ? '_' + safeName(data.klass) : '') + '.txt';
    const blob = new Blob([readable(data, true)], { type: 'text/plain;charset=utf-8' });
    try {
      if (window.showSaveFilePicker) {
        const h = await window.showSaveFilePicker({ suggestedName: fname, types: [{ description: 'Текст', accept: { 'text/plain': ['.txt'] } }] });
        const w = await h.createWritable(); await w.write(blob); await w.close();
        msg.textContent = 'Сохранено файлом: ' + fname + '. Скажи учителю, где лежит файл.';
        return;
      }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = fname; document.body.appendChild(a); a.click(); a.remove();
    msg.textContent = 'Файл ' + fname + ' скачан в папку «Загрузки». Скажи учителю.';
  }

  async function submit() {
    const data = fields();
    if (!data.fio) { alert('Сначала впиши фамилию и имя вверху страницы.'); FORM.elements.fio.focus(); return; }
    if (!ONLINE) { msg.textContent = 'Отправка в базу не настроена, сохраняем файлом.'; return saveFile(); }
    const btn = document.getElementById('submit-btn');
    btn.disabled = true; msg.textContent = 'Отправляем…';
    try {
      const url = CFG.supabaseUrl.replace(/\/+$/, '') + '/rest/v1/' + (CFG.table || 'answers');
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': CFG.supabaseAnonKey,
          'Authorization': 'Bearer ' + CFG.supabaseAnonKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ form: KIND, fio: data.fio, klass: data.klass || '', client_id: clientId, data: data, text: readable(data, false) })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + (await res.text()).slice(0, 200));
      const t = new Date().toLocaleTimeString('ru-RU');
      msg.innerHTML = 'Ответы отправлены ✓ ' + t + '. Если что-то исправишь, отправь ещё раз.' + NEXT;
      try { localStorage.setItem(KEY + '_sent', t); } catch (e) {}
    } catch (e) {
      msg.textContent = 'Не удалось отправить (' + e.message + '). Позови учителя. Пока сохраняем файлом.';
      saveBtn.hidden = false;
      await saveFile();
    } finally { btn.disabled = false; }
  }

  document.getElementById('submit-btn').addEventListener('click', submit);
  document.getElementById('save-btn').addEventListener('click', saveFile);
  document.getElementById('preview-btn').addEventListener('click', () => {
    const pre = document.getElementById('preview');
    pre.textContent = readable(fields(), false);
    pre.hidden = !pre.hidden;
  });
  const mode = document.getElementById('mode');
  if (mode) {
    let sent = ''; try { sent = localStorage.getItem(KEY + '_sent') || ''; } catch (e) {}
    mode.textContent = ONLINE ? (sent ? 'Последняя отправка: ' + sent : '') : 'Офлайн-режим: ответы сохраняются файлом';
  }
  window.__otbor = { fields, readable };

  // Бейджи номеров заданий: «A1.» → <span class="qn">A1</span>
  FORM.querySelectorAll('h3').forEach(h => {
    const m = h.innerHTML.match(/^([A-F]\d)(\s*<span class="star">★<\/span>)?\.\s*/);
    if (m) h.innerHTML = '<span class="qn">' + m[1] + '</span>' + (m[2] || '') + ' ' + h.innerHTML.slice(m[0].length);
  });

  // Прогресс: сколько вопросов заполнено
  const bar = document.getElementById('progress-bar');
  const counter = document.getElementById('counter');
  function progress() {
    const data = fields();
    const names = Object.keys(data).filter(n => n !== 'fio' && n !== 'klass');
    const done = names.filter(n => data[n] !== '').length;
    const pct = names.length ? Math.round(done / names.length * 100) : 0;
    if (bar) bar.style.width = pct + '%';
    if (counter) counter.textContent = 'Заполнено ' + done + ' из ' + names.length;
    FORM.querySelectorAll('.blocknav a[data-blk]').forEach(a => {
      const sec = document.getElementById('blk-' + a.dataset.blk);
      if (!sec) return;
      const els = [...sec.querySelectorAll('[name]')];
      const groups = new Set(els.map(e => e.name));
      const filled = [...groups].filter(n => data[n] !== '').length;
      a.classList.toggle('done', groups.size > 0 && filled === groups.size);
    });
  }
  FORM.addEventListener('input', progress);
  FORM.addEventListener('change', progress);
  progress();

  FORM.querySelectorAll('[data-max]').forEach(group => {
    const max = +group.dataset.max;
    group.addEventListener('change', (e) => {
      const checked = group.querySelectorAll('input[type=checkbox]:checked');
      if (checked.length > max && e.target.checked) { e.target.checked = false; autosave(); alert('Можно выбрать не больше ' + max + '.'); }
    });
  });
})();
