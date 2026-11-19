import { bookingState, slotBadge, unavailableSlotsSummary } from './reservation.mjs?v=automatic-photos-1';
import { dayParts } from './event-date.mjs';
import { posterThemeProfile } from './poster-theme-profile.mjs';
const clean = value => typeof value === 'string' ? value.trim() : '';

export function announcementFacts(event, now = Date.now()) {
  const date = dayParts(event.date);
  const state = bookingState(event, now);
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
    const lines = ordered.map(({slot, time}) => [clean(slot.label), time || '時間未確認', slotBadge(slot.status, event.kind).label].join('　'));
    rows.push([state.slotMode === 'record' ? '予約枠（記録）' : '予約枠', lines.join('\n')]);
  } else if (state.slotMode !== 'omit' && !state.cancelled && (!event.kind || event.kind === 'individual_photo')) {
    rows.push(['予約枠', '枠ごとの状況は未確認']);
  }
  const dateLabel = date?.label || '開催日未確認';
  const openSlots = slots.filter(slot => slotBadge(slot.status).variant === 'available').length;
  let banner = state.pending ? '予約受付開始予定' : state.label;
  if (!banner && openSlots) banner = '空き' + openSlots + '枠';
  if (!banner || banner === '予約受付中') banner = unavailableSlotsSummary(slots, event.kind) || banner;
  const name = title.includes('雪餅羽もえ') ? title : '雪餅羽もえ｜' + title;
  const profile = posterThemeProfile(event);
  const accent = profile.scene === 'flower' || profile.outfit === 'kimono' ? '🌸'
    : profile.scene === 'luxury' || profile.scene === 'night' || profile.outfit === 'swim' || profile.optionSwim ? '✨' : '🎀';
  const text = [
    [dateLabel, state.inactive ? name : name + ' ' + accent].join('\n'),
    rows.map(([label, value]) => label.startsWith('予約枠') ? '【' + label + '】\n' + value : label + '：' + value).join('\n'),
    (state.inactive ? '' : '💗 ') + 'もえのリンク集\nhttps://lit.link/nowan_moe0121',
    '#雪餅羽もえ'
  ].filter(Boolean).join('\n\n');
  return { title, dateLabel, day: date, month: date?.month, profile, rows, banner, text };
}

export function announcementSkillPrompt(event, now = Date.now()) {
  const facts = announcementFacts(event, now);
  return [
    '@create-moe-photo-announcements（雪餅羽もえ 撮影会告知画像）を使って、下記の撮影会の告知画像とSNS投稿文を作成・修正して。',
    '対象イベントの主催者の公式案内を確認し、提供資料がある場合は最新版と照合してください。告知画像には雪餅羽もえ本人の写真を使い、原則として縦長（9:16）で作成してください。投稿文には本人のリットリンクを入れてください。修正依頼の場合は、指定された箇所を更新してください。',
    '予約枠は掲載済みの時間と状況を使ってください。告知には確認日時、出典、参考写真のキャプションや見本の文字を省き、撮影テーマや必要な開催情報を読みやすく配置してください。',
    '依頼者が手動で選んだ本人写真を使い、撮影会テーマ、基本衣装とオプション、会場・スタジオの雰囲気に合わせて背景を選んでください。SNS投稿文にはグラビアらしい可愛い絵文字を1〜2個添えてください。',
    '【撮影会情報】\n' + facts.text
  ].join('\n\n');
}
