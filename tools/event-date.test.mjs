import assert from 'node:assert/strict';
import test from 'node:test';
import { dayParts } from '../event-date.mjs';

test('掲載日から曜日を求め、実在しない日付には曜日を付けない', () => {
  for (const [date, weekday] of [['2026/11/19', '木'], ['2026/11/21', '土'], ['2027/01/01', '金'], ['2028/02/29', '火']]) {
    assert.equal(dayParts(date).weekday, weekday);
  }
  for (const date of [null, '', '未確認', '2027/02/29', '2026/04/31', '2026/13/01']) {
    assert.equal(dayParts(date), null);
  }
});
