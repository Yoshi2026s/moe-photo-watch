import { dayParts } from './event-date.mjs';

export function jstTime(value) {
  if (typeof value !== 'string' || !/^\d{4}\/\d{2}\/\d{2} ([01]\d|2[0-3]):[0-5]\d$/.test(value) || !dayParts(value.slice(0, 10))) return NaN;
  return Date.parse(value.replaceAll('/', '-').replace(' ', 'T') + ':00+09:00');
}

export function slotConfirmation(event) {
  const checked = event.slots_checked_at === undefined ? event.checked_at : event.slots_checked_at;
  return Number.isFinite(jstTime(checked)) ? checked + '（日本時間）' : '未確認';
}

export function nextBookingChange(event, now) {
  const times = [jstTime(event.booking_opens_at), jstTime(event.booking_closes_at), jstTime(event.date + ' 00:00') + 86400000];
  return Math.min(Infinity, ...times.filter(at => at > now));
}

export function slotBadge(value, eventKind) {
  const status = typeof value === 'string' ? value.trim().normalize('NFKC') : '';
  if (/^(?:空き|空きあり|予約可|予約可能|予約受付中|○|〇|◯)$/.test(status)) return { label: '空き', variant: 'available' };
  if (/^(?:予約済み?|満枠|満席|完売|sold\s*out(?:\s*\(満枠\))?)$/i.test(status)) return { label: '予約済', variant: 'unavailable' };
  if (/^×(?:\(公式表示\))?$/.test(status)) {
    return { label: !eventKind || eventKind === 'individual_photo' ? '予約済' : '×（公式表示）', variant: 'unavailable' };
  }
  if (/^(?:予約不可|受付終了|予約受付終了|キャンセル待ち)$/.test(status)) return { label: status, variant: 'unavailable' };
  return { label: '未確認', variant: 'unknown' };
}

export function unavailableSlotsSummary(slots, eventKind) {
  const badges = slots.map(slot => slotBadge(slot.status, eventKind));
  if (!badges.length || badges.some(badge => badge.variant !== 'unavailable')) return '';
  return badges.every(badge => badge.label === '予約済') ? '掲載枠はすべて予約済' : '掲載枠に空きなし';
}

export function bookingState(event, now = Date.now()) {
  const status = typeof event.status === 'string' ? event.status.trim() : '';
  const past = jstTime(event.date + ' 00:00') + 86400000 <= now;
  const closed = /^(?:(?:予約(?:の)?)?受付(?:は|を)?終了|予約締切済み|予約終了)(?:です|しました|いたしました)?(?:[（(](?:開催日経過|主催者発表|公式発表)[）)])?[。！!\s]*$/.test(status)
    || now >= jstTime(event.booking_closes_at);
  const reservedEvent = event.kind === 'individual_photo' || status === '予約受付中'
    || Number.isFinite(jstTime(event.booking_opens_at)) || Array.isArray(event.slots) && event.slots.some(s => s?.label);
  const cancelled = /^(?:開催中止|出演中止)(?:です|となりました|が決定しました)?(?:$|[（(。！!\s])/.test(status);
  if (cancelled) return { label: status + ((closed || reservedEvent) && !status.includes('受付終了') ? '（予約受付終了）' : ''), slotMode: 'record', inactive: true, cancelled };
  if (/^予約不要[。！!\s]*$/.test(status)) return { label: past ? '開催日経過（予約不要）' : '予約不要', slotMode: 'omit', inactive: past };
  if (past || closed) {
    const label = closed || reservedEvent ? '予約受付終了' + (past ? '（開催日経過）' : '') : '開催日経過';
    return { label, slotMode: 'record', inactive: true };
  }
  if (/^(?:満枠|満席|完売|キャンセル待ち)$/.test(status)) return { label: status, slotMode: 'record' };
  if (jstTime(event.booking_opens_at) > now && status !== '予約受付中') {
    const opens = event.booking_opens_at;
    return { label: '予約受付開始　' + dayParts(opens.slice(0, 10)).label + ' ' + opens.slice(11), slotMode: 'record', pending: true };
  }
  return { label: status === '予約受付中' ? status : '', slotMode: 'current' };
}
