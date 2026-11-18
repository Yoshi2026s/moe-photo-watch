export const weekdays = '日月火水木金土';

export function dayParts(date) {
  if (typeof date !== 'string' || !/^\d{4}\/\d{2}\/\d{2}$/.test(date)) return null;
  const [year, month, day] = date.split('/').map(Number);
  const parsed = new Date(date.replaceAll('/', '-') + 'T00:00:00Z');
  if (parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null;
  const weekday = weekdays[parsed.getUTCDay()];
  return { year, month, day, weekday, label: year + '年' + month + '月' + day + '日（' + weekday + '）' };
}
