/** Immutable playback data is cacheable; explicit retry refreshes only after failure. */
export async function loadPlaybackManifest(url, {
  fetcher = globalThis.fetch, clock = globalThis, signal,
  validate = () => true, attempts = 2, timeoutMs = 20_000, cache,
} = {}) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (signal?.aborted) throw Error('Recording request canceled');
    const controller = new AbortController();
    const cancel = () => controller.abort();
    signal?.addEventListener('abort', cancel, { once: true });
    let timer;
    try {
      const timeout = new Promise((_,reject) => {
        controller.signal.addEventListener('abort', () => reject(Error('Recording request interrupted')), { once: true });
        timer = clock.setTimeout(() => { controller.abort(); reject(Error('Recording manifest timeout')); }, timeoutMs);
        timer?.unref?.();
      });
      const data = await Promise.race([(async () => {
        const mode = cache || (attempt > 0 ? 'reload' : /runtime-manifest-[a-f0-9]{16}\.json$/.test(url) ? 'force-cache' : 'default');
        const response = await fetcher(url,{cache:mode,signal:controller.signal});
        if (!response.ok) {
          const error = Error('Recording manifest request failed');
          error.retryable = response.status >= 500 || response.status === 408;
          throw error;
        }
        const manifest = await response.json();
        if (!validate(manifest)) { const error = Error('Recording manifest is not ready'); error.retryable = false; throw error; }
        return manifest;
      })(),timeout]);
      return data;
    } catch (error) {
      if (signal?.aborted || error.retryable === false || attempt + 1 >= attempts) throw error;
    } finally {
      clock.clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
    }
  }
}
