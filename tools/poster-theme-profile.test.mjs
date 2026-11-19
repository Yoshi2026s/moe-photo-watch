import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { posterThemeProfile } from '../poster-theme-profile.mjs';
import { filterPosterPhotos, loadPosterSelection, rankPosterPhotos, posterPhotos } from '../poster-photos.mjs';
import { announcementFacts } from '../announcement-facts.mjs';
import { nextDesign } from '../announcement-poster.mjs';

test('自動選択は1枚か2枚を選び、手動で1枚選んだ場合は増やさない', async () => {
  const candidates = posterPhotos.slice(0,3);
  const load = async photo => photo.src;
  const sources = candidates.map(photo => photo.src);
  assert.deepEqual(await loadPosterSelection(candidates,load,{ auto:true, random:() => .5 }),sources.slice(0,1));
  assert.deepEqual(await loadPosterSelection(candidates,load,{ auto:true, random:() => 0 }),sources.slice(0,2));
  assert.deepEqual(await loadPosterSelection(candidates,load,{ random:() => 0 }),sources.slice(0,1));
});

test('読み込める異なる候補が2枚未満なら、残りの写真だけで作る', async () => {
  const [first,missing,last] = posterPhotos;
  const load = async photo => {
    if (photo.src === missing.src) throw new Error('Not found');
    return photo.src;
  };
  const options = { auto:true, random:() => 0 };
  assert.deepEqual(await loadPosterSelection([first,first,missing,last],load,options),[first.src,last.src]);
  assert.deepEqual(await loadPosterSelection([first,missing],load,options),[first.src]);
  assert.deepEqual(await loadPosterSelection([missing],load,options),[]);
  assert.deepEqual(await loadPosterSelection([],load,options),[]);
});

test('掲載写真を名前と衣装の両方で絞り込み、解除で元の候補を表示する', () => {
  const originalGallery = posterPhotos.filter(photo=>!photo.name.startsWith('chat-'));
  const search = (query, outfit) => filterPosterPhotos(originalGallery,query,outfit).map(photo=>photo.name);
  assert.deepEqual(search('　庭園 ', 'kimono'), ['garden']);
  assert.deepEqual(search('ﾌﾞﾙｰﾘﾎﾞﾝ', 'animal'), ['blue-ribbon','blue-ribbon-green','blue-ribbon-red',
    'blue-ribbon-hood','blue-ribbon-smile','blue-ribbon-side','blue-ribbon-sofa']);
  assert.deepEqual(search('庭園', 'swim'), []);
  assert.deepEqual(search('', 'kimono'), ['portrait','garden','yukata','tatami','floral-yukata']);
  assert.deepEqual(search('テラス','dress'), ['white-dress-terrace']);
  assert.equal(search('', '').length,86);
});

test('公開素材が重複なく写真一覧にあり、どの衣装の回でも手動で全枚を選べる', () => {
  const files = readdirSync(new URL('../photos/',import.meta.url)).sort();
  assert.equal(new Set(posterPhotos.map(photo=>photo.label)).size,posterPhotos.length);
  assert.equal(filterPosterPhotos(posterPhotos,'','').length,posterPhotos.length);
  assert.deepEqual(posterPhotos.map(photo=>photo.src).sort(),files.map(file=>'photos/' + file));
  const profile = posterThemeProfile({title:'浴衣撮影会'});
  const manual = rankPosterPhotos(posterPhotos,profile,undefined,true);
  assert.deepEqual(manual.map(photo=>photo.src).sort(),files.map(file=>'photos/' + file));
});

test('撮影会の基本衣装とオプションを分け、会場の雰囲気を背景の選択に使う', () => {
  const event = {title:'個人撮影会',venue:'Gallery-O17 MADEMOISELLE',details:'料金：私服10,000円。オプション：水着＋5,000円。'};
  const profile = posterThemeProfile(event);
  assert.deepEqual(profile,{outfit:'casual',optionSwim:true,scene:'luxury'});
  const candidates = rankPosterPhotos(posterPhotos,profile);
  const casualCount = posterPhotos.filter(photo=>photo.outfits.includes('casual')).length;
  assert.ok(casualCount > 0 && candidates.length > casualCount);
  assert.ok(candidates.slice(0,casualCount).every(photo=>photo.outfits.includes('casual')));
  assert.ok(candidates.slice(casualCount).every(photo=>photo.outfits.includes('swim')));
  assert.ok(['champagne','goldCurtains','velvetHotel','roseLights','pearlRibbon'].includes(nextDesign(event).key));
});

test('水着不可を水着オプションと誤認せず、合う写真がなければ候補を広げない', () => {
  const profile = posterThemeProfile({title:'私服撮影会',details:'オプション：水着撮影不可。'});
  assert.equal(profile.optionSwim,false);
  const casual = rankPosterPhotos(posterPhotos,profile);
  assert.ok(casual.length > 0 && casual.every(photo=>photo.outfits.includes('casual')));
  assert.deepEqual(rankPosterPhotos(posterPhotos.filter(photo=>!photo.outfits.includes('casual')),profile),[]);
  const garden = posterThemeProfile({title:'浴衣撮影会',venue:'庭園'});
  assert.ok(rankPosterPhotos(posterPhotos,garden).every(photo=>photo.outfits.includes('kimono')));
});

test('SNS投稿文は可愛い絵文字を少数添え、終了済みの予定や画像用情報の文字に混ぜない', () => {
  const event = {title:'花の撮影会',date:'2026/11/22',venue:'スタジオ'};
  const now = Date.parse('2026-11-19T08:00:00+09:00');
  const open = announcementFacts(event,now);
  assert.deepEqual(open.text.match(/\p{Extended_Pictographic}/gu),['🌸','💗']);
  assert.doesNotMatch(open.title,/\p{Extended_Pictographic}/u);
  assert.doesNotMatch(announcementFacts({...event,status:'開催中止'},now).text,/\p{Extended_Pictographic}/u);
});
