import { bookingState, jstTime, nextBookingChange, slotBadge, slotConfirmation, unavailableSlotsSummary } from './reservation.mjs?v=gallery-1';
import { dayParts } from './event-date.mjs';
import { element, makeCalendar } from './event-calendar.mjs?v=full-booking-2';
const events = document.querySelector('#events'), updated = document.querySelector('#updated'), refresh = document.querySelector('#refresh');
const filters = document.querySelector('#filters');
const query = document.querySelector('#query');
const period = document.querySelector('#period');
const viewPicker = document.querySelector('#event-view');
const detailDialog = document.querySelector('#event-detail');
const detailBody = detailDialog.querySelector('.detail-body');
const viewKey = 'moe-photo-watch.eventView';
let snapshot, detailItem, clockTimer, nextBoundary = Infinity;
let hasData = false, lastConfirmation = '';
function safeUrl(s) { try { const u = new URL(s); return u.protocol === 'https:' ? u.href : null; } catch { return null; } }
function todayJst() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
function dateKey(date) {
  return dayParts(date) ? date.replaceAll('/', '-') : '9999';
}
function searchTerm(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase('ja')
    .replace(/(\d+)[年/-](\d+)[月/-](\d+)日?/g, (_,year,month,day) => year + '/' + Number(month) + '/' + Number(day))
    .replace(/(\d+)[月/-](\d+)日?/g, (_,month,day) => Number(month) + '/' + Number(day));
}
function pastCutoff(today) {
  const [year, month, day] = today.split('-').map(Number);
  const first = new Date(Date.UTC(year, month - 4, 1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(day, lastDay));
  return first.toISOString().slice(0, 10);
}
function validSlots(slots) {
  return Array.isArray(slots) ? slots.filter(slot =>
    slot && typeof slot.label === 'string' && slot.label.trim()
  ) : [];
}

function isFullyBooked(item, state = bookingState(item), slots = validSlots(item.slots)) {
  if (state.inactive || state.pending || state.slotMode === 'omit') return false;
  if (/^(?:満枠|満席|完売)$/.test(state.label)) return true;
  return slots.length > 0 && slots.every(slot => slotBadge(slot.status, item.kind).label === '予約済');
}

function repeatsSlotStatus(status, slots) {
  if (!slots.length) return false;
  const summary = typeof status === 'string' ? status.trim() : '';
  const count = summary.match(/^(\d+)枠とも×・予約不可$/);
  const range = summary.match(/^第(\d+)〜(\d+)部：公式ページで×表示$/);
  const allUnavailable = slots.every(slot => slotBadge(slot.status).variant === 'unavailable');
  if (count) return allUnavailable && Number(count[1]) === slots.length;
  if (range) {
    const start = Number(range[1]);
    const labels = new Set(slots.map(slot => slot.label));
    return allUnavailable && Number(range[2]) - start + 1 === slots.length &&
      slots.every((_, index) => labels.has('第' + (start + index) + '部'));
  }
  return /^(?:各部の予約状況：)?未確認$|^予約状況：未確認$/.test(summary) &&
    slots.every(slot => slotBadge(slot.status).variant === 'unknown');
}

function cardDetails(details, slots) {
  if (typeof details !== 'string') return '';
  const times = slots.map(slot => slot.time);
  const first = times[0]?.split?.('〜');
  const last = times.at(-1)?.split?.('〜');
  const labels = slots.map(slot => slot.label);
  const parts = details.match(/[^。]+。?/g) || [];
  const duplicate = new Set(['予約状況は変動する場合があります']);
  if (times.length && times.every(time => typeof time === 'string' && time)) {
    duplicate.add(times.join('、'));
  }
  if (first?.length === 2 && last?.length === 2) {
    duplicate.add(first[0] + '〜' + last[1] + 'の間に全' + slots.length + '部');
  }
  const firstPart = labels[0]?.match(/^第(\d+)部$/);
  if (firstPart && labels.every((label, i) => label === '第' + (Number(firstPart[1]) + i) + '部')) {
    duplicate.add('個人撮影・' + firstPart[1] + '〜' + (Number(firstPart[1]) + slots.length - 1) + '部');
  }
  return parts.filter(part => !duplicate.has(part.trim().replace(/。$/, ''))).join('').trim();
}

function slotStart(time) {
  const start = time.match(/^([01]?\d|2[0-3]):([0-5]\d)(?=\s*(?:[〜~–—-]|$))/);
  return start ? Number(start[1]) * 60 + Number(start[2]) : Number.MAX_SAFE_INTEGER;
}

function renderSlots(valid, record, item) {
  const section = element('div', '', 'reservation-slots');
  section.append(element('h4', record ? '予約枠（記録）' : '予約枠'));
  if (!valid.length) {
    section.append(element('p', '枠ごとの情報は未確認です。'));
    return section;
  }
  section.append(element('p', '予約枠の最終確認：' + slotConfirmation(item), 'meta slot-confirmation'));
  const list = element('ul', '', 'slot-list');
  const ordered = valid.map(slot => {
    const time = typeof slot.time === 'string' ? slot.time.trim() : '';
    const normalized = time.normalize('NFKC');
    const range = normalized.match(/^(\d{1,2}:\d{2})\s*[〜~–—-]\s*(\d{1,2}:\d{2})$/);
    const timing = range ? range[1].padStart(5, '0') + ' 〜 ' + range[2].padStart(5, '0') : time || '時間未確認';
    return { slot, timing, start: slotStart(normalized) };
  }).sort((a, b) => a.start - b.start);
  for (const { slot, timing } of ordered) {
    const status = slotBadge(slot.status, item.kind);
    const highlight = !record && status.variant === 'available' ? ' slot-row--available' : '';
    const row = element('li', '', 'slot-row' + highlight);
    row.append(element('strong', slot.label), element('span', timing, 'slot-time'), element('span', status.label, 'slot-status slot-status--' + (record ? 'record' : status.variant)));
    list.append(row);
  }
  section.append(list);
  return section;
}
function show(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.events) || data.events.some(item => !item || typeof item !== 'object' || Array.isArray(item))) throw Error('Invalid data');
  const today = todayJst();
  const past = period.value === 'past';
  const cutoff = past ? pastCutoff(today) : today;
  const terms = searchTerm(query.value.trim()).split(/\s+/).filter(Boolean);
  const list = data.events.filter(item => {
    const date = dateKey(item.date);
    const isPast = date < today;
    if (isPast !== past || date < cutoff) return false;
    const searchText = searchTerm([item.title, item.venue, item.date].join(' '));
    const eventDate = searchTerm(item.date);
    return terms.every(term => {
      if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(term)) return eventDate === term;
      if (/^\d{1,2}\/\d{1,2}$/.test(term)) return eventDate.endsWith('/' + term);
      return searchText.includes(term);
    });
  });
  list.sort((a, b) => (past ? -1 : 1) * dateKey(a.date).localeCompare(dateKey(b.date)));
  events.replaceChildren();
  updated.textContent = data.updated_at ? '掲載情報の確認：' + data.updated_at + '（日本時間）' : '掲載情報の確認：未確認';
  if (terms.length) events.append(element('p', '検索結果 ' + list.length + '件', 'search-results'));
  if (!list.length) {
    const box = element('div', '', 'empty');
    box.append(element('strong', terms.length ? '検索条件に一致する予定がありません' : past ? '過去の掲載分はありません' : 'これからの掲載予定はありません'));
    if (terms.length) {
      const reset = element('button', '検索をクリア');
      reset.type = 'button';
      reset.addEventListener('click', () => {
        query.value = '';
        applyFilters();
        query.focus();
      });
      box.append(reset);
    }
    events.append(box);
    return;
  }
  const mode = viewPicker.querySelector('input:checked').value;
  const makeCard = item => eventCard(item, today, past, mode === 'compact');
  if (mode === 'calendar') {
    events.append(makeCalendar(list, today, makeCard, isFullyBooked));
  } else {
    const container = mode === 'compact' ? element('div', '', 'compact-grid') : document.createDocumentFragment();
    for (const item of list) container.append(makeCard(item));
    events.append(container);
  }
}
function eventCard(item, today, past, compact = false) {
  const isToday = dateKey(item.date) === today;
  const checked = jstTime(item.checked_at);
  const card = element('article', '', compact ? 'card compact-card' : 'card');
  const state = bookingState(item);
  const slots = state.slotMode === 'omit' ? [] : validSlots(item.slots);
  const full = isFullyBooked(item, state, slots);
  const availableCount = state.slotMode === 'current' ? slots.filter(slot => slotBadge(slot.status).variant === 'available').length : 0;
  const top = element('div', '', 'card-top');
  const day = dayParts(item.date);
  const date = element(day ? 'time' : 'span', day ? item.date + '（' + day.weekday + '）' : '開催日：未確認', 'date');
  if (day) date.dateTime = dateKey(item.date);
  if (isToday) top.append(element('span', '本日', 'badge'));
  top.append(date);
  if (typeof item.time === 'string' && item.time.trim()) top.append(element('span', item.time.trim(), 'event-time'));
  if (full) top.append(element('span', '満枠', 'badge full-booking'));
  else if (availableCount) top.append(element('span', '空き' + availableCount + '枠', 'badge availability-count'));
  card.append(top, element('h3', item.title || '撮影会'));
  const showStatus = state.label || (!availableCount && (compact || !repeatsSlotStatus(item.status || '未確認', slots)));
  if ((!full && showStatus) || state.label === 'キャンセル待ち') {
    const compactSummary = compact && state.slotMode === 'current' ? unavailableSlotsSummary(slots, item.kind) : '';
    card.append(element('span', compactSummary || state.label || item.status || '予約状況：未確認', 'badge'));
  }
  card.append(element('p', '会場：' + (item.venue || '未確認')));
  if (compact) {
    if (slots.length) card.append(element('p', '予約枠の最終確認：' + slotConfirmation(item), 'meta slot-confirmation'));
    const open = element('button', '詳細を見る', 'open-details');
    open.type = 'button';
    open.setAttribute('aria-label', (item.title || '撮影会') + 'の詳細を見る');
    open.setAttribute('aria-haspopup', 'dialog');
    open.addEventListener('click', () => {
      detailItem = item;
      detailBody.replaceChildren(eventCard(item, today, past));
      detailDialog.showModal();
      detailDialog.scrollTop = 0;
    });
    card.append(open);
    return card;
  }
  if (state.slotMode !== 'omit' && (slots.length || (!state.cancelled && (!item.kind || item.kind === 'individual_photo')))) {
    card.append(renderSlots(slots, state.slotMode === 'record', item));
  }
  const details = cardDetails(item.details, slots);
  if (details) card.append(element('p', '補足：' + details));
  card.append(element('p', '確認日時：' + (item.checked_at || '未確認') + (item.checked_at ? '（日本時間）' : ''), 'meta'));
  if (!past && Number.isFinite(checked) && Date.now() - checked >= 86400000) {
    card.append(element('p', '確認から24時間以上経過', 'meta stale'));
  }
  const url = safeUrl(item.url);
  if (!url) card.append(element('p', '主催者ページ：未確認', 'meta'));
  if (url) {
    const isPost = Array.isArray(item.sources) && item.sources.some(source => source?.kind === 'official_post' && safeUrl(source.url) === url);
    const a = element('a', isPost ? '公式投稿 ↗' : '主催者の詳細ページ ↗', 'official');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    card.append(a);
  }
  const posts = new Set((Array.isArray(item.sources) ? item.sources : [])
    .filter(source => source?.kind === 'official_post')
    .map(source => safeUrl(source.url))
    .filter(post => post && post !== url));
  if (posts.size) {
    const links = element('div', '', 'links source-posts');
    for (const post of posts) {
      const host = new URL(post).hostname.replace(/^www\./, '');
      const link = element('a', '公式投稿 (' + host + ') ↗');
      link.href = post;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      links.append(link);
    }
    card.append(links);
  }
  const make = element('button', 'SNS告知を作る', 'make-announcement');
  make.type = 'button';
  make.addEventListener('click', async () => {
    make.disabled = true;
    try {
      const { openAnnouncement } = await import('./announcement-ui.mjs?v=drive-import-1');
      openAnnouncement(item);
    } catch {
      make.textContent = '告知画面を再読み込み';
    } finally {
      make.disabled = false;
    }
  });
  card.append(make);
  return card;
}
async function load() {
  refresh.disabled = true;
  try { const r = await fetch('data/events.json', { cache: 'no-store' }); if (!r.ok) throw Error('HTTP ' + r.status); const data = await r.json(); show(data); snapshot = data; scheduleBoundary(); filters.hidden = false; hasData = true; lastConfirmation = updated.textContent; }
  catch { if (!hasData) { events.replaceChildren(element('div', '情報を読み込めませんでした。「再読み込み」をお試しください。', 'empty')); updated.textContent = '掲載情報の確認：未確認'; } else { updated.textContent = lastConfirmation + '　再読み込みに失敗しました。前回の情報を表示しています。'; } }
  finally { refresh.disabled = false; }
}
function applyFilters() {
  if (!snapshot) return;
  const message = updated.textContent;
  show(snapshot);
  updated.textContent = message;
}
function scheduleBoundary() {
  clearTimeout(clockTimer);
  const now = Date.now();
  const today = todayJst().replaceAll('-', '/');
  nextBoundary = jstTime(today + ' 00:00') + 86400000;
  for (const item of snapshot.events) {
    for (const at of [nextBookingChange(item, now), jstTime(item.checked_at) + 86400000]) {
      if (at > now && at < nextBoundary) nextBoundary = at;
    }
  }
  clockTimer = setTimeout(refreshForTime, Math.max(0, nextBoundary - now) + 1);
}
function refreshForTime() {
  if (!snapshot || Date.now() < nextBoundary) return;
  const today = todayJst();
  applyFilters();
  if (detailDialog.open && detailItem) {
    detailBody.replaceChildren(eventCard(detailItem, today, dateKey(detailItem.date) < today));
  }
  scheduleBoundary();
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshForTime(); });
try {
  const saved = localStorage.getItem(viewKey);
  const choice = Array.from(viewPicker.elements).find(input => input.value === saved);
  if (choice) choice.checked = true;
} catch { /* The views also work without browser storage. */ }
viewPicker.addEventListener('change', event => {
  try { localStorage.setItem(viewKey, event.target.value); } catch { /* Storage is optional. */ }
  applyFilters();
});
detailDialog.querySelector('button').addEventListener('click', () => detailDialog.close());
detailDialog.addEventListener('close', () => { detailItem = null; detailBody.replaceChildren(); });
query.addEventListener('input', applyFilters);
period.addEventListener('change', applyFilters);
refresh.addEventListener('click', load);
load();
