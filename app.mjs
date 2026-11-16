import { createLanguageController, t, pokemonName, localizePokemon, localizedView, applyDocumentLanguage, EN_TYPES } from './i18n.mjs';
import { filterPokemon, readFavorites, toggleFavoriteState, FAVORITES_KEY } from './logic.mjs';
import { detailView } from './presentation.mjs';
import { catalogPage, adjacentPokemon, restoreSelection, persistSelection, shortDescription, pokemonIdFromHash } from './device-state.mjs';
import { createNarrator, recordingForSelection } from './speech.mjs';
import { TYPES, TYPE_NAMES, escapeHTML as esc, typeBadge, moreMarkup } from './render.mjs';
import { imageSrc } from './images.mjs';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const catalog = { query: '', type: 'all', generation: 'all', view: 'all', sort: 'number', page: 0 };
let snapshot, byId = new Map(), ordered = [], selection = { id: '25', formId: '25' }, favorites = new Set();
let storage, loading = false, toastTimer, composing = false;
let narrationManifest = null, narrationRequest = null;
const returnTargets = new WeakMap();
try { storage = window.localStorage; favorites = readFavorites(storage); } catch { /* Browsing still works without persistent storage. */ }
const languages = createLanguageController({ storage, onState() { narrator.stop(); clearTimeout(toastTimer); $('#toast').classList.remove('visible'); applyLanguage(); } });
const lang = () => languages.state.language;
const tr = (key, values) => t(lang(), key, values);
const nameOf = pokemon => pokemonName(pokemon, lang());
const typeNames = () => lang() === 'en' ? EN_TYPES : TYPE_NAMES;


function toast(message) {
  const el = $('#toast');
  (document.querySelector('dialog[open]') || document.body).append(el);
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 4000);
}
const narrator = createNarrator({ Audio: window.Audio, onState(state) {
  const active = lang() !== 'en' && (state === 'loading' || state === 'speaking');
  $('#speak-button').classList.toggle('is-reading', active);
  $('#speak-button').setAttribute('aria-pressed', String(active));
  $('#speak-label').textContent = state === 'loading' && lang() !== 'en' ? tr('audioPreparing') : state === 'speaking' && lang() !== 'en' ? tr('audioStop') : tr('listen');
  const messages = { unavailable: 'audioUnavailable', 'missing-recording': 'audioMissing', error: 'audioError' };
  if (lang() !== 'en' && messages[state]) toast(tr(messages[state]));
} });

function updateNarrationAvailability() {
  const english = lang() === 'en';
  $('#speak-button').disabled = !snapshot || english || Boolean(narrationRequest);
  $('#speak-button').setAttribute('aria-busy', String(!english && Boolean(narrationRequest)));
  $('#speak-button').title = tr(english ? 'englishAudio' : 'voice');
  $('#audio-language-note').hidden = !english;
  if (!narrator.active) $('#speak-label').textContent = !english && narrationRequest ? tr('recordingsLoading') : tr('listen');
}
function loadNarrationManifest() {
  if (narrationRequest) return narrationRequest;
  narrationRequest = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch('audio/manifest.json', { cache: 'no-cache', signal: controller.signal });
      if (!response.ok) throw new Error('Narration manifest request failed');
      const data = await response.json();
      if (data?.complete !== true || data.voice !== 'uncle_fu' || !data.entries || typeof data.entries !== 'object' || Array.isArray(data.entries)) throw new Error('Invalid narration manifest');
      narrationManifest = data;
      return true;
    } catch (error) {
      narrationManifest = null;
      console.warn('Pokédex recordings unavailable', error);
      return false;
    } finally {
      clearTimeout(timeout); narrationRequest = null;
      updateNarrationAvailability();
    }
  })();
  updateNarrationAvailability();
  return narrationRequest;
}

function selectedProfile() {
  const pokemon = byId.get(selection.id);
  return { basePokemon: pokemon, pokemon: localizePokemon(pokemon, lang(), languages.state.english), view: localizedView(pokemon, selection.formId, lang(), languages.state.english, TYPE_NAMES) };
}
function updateFavorite() {
  const active = favorites.has(selection.id);
  $('#favorite-pokemon').classList.toggle('is-favorite', active);
  $('#favorite-pokemon').setAttribute('aria-pressed', String(active));
  $('#favorite-pokemon').setAttribute('aria-label', tr(active ? 'unfavoriteAction' : 'favoriteAction', { name: nameOf(byId.get(selection.id)) }));
  $('#favorite-label').textContent = tr(active ? 'favorited' : 'favorite');
  $('#favorite-count').textContent = favorites.size;
}
function mainFamily(pokemon) {
  const family = pokemon.evolution || [];
  let preview = family.slice(0, 3);
  if (family.length > 3 && !preview.some(n => n.id === pokemon.id)) {
    const current = family.find(n => n.id === pokemon.id);
    const parent = family.find(n => n.id === current?.fromId);
    preview = [...(parent ? [parent] : family.slice(0, 1)), current].filter(Boolean);
  }
  $('#evolution-preview').innerHTML = preview.length > 1 ? preview.map((node, index) => {
    const partner = byId.get(node.id); if (!partner) return '';
    const arrow = index > 0 && node.fromId === preview[index - 1].id ? '<span class="evolution-arrow" aria-hidden="true">›</span>' : '';
    return `${arrow}<button type="button" class="evolution-node${partner.id === pokemon.id ? ' current' : ''}" data-select-pokemon="${esc(partner.id)}" aria-label="${esc(tr('view', { name: nameOf(partner) }))}"${partner.id === pokemon.id ? ' aria-current="true"' : ''}><img src="${imageSrc(partner.image, 160)}" alt="" width="60" height="60"><span>${esc(nameOf(partner))}</span></button>`;
  }).join('') : '';
  $('#evolution-note').hidden = family.length > 1;
  $('#evolution-note').textContent = tr(pokemon.announced ? 'noEvolutionAnnounced' : 'noEvolution');
  $('#open-family').hidden = family.length <= 3;
}
function renderMain({ focus = false } = {}) {
  const { pokemon, view } = selectedProfile();
  selection.formId = view.form.id;
  $('#pokemon-name').textContent = pokemon.name;
  $('#pokemon-name-secondary').hidden = lang() !== 'en';
  $('#pokemon-name-secondary').textContent = lang() === 'en' ? byId.get(selection.id).name : '';
  $('#main-number').textContent = pokemon.number ? `No. ${String(pokemon.number).padStart(3, '0')}` : tr('unknownNumber');
  $('#picture-label').textContent = view.variant ? view.form.label : tr(pokemon.announced ? 'newProfile' : 'profile');
  $('#type-badges').innerHTML = (view.form.types || pokemon.types).map(t => typeBadge(t, null, lang())).join('');
  $('#pokemon-story').textContent = lang() === 'en' ? (languages.state.loading ? tr('englishLoading') : languages.state.error ? tr('englishFailed') : view.shortIntro || tr('descriptionMissing')) : shortDescription(view.description || tr('descriptionMissing'));
  updateNarrationAvailability();
  const image = $('#pokemon-image');
  const src = imageSrc(view.form.image || pokemon.image);
  if (image.getAttribute('src') !== src) {
    delete image.dataset.failed; image.classList.remove('image-fallback'); $('#main-image-status').hidden = true;
    image.src = src;
  }
  image.alt = `${pokemon.name}${view.variant ? `，${view.form.label}` : ''}`;
  $('#change-form').hidden = pokemon.forms.length <= 1;
  $('#previous-pokemon').disabled = !adjacentPokemon(ordered, pokemon.id, -1);
  $('#next-pokemon').disabled = !adjacentPokemon(ordered, pokemon.id, 1);
  mainFamily(pokemon); updateFavorite();
  persistSelection(storage, selection);
  $('#selection-status').textContent = tr('selected', { name: `${pokemon.name}${view.variant ? `, ${view.form.label}` : ''}` });
  if (focus) $('#pokemon-name').focus({ preventScroll: true });
}
function showPokemon(id, formId = null, { push = true, focus = true } = {}) {
  if (!byId.has(id)) return;
  narrator.stop();
  selection = { id, formId: formId || byId.get(id).forms[0].id };
  const hash = `#pokemon/${encodeURIComponent(id)}`;
  renderMain({ focus });
  const historySelection = { pokemonId: id, formId: selection.formId };
  if (location.hash !== hash) history[push ? 'pushState' : 'replaceState'](historySelection, '', hash);
  else history.replaceState(historySelection, '', hash);
  if ($('#catalog-dialog').open) renderCatalog();
}
function routeSelection() {
  if (!snapshot) return;
  const id = pokemonIdFromHash(location.hash);
  if (id && byId.has(id)) {
    const formId = history.state?.pokemonId === id ? history.state.formId : null;
    if (id !== selection.id || formId && formId !== selection.formId) {
      $$('dialog[open]').forEach(dialog => dialog.close('selected'));
      showPokemon(id, formId, { push: false });
    }
  } else if (location.hash !== '#pokemon-name') {
    if (location.hash.startsWith('#pokemon/')) toast(tr('notFound'));
    history.replaceState({ pokemonId: selection.id, formId: selection.formId }, '', `#pokemon/${selection.id}`);
  }
}
function syncModalState() { document.body.classList.toggle('modal-open', !!document.querySelector('dialog[open]')); }
function openDialog(id, focusElement = null) {
  narrator.stop();
  const dialog = $(`#${id}`);
  returnTargets.set(dialog, document.activeElement);
  dialog.returnValue = '';
  dialog.showModal(); syncModalState(); dialog.scrollTop = 0;
  const scrollport = $('.dialog-content', dialog);
  if (scrollport) scrollport.scrollTop = 0;
  (focusElement || $('.close-button', dialog))?.focus({ preventScroll: true });
}
function closeForSelection(dialog) { if (dialog.open) dialog.close('selected'); }
function openCatalog() {
  if (!snapshot) return;
  renderCatalog();
  openDialog('catalog-dialog');
}
function renderCatalog() {
  const result = filterPokemon(snapshot.pokemon, { ...catalog, favorites });
  const page = catalogPage(result, catalog.page, 8);
  catalog.page = page.page;
  if ($('#search').value !== catalog.query) $('#search').value = catalog.query;
  $('#filter-type').value = catalog.type; $('#filter-generation').value = catalog.generation;
  $('#clear-search').hidden = !catalog.query;
  $$('.catalog-tabs [data-view]').forEach(b => { const active = b.dataset.view === catalog.view; b.classList.toggle('selected', active); b.setAttribute('aria-pressed', String(active)); });
  $('#catalog-results').textContent = tr('results', { n: page.total.toLocaleString(lang() === 'en' ? 'en-US' : 'zh-CN') });
  $('#catalog-view-note').hidden = catalog.view !== 'latest';
  $('#catalog-view-note').textContent = tr('latestNote');
  $('#catalog-grid').innerHTML = page.items.map(p => `<button type="button" class="catalog-card${p.id === selection.id ? ' selected' : ''}" data-select-pokemon="${esc(p.id)}" aria-label="${esc(tr('view', { name: nameOf(p) }))}"><span class="image-frame"><img src="${imageSrc(p.image, 240)}" alt="" width="120" height="120" loading="lazy" decoding="async"></span><span>${esc(nameOf(p))}</span>${lang() === 'en' ? `<small class="chinese-name" lang="zh-CN">${esc(p.name)}</small>` : ''}${p.announced ? `<small>${tr('newBadge')}</small>` : ''}</button>`).join('');
  $('#catalog-empty').hidden = page.total > 0;
  const emptyFavorites = catalog.view === 'favorites' && !favorites.size;
  $('#empty-title').textContent = tr(emptyFavorites ? 'noFavorites' : 'noResults');
  $('#empty-description').textContent = tr(emptyFavorites ? 'noFavoritesBody' : 'noResultsBody');
  $('#catalog-pagination').hidden = !page.total;
  $('#catalog-previous').disabled = !page.hasPrevious; $('#catalog-next').disabled = !page.hasNext;
  $('#catalog-page-label').textContent = page.pageCount ? tr('page', { page: page.page + 1, total: page.pageCount }) : '';
  updateFavorite();
}
function resetCatalog() {
  Object.assign(catalog, { query: '', type: 'all', generation: 'all', view: 'all', page: 0 });
  renderCatalog();
}
function renderForms() {
  if (lang() === 'en' && !languages.state.english) { $('#form-grid').innerHTML = englishPendingMarkup(); return; }
  const { pokemon } = selectedProfile();
  $('#form-grid').innerHTML = pokemon.forms.map(f => `<button class="form-card${f.id === selection.formId ? ' selected' : ''}" type="button" data-form="${esc(f.id)}" aria-pressed="${f.id === selection.formId}"><span class="image-frame"><img src="${imageSrc(f.image, 240)}" alt="" width="140" height="140" loading="lazy" decoding="async"></span><span>${esc(f.label)}</span><small>${f.types.map(t => typeNames()[t]).join(' / ')}</small></button>`).join('');
}
function openForms() { renderForms(); openDialog('form-dialog'); }
function renderMore() {
  const { pokemon, basePokemon, view } = selectedProfile();
  $('#more-title').textContent = tr('moreTitle', { name: pokemon.name });
  $('#more-content').innerHTML = lang() === 'en' && !languages.state.english ? englishPendingMarkup() : moreMarkup(basePokemon, view, snapshot, byId, { language: lang(), english: languages.state.english });
}
function englishPendingMarkup() {
  return `<p class="source-note" role="status">${tr(languages.state.error ? 'englishFailed' : 'englishLoading')}</p>${languages.state.error ? `<button class="primary-button" type="button" data-retry-english>${tr('retryEnglish')}</button>` : ''}`;
}
function openMore(family = false) {
  renderMore(); openDialog('more-dialog');
  if (family) $('#full-family')?.scrollIntoView({ block: 'start' });
}
function applyLanguage() {
  const focused = document.activeElement;
  const focusKey = focused?.dataset?.form ? 'form' : focused?.dataset?.selectPokemon ? 'selectPokemon' : null;
  const focusValue = focusKey ? focused.dataset[focusKey] : null;
  const focusRoot = focused?.closest?.('dialog') || document;
  const scrollPositions = $$('dialog[open] .dialog-content').map(node => [node, node.scrollTop]);
  applyDocumentLanguage(document, lang());
  $$('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === lang())));
  const typeValue = $('#filter-type').value;
  $('#filter-type').innerHTML = `<option value="all">${tr('allTypes')}</option>` + Object.entries(typeNames()).map(([id, label]) => `<option value="${id}">${label}</option>`).join('');
  $('#filter-type').value = typeValue || catalog.type;
  for (const option of $('#filter-generation').options) option.textContent = option.value === 'all' ? tr('allGenerations') : option.value === '10' ? tr('latest') : tr('generationOption', { n: option.value });
  $('#language-status').hidden = !languages.state.loading && !languages.state.error;
  $('#language-status-text').textContent = tr(languages.state.error ? 'englishFailed' : 'englishLoading');
  $('#retry-english').hidden = !languages.state.error;
  if (snapshot) { renderMain(); if ($('#catalog-dialog').open) renderCatalog(); if ($('#form-dialog').open) renderForms(); if ($('#more-dialog').open) renderMore(); }
  for (const [node, top] of scrollPositions) node.scrollTop = top;
  if (focusKey) $$('[data-form], [data-select-pokemon]', focusRoot).find(node => node.dataset[focusKey] === focusValue)?.focus({ preventScroll: true });
  updateNarrationAvailability();
  if (snapshot && lang() === 'zh' && !narrationManifest && !narrationRequest) loadNarrationManifest();
}

async function loadData() {
  if (loading) return; loading = true;
  $('#load-error').hidden = true; $('#device-content').hidden = false;
  $('.device').classList.add('is-loading'); $('.device').setAttribute('aria-busy', 'true');
  try {
    const boot = window.__pokedexBoot;
    const pending = boot?.data || boot?.request() || fetch('data/pokedex.runtime.json').then(response => {
      if (!response.ok) throw new Error('Snapshot request failed');
      return response.json();
    });
    if (boot) boot.data = null;
    const data = await pending;
    if (!Array.isArray(data?.pokemon) || !data.pokemon.length || !data.meta || !data.typeChart) throw new Error('Invalid snapshot');
    snapshot = data; byId = new Map(data.pokemon.map(p => [p.id, p]));
    ordered = filterPokemon(data.pokemon); favorites = new Set([...favorites].filter(id => byId.has(id)));
    const restored = restoreSelection(storage, data.pokemon), hashId = pokemonIdFromHash(location.hash);
    const id = byId.has(hashId) ? hashId : restored.id;
    selection = { id, formId: history.state?.pokemonId === id ? history.state.formId : id === restored.id ? restored.formId : null };
    $$('.device button').forEach(b => { b.disabled = false; });
    showPokemon(id, selection.formId, { push: false, focus: false });
    if (lang() === 'zh' && !narrationManifest && !narrationRequest) loadNarrationManifest();
    window.__pokedexBoot?.finish();
  } catch (error) {
    console.error('Pokédex load failed', error);
    $('#device-content').hidden = true; $('#load-error').hidden = false;
  } finally { loading = false; $('.device').classList.remove('is-loading'); $('.device').setAttribute('aria-busy', 'false'); }
}

$('#filter-type').insertAdjacentHTML('beforeend', Object.entries(TYPE_NAMES).map(([id, label]) => `<option value="${id}">${label}</option>`).join(''));
$('#open-catalog').addEventListener('click', () => openCatalog());
$('#open-more').addEventListener('click', () => openMore());
$('#open-family').addEventListener('click', () => openMore(true));
$('#change-form').addEventListener('click', openForms);
$('#previous-pokemon').addEventListener('click', () => { const id = adjacentPokemon(ordered, selection.id, -1); if (id) showPokemon(id); });
$('#next-pokemon').addEventListener('click', () => { const id = adjacentPokemon(ordered, selection.id, 1); if (id) showPokemon(id); });
$('#favorite-pokemon').addEventListener('click', () => {
  const result = toggleFavoriteState(storage, favorites, selection.id); favorites = result.favorites;
  updateFavorite(); if ($('#catalog-dialog').open) renderCatalog();
  toast(tr(result.saved ? favorites.has(selection.id) ? 'savedToast' : 'removedToast' : 'unsavedToast'));
});
$('#speak-button').addEventListener('click', () => {
  if (lang() === 'en') return;
  if (narrator.active) narrator.stop();
  else if (!narrationManifest) {
    loadNarrationManifest().then(ready => { if (lang() !== 'en') toast(tr(ready ? 'audioReady' : 'audioLoadError')); });
  } else {
    const { pokemon, view } = selectedProfile();
    const text = [pokemon.name, shortDescription(view.description)].filter(Boolean).join('。');
    const recording = recordingForSelection(narrationManifest, { ...selection, text });
    // The manifest is already loaded: stay in this click stack for Safari.
    narrator.speak(recording);
  }
});
$('#search').addEventListener('compositionstart', () => { composing = true; });
$('#search').addEventListener('compositionend', e => { composing = false; catalog.query = e.target.value; catalog.page = 0; renderCatalog(); });
$('#search').addEventListener('input', e => { catalog.query = e.target.value; catalog.page = 0; if (!composing) renderCatalog(); });
$('#search').addEventListener('keydown', e => {
  // Safari may end composition before the Enter used to confirm a candidate.
  if (e.key !== 'Enter' || composing || e.isComposing || e.keyCode === 229) return;
  e.preventDefault();
  const firstResult = $('#catalog-grid button');
  if (firstResult) { $('#search').blur(); firstResult.focus(); }
});
$('#clear-search').addEventListener('click', () => { catalog.query = ''; catalog.page = 0; renderCatalog(); $('#search').focus(); });
$('#filter-type').addEventListener('change', e => { catalog.type = e.target.value; catalog.page = 0; renderCatalog(); });
$('#filter-generation').addEventListener('change', e => { catalog.generation = e.target.value; catalog.page = 0; renderCatalog(); });
$('.catalog-tabs').addEventListener('click', e => { const b = e.target.closest('[data-view]'); if (b) { Object.assign(catalog, { view: b.dataset.view, query: '', type: 'all', generation: 'all', page: 0 }); renderCatalog(); } });
$('#reset-catalog').addEventListener('click', resetCatalog); $('#empty-reset').addEventListener('click', resetCatalog);
for (const [selector, direction] of [['#catalog-previous', -1], ['#catalog-next', 1]]) $(selector).addEventListener('click', () => { catalog.page += direction; renderCatalog(); $('#catalog-grid button')?.focus({ preventScroll: true }); $('#catalog-grid').scrollIntoView({ block: 'nearest' }); });
if (window.__pokedexBoot) window.__pokedexBoot.retry = loadData;
else $('#retry-load').addEventListener('click', loadData);
document.addEventListener('click', e => {
  if (e.target.closest('[data-retry-english]')) { languages.setLanguage('en'); return; }
  const close = e.target.closest('[data-close]'); if (close) { $(`#${close.dataset.close}`).close('cancel'); return; }
  const partner = e.target.closest('[data-select-pokemon]'); if (partner) { const dialog = partner.closest('dialog'); showPokemon(partner.dataset.selectPokemon); if (dialog) closeForSelection(dialog); return; }
  const form = e.target.closest('[data-form]'); if (form) { showPokemon(selection.id, form.dataset.form, { push: false }); closeForSelection($('#form-dialog')); }
});
$$('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => {
    syncModalState(); if (document.querySelector('dialog[open]')) return;
    document.body.append($('#toast'));
    const target = dialog.returnValue === 'selected' ? $('#pokemon-name') : returnTargets.get(dialog);
    (target?.isConnected ? target : $('#pokemon-name'))?.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', e => { if (e.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close('cancel'); });
});
document.addEventListener('error', e => {
  const img = e.target; if (!(img instanceof HTMLImageElement) || img.dataset.failed) return;
  img.dataset.failed = 'true'; img.src = 'assets/pokeball.svg'; img.classList.add('image-fallback'); img.alt = tr('imageError');
  if (img.id === 'pokemon-image') $('#main-image-status').hidden = false;
  else { const caption = document.createElement('span'); caption.className = 'image-error-caption'; caption.dataset.i18n = 'imageError'; caption.textContent = tr('imageError'); img.after(caption); }
}, true);
window.addEventListener('hashchange', routeSelection);
window.addEventListener('popstate', routeSelection);
window.addEventListener('storage', e => {
  if (e.key !== FAVORITES_KEY && e.key !== null || e.storageArea && e.storageArea !== storage) return;
  favorites = readFavorites(storage);
  if (!snapshot) return;
  updateFavorite();
  if ($('#catalog-dialog').open && catalog.view === 'favorites') {
    const focused = document.activeElement?.closest('.catalog-card');
    const id = focused?.dataset.selectPokemon;
    const index = $$('.catalog-card').indexOf(focused);
    renderCatalog();
    if (id) {
      const cards = $$('.catalog-card');
      (cards.find(card => card.dataset.selectPokemon === id) || cards[Math.min(index, cards.length - 1)] || $('#empty-reset')).focus({ preventScroll: true });
    }
  }
});
function updateVisibleViewport() {
  const viewport = window.visualViewport;
  // Leave pinch zoom to the browser instead of repeatedly shrinking its content.
  if (viewport && Math.abs(viewport.scale - 1) > 0.01) return;
  const height = viewport?.height || window.innerHeight;
  const top = viewport?.offsetTop || 0;
  document.documentElement.style.setProperty('--visible-height', `${height}px`);
  document.documentElement.style.setProperty('--visible-top', `${top}px`);
}
window.addEventListener('resize', updateVisibleViewport);
window.visualViewport?.addEventListener('resize', updateVisibleViewport);
window.visualViewport?.addEventListener('scroll', updateVisibleViewport);
window.addEventListener('pageshow', updateVisibleViewport);
updateVisibleViewport();
document.addEventListener('visibilitychange', () => { if (document.hidden) narrator.stop(); });
window.addEventListener('pagehide', () => narrator.stop());
$$('[data-language]').forEach(button => button.addEventListener('click', () => { languages.setLanguage(button.dataset.language); }));
$('#retry-english').addEventListener('click', () => languages.setLanguage('en'));
applyLanguage();
languages.setLanguage(languages.state.language);
if (lang() !== 'en') loadNarrationManifest();
loadData();
