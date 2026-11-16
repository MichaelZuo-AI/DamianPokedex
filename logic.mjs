export const FAVORITES_KEY = 'damian-pokedex-favorites-v1';
const chineseNames = new Intl.Collator('zh-CN');

const hasNumber = pokemon => Number.isFinite(pokemon.number) && pokemon.number > 0;

/** Search, intersect filters and sort a fresh array without changing the snapshot. */
export function filterPokemon(pokemon, {
  query = '', type = 'all', generation = 'all', view = 'all', favorites = [], sort = 'number',
} = {}) {
  const text = String(query ?? '').trim().toLowerCase();
  const englishKey = value => String(value ?? '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');
  const englishQuery = !/\p{Script=Han}/u.test(text) && /[a-z]/i.test(text) ? englishKey(text) : '';
  const nationalNumber = /^#?\d+$/.test(text) ? Number(text.replace(/^#/, '')) : null;
  const favoriteIds = favorites instanceof Set ? favorites : new Set(favorites);
  const result = pokemon.filter(entry => {
    if (type && type !== 'all' && !entry.types.includes(type)) return false;
    if (generation !== 'all' && Number(generation) !== entry.generation) return false;
    if (view === 'latest' && !entry.announced) return false;
    if (view === 'favorites' && !favoriteIds.has(entry.id)) return false;
    if (!text) return true;
    if (nationalNumber > 0 && hasNumber(entry) && entry.number === nationalNumber) return true;
    return [entry.name, entry.en, entry.slug].some(value => String(value ?? '').toLowerCase().includes(text))
      || Boolean(englishQuery && [entry.en, entry.slug].some(value => englishKey(value).includes(englishQuery)));
  });

  return result.sort((a, b) => {
    if (sort === 'name') return chineseNames.compare(a.name, b.name);
    if (sort === 'newest') {
      const aUpcoming = Boolean(a.announced && !hasNumber(a));
      const bUpcoming = Boolean(b.announced && !hasNumber(b));
      return Number(bUpcoming) - Number(aUpcoming) || b.generation - a.generation;
    }
    if (!hasNumber(a)) return hasNumber(b) ? 1 : 0;
    if (!hasNumber(b)) return -1;
    return a.number - b.number;
  });
}

/** Multiply each attacking type's effectiveness against all defending types. */
export function typeMatchups(types, typeChart) {
  const result = { weak: [], resist: [], immune: [] };
  for (const [type, defenses] of Object.entries(typeChart)) {
    const multiplier = types.reduce((product, defense) => product * (defenses[defense] ?? 1), 1);
    const matchup = { type, multiplier };
    if (multiplier === 0) result.immune.push(matchup);
    else if (multiplier > 1) result.weak.push(matchup);
    else if (multiplier < 1) result.resist.push(matchup);
  }
  return result;
}

function safeIds(values) {
  if (!Array.isArray(values) && !(values instanceof Set)) return new Set();
  return new Set([...values].filter(id => {
    if (typeof id !== 'string') return false;
    if (/^\d+$/.test(id)) return /[1-9]/.test(id);
    return /^(?=.*[a-z])[a-z0-9-]+$/.test(id);
  }));
}

function parseFavorites(raw) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? safeIds(parsed) : new Set();
  } catch {
    return new Set();
  }
}

const pendingFavorites = new WeakMap();
const canRemember = storage => storage !== null && (typeof storage === 'object' || typeof storage === 'function');

/** Replay only unsaved local changes over the newest data from other tabs. */
function favoriteSnapshot(storage, currentIds = []) {
  const pending = canRemember(storage) ? pendingFavorites.get(storage) : undefined;
  let baseline;
  let favorites;
  try {
    baseline = parseFavorites(storage.getItem(FAVORITES_KEY));
    favorites = new Set(baseline);
    if (pending) {
      for (const id of pending.removed) favorites.delete(id);
      for (const id of pending.added) favorites.add(id);
    }
  } catch {
    baseline = new Set(pending?.baseline ?? safeIds(currentIds));
    favorites = new Set(pending?.memory ?? safeIds(currentIds));
  }
  if (pending) {
    pending.baseline = new Set(baseline);
    pending.memory = new Set(favorites);
  }
  return { baseline, favorites };
}

/** Reads include pending changes, including when called by a storage event. */
export function readFavorites(storage) {
  return favoriteSnapshot(storage).favorites;
}

/** Return whether persistence succeeded so the UI can keep browsing on failure. */
export function writeFavorites(storage, ids) {
  try {
    storage.setItem(FAVORITES_KEY, JSON.stringify([...safeIds(ids)]));
    if (canRemember(storage)) pendingFavorites.delete(storage);
    return true;
  } catch {
    return false;
  }
}

/** Keep failed local additions/removals until a later merged write succeeds. */
export function toggleFavoriteState(storage, currentIds, id) {
  const { baseline, favorites } = favoriteSnapshot(storage, currentIds);
  if (!safeIds([id]).has(id)) return { favorites, saved: false };
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  const saved = writeFavorites(storage, favorites);
  if (!saved && canRemember(storage)) {
    pendingFavorites.set(storage, {
      baseline: new Set(baseline),
      added: new Set([...favorites].filter(value => !baseline.has(value))),
      removed: new Set([...baseline].filter(value => !favorites.has(value))),
      memory: new Set(favorites),
    });
  }
  return { favorites, saved };
}
