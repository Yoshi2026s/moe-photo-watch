import { nextBookingChange } from './reservation.mjs?v=gallery-1';
import { announcementFacts, announcementSkillPrompt } from './announcement-facts.mjs?v=manual-photos-1';
import { nextDesign, posterThemeGroups, posterThemes, renderPoster } from './announcement-poster.mjs?v=two-photos-1';
import { openPosterEditor } from './poster-editor.mjs?v=two-photos-1';
import { filterPosterPhotos, posterPhotos, rankPosterPhotos } from './poster-photos.mjs?v=e4916b76b8a5906c';
import { photoInputError } from './manual-photo.mjs';
import { createCopyRequest } from './clipboard-copy.mjs';

const dialog = document.querySelector('#announcement');
const preview = dialog.querySelector('.poster-preview');
const message = dialog.querySelector('#social-message');
const feedback = dialog.querySelector('.announce-feedback');
const shuffle = dialog.querySelector('.shuffle');
const copy = dialog.querySelector('.copy-message');
const mobileCopy = dialog.querySelector('.mobile-copy-message');
const jumpPoster = dialog.querySelector('.jump-poster');
const postFeedback = dialog.querySelector('.post-copy-status');
const postManualFeedback = dialog.querySelector('#post-manual-status');
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
const fileInput = picker.querySelector('.upload-photo input');
const fileFormats = picker.querySelector('#upload-photo-formats');
const localPreview = picker.querySelector('.local-photo-preview');
const localPhotoImage = picker.querySelector('.local-photo-image');
const localPhotoName = picker.querySelector('.local-photo-name');
const applyLocalPhoto = picker.querySelector('.use-local-photo');
const photoFilters = picker.querySelector('.photo-filters');
const photoQuery = picker.querySelector('.photo-query');
const photoOutfit = picker.querySelector('.photo-outfit');
const photoCurrent = picker.querySelector('.current-photo');
const clearPhotoFilters = picker.querySelector('.clear-photo-filters');
const photoResults = picker.querySelector('.photo-results');
const morePhotos = picker.querySelector('.more-photos');
const autoChoice = picker.querySelector('.auto-choice');
const pairMode = picker.querySelector('.photo-pair-mode');
const applyPair = picker.querySelector('.apply-photo-pair');
const resetPair = picker.querySelector('.reset-photo-pair');
const photoPageSize = 24;
const lastDesign = new Map();
let event, request = 0, uploaded = null, uploadedName = '', pendingPhoto, blank = false, previousPhoto = '', downloadUrl = '';
const posterFiles = new WeakMap();
let displayedText = '', design, photoChoice, crop;
let secondaryPhoto, secondCrop, pendingPair = null;
let press, saveMenuTimer;
const writeClipboard = text => navigator.clipboard.writeText(text);
const postCopy = createCopyRequest(writeClipboard);
const skillCopy = createCopyRequest(writeClipboard);
let selectedTheme = '', selectedPhoto = '', activePhoto = '', pickerMode, pickerRequest = 0;
const photoSources = new WeakMap();
let recommendedPhotos;
let photoLimit = photoPageSize;
let designPreviewObserver;
let localPreviewUrl = '';

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
    const offset = bounds.top - figure.getBoundingClientRect().top;
    menu.style.top = offset + Math.max(0, Math.min(y - bounds.top - height/2, bounds.height - height)) + 'px';
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
  download.className = 'download-poster';
  download.href = url;
  download.download = file.name;
  download.textContent = 'PNGをダウンロード';
  actions.append(download,open);
  return actions;
}

async function loadPhoto(url) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}

async function loadReference(candidate) {
  const image = await loadPhoto(candidate.src);
  photoSources.set(image,candidate);
  return image;
}

async function choosePhoto(facts) {
  if (blank || uploaded) return uploaded;
  const selected = posterPhotos.find(photo => photo.src === selectedPhoto);
  const automatic = rankPosterPhotos(posterPhotos,facts.profile,previousPhoto);
  for (const candidate of (selected ? [selected,...automatic] : automatic)) {
    try {
      return await loadReference(candidate);
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
  button.addEventListener('click',apply);
  return button;
}

function clearThumbnails() {
  designPreviewObserver?.disconnect();
  designPreviewObserver = null;
  choices.replaceChildren();
}

function syncPhotoPicker() {
  const pairing = pendingPair !== null;
  pairMode.setAttribute('aria-pressed',String(pairing));
  applyPair.hidden = resetPair.hidden = !pairing;
  resetPair.disabled = !pendingPair?.length;
  applyPair.disabled = pendingPair?.length !== 2;
  autoChoice.hidden = pairing;
  blankButton.hidden = fileInput.parentElement.hidden = fileFormats.hidden = pairing;
  const label = src => posterPhotos.find(photo => photo.src === src)?.label;
  photoCurrent.textContent = pairing
    ? pendingPair.map((src,index) => (index+1) + '枚目：' + label(src)).join(' ／ ') + (pendingPair.length < 2
      ? (pendingPair.length ? ' ／ 2枚目を選んでください。' : '素材から2枚を選んでください。') : '')
    : secondaryPhoto ? '現在の告知画像は2枚の写真を使用中です。'
      : '使用中：' + choosePhotoButton.querySelector('small').textContent;
}

function selectPairPhoto(src) {
  const index = pendingPair.indexOf(src);
  if (index < 0 && pendingPair.length === 2) {
    showPickerStatus('写真を入れ替えるには、選んだ写真をもう一度押すか「選び直す」を押してください。');
    return;
  }
  pickerRequest++;
  showPickerStatus('');
  if (index < 0) pendingPair.push(src);
  else pendingPair.splice(index,1);
  syncPhotoPicker();
  renderPhotoChoices();
}

function renderPhotoChoices() {
  const focused = choices.contains(document.activeElement) && document.activeElement.dataset.photo;
  clearThumbnails();
  const query = photoQuery.value.trim();
  const outfit = photoOutfit.value;
  const candidates = filterPosterPhotos(recommendedPhotos,query,outfit);
  clearPhotoFilters.hidden = !query && !outfit;
  const visible = candidates.slice(0,photoLimit);
  photoResults.textContent = candidates.length ? candidates.length + '枚中 ' + visible.length + '枚を表示'
    : '条件に合う写真がありません。';
  morePhotos.hidden = visible.length === candidates.length;
  for (const photo of visible) {
    const thumbnail = document.createElement('img');
    thumbnail.alt = '';
    thumbnail.loading = 'lazy';
    thumbnail.src = photo.src;
    const index = pendingPair?.indexOf(photo.src) ?? -1;
    const selected = pendingPair ? index >= 0 : !secondaryPhoto && activePhoto === photo.src;
    const choice = thumbnailChoice(photo.label,thumbnail,selected,() => {
      if (pendingPair) selectPairPhoto(photo.src);
      else {
        picker.close();
        useReferencePhoto(photo.src);
      }
    });
    choice.dataset.photo = photo.src;
    if (index >= 0) choice.dataset.pairPosition = index+1;
    choices.append(choice);
    if (photo.src === focused) choice.focus({preventScroll:true});
  }
}

function filterPhotos() {
  photoLimit = photoPageSize;
  renderPhotoChoices();
}
photoQuery.addEventListener('input',filterPhotos);
photoOutfit.addEventListener('change',filterPhotos);
clearPhotoFilters.addEventListener('click',() => {
  photoQuery.value = photoOutfit.value = '';
  filterPhotos();
  photoQuery.focus();
});
morePhotos.addEventListener('click',() => {
  const firstNew = photoLimit;
  photoLimit += photoPageSize;
  renderPhotoChoices();
  choices.children[firstNew]?.focus();
});

pairMode.addEventListener('click',() => {
  pickerRequest++;
  if (pendingPair) pendingPair = null;
  else if (secondaryPhoto) pendingPair = [selectedPhoto,photoSources.get(secondaryPhoto).src];
  else pendingPair = selectedPhoto && activePhoto === selectedPhoto ? [selectedPhoto] : [];
  resetLocalPreview();
  showPickerStatus('');
  syncPhotoPicker();
  renderPhotoChoices();
});

resetPair.addEventListener('click',() => {
  pickerRequest++;
  pendingPair = [];
  showPickerStatus('');
  syncPhotoPicker();
  renderPhotoChoices();
  pairMode.focus({preventScroll:true});
});

applyPair.addEventListener('click',async () => {
  if (applyPair.disabled || pendingPair?.length !== 2) return;
  const id = ++pickerRequest;
  applyPair.disabled = true;
  showPickerStatus('写真を読み込んでいます…');
  const sources = [...pendingPair];
  try {
    const [first,second] = await Promise.all(sources.map(src => loadReference(posterPhotos.find(photo => photo.src === src))));
    if (id !== pickerRequest || !picker.open || !dialog.open) return;
    const existingCrops = secondaryPhoto && new Map([[selectedPhoto,crop],[photoSources.get(secondaryPhoto).src,secondCrop]]);
    crop = existingCrops ? existingCrops.get(sources[0]) : null;
    secondCrop = existingCrops ? existingCrops.get(sources[1]) : null;
    selectedPhoto = sources[0];
    uploaded = null;
    uploadedName = '';
    blank = false;
    photoChoice = Promise.resolve(first);
    secondaryPhoto = second;
    picker.close();
    generate();
  } catch {
    if (id === pickerRequest && picker.open) showPickerStatus('写真を読み込めませんでした。もう一度反映するか、別の写真を選んでください。');
  } finally {
    if (id === pickerRequest && picker.open) applyPair.disabled = false;
  }
});

async function openPicker(mode) {
  const id = ++pickerRequest;
  pickerMode = mode;
  pickerHeading.textContent = mode === 'photo' ? '写真を選ぶ' : 'デザインを選ぶ';
  blankButton.hidden = fileInput.parentElement.hidden = mode !== 'photo';
  fileFormats.hidden = mode !== 'photo';
  themeFilter.parentElement.hidden = mode === 'photo';
  photoFilters.hidden = photoResults.hidden = mode !== 'photo';
  photoCurrent.hidden = pairMode.hidden = mode !== 'photo';
  applyPair.hidden = resetPair.hidden = true;
  autoChoice.hidden = false;
  pendingPair = null;
  clearPhotoFilters.hidden = true;
  morePhotos.hidden = true;
  clearThumbnails();
  resetLocalPreview();
  showPickerStatus('');
  picker.showModal();
  picker.scrollTop = 0;
  if (mode === 'photo') {
    photoQuery.value = '';
    photoOutfit.value = '';
    if (secondaryPhoto) pendingPair = [selectedPhoto,photoSources.get(secondaryPhoto).src];
    syncPhotoPicker();
    photoLimit = photoPageSize;
    recommendedPhotos = rankPosterPhotos(posterPhotos,announcementFacts(event).profile,undefined,true);
    renderPhotoChoices();
    return;
  }
  showPickerStatus('デザインをプレビュー中…');
  try {
    const photo = await photoChoice;
    if (id !== pickerRequest || !picker.open) return;
    const facts = announcementFacts(event);
    const paint = new WeakMap();
    if (typeof IntersectionObserver === 'function') {
      designPreviewObserver = new IntersectionObserver((entries,observer) => {
        if (id !== pickerRequest || !picker.open) return;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          paint.get(entry.target)?.();
        }
      },{root:picker,rootMargin:'240px 0px'});
    }
    for (const [key, theme] of Object.entries(posterThemes)) {
      const candidate = design.key === key ? design : nextDesign(facts,null,key);
      const thumbnail = document.createElement('div');
      thumbnail.className = 'design-thumbnail';
      thumbnail.style.aspectRatio = { story:'9/16', feed:'4/5', square:'1' }[format.value];
      thumbnail.setAttribute('aria-hidden','true');
      const draw = () => {
        try { thumbnail.append(renderPoster(facts,candidate,photo,format.value,{ previewScale: .2, crop, secondaryPhoto, secondCrop })); }
        catch { thumbnail.classList.add('thumbnail-unavailable'); }
      };
      const choice = thumbnailChoice(theme.label,thumbnail,design.key === key,() => {
        picker.close();
        design = candidate;
        selectedTheme = key;
        generate();
      });
      choice.dataset.theme = key;
      choices.append(choice);
      if (designPreviewObserver) {
        paint.set(thumbnail,draw);
        designPreviewObserver.observe(thumbnail);
      } else draw();
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
    crop = secondCrop = secondaryPhoto = null;
    photoChoice = choosePhoto(facts);
  }
  displayedText = facts.text;
  syncPostMessage(facts.text);
  if (promptPreview.open) refreshSkillPrompt();
  feedback.textContent = '告知画像を作成中…';
  clearPress();
  jumpPoster.disabled = true;
  preview.replaceChildren();
  releaseDownload();
  editButton.disabled = shuffle.disabled = true;
  try {
    const photo = await photoChoice;
    if (id !== request) return;
    const reference = photo && photoSources.get(photo);
    previousPhoto = reference?.src || '';
    activePhoto = reference?.src || '';
    choosePhotoButton.querySelector('small').textContent = secondaryPhoto ? '2枚を使用中'
      : reference?.label || (photo ? (uploadedName || '端末の写真') : '空欄');
    if (picker.open && pickerMode === 'photo') {
      if (!pendingPair) syncPhotoPicker();
      renderPhotoChoices();
    }
    const canvas = renderPoster(facts,design,photo,format.value,{ crop, secondaryPhoto, secondCrop });
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
    figure.append(posterActions(file,downloadUrl),status);
    if (matchMedia('(any-pointer: coarse)').matches) {
      const tip = document.createElement('p');
      tip.className = 'poster-save-tip';
      tip.textContent = '画像を長押しして写真アプリに保存することもできます。';
      figure.append(tip);
    }
    figure.append(pic);
    preview.replaceChildren(figure);
    jumpPoster.disabled = false;
    lastDesign.set(key,design);
    feedback.textContent = photo ? '告知画像を作成しました。'
      : blank ? '写真枠を空欄にしました。' : '衣装に合う写真が見つかりませんでした。「写真を選ぶ」から差し替えられます。';
  } catch {
    if (id === request) feedback.textContent = '画像を作成できませんでした。投稿文はコピーできます。';
  } finally {
    if (id === request) editButton.disabled = shuffle.disabled = false;
  }
}

export function openAnnouncement(item) {
  event = item;
  resetPostCopy();
  skillCopy.cancel();
  copySkillPrompt.disabled = false;
  promptPreview.open = false;
  skillPrompt.value = '';
  skillFeedback.textContent = '';
  uploaded = null;
  uploadedName = '';
  blank = false;
  fileInput.value = '';
  selectedPhoto = '';
  activePhoto = '';
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
    facts: announcementFacts(event), design, photo, secondaryPhoto, format: format.value, crop, secondCrop,
    apply(variant, framing, secondFraming) {
      design = variant;
      crop = framing;
      secondCrop = secondFraming;
      generate();
    }
  });
});
picker.querySelector('.close-picker').addEventListener('click',() => picker.close());
picker.addEventListener('close',() => {
  if (!picker.open) {
    pickerRequest++;
    clearThumbnails();
    resetLocalPreview();
  }
});
format.addEventListener('change',() => generate());
dialog.querySelector('.close-dialog').addEventListener('click',() => dialog.close());
dialog.addEventListener('close',() => {
  if (dialog.open) return;
  resetPostCopy();
  skillCopy.cancel();
  clearPress();
  request++;
  photoChoice = null;
  uploaded = null;
  uploadedName = '';
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
  uploadedName = '';
  selectedPhoto = '';
  fileInput.value = '';
  generate({ newPhoto: true });
});
function useReferencePhoto(src = '') {
  selectedPhoto = src;
  blank = false;
  uploaded = null;
  uploadedName = '';
  fileInput.value = '';
  generate({ newPhoto: true });
}
autoChoice.addEventListener('click',() => {
  picker.close();
  if (pickerMode === 'photo') useReferencePhoto();
  else {
    selectedTheme = '';
    generate({ newDesign: true });
  }
});
function resetLocalPreview() {
  pendingPhoto = null;
  localPreview.hidden = true;
  localPhotoImage.replaceChildren();
  if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
  localPreviewUrl = '';
  localPhotoName.textContent = '';
  fileInput.value = '';
}

async function previewLocalPhoto(file) {
  const id = ++pickerRequest;
  resetLocalPreview();
  const validation = photoInputError(file);
  if (validation) {
    showPickerStatus(validation);
    return;
  }
  showPickerStatus('写真を読み込み中…');
  const url = URL.createObjectURL(file);
  try {
    const image = await loadPhoto(url);
    if (id !== pickerRequest || !picker.open || !dialog.open) return;
    localPreviewUrl = url;
    pendingPhoto = { image, name:file.name };
    image.alt = '選んだ写真のプレビュー';
    localPhotoImage.replaceChildren(image);
    localPhotoName.textContent = file.name;
    localPreview.hidden = false;
    showPickerStatus('');
    applyLocalPhoto.focus({preventScroll:true});
    localPreview.scrollIntoView({block:'nearest'});
  } catch {
    if (id === pickerRequest && picker.open) {
      showPickerStatus('写真を読み込めませんでした。別の写真を選んでください。');
    }
  } finally {
    if (localPreviewUrl !== url) URL.revokeObjectURL(url);
  }
}
applyLocalPhoto.addEventListener('click',() => {
  if (!pendingPhoto || !picker.open || !dialog.open) return;
  uploaded = pendingPhoto.image;
  uploadedName = pendingPhoto.name;
  selectedPhoto = '';
  blank = false;
  picker.close();
  generate({ newPhoto: true });
});
picker.querySelector('.cancel-local-photo').addEventListener('click',() => {
  pickerRequest++;
  resetLocalPreview();
  showPickerStatus('');
  fileInput.focus();
});
fileInput.addEventListener('change',() => {
  if (fileInput.files[0]) previewLocalPhoto(fileInput.files[0]);
});

function jumpToMessage() {
  message.focus({preventScroll:true});
  dialog.querySelector('.message-heading').scrollIntoView({block:'start'});
}
dialog.querySelector('.view-message').addEventListener('click',jumpToMessage);
dialog.querySelector('.jump-message').addEventListener('click',jumpToMessage);
jumpPoster.addEventListener('click',() => {
  preview.querySelector('.download-poster')?.focus({preventScroll:true});
  preview.scrollIntoView({block:'start'});
});
function resetPostCopy() {
  postCopy.cancel();
  copy.disabled = mobileCopy.disabled = false;
  postFeedback.textContent = '';
  postManualFeedback.textContent = '';
}

function syncPostMessage(text) {
  if (message.value === text) return;
  resetPostCopy();
  message.value = text;
}

function selectFullText(textarea) {
  textarea.focus({preventScroll:true});
  textarea.scrollIntoView({block:'nearest'});
  textarea.select();
  textarea.setSelectionRange(0,textarea.value.length);
}

function selectPostMessage() {
  syncPostMessage(announcementFacts(event).text);
  resetPostCopy();
  postManualFeedback.textContent = '投稿文を全選択しました。端末のメニューから「コピー」を選んでください。';
  selectFullText(message);
}

dialog.querySelector('.select-message').addEventListener('click',selectPostMessage);
async function copyPostMessage(clickEvent) {
  const status = clickEvent.currentTarget === mobileCopy ? postManualFeedback : postFeedback;
  syncPostMessage(announcementFacts(event).text);
  copy.disabled = mobileCopy.disabled = true;
  postFeedback.textContent = '';
  postManualFeedback.textContent = '';
  status.textContent = '投稿文をコピー中…';
  const result = await postCopy.write(message.value);
  if (!result || !dialog.open) return;
  copy.disabled = mobileCopy.disabled = false;
  if (result === 'manual') selectPostMessage();
  else status.textContent = '投稿文をコピーしました。';
}
copy.addEventListener('click',copyPostMessage);
mobileCopy.addEventListener('click',copyPostMessage);

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
  copySkillPrompt.disabled = true;
  skillFeedback.textContent = '依頼文をコピー中…';
  const result = await skillCopy.write(prompt);
  if (!result || !dialog.open) return;
  copySkillPrompt.disabled = false;
  if (result === 'manual') {
    promptPreview.open = true;
    refreshSkillPrompt();
    skillFeedback.textContent = '依頼文を全選択しました。端末のメニューから「コピー」を選んでください。';
    selectFullText(skillPrompt);
  } else {
    skillFeedback.textContent = '依頼文をコピーしました。';
  }
});
