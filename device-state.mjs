export const LAST_VIEW_KEY = 'damian-pokedex-last-v1';

const safeId = value => typeof value === 'string' && /^(?:[1-9]\d*|[a-z][a-z0-9-]*)$/.test(value);

/** Clamp against the current result set, including after a favorite is removed. */
export function catalogPage(items, page, pageSize = 8) {
  const size = Number.isFinite(pageSize) && pageSize >= 1 ? Math.floor(pageSize) : 8;
  const total = items.length;
  const pageCount = Math.ceil(total / size);
  const requested = Number.isFinite(page) ? Math.floor(page) : 0;
  const current = Math.max(0, Math.min(requested, Math.max(0, pageCount - 1)));
  return {
    items: items.slice(current * size, (current + 1) * size),
    page: current,
    pageCount,
    total,
    hasPrevious: current > 0,
    hasNext: current + 1 < pageCount,
  };
}

/** The catalogue order also includes announced partners without national numbers. */
export function adjacentPokemon(items, id, direction) {
  if (direction !== -1 && direction !== 1) return null;
  const index = items.findIndex(pokemon => pokemon.id === id);
  return index < 0 ? null : items[index + direction]?.id ?? null;
}

/** A saved form is valid only when it belongs to the saved species. */
export function restoreSelection(storage, pokemon, fallbackId = '25') {
  let saved;
  try {
    saved = JSON.parse(storage.getItem(LAST_VIEW_KEY));
  } catch {
    saved = null;
  }
  const restored = pokemon.find(entry => entry.id === saved?.id);
  const selected = restored || pokemon.find(entry => entry.id === fallbackId) || pokemon[0];
  if (!selected) return { id: null, formId: null };
  const forms = selected.forms || [];
  const form = (restored && forms.find(entry => entry.id === saved?.formId)) || forms[0];
  return { id: selected.id, formId: form?.id ?? null };
}

/** Failed persistence does not prevent the current partner remaining visible. */
export function persistSelection(storage, selection) {
  const id = selection?.id;
  const formId = selection?.formId;
  if (!safeId(id) || !safeId(formId)) return false;
  try {
    storage.setItem(LAST_VIEW_KEY, JSON.stringify({ id, formId }));
    return true;
  } catch {
    return false;
  }
}

/** Prefer a complete sentence, then truncate by Unicode code point if necessary. */
export function shortDescription(text, maxLength = 56) {
  const limit = Number.isFinite(maxLength) ? Math.max(0, Math.floor(maxLength)) : 56;
  if (!limit) return '';
  const characters = Array.from(String(text ?? '').trim());
  let sentence = characters;
  for (let i = 0; i < characters.length; i++) {
    const character = characters[i];
    if (!/[。！？!?\.]/u.test(character)) continue;
    if (character === '.' && /\d/.test(characters[i - 1] ?? '') && /\d/.test(characters[i + 1] ?? '')) continue;
    let end = i + 1;
    while (end < characters.length && /[。！？!?\."'”’」』）)]/u.test(characters[end])) end++;
    sentence = characters.slice(0, end);
    break;
  }
  return sentence.length <= limit ? sentence.join('') : `${sentence.slice(0, limit - 1).join('')}…`;
}

/** Accept exactly one safely decoded identifier after the detail permalink prefix. */
export function pokemonIdFromHash(hash) {
  if (typeof hash !== 'string' || !hash.startsWith('#pokemon/')) return null;
  try {
    const id = decodeURIComponent(hash.slice('#pokemon/'.length));
    return safeId(id) ? id : null;
  } catch {
    return null;
  }
}
