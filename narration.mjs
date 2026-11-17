import { loadPlaybackManifest } from './manifest-loader.mjs';
import { localizedView, localizePokemon } from './i18n.mjs';
import { shortDescription } from './device-state.mjs';
import { TYPE_NAMES } from './render.mjs';
import { RECORDING_CONFIG, isRecordingManifest } from './speech.mjs';

/** Shared by offline recording generation and the exact live selection lookup. */
export function narrationForSelection(pokemon, formId, language = 'zh', english = null) {
  if (!pokemon || !RECORDING_CONFIG[language] || (language === 'en' && !english?.pokemon?.[pokemon.id])) return null;
  const view = localizedView(pokemon, formId, language, english, TYPE_NAMES);
  const name = localizePokemon(pokemon, language, english).name;
  const intro = language === 'en' ? view.shortIntro : shortDescription(view.description);
  if (!intro) return null;
  const text = language === 'en' ? `${name}${/[.!?]$/.test(name) ? ' ' : '. '}${intro}` : [name, intro].join('。');
  return { id: pokemon.id, formId: view.form.id, language, voice: RECORDING_CONFIG[language].voice, name, intro, text };
}

/** Cache manifests per language; late requests never update another language's UI. */
export function createRecordingLibrary({ fetcher = globalThis.fetch, onState = () => {}, clock = globalThis, attempts = 2 } = {}) {
  let activeLanguage = 'zh';
  const states = Object.fromEntries(['zh', 'en'].map(language => [language, { status: 'idle', manifest: null, token: 0, controller: null, pending: null }]));
  const getState = (language = activeLanguage) => ({ language, status: states[language].status, manifest: states[language].manifest });
  const emit = language => { if (language === activeLanguage) onState(getState(language)); };
  function load(language, force = false) {
    const state = states[language];
    if (!force && state.pending) return state.pending;
    if (!force && state.status === 'ready') return Promise.resolve(getState(language));
    const token = ++state.token;
    state.controller?.abort();
    const controller = new AbortController();
    state.controller = controller; state.status = 'loading'; state.manifest = null; emit(language);
    state.pending = (async () => {
      try {
        const manifest = await loadPlaybackManifest(RECORDING_CONFIG[language].manifest, {
          fetcher, clock, signal: controller.signal, attempts, cache: force ? 'reload' : undefined,
          validate: data => isRecordingManifest(data, language),
        });
        if (token === state.token) { state.status = 'ready'; state.manifest = manifest; emit(language); }
      } catch {
        if (token === state.token) { state.status = 'error'; state.manifest = null; emit(language); }
      } finally {
        if (token === state.token) { state.pending = null; state.controller = null; }
      }
      return getState(language);
    })();
    return state.pending;
  }
  function setLanguage(language) {
    language = language === 'en' ? 'en' : 'zh';
    const changed = language !== activeLanguage;
    activeLanguage = language; emit(language);
    return states[language].status === 'idle' || changed && states[language].status === 'error'
      ? load(language) : states[language].pending || Promise.resolve(getState(language));
  }
  return { setLanguage, getState, retry: (language = activeLanguage) => load(language, true), get state() { return getState(); } };
}
