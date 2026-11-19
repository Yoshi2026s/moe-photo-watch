import library from './photo-library.mjs?v=c51387c062e06f5b';

export const posterPhotos = library.map(([name, label, outfits, scenes]) => ({name, label, src:'photos/' + name + '.webp', outfits, scenes}));

export function filterPosterPhotos(photos, query, outfit) {
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase('ja');
  const term = normalize(query.trim());
  return photos.filter(photo =>
    (!outfit || photo.outfits.includes(outfit)) && normalize(photo.label).includes(term));
}

export function rankPosterPhotos(photos, profile, previous, allowMismatch = false) {
  const { outfit, optionSwim, scene } = profile;
  const scored = photos.map(photo => {
    const matches = outfit && photo.outfits.includes(outfit);
    const swim = photo.outfits.includes('swim');
    const permitted = matches || !outfit || (optionSwim && swim);
    const score = (matches ? 40 : (optionSwim && swim ? 20 : 0))
      + (scene && photo.scenes.includes(scene) ? 8 : 0)
      + (!outfit && !optionSwim && !swim ? 12 : 0)
      + (photo.file ? 1 : 0);
    return { photo, score, permitted, priority: score - (photo.src === previous ? 2 : 0) + Math.random() };
  });
  return scored.filter(item => allowMismatch || item.permitted)
    .sort((a,b) => Number(b.permitted) - Number(a.permitted) || b.priority - a.priority)
    .map(item => item.photo);
}
