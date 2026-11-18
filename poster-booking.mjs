import { dayParts } from './event-date.mjs';
import { jstTime, slotBadge } from './reservation.mjs?v=gallery-1';

const performer = '雪餅羽もえ';
const clock = '(?:[01]?\\d|2[0-3]):[0-5]\\d';
const range = new RegExp('^(' + clock + ')\\s*[〜~～–—―-]\\s*(' + clock + ')$');
const inputLine = new RegExp('^(?:第\\s*)?(\\d{1,2})\\s*部\\s*[:：]?\\s*(?:(' + clock + '\\s*[〜~～–—―-]\\s*' + clock + ')\\s*)?(?:\\(個\\)\\s*)?(.+)$');
const normalize = s => (s || '').normalize('NFKC').trim();
const content = node => normalize(node?.textContent);
const stamp = now => new Date(now+9*3600000).toISOString().slice(0,16).replaceAll('-','/').replace('T',' ');

function slot(number, time, status) {
  const raw = normalize(status);
  const badge = slotBadge(raw);
  if (!Number.isInteger(number) || number < 1 || badge.variant === 'unknown') return null;
  const match = range.exec(normalize(time));
  if (time && !match) return null;
  const times = match?.slice(1).map(t => t.padStart(5,'0'));
  if (times && times[0] >= times[1]) return null;
  return { label:'第'+number+'部', time:times?.join('〜') || '', status:raw === '×' ? '×（公式表示）' : badge.label };
}

function complete(rows) {
  return rows.length && rows.every(Boolean) && new Set(rows.map(row => row.label)).size === rows.length ? rows : null;
}

export function readSlotLines(text) {
  return complete(text.split(/\r?\n/).map(normalize).filter(Boolean).map(line => {
    const match = inputLine.exec(line);
    return match && slot(Number(match[1]),match[2],match[3]);
  }));
}

export function confirmedEvent(item, status, slots, now = Date.now()) {
  // The previous availability summary and elapsed deadlines belong to the old observation.
  const event = { ...item, status, slots, slots_checked_at:stamp(now) };
  if (jstTime(event.booking_closes_at) <= now && status !== '予約受付終了') delete event.booking_closes_at;
  if (status && status !== '予約受付開始前') delete event.booking_opens_at;
  return event;
}

export function matchPublishedEvent(item, events) {
  if (!Array.isArray(events)) throw Error('掲載データを読み取れませんでした。');
  const sameDate = events.filter(e => e.date === item.date && e.title === item.title);
  const candidates = sameDate.length > 1 ? sameDate.filter(e => e.url === item.url) : sameDate;
  if (candidates.length !== 1) throw Error('対象回の掲載内容が変わりました。一覧を再読み込みしてください。');
  return candidates[0];
}

const officialHosts = new Set(['www.fresh-club.net','www.smooth-tokyo.jp','photo-session-chance.com','gravure.nakapara.com']);
function sourceUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && officialHosts.has(url.hostname) ? url : null;
  } catch { return null; }
}

function textLines(node) {
  if (!node) return [];
  const copy = node.cloneNode(true);
  for (const br of copy.querySelectorAll('br')) br.replaceWith('\n');
  return content(copy).split(/\r?\n/).map(normalize).filter(Boolean);
}

function sameDate(title, date) {
  const day = dayParts(date);
  if (!day) return false;
  const match = normalize(title).match(/(20\d\d)[.\/年-](\d{1,2})[.\/月-](\d{1,2})(?!\d)/);
  return match && +match[1] === day.year && +match[2] === day.month && +match[3] === day.day;
}

export function readOfficialTable(item, url, html, apiTitle = '') {
  // A template keeps images, embeds and scripts from the source inert.
  const template = document.createElement('template');
  template.innerHTML = html;
  const root = template.content;
  const heading = apiTitle || content(root.querySelector('title'));
  if (/開催中止|出演中止|受付終了|予約締切/.test(heading)) return null;
  if (url.hostname === 'photo-session-chance.com') {
    if (!sameDate(heading,item.date) || !heading.includes(performer)) return null;
    const headings = [...root.querySelectorAll('h2,h3,h4')].filter(h => content(h) === '予約枠');
    if (headings.length !== 1 || headings[0].nextElementSibling?.tagName !== 'P') return null;
    return readSlotLines(textLines(headings[0].nextElementSibling).join('\n'));
  }
  if (url.hostname === 'gravure.nakapara.com') {
    const day = dayParts(item.date);
    const mark = content(root.querySelector('.pd-datebar')).match(/(?:(20\d\d)年)?(\d{1,2})月(\d{1,2})日\(([日月火水木金土])\)/);
    if (!day || !mark || (mark[1] && +mark[1] !== day.year) || +mark[2] !== day.month || +mark[3] !== day.day || mark[4] !== day.weekday) return null;
    const cast = [...root.querySelectorAll('article.pd-cast')].filter(el => content(el.querySelector('.pd-cast-name')) === performer);
    if (cast.length !== 1) return null;
    return complete([...cast[0].querySelectorAll('.pd-booking tr')].filter(tr => tr.querySelector('td')).map(tr => {
      const [label,time,state] = tr.querySelectorAll('td');
      const number = content(label).match(/^第?(\d+)部$/);
      const status = normalize(state?.querySelector('img[alt]')?.getAttribute('alt') || content(state)).replace(/^[○〇◯]\s*空き$/, '空き');
      return number && slot(+number[1],content(time),status);
    }));
  }
  if (!sameDate(heading,item.date)) return null;
  if (url.hostname === 'www.fresh-club.net' && url.pathname.startsWith('/premium/detail/')) {
    const names = [...root.querySelectorAll('.bottom_inner h4.name')].filter(n => content(n) === performer);
    if (names.length !== 1) return null;
    return complete([...names[0].parentElement.querySelectorAll('dl .event_time')].map((row,i) =>
      slot(i+1,content(row.querySelector('dt')),content(row.querySelector('dd')))));
  }
  if (url.hostname === 'www.smooth-tokyo.jp') {
    const cast = [...root.querySelectorAll('.add_photoBox')];
    if (cast.length !== 1 || content(cast[0]) !== performer) return null;
    const labels = [...root.querySelectorAll('td')];
    const cells = labels.filter(td => /^内容\s*\/\s*予約状況$/.test(content(td)));
    if (cells.length !== 1) return null;
    const table = cells[0].closest('table');
    const timeLabel = [...table.querySelectorAll('td')].find(td => content(td) === '時間');
    const times = new Map(textLines(timeLabel?.nextElementSibling).map(line => {
      const m = line.match(/^(?:第)?(\d+)部\s*:\s*(.+)$/);
      return m ? [+m[1],m[2]] : [0,''];
    }));
    const states = textLines(cells[0].nextElementSibling);
    if (!times.size || times.size !== states.length) return null;
    return complete(states.map(line => {
      const m = line.match(/^(?:第)?(\d+)部\s*:.*?受付\s*(\S+)$/);
      return m && times.has(+m[1]) && slot(+m[1],times.get(+m[1]),m[2]);
    }));
  }
  return null;
}

async function readOfficial(url, signal) {
  const r = await fetch(url,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',signal});
  if (!r.ok) throw Error('開催ページを取得できませんでした。');
  return r;
}

export async function collectOfficialSlots(item, signal) {
  const url = sourceUrl(item.url);
  if (!url || !dayParts(item.date) || /中止|受付終了/.test(item.status || '') || Date.now() >= jstTime(item.booking_closes_at)) return null;
  const host = url.hostname;
  if (host === 'www.fresh-club.net' && !/^\/premium\/detail\/\d+\/?$/.test(url.pathname)) return null;
  if (host === 'www.smooth-tokyo.jp' && !/^\/schedule\/detail\/\d{4}-\d{2}-\d{2}_\d+\.html$/.test(url.pathname)) return null;
  const readTable = (html,title) => readOfficialTable(item,url,html,title);
  try {
    const response = await readOfficial(url,signal);
    const encoding = host === 'www.smooth-tokyo.jp' ? 'shift_jis' : 'utf-8';
    const rows = readTable(new TextDecoder(encoding).decode(await response.arrayBuffer()));
    if (rows) return rows;
  } catch (error) { if (signal.aborted) throw error; }
  let api;
  if (host === 'photo-session-chance.com') {
    api = new URL('/wp-json/wp/v2/posts',url);
    api.searchParams.set('slug',decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1)));
  } else if (host === 'gravure.nakapara.com' && /^\d+$/.test(url.searchParams.get('page_id') || '')) {
    api = new URL('/index.php',url);
    api.searchParams.set('rest_route','/wp/v2/pages/'+url.searchParams.get('page_id'));
  } else return null;
  api.searchParams.set('_fields','link,title,content');
  const data = await (await readOfficial(api,signal)).json();
  const page = Array.isArray(data) ? (data.length === 1 ? data[0] : null) : data;
  if (!page?.content?.rendered || decodeURI(page.link) !== decodeURI(url.href)) return null;
  return readTable(page.content.rendered,normalize(page.title?.rendered));
}
