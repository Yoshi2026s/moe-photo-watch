import test from 'node:test';
import assert from 'node:assert/strict';
import { announcementFacts, announcementSkillPrompt } from '../announcement-facts.mjs';
import { bookingState, slotBadge } from '../reservation.mjs';
import { nextDesign, posterLayouts, posterThemeGroups, posterThemes, posterVariant } from '../announcement-poster.mjs';
import { backgroundPatterns, posterPatternKey } from '../poster-patterns.mjs';

const event = {title:'撮影会',date:'2026/11/21',checked_at:'2026/11/17 12:30',
  details:'料金：各部12,000円、会場代1,000円。オプション：水着＋5,000円。',
  slots:[{label:'第2部',time:'15:00〜16:00',status:'予約不可'},{label:'第1部',time:'13:00〜14:00',status:'未確認'}]};
const at = time => Date.parse(time + '+09:00');

test('告知依頼文は対象回・制作指定・本人リンクを引き継ぎ、出典URLを載せない', () => {
  const url = 'https://example.org/event/21';
  const post = 'https://example.org/performer/post/5';
  const item = {...event,url:post,sources:[{kind:'official_post',url:post},{kind:'official_page',url}]};
  const prompt = announcementSkillPrompt(item,at('2026-11-18T12:00'));
  for (const part of ['create-moe-photo-announcements','本人の写真','9:16','11月21日（土）',item.title,
    'https://lit.link/nowan_moe0121','確認日時、出典']) assert.ok(prompt.includes(part),part);
  assert.doesNotMatch(prompt,/example\.org|最終確認|情報確認|開催情報の掲載元/);
  const postOnly = announcementSkillPrompt({...item,sources:[{kind:'official_post',url:post}]});
  assert.doesNotMatch(postOnly,/example\.org|開催情報の掲載元/);
});

test('日本時間の受付開始・締切ちょうどで表示を切り替える', () => {
  const timed = {...event,booking_opens_at:'2026/11/18 20:00',booking_closes_at:'2026/11/20 22:00'};
  assert.match(announcementFacts(timed,at('2026-11-18T19:59')).text,/予約受付開始　2026年11月18日（水） 20:00/);
  assert.doesNotMatch(announcementFacts(timed,at('2026-11-18T20:00')).text,/受付開始|受付終了/);
  assert.match(announcementFacts(timed,at('2026-11-20T22:00')).text,/予約受付終了/);
});
test('過去・公式締切・予約不要・中止・全枠不可を区別する', () => {
  const now = at('2026-11-18T14:00');
  const text = (status, other = {}) => announcementFacts({...event,status,...other},now).text;
  assert.match(text('予約受付終了'),/予約受付終了/);
  assert.match(text('予約受付中',{date:'2026/11/17'}),/予約受付終了（開催日経過）/);
  assert.doesNotMatch(text('予約不要',{date:'2026/11/17',slots:[]}),/予約受付終了|枠ごと/);
  assert.match(text('開催中止'),/開催中止/);
  assert.doesNotMatch(text('開催中止'),/ご希望の部/);
  const full = text('2枠とも×・予約不可',{slots:event.slots.map(s=>({...s,status:'予約不可'}))});
  assert.doesNotMatch(full,/受付終了|満枠|予約済み/);
});
test('料金・日付・全枠を保ち、未確認の詳細やURLを補わない', () => {
  const facts = announcementFacts({...event,url:'javascript:alert(1)'},at('2026-11-18T14:00'));
  for (const part of ['11月21日（土）','会場代1,000円','水着＋5,000円','第1部　13:00〜14:00　未確認','第2部　15:00〜16:00　予約不可']) assert.ok(facts.text.includes(part),part);
  assert.ok(facts.text.indexOf('第1部') < facts.text.indexOf('第2部'));
  assert.doesNotMatch(facts.text,/javascript:|2026\/11\/17 12:30/);
  assert.doesNotMatch(announcementFacts({title:'予定',date:'2026/02/31',booking_opens_at:'2026/02/31 20:00'}).text,/月31日|受付開始|無料/);
  let design;
  for (let i=0; i<16; i++) {
    const next = nextDesign(facts,design);
    assert.notEqual(next.id,design?.id);
    design = next;
  }
});


test('×・満席・締切の根拠を区別し、予約不要の予定には古い枠を出さない', () => {
  const now = at('2026-11-18T14:00');
  const slots = [{label:'第1部',status:'空き'}];
  for (const [raw, label] of [['予約不可','予約不可'],['受付終了','受付終了'],['キャンセル待ち','キャンセル待ち']]) {
    assert.deepEqual(slotBadge(raw), {label, variant:'unavailable'});
  }
  for (const status of ['予約受付終了','満席','キャンセル待ち','開催中止']) {
    const data = {...event,status,slots};
    assert.equal(bookingState(data,now).slotMode,'record');
    assert.match(announcementFacts(data,now).text,/予約枠（記録）】\n第1部　時間未確認　空き/);
    assert.doesNotMatch(announcementFacts(data,now).banner,/空き/);
  }
  const free = announcementFacts({...event,status:'予約不要',slots,url:'https://example.org/events/1'},now);
  assert.equal(free.banner,'予約不要');
  assert.doesNotMatch(free.text,/予約枠|第1部|空き/);
  assert.doesNotMatch(free.text,/example\.org/);
  assert.match(free.text,/\nhttps:\/\/lit.link\/nowan_moe0121\n/);
  assert.equal(bookingState({date:'2026/11/17',status:'未確認'},now).label,'開催日経過');
  assert.equal(bookingState({...event,status:'予約不要？'},now).label,'');
  assert.equal(announcementFacts({...event,slots},now).banner,'空き1枠');
});

test('埋まった枠は予約済と表記し、個別の予約とイベント全体の締切を区別する', () => {
  const now = at('2026-11-18T14:00');
  for (const raw of ['予約済','予約済み','満枠','満席','完売','SOLD OUT（満枠）','×','×（公式表示）']) {
    assert.deepEqual(slotBadge(raw), {label:'予約済',variant:'unavailable'});
  }
  assert.equal(slotBadge('×（公式表示）', 'individual_photo').label, '予約済');
  assert.equal(slotBadge('×（公式表示）', 'group_photo').label, '×');
  const slots = event.slots.map(slot => ({...slot,status:'×（公式表示）'}));
  const full = announcementFacts({...event,slots},now);
  assert.equal(full.banner,'掲載枠はすべて予約済');
  assert.match(full.text,/第1部　13:00〜14:00　予約済\n/);
  assert.doesNotMatch(full.text,/予約不可|予約済み|受付終了/);
  const mixed = announcementFacts({...event,slots:[slots[0],{...slots[1],status:'受付終了'}]},now);
  assert.doesNotMatch(mixed.banner,/すべて予約済/);
  const closed = announcementFacts({...event,kind:'individual_photo',slots,status:'予約受付終了'},now);
  assert.equal(closed.banner,'予約受付終了');
  assert.match(closed.text,/第1部　13:00〜14:00　予約済\n/);
});

test('日時や出典が入力にあっても、告知画像用の行と投稿文には予約枠の内容だけを渡す', () => {
  const now = at('2026-11-18T14:00');
  const url = 'https://example.org/event/21';
  const withSlotCheck = announcementFacts({...event,slots_checked_at:'2026/11/16 08:10',url,
    sources:[{kind:'official_page',url}]},now);
  assert.deepEqual(withSlotCheck.rows.find(([label]) => label === '予約枠'),['予約枠',
    '第1部　13:00〜14:00　未確認\n第2部　15:00〜16:00　予約不可']);
  assert.doesNotMatch(withSlotCheck.text,/最終確認|情報確認|掲載元|2026\/11\/(16|17)|example\.org/);
});

test('告知デザインを指定すると選んだ系統の中で切り替わる', () => {
  for (const theme of Object.keys(posterThemes)) {
    const first = nextDesign({title:'春の撮影会',month:4},null,theme);
    const next = nextDesign({title:'春の撮影会',month:4},first,theme);
    assert.equal(first.key,theme);
    assert.equal(next.key,theme);
    assert.notEqual(next.id,first.id);
  }
});

test('各系統を一つの雰囲気に割り当て、配色・配置・反転を個別に選べる', () => {
  const keys = Object.values(posterThemeGroups).flat();
  assert.deepEqual(keys.slice().sort(),Object.keys(posterThemes).sort());
  const variants = keys.flatMap(key => Object.keys(posterLayouts).flatMap(layout =>
    posterThemes[key].palettes.flatMap((colors,index) => [false,true].map(left => {
      const variant = posterVariant(key,index,left,layout);
      assert.equal(variant.colors,colors);
      assert.equal(variant.layout,layout);
      assert.equal(variant.left,left);
      return variant.id;
    }))));
  assert.equal(new Set(variants).size,Object.keys(posterThemes).length*24);
});

test('保存した見本のテーマを雰囲気で絞り込め、おまかせで撮影内容に応じて選べる', t => {
  t.mock.method(Math,'random',() => 0);
  assert.equal(posterThemeGroups['保存した見本'].length,16);
  assert.equal(nextDesign({title:'学園ポートレート撮影会',month:11}).key,'chalkboard');
  assert.equal(nextDesign({title:'夜のイルミネーション撮影会',month:11}).key,'lanternNight');
  assert.equal(nextDesign({title:'撮影会',month:11},null,'retroDiner').shape,'tilt');
});

test('背景柄はテーマと配色に応じて選ばれ、個別指定と柄なしを優先する', () => {
  assert.equal(Object.keys(backgroundPatterns).length,18);
  for (const [key,pattern] of [['champagne','jewels'],['roseBouquet','bouquet'],['satinRibbon','ribbons'],['pearlRibbon','ribbons']]) {
    assert.equal(posterPatternKey(posterVariant(key)),pattern);
  }
  assert.equal(posterPatternKey(posterVariant('winterPetals',0)),'snow');
  assert.equal(posterPatternKey(posterVariant('winterPetals',1)),'lace');
  for (const key of Object.keys(posterThemes)) {
    for (let palette = 0; palette < 3; palette++) {
      assert.ok(Object.hasOwn(backgroundPatterns,posterPatternKey(posterVariant(key,palette))));
    }
  }
  const design = posterVariant('glamour');
  assert.equal(posterPatternKey({...design,backgroundPattern:'waves'}),'waves');
  assert.equal(posterPatternKey({...design,backgroundPattern:'none'}),'none');
});
