const kimonoScenes = { portrait:['retro'], garden:['outdoor','flower','retro'], yukata:['retro'], tatami:['retro'] };

export const posterPhotos = [
  ['portrait', '和装・縁側', 'kimono'],
  ['garden', '和装・庭園', 'outdoor'],
  ['yukata', '和装・室内', 'kimono'],
  ['tatami', '和装・畳の間', 'kimono'],
  ['amber-wide', 'アンバースタジオ・ワイド', 'warm'],
  ['amber-portrait', 'アンバースタジオ・ポートレート', 'warm'],
  ['amber-lounge', 'アンバースタジオ・ラウンジ', 'warm'],
  ['amber-closeup', 'アンバースタジオ・アップ', 'warm'],
  ['amber-green', 'アンバースタジオ・グリーン', 'warm'],
  ['blue-ribbon', 'ブルーリボン・ポートレート', 'cute'],
  ['blue-ribbon-green', 'ブルーリボン・グリーン', 'cute'],
  ['blue-ribbon-red', 'ブルーリボン・レッド', 'cute'],
  ['white-studio', 'ホワイト・スタジオ', 'cool'],
  ['white-sofa', 'ホワイト・ソファ', 'cool'],
  ['white-garden', 'ホワイト・グリーン', 'cool'],
  ['gray-studio', 'グレー・スタジオ', 'cool'],
  ['gray-closeup', 'グレー・アップ', 'cool'],
  ['window', '窓辺・全身', 'warm'],
  ['window-portrait', '窓辺・ポートレート', 'warm']
].map(([name,label,tag]) => ({
  name, label, src:'photos/' + name + '.webp',
  outfits:kimonoScenes[name] ? ['kimono'] : name.startsWith('blue-ribbon') ? ['animal','swim'] : ['swim'],
  scenes:kimonoScenes[name] || (name.startsWith('window') ? ['retro','luxury']
    : tag === 'warm' ? ['luxury','night']
    : name.startsWith('gray') ? ['monochrome','night'] : ['light','pool'])
}));

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
