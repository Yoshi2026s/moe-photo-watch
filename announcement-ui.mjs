import { nextBookingChange } from './reservation.mjs?v=gallery-1';
import { announcementFacts } from './announcement-facts.mjs?v=gallery-1';
import { nextDesign, posterThemeGroups, posterThemes, renderPoster } from './announcement-poster.mjs?v=lettering-1';
import { openPosterEditor } from './poster-editor.mjs?v=lettering-1';
import { posterPhotos } from './poster-photos.mjs';

const dialog = document.querySelector('#announcement');
const preview = dialog.querySelector('.poster-preview');
const message = dialog.querySelector('textarea');
const feedback = dialog.querySelector('[role=status]');
const shuffle = dialog.querySelector('.shuffle');
const copy = dialog.querySelector('.copy-message');
const format = dialog.querySelector('#poster-format');
const choosePhotoButton = dialog.querySelector('.choose-photo');
const chooseDesignButton = dialog.querySelector('.choose-design');
const editButton = dialog.querySelector('.edit-poster');
const picker = document.querySelector('#poster-picker');
const pickerHeading = picker.querySelector('h2');
const choices = picker.querySelector('.poster-choices');
const themeFilter = picker.querySelector('.theme-filter select');
const pickerStatus = picker.querySelector('.poster-picker-status');
const blankButton = picker.querySelector('.blank-photo');
const fileInput = picker.querySelector('input[type=file]');
const lastDesign = new Map();
let event, request = 0, uploaded = null, blank = false, previousPhoto = '', downloadUrl = '';
const posterFiles = new WeakMap();
let displayedText = '', design, photoChoice, crop;
let press, saveMenuTimer;
let selectedTheme = '', selectedPhoto = '', pickerMode, pickerRequest = 0;

themeFilter.add(new Option('すべて',''));
for (const group of Object.keys(posterThemeGroups)) themeFilter.add(new Option(group,group));
function filterDesigns() {
  const group = posterThemeGroups[themeFilter.value];
  for (const choice of choices.children) choice.hidden = Boolean(group && !group.includes(choice.dataset.theme));
}
themeFilter.addEventListener('change',filterDesigns);

function clearPress() {
  press = null;
  clearTimeout(saveMenuTimer);
  preview.querySelector('.press-save')?.remove();
}

dialog.addEventListener('pointerdown', e => {
  if (e.target.closest('.press-save')) return;
  clearPress();
  if (e.pointerType === 'touch' && e.isPrimary && e.target.matches('.poster-preview img')) {
    press = { image: e.target, id: e.pointerId, x: e.clientX, y: e.clientY, start: e.timeStamp };
  }
});
preview.addEventListener('pointermove', e => {
  if (press?.id === e.pointerId && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) clearPress();
});
preview.addEventListener('pointerup', e => {
  if (press?.id !== e.pointerId) return;
  const { image, y, start } = press;
  press = null;
  if (e.timeStamp - start < 600) return;
  // Some in-app browsers deliver the touch without opening an image menu.
  saveMenuTimer = setTimeout(() => {
    if (!image.isConnected) return;
    const figure = image.closest('figure');
    const actions = figure.querySelector('.poster-actions');
    const menu = document.createElement('div');
    menu.className = 'press-save';
    menu.append(...Array.from(actions.querySelectorAll('.photo-share, .open-poster-image'), action => action.cloneNode(true)));
    figure.append(menu);
    const bounds = image.getBoundingClientRect();
    const height = menu.offsetHeight;
    menu.style.top = Math.max(0, Math.min(y - bounds.top - height/2, bounds.height - height)) + 'px';
  }, 120);
});
preview.addEventListener('contextmenu', clearPress);
preview.addEventListener('pointercancel', clearPress);
dialog.addEventListener('scroll', clearPress, { passive: true });
window.addEventListener('blur', clearPress);
document.addEventListener('visibilitychange', () => { if (document.hidden) clearPress(); });

function releaseDownload() {
  if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  downloadUrl = '';
}

function posterImageSource(blob) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

function posterActions(file, url) {
  const actions = document.createElement('div');
  actions.className = 'poster-actions';
  if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
    const share = document.createElement('button');
    share.type = 'button';
    share.className = 'photo-share';
    share.textContent = '写真に保存…';
    actions.append(share);
  }
  const open = document.createElement('a');
  open.className = 'open-poster-image';
  open.href = url;
  open.target = '_blank';
  open.rel = 'noopener';
  open.textContent = '画像だけ開く';
  const download = document.createElement('a');
  download.href = url;
  download.download = file.name;
  download.textContent = 'PNGをダウンロード';
  actions.append(open,download);
  return actions;
}

async function loadPhoto(url) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}

async function choosePhoto() {
  if (blank || uploaded) return uploaded;
  const tag = /浴衣|和装|レトロ|古民家/.test(event.title) ? 'kimono'
    : /野外|屋外|公園|ガーデン/.test(event.title) ? 'outdoor'
    : design.key === 'cute' || design.key === 'pop' ? 'cute' : '';
  const ranked = posterPhotos.map(photo => ({
    src: photo.src,
    priority: photo.src === selectedPhoto ? 3
      : photo.src === previousPhoto ? -1 : Math.random() + (photo.tag === tag ? .8 : 0)
  })).sort((a,b) => b.priority - a.priority);
  for (const { src } of ranked) {
    try {
      return await loadPhoto(src);
    } catch { /* Try another reviewed reference before leaving the photo space blank. */ }
  }
  return null;
}

function showPickerStatus(text) {
  pickerStatus.textContent = text;
  pickerStatus.hidden = !text;
}

function thumbnailChoice(label, thumbnail, selected, apply) {
  const button = document.createElement('button');
  const name = document.createElement('span');
  button.type = 'button';
  button.className = 'poster-choice';
  button.setAttribute('aria-pressed', String(selected));
  name.textContent = label;
  button.append(thumbnail,name);
  button.addEventListener('click',() => {
    picker.close();
    apply();
  });
  return button;
}

async function openPicker(mode) {
  const id = ++pickerRequest;
  pickerMode = mode;
  pickerHeading.textContent = mode === 'photo' ? '写真を選ぶ' : 'デザインを選ぶ';
  blankButton.hidden = fileInput.parentElement.hidden = mode !== 'photo';
  themeFilter.parentElement.hidden = mode === 'photo';
  choices.replaceChildren();
  showPickerStatus('');
  picker.showModal();
  picker.scrollTop = 0;
  if (mode === 'photo') {
    for (const photo of posterPhotos) {
      const thumbnail = document.createElement('img');
      thumbnail.alt = '';
      thumbnail.loading = 'lazy';
      thumbnail.src = photo.src;
      choices.append(thumbnailChoice(photo.label,thumbnail,!blank && !uploaded && previousPhoto === photo.src,
        () => useReferencePhoto(photo.src)));
    }
    return;
  }
  showPickerStatus('デザインをプレビュー中…');
  try {
    const photo = await photoChoice;
    if (id !== pickerRequest || !picker.open) return;
    const facts = announcementFacts(event);
    for (const [key, theme] of Object.entries(posterThemes)) {
      const candidate = design.key === key ? design : nextDesign(facts,null,key);
      const thumbnail = renderPoster(facts,candidate,photo,format.value,{ previewScale: .2, crop });
      thumbnail.setAttribute('aria-hidden','true');
      const choice = thumbnailChoice(theme.label,thumbnail,design.key === key,() => {
        design = candidate;
        selectedTheme = key;
        generate();
      });
      choice.dataset.theme = key;
      choices.append(choice);
    }
    filterDesigns();
    showPickerStatus('');
  } catch {
    if (id === pickerRequest && picker.open) showPickerStatus('デザインのプレビューを表示できませんでした。');
  }
}

async function generate({ newDesign = false, newPhoto = false } = {}) {
  const id = ++request;
  const facts = announcementFacts(event);
  const key = [event.date,event.title,event.url].join('|');
  if (newDesign) design = nextDesign(facts,lastDesign.get(key),selectedTheme);
  chooseDesignButton.querySelector('small').textContent = posterThemes[design.key].label;
  if (newPhoto) choosePhotoButton.querySelector('small').textContent = '読み込み中…';
  if (newPhoto) {
    crop = null;
    photoChoice = choosePhoto();
  }
  displayedText = facts.text;
  message.value = facts.text;
  feedback.textContent = '告知画像を作成中…';
  clearPress();
  preview.replaceChildren();
  releaseDownload();
  editButton.disabled = shuffle.disabled = true;
  try {
    const photo = await photoChoice;
    if (id !== request) return;
    const reference = photo && !uploaded ? posterPhotos.find(ref => photo.src.endsWith('/'+ref.src)) : null;
    if (reference) previousPhoto = reference.src;
    choosePhotoButton.querySelector('small').textContent = reference?.label || (photo ? '端末の写真' : '空欄');
    const canvas = renderPoster(facts,design,photo,format.value,{ crop });
    const blob = await new Promise((resolve,reject) =>
      canvas.toBlob(output => output ? resolve(output) : reject(new Error('PNG')), 'image/png'));
    if (id !== request) return;
    const source = await posterImageSource(blob);
    if (id !== request) return;
    downloadUrl = URL.createObjectURL(blob);
    const pic = document.createElement('img');
    pic.src = source || downloadUrl;
    pic.alt = facts.title + 'の告知画像。内容はSNS投稿文でも確認できます。';
    const name = [event.date?.replaceAll('/','-'),facts.title].join('_').replace(/[\\/:*?"<>|]/g,'-') + '.png';
    const file = new File([blob],name,{ type: 'image/png' });
    const figure = document.createElement('figure');
    posterFiles.set(figure,file);
    const status = document.createElement('p');
    status.className = 'poster-action-status';
    status.setAttribute('role','status');
    figure.append(pic,posterActions(file,downloadUrl),status);
    preview.replaceChildren(figure);
    lastDesign.set(key,design);
    feedback.textContent = photo ? '告知画像を作成しました。' : '写真を挿入できる空欄で作成しました。';
  } catch {
    if (id === request) feedback.textContent = '画像を作成できませんでした。投稿文はコピーできます。';
  } finally {
    if (id === request) editButton.disabled = shuffle.disabled = false;
  }
}

export function openAnnouncement(item) {
  event = item;
  uploaded = null;
  blank = false;
  fileInput.value = '';
  selectedPhoto = '';
  dialog.querySelector('.event-name').textContent = item.title;
  dialog.showModal();
  dialog.scrollTop = 0;
  scheduleBookingCheck();
  generate({ newDesign: true, newPhoto: true });
}

shuffle.addEventListener('click',() => generate({ newDesign: true }));
choosePhotoButton.addEventListener('click',() => openPicker('photo'));
chooseDesignButton.addEventListener('click',() => openPicker('design'));
editButton.addEventListener('click',async () => {
  const id = request;
  const photo = await photoChoice;
  if (id !== request || !dialog.open) return;
  openPosterEditor({
    facts: announcementFacts(event), design, photo, format: format.value, crop,
    apply(variant, framing) {
      design = variant;
      crop = framing;
      generate();
    }
  });
});
picker.querySelector('.close-picker').addEventListener('click',() => picker.close());
picker.addEventListener('close',() => {
  if (!picker.open) {
    pickerRequest++;
    choices.replaceChildren();
  }
});
format.addEventListener('change',() => generate());
dialog.querySelector('.close-dialog').addEventListener('click',() => dialog.close());
dialog.addEventListener('close',() => {
  clearPress();
  request++;
  photoChoice = null;
  uploaded = null;
  preview.replaceChildren();
  releaseDownload();
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
preview.addEventListener('click',async e => {
  const action = e.target.closest('a, .photo-share');
  if (!action) return;
  if (displayedText !== announcementFacts(event).text) {
    e.preventDefault();
    generate();
    return;
  }
  if (action.matches('.photo-share')) {
    const figure = action.closest('figure');
    const status = figure.querySelector('.poster-action-status');
    const file = posterFiles.get(figure);
    action.disabled = true;
    status.textContent = '';
    try {
      await navigator.share({ files: [file] });
    } catch (error) {
      if (error?.name !== 'AbortError') status.textContent = '「画像だけ開く」から、画像を長押しして保存できます。';
    } finally {
      action.disabled = false;
    }
  }
});
blankButton.addEventListener('click',() => {
  picker.close();
  blank = true;
  uploaded = null;
  fileInput.value = '';
  generate({ newPhoto: true });
});
function useReferencePhoto(src = '') {
  selectedPhoto = src;
  blank = false;
  uploaded = null;
  fileInput.value = '';
  generate({ newPhoto: true });
}
picker.querySelector('.auto-choice').addEventListener('click',() => {
  picker.close();
  if (pickerMode === 'photo') useReferencePhoto();
  else {
    selectedTheme = '';
    generate({ newDesign: true });
  }
});
fileInput.addEventListener('change',async () => {
  const file = fileInput.files[0];
  if (!file) return;
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 12 * 1024 * 1024) {
    showPickerStatus('12MB以内のJPEG・PNG・WebP画像を選んでください。');
    fileInput.value = '';
    return;
  }
  const id = ++pickerRequest;
  showPickerStatus('写真を読み込み中…');
  const url = URL.createObjectURL(file);
  try {
    const image = await loadPhoto(url);
    if (id !== pickerRequest || !picker.open) return;
    uploaded = image;
    blank = false;
  } catch {
    if (id === pickerRequest && picker.open) {
      showPickerStatus('写真を読み込めませんでした。別の写真を選んでください。');
      fileInput.value = '';
    }
    return;
  } finally {
    URL.revokeObjectURL(url);
  }
  picker.close();
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
