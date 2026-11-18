import { bookingState, jstTime, slotBadge } from './reservation.mjs';
import { dayParts } from './event-date.mjs';
const clean = value => typeof value === 'string' ? value.trim() : '';

function officialUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

export function announcementFacts(event, now = Date.now()) {
  const date = dayParts(event.date);
  const state = bookingState(event, now);
  const checked = Number.isFinite(jstTime(event.checked_at)) ? event.checked_at : '';
  const rows = [];
  const slots = state.slotMode === 'omit' ? [] : (Array.isArray(event.slots) ? event.slots : []).filter(slot => clean(slot?.label));
  const title = clean(event.title) || '雪餅羽もえの出演情報';
  if (clean(event.venue)) rows.push(['会場', clean(event.venue)]);
  const time = clean(event.time);
  if (time) rows.push(['開催時間', time]);
  if (state.label) rows.push(['受付', state.label]);
  let detailRow;
  for (const part of clean(event.details).split('。').map(s => s.trim()).filter(Boolean)) {
    const match = part.match(/^(料金|参加料金|オプション(?:料金)?|中止条件)[：:](.+)$/);
    if (match) {
      detailRow = [match[1] === '料金' ? '参加料金' : match[1], match[2]];
      rows.push(detailRow);
    } else if (detailRow) {
      detailRow[1] += '。' + part;
    } else {
      detailRow = ['補足',part];
      rows.push(detailRow);
    }
  }
  if (!state.inactive && clean(event.highlight)) rows.push(['撮影会について',clean(event.highlight)]);
  if (slots.length) {
    const ordered = slots.map(slot => {
      const time = clean(slot.time);
      const start = time.normalize('NFKC').match(/^(\d{1,2}):([0-5]\d)/);
      return { slot, time, start: start ? Number(start[1]) * 60 + Number(start[2]) : Infinity };
    }).sort((a, b) => a.start - b.start);
    const lines = ordered.map(({slot, time}) => [clean(slot.label), time || '時間未確認', slotBadge(slot.status).label].join('　'));
    rows.push([state.slotMode === 'record' ? '予約枠（確認時点の記録）' : '予約枠（確認時点）', lines.join('\n')]);
  } else if (state.slotMode !== 'omit' && !state.cancelled && (!event.kind || event.kind === 'individual_photo')) {
    rows.push(['予約枠', '枠ごとの状況は未確認']);
  }
  let note = '';
  if (!state.inactive) {
    if (state.label === '予約不要') note = '当日の参加方法は主催者の案内をご覧ください。';
    else if (state.pending) note = 'お申し込みは受付開始日時をご確認ください。';
    else if (state.slotMode === 'record') note = '受付状況と参加条件は主催者の案内をご確認ください。';
    else if (slots.length) note = 'ご希望の部の時間と最新の受付状況を、公式案内でご確認ください。';
    else if (event.kind === 'event') note = '参加方法と当日の進行は公式案内をご覧ください。';
    else note = '詳しい開催内容は公式案内をご覧ください。';
  }
  const source = officialUrl(event.url) || (Array.isArray(event.sources) ? event.sources : []).map(s => officialUrl(s?.url)).find(Boolean) || '';
  const dateLabel = date?.label || '開催日未確認';
  const openSlots = slots.filter(slot => slotBadge(slot.status).variant === 'available').length;
  let banner = state.pending ? '予約受付開始予定' : state.label;
  if (!banner && openSlots) banner = '空き' + openSlots + '枠（確認時点）';
  if (!banner && slots.length && slots.every(slot => slotBadge(slot.status).variant === 'unavailable')) banner = '掲載枠は予約不可（確認時点）';
  const name = title.includes('雪餅羽もえ') ? title : '雪餅羽もえ｜' + title;
  const text = [
    [dateLabel, name].join('\n'),
    rows.map(([label, value]) => label.startsWith('予約枠') ? '【' + label + '】\n' + value : label + '：' + value).join('\n'),
    [note, checked && '情報確認：' + checked + '（日本時間）'].filter(Boolean).join('\n'),
    source && '主催者の公式案内\n' + source,
    'もえのリンク集\nhttps://lit.link/nowan_moe0121',
    '#雪餅羽もえ'
  ].filter(Boolean).join('\n\n');
  return { title, dateLabel, day: date, month: date?.month, rows, banner, note, checked, source, text };
}
