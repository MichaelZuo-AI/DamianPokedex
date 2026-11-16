(() => {
  let complete = false;
  let watchdog;
  function ready(callback) {
    if (document.readyState !== 'loading') { callback(); return; }
    const parsed = () => {
      if (document.readyState === 'loading') return;
      document.removeEventListener('readystatechange', parsed);
      callback();
    };
    document.addEventListener('readystatechange', parsed);
  }
  let preferredLanguage = 'zh';
  try { if (window.localStorage.getItem('damian-pokedex-language-v1') === 'en') preferredLanguage = 'en'; } catch { /* Chinese remains usable without storage. */ }
  if (preferredLanguage === 'en') {
    const text = window.__pokedexEnglishUI || {};
    document.documentElement.lang = 'en';
    document.title = text.title || 'Damian’s Pokédex';
    ready(() => {
      for (const node of document.querySelectorAll('[data-i18n]')) if (text[node.dataset.i18n]) node.textContent = text[node.dataset.i18n];
      for (const node of document.querySelectorAll('[data-i18n-aria]')) if (text[node.dataset.i18nAria]) node.setAttribute('aria-label', text[node.dataset.i18nAria]);
      for (const node of document.querySelectorAll('[data-i18n-placeholder]')) if (text[node.dataset.i18nPlaceholder]) node.setAttribute('placeholder', text[node.dataset.i18nPlaceholder]);
    });
  }
  function fail() {
    clearTimeout(watchdog);
    ready(() => {
      if (complete) return;
      document.getElementById('load-error').hidden = false;
      document.getElementById('device-content').hidden = true;
      const device = document.querySelector('.device');
      device.classList.remove('is-loading');
      device.setAttribute('aria-busy', 'false');
    });
  }
  async function request() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch('data/pokedex.runtime.json', { signal: controller.signal });
      if (!response.ok) throw new Error('Snapshot request failed');
      return await response.json();
    } catch {
      fail();
      return null;
    } finally { clearTimeout(timer); }
  }
  const boot = window.__pokedexBoot = {
    data: null, request, fail, retry: null,
    finish() { complete = true; clearTimeout(watchdog); },
  };
  // A hung defer script can postpone DOMContentLoaded indefinitely.
  document.addEventListener('click', event => {
    if (!event.target.closest?.('#retry-load')) return;
    if (typeof boot.retry === 'function') boot.retry();
    else window.location.reload();
  });
  watchdog = setTimeout(fail, 20_000);
  boot.data = request();
})();
