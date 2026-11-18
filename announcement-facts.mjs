import { dayParts } from './event-date.mjs';
const clean = value => typeof value === 'string' ? value.trim() : '';

function jstTime(value) {
  if (!/^\d{4}\/\d{2}\/\d{2} ([01]\d|2[0-3]):[0-5]\d$/.test(value) || !dayParts(value.slice(0, 10))) return NaN;
  return Date.parse(value.replaceAll('/', '-').replace(' ', 'T') + ':00+09:00');
}

function booking(event, now) {
  const status = clean(event.status);
  const past = dayParts(event.date) && jstTime(event.date + ' 00:00') + 86400000 <= now;
  const cancelled = /^(?:開催中止|出演中止)/.test(status);
  const noBooking = /^予約不要[。！!？\s]*$/.test(status);
  const closed = /^(?:(?:予約(?:の)?)?受付(?:は)?(?:を)?終了|予約締切済み|予約終了)(?:です|しました|いたしました)?(?:[。（(！!\s]|$)/.test(status)
    || now >= jstTime(event.booking_closes_at);
  if (cancelled) return { label: status + (closed || (!event.kind || event.kind === 'individual_photo') ? '（予約受付終了）' : ''), inactive: true };
  if (noBooking) return { label: past ? '開催日経過（予約不要）' : '予約不要', inactive: !!past };
  if (past || closed) return { label: '予約受付終了' + (past ? '（開催日経過）' : ''), inactive: true };
  if (jstTime(event.booking_opens_at) > now && status !== '予約受付中') {
    return { label: '予約受付開始　' + dayParts(event.booking_opens_at.slice(0, 10)).label + ' ' + event.booking_opens_at.slice(11), pending: true };
  }
  if (/^(?:予約受付中|満枠|満席|完売|キャンセル待ち)$/.test(status)) return { label: status };
  return { label: '' };
}

function officialUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

export function announcementFacts(event, now = Date.now()) {
  const date = dayParts(event.date);
  const state = booking(event, now);
  const checked = Number.isFinite(jstTime(event.checked_at)) ? event.checked_at : '';
  const rows = [];
  const slots = (Array.isArray(event.slots) ? event.slots : []).filter(slot => clean(slot?.label));
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
    const lines = ordered.map(({slot, time}) => [clean(slot.label), time || '時間未確認', clean(slot.status) || '未確認'].join('　'));
    rows.push([state.inactive || state.pending ? '予約枠（確認時点の記録）' : '予約枠（確認時点）', lines.join('\n')]);
  } else if (!/予約不要|中止/.test(state.label)) {
    rows.push(['予約枠', '枠ごとの状況は未確認']);
  }
  let note = '';
  if (!state.inactive) {
    if (state.label === '予約不要') note = '当日の参加方法は主催者の案内をご覧ください。';
    else if (state.pending) note = 'お申し込みは受付開始日時をご確認ください。';
    else if (slots.length) note = 'ご希望の部の時間と最新の受付状況を、公式案内でご確認ください。';
    else if (event.kind === 'event') note = '参加方法と当日の進行は公式案内をご覧ください。';
    else note = '詳しい開催内容は公式案内をご覧ください。';
  }
  const source = officialUrl(event.url) || (event.sources || []).map(s => officialUrl(s?.url)).find(Boolean) || '';
  const dateLabel = date?.label || '開催日未確認';
  const text = [title.includes('雪餅羽もえ') ? title : '雪餅羽もえ｜' + title, dateLabel,
    ...rows.map(([label, value]) => label.startsWith('予約枠') ? '【' + label + '】\n' + value : label + '：' + value),
    checked && '情報確認：' + checked + '（日本時間）', note, source && '公式案内：' + source, '#雪餅羽もえ'
  ].filter(Boolean).join('\n');
  return { title, dateLabel, month: date?.month, rows, note, checked, source, text };
}
