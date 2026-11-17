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
function pastCutoff(today) {
  const [year, month, day] = today.split('-').map(Number);
  const first = new Date(Date.UTC(year, month - 4, 1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(day, lastDay));
  return first.toISOString().slice(0, 10);
}
function slotBadge(value) {
  const status = typeof value === 'string' ? value.trim().normalize('NFKC') : '';
  if (/^(?:空き|空きあり|予約可|予約可能|予約受付中|○|〇|◯)$/.test(status)) {
    return { label: '空き', variant: 'available' };
  }
  if (/^(?:予約不可|予約済み|満枠|満席|受付終了|×(?:\(公式表示\))?)$/.test(status)) {
    return { label: '予約済み', variant: 'unavailable' };
  }
  return { label: '未確認', variant: 'unknown' };
}
function validSlots(slots) {
  return Array.isArray(slots) ? slots.filter(slot =>
    slot && typeof slot.label === 'string' && slot.label.trim()
  ) : [];
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

function renderSlots(valid, past) {
  const section = element('div', '', 'reservation-slots');
  section.append(element('h4', past ? '予約枠（掲載時点）' : '予約枠'));
  if (!valid.length) {
    section.append(element('p', '枠ごとの情報は未確認です。'));
    return section;
  }
  const list = element('ul', '', 'slot-list');
  const ordered = valid.map(slot => {
    const time = typeof slot.time === 'string' ? slot.time.trim() : '';
    const normalized = time.normalize('NFKC');
    const range = normalized.match(/^(\d{1,2}:\d{2})\s*[〜~–—-]\s*(\d{1,2}:\d{2})$/);
    const timing = range ? range[1].padStart(5, '0') + ' 〜 ' + range[2].padStart(5, '0') : time || '時間未確認';
    return { slot, timing, start: slotStart(normalized) };
  }).sort((a, b) => a.start - b.start);
  for (const { slot, timing } of ordered) {
    const status = slotBadge(slot.status);
    const highlight = !past && status.variant === 'available' ? ' slot-row--available' : '';
    const row = element('li', '', 'slot-row' + highlight);
    row.append(element('strong', slot.label), element('span', timing, 'slot-time'), element('span', status.label, 'slot-status slot-status--' + status.variant));
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
  const term = query.value.trim().normalize('NFKC').toLocaleLowerCase('ja');
  const list = data.events.filter(item => {
    const date = dateKey(item.date);
    const isPast = date < today;
    const searchText = [item.title, item.venue, item.date].join(' ').normalize('NFKC').toLocaleLowerCase('ja');
    return isPast === past && date >= cutoff && searchText.includes(term);
  });
  list.sort((a, b) => (past ? -1 : 1) * dateKey(a.date).localeCompare(dateKey(b.date)));
  events.replaceChildren();
  updated.textContent = data.updated_at ? '掲載情報の確認：' + data.updated_at + '（日本時間）' : '掲載情報の確認：未確認';
  if (!list.length) { const box = element('div', '', 'empty'); box.append(element('strong', term ? '検索条件に一致する予定がありません' : past ? '過去の掲載分はありません' : 'これからの掲載予定はありません')); events.append(box); return; }
  for (const item of list) {
    const isToday = dateKey(item.date) === today;
    const checked = typeof item.checked_at === 'string' && /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/.test(item.checked_at) ? Date.parse(item.checked_at.replaceAll('/', '-').replace(' ', 'T') + ':00+09:00') : NaN;
    const card = element('article', '', 'card');
    const slots = validSlots(item.slots);
    const cancelled = /^(?:開催中止|出演中止)/.test(item.status || '');
    const availableCount = past || cancelled ? 0 : slots.filter(slot => slotBadge(slot.status).variant === 'available').length;
    const top = element('div', '', 'card-top');
    top.append(element('div', (isToday ? '本日 · ' : '') + (item.date || '開催日：未確認'), 'date'));
    if (availableCount) top.append(element('span', '空き' + availableCount + '枠', 'badge availability-count'));
    card.append(top, element('h3', item.title || '撮影会'));
    if (!availableCount && (past || cancelled || !repeatsSlotStatus(item.status || '未確認', slots))) {
      const status = past && !cancelled ? '開催日経過' : item.status || '予約状況：未確認';
      card.append(element('span', status.replaceAll('予約不可', '予約済み'), 'badge'));
    }
    card.append(element('p', '会場：' + (item.venue || '未確認')));
    if (slots.length || (!cancelled && (!item.kind || item.kind === 'individual_photo'))) {
      card.append(renderSlots(slots, past || cancelled));
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
    events.append(card);
  }
}
async function load() {
  refresh.disabled = true;
  try { const r = await fetch('data/events.json', { cache: 'no-store' }); if (!r.ok) throw Error('HTTP ' + r.status); const data = await r.json(); show(data); snapshot = data; filters.hidden = false; hasData = true; lastConfirmation = updated.textContent; }
  catch { if (!hasData) { events.replaceChildren(element('div', '情報を読み込めませんでした。「再読み込み」をお試しください。', 'empty')); updated.textContent = '掲載情報の確認：未確認'; } else { updated.textContent = lastConfirmation + '　再読み込みに失敗しました。前回の情報を表示しています。'; } }
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
