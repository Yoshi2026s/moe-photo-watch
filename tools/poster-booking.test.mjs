import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmedEvent, matchPublishedEvent, readSlotLines } from '../poster-booking.mjs';
import { announcementFacts } from '../announcement-facts.mjs';

const now = Date.parse('2026-11-19T00:24:00+09:00');
const item = { title:'個人撮影会',date:'2026/11/21',url:'https://example.org/1',
  status:'予約受付終了',booking_closes_at:'2026/11/18 23:00',slots:[{label:'第1部',status:'予約済'}] };

test('公式表の全角時刻と部番号を読み、1行でも不正なら部分的な結果を採用しない', () => {
  const rows = readSlotLines('第３部 １３：１０～１４：００（個）×\n4部 14:20-15:10 ○');
  assert.deepEqual(rows, [
    {label:'第3部',time:'13:10〜14:00',status:'×（公式表示）'},
    {label:'第4部',time:'14:20〜15:10',status:'空き'}
  ]);
  for (const text of ['','第1部','第1部 10:00〜10:40','第1部 11:00〜10:00 ○','第1部 ○\n第1部 ×','第1部 ○\n時間調整中']) {
    assert.equal(readSlotLines(text),null,text);
  }
});

test('手動確認が前回の受付・時刻・予約枠に優先し、開催情報の確認日は保持する', () => {
  const updated = confirmedEvent({...item,checked_at:'2026/11/16 12:00'},'',readSlotLines('第2部 15:00〜16:00 ○'),now);
  assert.equal(updated.slots_checked_at,'2026/11/19 00:24');
  assert.equal(updated.checked_at,'2026/11/16 12:00');
  const facts = announcementFacts(updated,now);
  assert.equal(facts.banner,'空き1枠');
  assert.doesNotMatch(facts.text,/第1部|予約受付終了/);
  for (const status of ['予約不要','空き状況の公表なし','予約受付開始前','出演中止']) {
    const manual = announcementFacts(confirmedEvent(item,status,[],now),now);
    assert.ok(manual.text.includes(status));
    assert.doesNotMatch(manual.text,/第1部|枠ごとの状況は未確認/);
  }
});

test('掲載回の消失・曖昧な一致を検知し、同名の別日や別URLを取り込まない', () => {
  const other = {...item,url:'https://example.org/2'};
  assert.equal(matchPublishedEvent(item,[other,item]),item);
  assert.throws(() => matchPublishedEvent(item,[{...item,date:'2026/12/21'}]));
  assert.throws(() => matchPublishedEvent(item,[item,item]));
  assert.throws(() => matchPublishedEvent(item,null));
});
