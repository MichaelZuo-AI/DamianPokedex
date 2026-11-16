import { IMAGE_ASSETS as imageMap } from './image-map.mjs';

/** Original upstream URLs remain provenance; image requests stay on this site. */
export function imageSrc(source, size = 'main') {
  const assetId = Object.hasOwn(imageMap, source) ? imageMap[source] : null;
  if (!assetId) return 'assets/pokeball.svg';
  const suffix = size === 160 || size === 240 ? `-${size}` : '';
  return `assets/pokemon/${assetId}${suffix}.webp`;
}
