import test from 'node:test';
import assert from 'node:assert/strict';
import { announcementFacts } from '../announcement-facts.mjs';
import { nextDesign } from '../announcement-poster.mjs';

const event = {title:'撮影会',date:'2026/11/21',checked_at:'2026/11/17 12:30',
  details:'料金：各部12,000円、会場代1,000円。オプション：水着＋5,000円。',
  slots:[{label:'第2部',time:'15:00〜16:00',status:'予約不可'},{label:'第1部',time:'13:00〜14:00',status:'未確認'}]};
const at = time => Date.parse(time + '+09:00');

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
test('料金・日付・全枠・確認日時を保ち、未確認の詳細やURLを補わない', () => {
  const facts = announcementFacts({...event,url:'javascript:alert(1)'},at('2026-11-18T14:00'));
  for (const part of ['11月21日（土）','会場代1,000円','水着＋5,000円','第1部　13:00〜14:00　未確認','第2部　15:00〜16:00　予約不可','2026/11/17 12:30']) assert.ok(facts.text.includes(part),part);
  assert.ok(facts.text.indexOf('第1部') < facts.text.indexOf('第2部'));
  assert.equal(facts.source,'');
  assert.doesNotMatch(announcementFacts({title:'予定',date:'2026/02/31',booking_opens_at:'2026/02/31 20:00'}).text,/月31日|受付開始|無料/);
  let design;
  for (let i=0; i<16; i++) {
    const next = nextDesign(facts,design);
    assert.notEqual(next.id,design?.id);
    design = next;
  }
});
