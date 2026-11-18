import { nextBookingChange } from './reservation.mjs';
import { announcementFacts } from './announcement-facts.mjs?v=booking-poster-1';
import { nextDesign, renderPosters } from './announcement-poster.mjs?v=booking-poster-1';

const dialog = document.querySelector('#announcement');
const preview = dialog.querySelector('.poster-preview');
const message = dialog.querySelector('textarea');
const feedback = dialog.querySelector('[role=status]');
const shuffle = dialog.querySelector('.shuffle');
const copy = dialog.querySelector('.copy-message');
const format = dialog.querySelector('#poster-format');
const fileInput = dialog.querySelector('input[type=file]');
const lastDesign = new Map();
const photos = ['photos/portrait.webp','photos/garden.webp','photos/yukata.webp'];
let event, request = 0, uploaded = null, blank = false, previousPhoto = '', downloads = [];
let displayedText = '', design, photoChoice;

function releaseDownloads() {
  for (const url of downloads) URL.revokeObjectURL(url);
  downloads = [];
}

async function loadPhoto(url) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}

async function choosePhoto() {
  if (blank || uploaded) return uploaded;
  const preferred = photos.filter(path => path !== previousPhoto);
  const pool = [...preferred];
  if (previousPhoto) pool.push(previousPhoto);
  const themed = /浴衣|和装|レトロ|古民家/.test(event.title) ? 'photos/yukata.webp'
    : /野外|屋外|公園|ガーデン/.test(event.title) ? 'photos/garden.webp' : '';
  const weighted = preferred.includes(themed) ? [...preferred,themed] : preferred;
  const first = pool.indexOf(weighted[Math.floor(Math.random() * weighted.length)]);
  [pool[0], pool[first]] = [pool[first], pool[0]];
  for (const path of pool) {
    try {
      const image = await loadPhoto(path);
      return image;
    } catch { /* Try another reviewed reference before leaving the photo space blank. */ }
  }
  return null;
}

async function generate({ newDesign = false, newPhoto = false } = {}) {
  const id = ++request;
  const facts = announcementFacts(event);
  const key = [event.date,event.title,event.url].join('|');
  if (newDesign) design = nextDesign(facts,lastDesign.get(key));
  if (newPhoto) photoChoice = choosePhoto();
  displayedText = facts.text;
  message.value = facts.text;
  feedback.textContent = '告知画像を作成中…';
  preview.replaceChildren();
  releaseDownloads();
  shuffle.disabled = true;
  try {
    const photo = await photoChoice;
    if (id !== request) return;
    const pages = renderPosters(facts, design, photo, format.value);
    const blobs = await Promise.all(pages.map(canvas => new Promise((resolve,reject) =>
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG')), 'image/png'))));
    if (id !== request) return;
    for (const [index,blob] of blobs.entries()) {
      const url = URL.createObjectURL(blob);
      downloads.push(url);
      const pic = document.createElement('img');
      pic.src = url;
      pic.alt = facts.title + 'の告知画像 ' + (index+1) + '枚目。内容はSNS投稿文でも確認できます。';
      const link = document.createElement('a');
      link.href = url;
      link.download = [event.date?.replaceAll('/','-'),facts.title,index+1].join('_').replace(/[\\/:*?"<>|]/g,'-') + '.png';
      link.textContent = '画像を保存' + (pages.length > 1 ? '（' + (index+1) + '／' + pages.length + '）' : '（PNG）');
      const figure = document.createElement('figure');
      figure.append(pic,link);
      preview.append(figure);
    }
    if (photo && !uploaded) previousPhoto = photos.find(path => photo.src.endsWith('/'+path)) || '';
    lastDesign.set(key,design);
    feedback.textContent = photo ? '告知画像を' + pages.length + '枚作成しました。' : '写真を挿入できる空欄で作成しました。';
  } catch {
    if (id === request) feedback.textContent = '画像を作成できませんでした。投稿文はコピーできます。';
  } finally {
    if (id === request) shuffle.disabled = false;
  }
}

export function openAnnouncement(item) {
  event = item;
  uploaded = null;
  blank = false;
  fileInput.value = '';
  dialog.querySelector('.event-name').textContent = item.title;
  dialog.showModal();
  dialog.scrollTop = 0;
  scheduleBookingCheck();
  generate({ newDesign: true, newPhoto: true });
}

shuffle.addEventListener('click',() => generate({ newDesign: true, newPhoto: true }));
format.addEventListener('change',() => generate());
dialog.querySelector('.close-dialog').addEventListener('click',() => dialog.close());
dialog.addEventListener('close',() => {
  request++;
  photoChoice = null;
  uploaded = null;
  preview.replaceChildren();
  releaseDownloads();
});
function refreshBooking() {
  if (!dialog.open) return;
  if (displayedText !== announcementFacts(event).text) generate();
  scheduleBookingCheck();
}
let timeCheck;
function scheduleBookingCheck() {
  clearTimeout(timeCheck);
  const now = Date.now();
  const next = nextBookingChange(event, now);
  if (Number.isFinite(next)) timeCheck = setTimeout(refreshBooking, Math.min(next - now + 1, 86400000));
}
dialog.addEventListener('close',() => clearTimeout(timeCheck));
document.addEventListener('visibilitychange',() => { if (!document.hidden) refreshBooking(); });
dialog.addEventListener('click',e => {
  if (e.target.closest('.poster-preview a') && displayedText !== announcementFacts(event).text) {
    e.preventDefault();
    generate();
  }
});
dialog.querySelector('.blank-photo').addEventListener('click',() => {
  blank = true;
  uploaded = null;
  fileInput.value = '';
  generate({ newPhoto: true });
});
dialog.querySelector('.auto-photo').addEventListener('click',() => {
  blank = false;
  uploaded = null;
  fileInput.value = '';
  generate({ newPhoto: true });
});
fileInput.addEventListener('change',async () => {
  const file = fileInput.files[0];
  if (!file) return;
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 12 * 1024 * 1024) {
    feedback.textContent = '12MB以内のJPEG・PNG・WebP画像を選んでください。';
    fileInput.value = '';
    return;
  }
  const id = ++request;
  const url = URL.createObjectURL(file);
  try {
    const image = await loadPhoto(url);
    if (id !== request) return;
    uploaded = image;
    blank = false;
  } catch {
    if (id !== request) return;
    uploaded = null;
    blank = true;
  } finally {
    URL.revokeObjectURL(url);
  }
  generate({ newPhoto: true });
});
copy.addEventListener('click',async () => {
  message.value = announcementFacts(event).text;
  try {
    await navigator.clipboard.writeText(message.value);
    feedback.textContent = '投稿文をコピーしました。';
  } catch {
    message.focus();
    message.select();
    feedback.textContent = '投稿文を選択しました。端末のコピーメニューをご利用ください。';
  }
});
