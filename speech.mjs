const START_TIMEOUT_MS = 10_000;

/**
 * Narration stays synchronous with the caller's click for Safari's user gesture.
 * `active` includes loading; `speaking` is reported only after the native event.
 * An optional clock supplies setTimeout/clearTimeout for deterministic callers.
 */
export function createNarrator({ synthesis, Utterance, onState = () => {}, clock = globalThis } = {}) {
  let generation = 0;
  let current = null;
  let startTimer = null;

  function clearStartTimer() {
    if (startTimer !== null) {
      clock.clearTimeout(startTimer);
      startTimer = null;
    }
  }

  function invalidate() {
    generation += 1;
    current = null;
    clearStartTimer();
  }

  function finish(token, state) {
    if (current?.token !== token) return;
    invalidate();
    onState(state);
  }

  function stop() {
    // Native cancel may dispatch an error synchronously, so invalidate first.
    invalidate();
    try {
      synthesis?.cancel?.();
      onState('idle');
    } catch {
      onState('error');
    }
  }

  function speak({ name, text }) {
    invalidate();
    if (!synthesis || typeof synthesis.speak !== 'function'
      || typeof synthesis.cancel !== 'function' || typeof synthesis.getVoices !== 'function'
      || typeof Utterance !== 'function') {
      onState('unavailable');
      return false;
    }

    try {
      synthesis.cancel();
      const voices = synthesis.getVoices();
      const language = voice => voice.lang.toLowerCase().replaceAll('_', '-');
      const voice = voices.find(item => /^zh-(cn|hans)(-|$)/.test(language(item)))
        ?? voices.find(item => /^zh(-|$)/.test(language(item)));
      if (voices.length && !voice) {
        onState('no-chinese-voice');
        return false;
      }

      const content = [name, text].map(part => String(part ?? '').trim()).filter(Boolean).join('。');
      const utterance = new Utterance(content);
      utterance.lang = voice?.lang ?? 'zh-CN';
      if (voice) utterance.voice = voice;
      const token = generation;
      current = { token, utterance }; // Retain the native utterance until it settles.

      utterance.onstart = () => {
        if (current?.token !== token) return;
        clearStartTimer();
        onState('speaking');
      };
      utterance.onend = () => finish(token, 'idle');
      utterance.onerror = () => finish(token, 'error');

      startTimer = clock.setTimeout(() => {
        if (current?.token !== token) return;
        invalidate();
        try { synthesis.cancel(); } catch { /* Still report the failed start. */ }
        onState('error');
      }, START_TIMEOUT_MS);
      // Node timers must not keep a non-browser process alive.
      startTimer?.unref?.();
      onState('loading');
      // Do not wait for voiceschanged: that would lose the original Safari click.
      synthesis.speak(utterance);
      return true;
    } catch {
      invalidate();
      onState('error');
      return false;
    }
  }

  return { speak, stop, get active() { return current !== null; } };
}
