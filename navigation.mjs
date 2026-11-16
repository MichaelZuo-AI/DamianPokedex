/** Each pushed detail entry records its distance to the original catalogue. */
export function openDetailState(currentState, currentHash, sessionId) {
  const inSession = currentHash.startsWith('#pokemon/') && Number.isSafeInteger(currentState?.pokedexDepth) && currentState.pokedexDepth > 0;
  return { pokedexSession: inSession ? currentState.pokedexSession : sessionId, pokedexDepth: inSession ? currentState.pokedexDepth + 1 : 1 };
}

/** A direct permalink has no catalogue history to unwind. */
export function detailCloseAction(currentState) {
  const depth = currentState?.pokedexDepth;
  return Number.isSafeInteger(depth) && depth > 0 ? { back: depth } : { replaceHash: '#explore' };
}
