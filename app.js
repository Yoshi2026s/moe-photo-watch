'use strict';
const events = document.querySelector('#events'), updated = document.querySelector('#updated'), refresh = document.querySelector('#refresh');
let hasData = false, lastConfirmation = '';
function element(tag, text, cls) { const e = document.createElement(tag); e.textContent = text; if (cls) e.className = cls; return e; }
function safeUrl(s) { try { const u = new URL(s); return u.protocol === 'https:' ? u.href : null; } catch { return null; } }
function todayJst() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
function dateKey(date) {
  return typeof date === 'string' && /^\d{4}\/\d{2}\/\d{2}$/.test(date) ? date.replaceAll('/', '-') : '9999';
}
function show(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.events) || data.events.some(item => !item || typeof item !== 'object' || Array.isArray(item))) throw Error('Invalid data');
  const today = todayJst();
  const list = data.events.filter(item => { const date = typeof item.date === 'string' && /^\d{4}\/\d{2}\/\d{2}$/.test(item.date) ? item.date.replaceAll('/', '-') : null; return !date || date >= today; });
  list.sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date)));
  events.replaceChildren();
  updated.textContent = data.updated_at ? '掲載情報の最終確認：' + data.updated_at + '（日本時間）' : '掲載情報の最終確認：未確認';
  if (!list.length) { const box = element('div', '', 'empty'); box.append(element('strong', '掲載できる確認済み情報はまだありません'), element('span', '公式ページから最新情報をご確認ください。')); events.append(box); return; }
  for (const item of list) {
    const isToday = dateKey(item.date) === today;
    const checked = typeof item.checked_at === 'string' && /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/.test(item.checked_at) ? Date.parse(item.checked_at.replaceAll('/', '-').replace(' ', 'T') + ':00+09:00') : NaN;
    const card = element('article', '', 'card');
    card.append(element('div', (isToday ? '本日 · ' : '') + (item.date || '開催日：未確認'), 'date'), element('h3', item.title || '撮影会'), element('span', item.status || '予約状況：未確認', 'badge'));
    if (item.venue) card.append(element('p', '会場：' + item.venue));
    if (item.details) card.append(element('p', item.details));
    card.append(element('p', '確認日時：' + (item.checked_at || '未確認') + (item.checked_at ? '（日本時間）' : ''), 'meta'));
    card.append(element('p', Number.isFinite(checked) && Date.now() - checked >= 86400000 ? '確認から24時間以上経過しています。最新の状況は公式ページへ。' : '最新の予約状況は公式ページへ。', 'meta'));
    const url = safeUrl(item.url);
    if (url) { const a = element('a', '公式ページを見る ↗', 'official'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; card.append(a); }
    events.append(card);
  }
}
async function load() {
  refresh.disabled = true;
  try { const r = await fetch('data/events.json', { cache: 'no-store' }); if (!r.ok) throw Error('HTTP ' + r.status); show(await r.json()); hasData = true; lastConfirmation = updated.textContent; }
  catch { if (!hasData) { events.replaceChildren(element('div', '情報を読み込めませんでした。時間をおいて再度お試しください。', 'empty')); updated.textContent = '掲載情報の最終確認：未確認'; } else { updated.textContent = lastConfirmation + '　更新に失敗しました。表示中の情報は前回読み込んだものです。公式ページをご確認ください。'; } }
  finally { refresh.disabled = false; }
}
refresh.addEventListener('click', load); load();
