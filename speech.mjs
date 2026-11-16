const START_TIMEOUT_MS = 10_000;
const safeId = value => typeof value === 'string' && /^(?:[1-9]\d*|[a-z][a-z0-9-]*)$/.test(value);
const safeSource = value => typeof value === 'string' && /^audio\/pokemon-[a-z0-9-]+--[a-z0-9-]+\.mp3$/.test(value);

/** A form must have its own selected-voice recording; never borrow default biology. */
export function recordingForSelection(manifest, { id, formId, text } = {}) {
  if (manifest?.voice !== 'uncle_fu' || !safeId(id) || !safeId(formId)
    || !manifest.entries || !Object.hasOwn(manifest.entries, `${id}:${formId}`)) return null;
  const recording = manifest.entries[`${id}:${formId}`];
  if (recording?.src !== `audio/pokemon-${id}--${formId}.mp3` || typeof recording.text !== 'string') return null;
  if (recording.pokemonId !== undefined && recording.pokemonId !== id) return null;
  if (recording.formId !== undefined && recording.formId !== formId) return null;
  if (recording.voice !== undefined && recording.voice !== 'uncle_fu') return null;
  if (text !== undefined && recording.text !== text) return null;
  return recording;
}

/** Recorded audio only. play() stays inside the original Safari click stack. */
export function createNarrator({ Audio = globalThis.Audio, onState = () => {}, clock = globalThis } = {}) {
  let generation = 0;
  let current = null;
  let startTimer = null;

  function clearStartTimer() {
    if (startTimer !== null) { clock.clearTimeout(startTimer); startTimer = null; }
  }
  function release(audio) {
    if (!audio) return;
    // Invalidation always precedes native methods, which can dispatch events.
    try { audio.pause(); } catch { /* Continue releasing a failed media element. */ }
    try { audio.removeAttribute?.('src'); audio.load?.(); } catch { /* Browsing remains available. */ }
  }
  function invalidate() {
    generation++;
    const audio = current?.audio;
    current = null;
    clearStartTimer();
    release(audio);
  }
  function finish(token, state) {
    if (current?.token !== token) return;
    invalidate();
    onState(state);
  }
  function loading(token) {
    if (current?.token !== token) return;
    clearStartTimer();
    startTimer = clock.setTimeout(() => finish(token, 'error'), START_TIMEOUT_MS);
    startTimer?.unref?.();
    onState('loading');
  }
  function stop() {
    invalidate();
    onState('idle');
  }
  function speak(recording) {
    invalidate();
    if (!safeSource(recording?.src)) { onState('missing-recording'); return false; }
    if (typeof Audio !== 'function') { onState('unavailable'); return false; }
    try {
      const audio = new Audio(recording.src);
      if (typeof audio.play !== 'function' || typeof audio.pause !== 'function') {
        onState('unavailable'); return false;
      }
      audio.preload = 'auto';
      const token = generation;
      current = { token, audio };
      audio.onplaying = () => {
        if (current?.token !== token) return;
        clearStartTimer();
        onState('speaking');
      };
      audio.onended = () => finish(token, 'idle');
      audio.onpause = () => finish(token, 'idle');
      audio.onerror = () => finish(token, 'error');
      audio.onwaiting = () => loading(token);
      loading(token);
      // No await, fetch or delayed callback before play: preserve user activation.
      const playing = audio.play();
      playing?.catch?.(() => finish(token, 'error'));
      return true;
    } catch {
      invalidate();
      onState('error');
      return false;
    }
  }
  return { speak, stop, get active() { return current !== null; } };
}
