/* Переключатель темы: light / dark / system. Подключается в <head>, чтобы не мигало при загрузке. */
(function () {
  // Всегда HTTPS: если страницу открыли по http, переходим на защищённую версию
  if (location.protocol === 'http:' && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) { location.replace('https://' + location.host + location.pathname + location.search + location.hash); return; }
  const KEY = 'otbor2107_theme';
  const root = document.documentElement;
  function get() { try { return localStorage.getItem(KEY) || 'system'; } catch (e) { return 'system'; } }
  function apply(v) { if (v === 'light' || v === 'dark') root.dataset.theme = v; else delete root.dataset.theme; }
  apply(get());
  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.id = 'theme-btn'; btn.className = 'theme-btn';
    const icons = { light: '☀️', dark: '🌙', system: '🖥️' };
    const names = { light: 'Светлая тема', dark: 'Тёмная тема', system: 'Тема как в системе' };
    function draw() { const v = get(); btn.textContent = icons[v]; btn.title = names[v] + ' · нажмите, чтобы сменить'; btn.setAttribute('aria-label', names[v]); }
    btn.addEventListener('click', () => {
      const order = ['system', 'light', 'dark'];
      const next = order[(order.indexOf(get()) + 1) % order.length];
      try { localStorage.setItem(KEY, next); } catch (e) {}
      apply(next); draw();
    });
    draw();
    document.body.appendChild(btn);
  });
})();
