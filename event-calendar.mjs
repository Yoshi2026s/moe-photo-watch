import { dayParts, weekdays } from './event-date.mjs';

export function element(tag, text, cls) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (cls) node.className = cls;
  return node;
}

// Keep the selected date when returning from another view or refreshing the data.
let selectedDate = '';

export function makeCalendar(items, today, makeCard, isFullyBooked) {
  const byDate = new Map();
  const undated = [];
  for (const item of items) {
    if (!dayParts(item.date)) {
      undated.push(item);
      continue;
    }
    if (!byDate.has(item.date)) byDate.set(item.date, []);
    byDate.get(item.date).push(item);
  }
  const calendar = element('div', '', 'calendar-view');
  const dates = [...byDate.keys()];
  if (dates.length) {
    if (!byDate.has(selectedDate)) selectedDate = dates[0];
    const months = [...new Set(dates.map(date => date.slice(0, 7)))].sort();
    let month = selectedDate.slice(0, 7);
    const nav = element('div', '', 'calendar-nav');
    const prev = element('button', '‹ 前月', 'month-prev');
    const next = element('button', '次月 ›', 'month-next');
    const heading = element('h3', '');
    prev.type = next.type = 'button';
    nav.append(prev, heading, next);
    const table = element('table', '', 'month-grid');
    const header = table.createTHead().insertRow();
    for (const weekday of weekdays) {
      const cell = element('th', weekday);
      cell.scope = 'col';
      header.append(cell);
    }
    const body = table.createTBody();
    const agenda = element('div', '', 'day-agenda');
    calendar.append(nav, table, agenda);

    function selectDate(date) {
      selectedDate = date;
      for (const button of body.querySelectorAll('button')) {
        button.setAttribute('aria-pressed', String(button.dataset.date === date));
      }
      const entries = byDate.get(date) || [];
      agenda.replaceChildren();
      if (!entries.length) {
        agenda.append(element('p', 'この月に該当する予定はありません。', 'empty'));
        return;
      }
      const agendaHeading = element('h3', '', 'agenda-heading');
      agendaHeading.append(element('span', dayParts(date).label + 'の予定'), element('span', entries.length + '件', 'badge'));
      agenda.append(agendaHeading);
      for (const item of entries) agenda.append(makeCard(item));
    }

    function drawMonth() {
      const [year, number] = month.split('/').map(Number);
      const start = new Date(Date.UTC(year, number - 1, 1)).getUTCDay();
      const days = new Date(Date.UTC(year, number, 0)).getUTCDate();
      heading.textContent = year + '年' + number + '月';
      table.setAttribute('aria-label', heading.textContent + 'の開催日');
      prev.disabled = month <= months[0];
      next.disabled = month >= months.at(-1);
      body.replaceChildren();
      let row;
      for (let i = 0; i < Math.ceil((start + days) / 7) * 7; i++) {
        if (i % 7 === 0) row = body.insertRow();
        const cell = row.insertCell();
        const day = i - start + 1;
        if (day < 1 || day > days) continue;
        const date = month + '/' + String(day).padStart(2, '0');
        const entries = byDate.get(date);
        const contents = element(entries ? 'button' : 'span', '', 'calendar-day');
        if (date.replaceAll('/', '-') === today) contents.setAttribute('aria-current', 'date');
        contents.append(element('span', String(day), 'day-number'));
        if (entries) {
          contents.type = 'button';
          contents.dataset.date = date;
          const full = new Set(entries.filter(item => isFullyBooked(item)));
          const fullLabel = full.size ? '、満枠' + full.size + '件' : '';
          contents.setAttribute('aria-label', dayParts(date).label + '、' + entries.length + '件の予定' + fullLabel);
          contents.append(element('span', entries.length + '件', 'day-count'));
          if (full.size) {
            contents.append(element('span', full.size === entries.length ? '満枠' : '満枠あり', 'badge full-booking'));
          }
          const titles = entries.map(item => (full.has(item) ? '【満枠】' : '') + (item.title || '撮影会'));
          contents.title = titles.join('\n');
          for (const title of titles.slice(0, 2)) {
            contents.append(element('span', title, 'day-event'));
          }
          contents.addEventListener('click', () => selectDate(date));
        }
        cell.append(contents);
      }
      const day = selectedDate.startsWith(month + '/') ? selectedDate : dates.find(date => date.startsWith(month + '/'));
      selectDate(day || '');
    }
    function moveMonth(step) {
      const [year, number] = month.split('/').map(Number);
      month = new Date(Date.UTC(year, number - 1 + step, 1)).toISOString().slice(0, 7).replace('-', '/');
      drawMonth();
      if (document.activeElement === document.body || (step > 0 ? next : prev).disabled) {
        (step > 0 ? prev : next).focus({ preventScroll: true });
      }
    }
    prev.addEventListener('click', () => moveMonth(-1));
    next.addEventListener('click', () => moveMonth(1));
    drawMonth();
  }
  if (undated.length) {
    calendar.append(element('h3', '開催日未確認'));
    for (const item of undated) calendar.append(makeCard(item));
  }
  return calendar;
}
