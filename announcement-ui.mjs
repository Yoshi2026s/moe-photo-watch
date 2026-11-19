import { nextBookingChange } from './reservation.mjs?v=gallery-1';
import { announcementFacts, announcementSkillPrompt } from './announcement-facts.mjs?v=photo-themes-1';
import { nextDesign, posterThemeGroups, posterThemes, renderPoster } from './announcement-poster.mjs?v=photo-themes-1';
import { openPosterEditor } from './poster-editor.mjs?v=photo-themes-1';
import { posterPhotos, rankPosterPhotos } from './poster-photos.mjs?v=photo-themes-1';
import { listMaterialPhotos, savedMaterialFolder, saveMaterialFolder, supportsMaterialFolder, usablePhoto } from './poster-materials.mjs';
import { clearSavedDrivePhotos, importDrivePhotos, savedDrivePhotos } from './poster-imported-photos.mjs?v=drive-import-1';

const dialog = document.querySelector('#announcement');
const preview = dialog.querySelector('.poster-preview');
const message = dialog.querySelector('#social-message');
const feedback = dialog.querySelector('.announce-feedback');
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
const fileInput = picker.querySelector('.upload-photo input');
const drivePanel = picker.querySelector('.drive-materials');
const driveConnection = picker.querySelector('.drive-connection');
const driveHelp = picker.querySelector('.drive-help');
const folderButton = picker.querySelector('.material-folder');
const permitFolderButton = picker.querySelector('.permit-material-folder');
const refreshFolderButton = picker.querySelector('.refresh-material-folder');
const removeFolderButton = picker.querySelector('.remove-material-folder');
const importButton = picker.querySelector('.import-drive-photos');
const importInput = picker.querySelector('.drive-files');
const clearImportButton = picker.querySelector('.clear-drive-photos');
const driveButtons = [folderButton,permitFolderButton,refreshFolderButton,removeFolderButton,importButton,clearImportButton];
const photoFilters = picker.querySelector('.photo-filters');
const photoQuery = picker.querySelector('.photo-query');
const photoOrigin = picker.querySelector('.photo-origin');
const photoResults = picker.querySelector('.photo-results');
const morePhotos = picker.querySelector('.more-photos');
const photoPageSize = 24;
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
let materialScan, recommendedPhotos;
let driveActionPending = false;
let importedPhotos = [], importRead = 0, importReadFailed = false;
let photoLimit = photoPageSize;
let designPreviewObserver;

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

function refreshMaterials() {
  const source = materialFolder;
  if (materialScan?.source === source) return materialScan.promise;
  const promise = source.then(async folder => {
    const result = await listMaterialPhotos(folder).catch(() => ({state:'error',photos:[]}));
    if (materialFolder === source) currentMaterials = { ...result, folder };
    return currentMaterials;
  }).finally(() => {
    if (materialScan?.promise === promise) materialScan = null;
  });
  materialScan = { source, promise };
  return promise;
}

function initialMaterials() {
  const scan = Promise.all([refreshMaterials(),refreshImports()]).then(([material]) => material);
  // Drive can take a moment to reconnect, even when the browser still has permission.
  let timer;
  const fallback = new Promise(resolve => {
    timer = setTimeout(() => resolve({ photos:[] }),1800);
  });
  return Promise.race([scan,fallback]).finally(() => clearTimeout(timer));
}

async function refreshImports() {
  const id = ++importRead;
  try {
    const items = await savedDrivePhotos();
    if (id === importRead) {
      importedPhotos = items;
      importReadFailed = false;
    }
  } catch {
    if (id === importRead) {
      importedPhotos = [];
      importReadFailed = true;
    }
  }
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
  const candidates = [...photos,...importedPhotos].filter(photo => photo.outfits.length);
  const automatic = rankPosterPhotos([...posterPhotos,...candidates],facts.profile,previousPhoto);
  for (const candidate of (selected ? [selected,...automatic] : automatic)) {
    try {
      const file = candidate.loadFile ? await candidate.loadFile() : candidate.file;
      if (candidate.loadFile && !file) continue;
      const image = file ? await loadMaterialPhoto(file) : await loadPhoto(candidate.src);
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
  designPreviewObserver?.disconnect();
  designPreviewObserver = null;
  choices.replaceChildren();
  for (const url of thumbnailUrls.splice(0)) URL.revokeObjectURL(url);
}

function renderDriveConnection() {
  const { folder, state, photos } = currentMaterials;
  const needsPermission = state === 'permission';
  folderButton.hidden = !supportsMaterialFolder;
  permitFolderButton.hidden = !supportsMaterialFolder || !needsPermission;
  refreshFolderButton.hidden = !supportsMaterialFolder || !folder || needsPermission;
  removeFolderButton.hidden = !supportsMaterialFolder || !folder;
  clearImportButton.hidden = !importedPhotos.length;
  folderButton.textContent = folder ? 'フォルダを変更' : 'Driveフォルダを登録';
  folderButton.classList.toggle('drive-primary',!folder);
  permitFolderButton.classList.toggle('drive-primary',needsPermission);
  refreshFolderButton.classList.toggle('drive-primary',Boolean(folder && !needsPermission));
  importButton.classList.toggle('drive-primary',!supportsMaterialFolder);
  const localCount = 'この端末に追加した写真 ' + importedPhotos.length + '枚';
  if (!supportsMaterialFolder) {
    driveConnection.textContent = localCount;
    driveHelp.textContent = '「Driveの写真を追加」を押し、「ファイルを選択」→「ブラウズ」→「Google Drive」→「告知画像」で写真を選びます。追加した写真はこのブラウザーに保存されます。';
  } else if (!folder) {
    driveConnection.textContent = '未登録';
    driveHelp.textContent = '「Driveフォルダを登録」を押し、PCのGoogle Drive → マイドライブ → 告知画像を選んで読み取りを許可します。';
  } else {
    const status = needsPermission ? '読み取り許可が必要' : state === 'error' ? 'フォルダを開けません'
      : '登録済み・写真 ' + photos.length + '枚';
    driveConnection.textContent = folder.name + '　' + status;
    driveHelp.textContent = needsPermission ? '「読み取りを許可」で、このフォルダをもう一度開けます。'
      : state === 'error' ? 'PCでGoogle Driveの同期を確認し、「Driveの写真を更新」を押してください。'
      : photos.length ? '' : 'フォルダに対応する写真がありません。JPEG・PNG・WebPの写真を確認してください。';
  }
  if (supportsMaterialFolder && importedPhotos.length) driveConnection.textContent += ' ／ ' + localCount;
  if (importReadFailed) driveConnection.textContent += ' ／ 端末に追加した写真を読み込めませんでした。';
}

function renderPhotoChoices() {
  const focused = choices.contains(document.activeElement) && document.activeElement.dataset.photo;
  clearThumbnails();
  const selection = currentMaterials;
  const origin = photoOrigin.value;
  const query = photoQuery.value.trim().normalize('NFKC').toLocaleLowerCase('ja');
  const candidates = [
    ...(origin === 'site' ? [] : [...importedPhotos,...selection.photos]),
    ...(origin === 'folder' ? [] : recommendedPhotos)
  ].filter(photo => photo.label.normalize('NFKC').toLocaleLowerCase('ja').includes(query));
  const visible = candidates.slice(0,photoLimit);
  photoResults.textContent = candidates.length ? candidates.length + '枚中 ' + visible.length + '枚を表示'
    : origin === 'folder' && !query ? 'Driveの写真がまだ表示されていません。「Driveの写真を追加」から登録できます。'
    : '条件に合う写真がありません。';
  morePhotos.hidden = visible.length === candidates.length;
  for (const photo of visible) {
    const thumbnail = document.createElement('img');
    thumbnail.alt = '';
    thumbnail.loading = 'lazy';
    const image = photo.thumbnail || photo.file;
    if (image) {
      thumbnail.src = URL.createObjectURL(image);
      thumbnailUrls.push(thumbnail.src);
    } else thumbnail.src = photo.src;
    const apply = image ? () => useLocalPhoto(photo.file,photo) : () => useReferencePhoto(photo.src);
    const choice = thumbnailChoice(photo.label,thumbnail,!blank && previousPhoto === photo.src,apply,!image);
    choice.dataset.photo = photo.src;
    choices.append(choice);
    if (photo.src === focused) choice.focus({preventScroll:true});
  }
}

async function updatePhotoChoices(id) {
  if (supportsMaterialFolder) showPickerStatus('Driveフォルダを確認中…');
  await Promise.all([refreshMaterials(),refreshImports()]);
  if (id !== pickerRequest || !picker.open) return;
  showPickerStatus('');
  renderDriveConnection();
  renderPhotoChoices();
}

function filterPhotos() {
  photoLimit = photoPageSize;
  renderPhotoChoices();
}
photoQuery.addEventListener('input',filterPhotos);
photoOrigin.addEventListener('change',filterPhotos);
morePhotos.addEventListener('click',() => {
  const firstNew = photoLimit;
  photoLimit += photoPageSize;
  renderPhotoChoices();
  choices.children[firstNew]?.focus();
});

async function openPicker(mode) {
  const id = ++pickerRequest;
  pickerMode = mode;
  pickerHeading.textContent = mode === 'photo' ? '写真を選ぶ' : 'デザインを選ぶ';
  blankButton.hidden = fileInput.parentElement.hidden = mode !== 'photo';
  themeFilter.parentElement.hidden = mode === 'photo';
  drivePanel.hidden = mode !== 'photo';
  photoFilters.hidden = photoResults.hidden = mode !== 'photo';
  morePhotos.hidden = true;
  clearThumbnails();
  showPickerStatus('');
  picker.showModal();
  picker.scrollTop = 0;
  if (mode === 'photo') {
    photoQuery.value = '';
    photoOrigin.value = 'all';
    photoLimit = photoPageSize;
    recommendedPhotos = rankPosterPhotos(posterPhotos,announcementFacts(event).profile,undefined,true);
    renderDriveConnection();
    renderPhotoChoices();
    await updatePhotoChoices(id);
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
        try { thumbnail.append(renderPoster(facts,candidate,photo,format.value,{ previewScale: .2, crop })); }
        catch { thumbnail.classList.add('thumbnail-unavailable'); }
      };
      const choice = thumbnailChoice(theme.label,thumbnail,design.key === key,() => {
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
    figure.append(posterActions(file,downloadUrl),status);
    if (matchMedia('(any-pointer: coarse)').matches) {
      const tip = document.createElement('p');
      tip.className = 'poster-save-tip';
      tip.textContent = '画像を長押しして写真アプリに保存することもできます。';
      figure.append(tip);
    }
    figure.append(pic);
    preview.replaceChildren(figure);
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
  if (dialog.open) return;
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
  if (!source?.loadFile && !usablePhoto(file)) {
    showPickerStatus('12MB以内のJPEG・PNG・WebP画像を選んでください。');
    fileInput.value = '';
    return;
  }
  const id = ++pickerRequest;
  showPickerStatus('写真を読み込み中…');
  try {
    const input = source?.loadFile ? await source.loadFile() : file;
    if (!input) throw Error('Missing photo');
    const image = await loadMaterialPhoto(input);
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

async function chooseDriveFolder(id) {
  const previous = currentMaterials.folder;
  const folder = await window.showDirectoryPicker({id:'announcement-photos',mode:'read',startIn:previous || 'documents'});
  if (id === pickerRequest && picker.open) showPickerStatus('選んだフォルダの写真を確認中…');
  const result = await listMaterialPhotos(folder);
  if (result.state !== 'ready') return '選んだフォルダを読み取れませんでした。ブラウザーの確認画面で読み取りを許可してください。';
  if (!result.photos.length) return '選んだフォルダに対応する写真がありません。「告知画像」フォルダを選び直してください。';
  await saveMaterialFolder(folder);
  materialFolder = Promise.resolve(folder);
  currentMaterials = { ...result, folder };
  return '';
}

function importResultText(result) {
  return [
    result.added + '枚をこの端末に追加しました。',
    result.duplicate && '登録済み ' + result.duplicate + '枚',
    result.invalid && '非対応形式または12MB超 ' + result.invalid + '枚',
    result.unreadable && '読み込めない写真 ' + result.unreadable + '枚',
    result.storageFailed && '端末に保存できず途中で止まりました。保存できた写真は一覧で確認できます。'
  ].filter(Boolean).join(' ');
}

async function useDrivePhotos(action, files) {
  if (driveActionPending) return;
  const id = ++pickerRequest;
  driveActionPending = true;
  for (const button of driveButtons) button.disabled = true;
  try {
    let problem = '';
    let notice = '';
    if (action === 'choose') {
      problem = await chooseDriveFolder(id);
    } else if (action === 'remove') {
      await saveMaterialFolder(null);
      materialFolder = Promise.resolve(null);
      currentMaterials = { state:'none', photos:[] };
    } else if (action === 'import') {
      showPickerStatus('写真をこの端末に保存中…');
      const result = await importDrivePhotos(files);
      await refreshImports();
      notice = importResultText(result);
    } else if (action === 'clear-imports') {
      await clearSavedDrivePhotos();
      await refreshImports();
      notice = 'この端末に追加した写真の登録を解除しました。';
    } else {
      if (action === 'permit') {
        await currentMaterials.folder.requestPermission({mode:'read'});
        await materialScan?.promise;
      }
      if (id === pickerRequest && picker.open) showPickerStatus('Driveの写真を確認中…');
      await refreshMaterials();
    }
    if (id !== pickerRequest || !picker.open) return;
    renderDriveConnection();
    if (!problem) {
      photoOrigin.value = currentMaterials.photos.length || importedPhotos.length ? 'folder' : 'all';
      photoQuery.value = '';
      filterPhotos();
    }
    showPickerStatus(problem || notice);
  } catch (error) {
    if (id === pickerRequest && picker.open) {
      showPickerStatus(error.name === 'AbortError' ? '' : 'Driveフォルダを登録・更新できませんでした。もう一度お試しください。');
    }
  } finally {
    driveActionPending = false;
    for (const button of driveButtons) button.disabled = false;
  }
}
folderButton.addEventListener('click',() => useDrivePhotos('choose'));
permitFolderButton.addEventListener('click',() => useDrivePhotos('permit'));
refreshFolderButton.addEventListener('click',() => useDrivePhotos('refresh'));
removeFolderButton.addEventListener('click',() => useDrivePhotos('remove'));
importButton.addEventListener('click',() => importInput.click());
importInput.addEventListener('change',() => {
  const files = Array.from(importInput.files);
  importInput.value = '';
  if (files.length) useDrivePhotos('import',files);
});
clearImportButton.addEventListener('click',() => {
  if (window.confirm('この端末に追加した写真の登録をすべて解除しますか？')) useDrivePhotos('clear-imports');
});
dialog.querySelector('.view-message').addEventListener('click',() => {
  message.focus({preventScroll:true});
  message.scrollIntoView({block:'start'});
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
