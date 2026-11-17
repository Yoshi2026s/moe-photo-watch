'use strict';
const events = document.querySelector('#events'), updated = document.querySelector('#updated'), refresh = document.querySelector('#refresh');
const filters = document.querySelector('#filters');
const query = document.querySelector('#query');
const period = document.querySelector('#period');
let snapshot;
let hasData = false, lastConfirmation = '';
function element(tag, text, cls) { const e = document.createElement(tag); e.textContent = text; if (cls) e.className = cls; return e; }
function safeUrl(s) { try { const u = new URL(s); return u.protocol === 'https:' ? u.href : null; } catch { return null; } }
function todayJst() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
function dateKey(date) {
  return typeof date === 'string' && /^\d{4}\/\d{2}\/\d{2}$/.test(date) ? date.replaceAll('/', '-') : '9999';
}
function slotBadge(value) {
  const status = typeof value === 'string' ? value.trim().normalize('NFKC') : '';
  if (/^(?:空き|空きあり|予約可|予約可能|予約受付中|○|〇|◯)$/.test(status)) {
    return { label: '空き', variant: 'available' };
  }
  if (/^(?:予約不可|満枠|満席|受付終了|×(?:\(公式表示\))?)$/.test(status)) {
    return { label: '予約不可', variant: 'unavailable' };
  }
  return { label: '未確認', variant: 'unknown' };
}
function renderSlots(slots, past) {
  const valid = Array.isArray(slots) ? slots.filter(slot =>
    slot && typeof slot.label === 'string' && slot.label.trim()
  ) : [];
  const section = element('div', '', 'reservation-slots');
  section.append(element('h4', past ? '予約枠（掲載時点）' : '予約枠ごとの状況'));
  if (!valid.length) {
    section.append(element('p', '枠ごとの情報は未確認です。'));
    return section;
  }
  const list = element('ul', '', 'slot-list');
  for (const slot of valid) {
    const timing = typeof slot.time === 'string' && slot.time ? slot.time : '時間未確認';
    const status = slotBadge(slot.status);
    const row = element('li', '', 'slot-row');
    row.append(element('strong', slot.label), element('span', timing), element('span', status.label, 'slot-status slot-status--' + status.variant));
    list.append(row);
  }
  section.append(list);
  return section;
}
function show(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.events) || data.events.some(item => !item || typeof item !== 'object' || Array.isArray(item))) throw Error('Invalid data');
  const today = todayJst();
  const past = period.value === 'past';
  const term = query.value.trim().normalize('NFKC').toLocaleLowerCase('ja');
  const list = data.events.filter(item => {
    const isPast = dateKey(item.date) < today;
    const searchText = [item.title, item.venue, item.date].join(' ').normalize('NFKC').toLocaleLowerCase('ja');
    return isPast === past && searchText.includes(term);
  });
  list.sort((a, b) => (past ? -1 : 1) * dateKey(a.date).localeCompare(dateKey(b.date)));
  events.replaceChildren();
  updated.textContent = data.updated_at ? '掲載情報の最終確認：' + data.updated_at + '（日本時間）' : '掲載情報の最終確認：未確認';
  if (!list.length) { const box = element('div', '', 'empty'); box.append(element('strong', term ? '検索条件に一致する予定がありません' : past ? '過去の掲載分はありません' : 'これからの掲載予定はありません'), element('span', '公式ページから最新情報をご確認ください。')); events.append(box); return; }
  for (const item of list) {
    const isToday = dateKey(item.date) === today;
    const checked = typeof item.checked_at === 'string' && /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/.test(item.checked_at) ? Date.parse(item.checked_at.replaceAll('/', '-').replace(' ', 'T') + ':00+09:00') : NaN;
    const card = element('article', '', 'card');
    card.append(element('div', (isToday ? '本日 · ' : '') + (item.date || '開催日：未確認'), 'date'), element('h3', item.title || '撮影会'), element('span', past ? '開催日経過' : item.status || '予約状況：未確認', 'badge'));
    if (item.venue) card.append(element('p', '会場：' + item.venue));
    if (item.details) card.append(element('p', item.details));
    card.append(renderSlots(item.slots, past));
    card.append(element('p', '確認日時：' + (item.checked_at || '未確認') + (item.checked_at ? '（日本時間）' : ''), 'meta'));
    if (!past) card.append(element('p', Number.isFinite(checked) && Date.now() - checked >= 86400000 ? '確認から24時間以上経過しています。最新の状況は公式ページへ。' : '最新の予約状況は公式ページへ。', 'meta'));
    const url = safeUrl(item.url);
    if (url) { const a = element('a', '公式ページを見る ↗', 'official'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; card.append(a); }
    events.append(card);
  }
}
async function load() {
  refresh.disabled = true;
  try { const r = await fetch('data/events.json', { cache: 'no-store' }); if (!r.ok) throw Error('HTTP ' + r.status); const data = await r.json(); show(data); snapshot = data; filters.hidden = false; hasData = true; lastConfirmation = updated.textContent; }
  catch { if (!hasData) { events.replaceChildren(element('div', '情報を読み込めませんでした。時間をおいて再度お試しください。', 'empty')); updated.textContent = '掲載情報の最終確認：未確認'; } else { updated.textContent = lastConfirmation + '　更新に失敗しました。表示中の情報は前回読み込んだものです。公式ページをご確認ください。'; } }
  finally { refresh.disabled = false; }
}
function applyFilters() {
  if (!snapshot) return;
  const message = updated.textContent;
  show(snapshot);
  updated.textContent = message;
}
query.addEventListener('input', applyFilters);
period.addEventListener('change', applyFilters);
refresh.addEventListener('click', load);
load();
