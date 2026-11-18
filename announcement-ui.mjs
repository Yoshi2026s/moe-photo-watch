import { nextBookingChange } from './reservation.mjs?v=gallery-1';
import { announcementFacts, announcementSkillPrompt } from './announcement-facts.mjs?v=photo-themes-1';
import { nextDesign, posterThemeGroups, posterThemes, renderPoster } from './announcement-poster.mjs?v=photo-themes-1';
import { openPosterEditor } from './poster-editor.mjs?v=photo-themes-1';
import { posterPhotos, rankPosterPhotos } from './poster-photos.mjs?v=photo-themes-1';
import { listMaterialPhotos, savedMaterialFolder, saveMaterialFolder, supportsMaterialFolder, usablePhoto } from './poster-materials.mjs';

const dialog = document.querySelector('#announcement');
const preview = dialog.querySelector('.poster-preview');
const message = dialog.querySelector('textarea');
const feedback = dialog.querySelector('[role=status]');
const shuffle = dialog.querySelector('.shuffle');
const copy = dialog.querySelector('.copy-message');
const copySkillPrompt = dialog.querySelector('.copy-skill-prompt');
const skillPrompt = dialog.querySelector('#skill-prompt');
const promptPreview = dialog.querySelector('.skill-prompt-preview');
const skillFeedback = dialog.querySelector('.skill-prompt-feedback');
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
const folderButton = picker.querySelector('.material-folder');
const removeFolderButton = picker.querySelector('.remove-material-folder');
const lastDesign = new Map();
let event, request = 0, uploaded = null, blank = false, previousPhoto = '', downloadUrl = '';
const posterFiles = new WeakMap();
let displayedText = '', design, photoChoice, crop;
let press, saveMenuTimer;
let copyAttempt = 0;
let selectedTheme = '', selectedPhoto = '', pickerMode, pickerRequest = 0;
const photoSources = new WeakMap();
const thumbnailUrls = [];
let materialFolder = supportsMaterialFolder ? savedMaterialFolder().catch(() => null) : Promise.resolve(null);
let currentMaterials = { state:'none', photos:[] };
let materialSelection = currentMaterials;
let materialScan = 0;

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

async function refreshMaterials() {
  const id = ++materialScan;
  const folder = await materialFolder;
  const result = await listMaterialPhotos(folder).catch(() => ({state:'error',photos:[]}));
  if (id === materialScan) currentMaterials = { ...result, folder };
  return currentMaterials;
}

function initialMaterials() {
  const scan = refreshMaterials();
  // Drive can take a moment to reconnect, even when the browser still has permission.
  let timer;
  const cached = new Promise(resolve => {
    timer = setTimeout(() => resolve({ photos:[] }),1800);
  });
  return Promise.race([scan,cached]).finally(() => clearTimeout(timer));
}

async function loadMaterialPhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    return await loadPhoto(url);
  } finally { URL.revokeObjectURL(url); }
}

async function choosePhoto(facts, materials) {
  if (blank || uploaded) return uploaded;
  const selected = posterPhotos.find(photo => photo.src === selectedPhoto);
  const { photos } = await materials;
  const automatic = rankPosterPhotos([...posterPhotos,...photos.filter(photo => photo.outfits.length)],facts.profile,previousPhoto);
  for (const candidate of (selected ? [selected,...automatic] : automatic)) {
    try {
      const image = candidate.file ? await loadMaterialPhoto(candidate.file) : await loadPhoto(candidate.src);
      photoSources.set(image,candidate);
      return image;
    } catch { /* Try another reviewed reference before leaving the photo space blank. */ }
  }
  return null;
}

function showPickerStatus(text) {
  pickerStatus.textContent = text;
  pickerStatus.hidden = !text;
}

function thumbnailChoice(label, thumbnail, selected, apply, closeOnSelect = true) {
  const button = document.createElement('button');
  const name = document.createElement('span');
  button.type = 'button';
  button.className = 'poster-choice';
  button.setAttribute('aria-pressed', String(selected));
  name.textContent = label;
  button.append(thumbnail,name);
  button.addEventListener('click',() => {
    if (closeOnSelect) picker.close();
    apply();
  });
  return button;
}

function clearThumbnails() {
  choices.replaceChildren();
  for (const url of thumbnailUrls.splice(0)) URL.revokeObjectURL(url);
}

async function showPhotoChoices(id) {
  const selection = await refreshMaterials();
  if (id !== pickerRequest || !picker.open) return;
  materialSelection = selection;
  folderButton.hidden = !supportsMaterialFolder;
  folderButton.textContent = selection.state === 'permission' ? '同期フォルダへのアクセスを許可'
    : selection.folder ? '同期フォルダを変更' : 'Google Driveの同期フォルダを選ぶ';
  removeFolderButton.hidden = !selection.folder;
  const statuses = {
    ready: '同期フォルダの写真 ' + selection.photos.length + '枚を読み込みました。',
    permission: '同期フォルダへのアクセスを許可すると写真を追加できます。',
    error: '同期フォルダを開けませんでした。フォルダを選び直してください。'
  };
  showPickerStatus(statuses[selection.state] || '');
  const candidates = rankPosterPhotos(posterPhotos,announcementFacts(event).profile,undefined,true);
  for (const photo of [...selection.photos,...candidates]) {
    const thumbnail = document.createElement('img');
    thumbnail.alt = '';
    thumbnail.loading = 'lazy';
    if (photo.file) {
      thumbnail.src = URL.createObjectURL(photo.file);
      thumbnailUrls.push(thumbnail.src);
    } else thumbnail.src = photo.src;
    const apply = photo.file ? () => useLocalPhoto(photo.file,photo) : () => useReferencePhoto(photo.src);
    choices.append(thumbnailChoice(photo.label,thumbnail,!blank && previousPhoto === photo.src,apply,!photo.file));
  }
}

async function openPicker(mode) {
  const id = ++pickerRequest;
  pickerMode = mode;
  pickerHeading.textContent = mode === 'photo' ? '写真を選ぶ' : 'デザインを選ぶ';
  blankButton.hidden = fileInput.parentElement.hidden = mode !== 'photo';
  themeFilter.parentElement.hidden = mode === 'photo';
  folderButton.hidden = removeFolderButton.hidden = true;
  clearThumbnails();
  showPickerStatus('');
  picker.showModal();
  picker.scrollTop = 0;
  if (mode === 'photo') {
    await showPhotoChoices(id);
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

async function generate({ newDesign = false, newPhoto = false, materials = Promise.resolve(currentMaterials) } = {}) {
  const id = ++request;
  const facts = announcementFacts(event);
  const key = [event.date,event.title,event.url].join('|');
  if (newDesign) design = nextDesign(facts,lastDesign.get(key),selectedTheme);
  chooseDesignButton.querySelector('small').textContent = posterThemes[design.key].label;
  if (newPhoto) choosePhotoButton.querySelector('small').textContent = '読み込み中…';
  if (newPhoto) {
    crop = null;
    photoChoice = choosePhoto(facts,materials);
  }
  displayedText = facts.text;
  message.value = facts.text;
  if (promptPreview.open) refreshSkillPrompt();
  feedback.textContent = '告知画像を作成中…';
  clearPress();
  preview.replaceChildren();
  releaseDownload();
  editButton.disabled = shuffle.disabled = true;
  try {
    const photo = await photoChoice;
    if (id !== request) return;
    const reference = photo && photoSources.get(photo);
    previousPhoto = reference?.src || '';
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
  copyAttempt++;
  copySkillPrompt.disabled = false;
  promptPreview.open = false;
  skillPrompt.value = '';
  skillFeedback.textContent = '';
  uploaded = null;
  blank = false;
  fileInput.value = '';
  selectedPhoto = '';
  dialog.querySelector('.event-name').textContent = item.title;
  dialog.showModal();
  dialog.scrollTop = 0;
  scheduleBookingCheck();
  generate({ newDesign: true, newPhoto: true, materials:initialMaterials() });
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
    clearThumbnails();
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
async function useLocalPhoto(file, source) {
  if (!usablePhoto(file)) {
    showPickerStatus('12MB以内のJPEG・PNG・WebP画像を選んでください。');
    fileInput.value = '';
    return;
  }
  const id = ++pickerRequest;
  showPickerStatus('写真を読み込み中…');
  try {
    const image = await loadMaterialPhoto(file);
    if (id !== pickerRequest || !picker.open) return;
    if (source) photoSources.set(image,source);
    uploaded = image;
    blank = false;
  } catch {
    if (id === pickerRequest && picker.open) {
      showPickerStatus('写真を読み込めませんでした。別の写真を選んでください。');
      fileInput.value = '';
    }
    return;
  }
  picker.close();
  generate({ newPhoto: true });
}
fileInput.addEventListener('change',() => {
  if (fileInput.files[0]) useLocalPhoto(fileInput.files[0]);
});

async function updateMaterialFolder(chooseFolder) {
  const id = ++pickerRequest;
  folderButton.disabled = removeFolderButton.disabled = true;
  try {
    const nextFolder = await chooseFolder();
    await saveMaterialFolder(nextFolder);
    materialFolder = Promise.resolve(nextFolder);
    currentMaterials = { state:'none', photos:[] };
    if (id !== pickerRequest || !picker.open) return;
    clearThumbnails();
    await showPhotoChoices(id);
  } catch (error) {
    if (id === pickerRequest && picker.open && error.name !== 'AbortError') showPickerStatus('フォルダを登録できませんでした。');
  } finally {
    folderButton.disabled = removeFolderButton.disabled = false;
  }
}
folderButton.addEventListener('click',() => updateMaterialFolder(async () => {
  if (materialSelection.state === 'permission') {
    await materialSelection.folder.requestPermission({mode:'read'});
    return materialSelection.folder;
  }
  return window.showDirectoryPicker({id:'announcement-photos',mode:'read'});
}));
removeFolderButton.addEventListener('click',() => updateMaterialFolder(() => null));
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

function refreshSkillPrompt() {
  const prompt = announcementSkillPrompt(event);
  if (skillPrompt.value !== prompt) {
    skillPrompt.value = prompt;
    skillFeedback.textContent = '';
  }
  return prompt;
}
promptPreview.addEventListener('toggle', () => {
  if (dialog.open && promptPreview.open) refreshSkillPrompt();
});

copySkillPrompt.addEventListener('click', async () => {
  const prompt = refreshSkillPrompt();
  const attempt = ++copyAttempt;
  copySkillPrompt.disabled = true;
  try {
    await navigator.clipboard.writeText(prompt);
    if (attempt !== copyAttempt || !dialog.open) return;
    skillFeedback.textContent = '依頼文をコピーしました。';
  } catch {
    if (attempt !== copyAttempt || !dialog.open) return;
    promptPreview.open = true;
    refreshSkillPrompt();
    skillPrompt.focus();
    skillPrompt.select();
    skillFeedback.textContent = '依頼文を全選択しました。端末のメニューから「コピー」を選んでください。';
  } finally {
    if (attempt === copyAttempt) copySkillPrompt.disabled = false;
  }
});
