import test from 'node:test';
import assert from 'node:assert/strict';
import { posterThemeProfile } from '../poster-theme-profile.mjs';
import { rankPosterPhotos, posterPhotos } from '../poster-photos.mjs';
import { announcementFacts } from '../announcement-facts.mjs';
import { nextDesign } from '../announcement-poster.mjs';

test('撮影会の基本衣装とオプションを分け、会場の雰囲気を背景の選択に使う', () => {
  const event = {title:'個人撮影会',venue:'Gallery-O17 MADEMOISELLE',details:'料金：私服10,000円。オプション：水着＋5,000円。'};
  const profile = posterThemeProfile(event);
  assert.deepEqual(profile,{outfit:'casual',optionSwim:true,scene:'luxury'});
  const casual = {src:'casual',outfits:['casual'],scenes:[]};
  const candidates = rankPosterPhotos([...posterPhotos,casual],profile);
  assert.equal(candidates[0],casual);
  assert.ok(candidates[1].outfits.includes('swim'));
  assert.ok(['champagne','goldCurtains','velvetHotel','roseLights','pearlRibbon'].includes(nextDesign(event).key));
});

test('水着不可を水着オプションと誤認せず、合う写真がなければ候補を広げない', () => {
  const profile = posterThemeProfile({title:'私服撮影会',details:'オプション：水着撮影不可。'});
  assert.equal(profile.optionSwim,false);
  assert.deepEqual(rankPosterPhotos(posterPhotos,profile),[]);
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
