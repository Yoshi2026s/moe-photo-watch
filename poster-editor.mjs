import { posterLayouts, posterVariant, renderPoster } from './announcement-poster.mjs?v=two-photos-1';
import { letteringOptions } from './poster-lettering.mjs?v=poster-density-1';
import { backgroundPatterns } from './poster-patterns.mjs?v=photo-themes-1';
import { cropFromGesture, defaultCrop } from './poster-crop.mjs?v=touch-crop-1';

const editor = document.querySelector('#poster-editor');
const preview = editor.querySelector('.poster-edit-preview');
const canvasMount = preview.querySelector('.poster-edit-canvas');
const editControls = editor.querySelector('.poster-edit-controls');
const editTabs = [...editor.querySelectorAll('[data-edit-tab]')];
const cropTab = editTabs.find(button => button.dataset.editTab === 'crop');
const palettes = editor.querySelector('.poster-palettes');
const layout = editor.querySelector('#poster-layout');
const lettering = editor.querySelector('#poster-lettering');
const typeface = editor.querySelector('#poster-typeface');
const typeSize = editor.querySelector('#poster-type-size');
const pattern = editor.querySelector('#poster-pattern');
const cropControls = editor.querySelector('.poster-crop');
const cropTarget = cropControls.querySelector('.crop-photo-target select');
const ranges = [...cropControls.querySelectorAll('input[type=range]')];
const rangeReadouts = new Map(ranges.map(range => [range.name,cropControls.querySelector('[data-crop-value="' + range.name + '"]')]));
const fit = cropControls.querySelector('input[name=fit]');
const portraitScreen = matchMedia('(max-width: 600px) and (orientation: portrait)');
const contacts = new Map();
let source, draft, crops, frame, photoFrame, gesture;

const pairedLayouts = { split:'同じ幅で並べる', feature:'1枚目を大きく', stack:'写真の比率に合わせる', banner:'2枚目を大きく' };
for (const [key, name] of Object.entries(letteringOptions)) lettering.add(new Option(name,key));
for (const [key, motif] of Object.entries(backgroundPatterns)) pattern.add(new Option(motif.label,key));

const currentCrop = () => crops[Number(cropTarget.value)];
const initialCrop = () => ({ ...defaultCrop, fit: Boolean(source.secondaryPhoto) });

function drawPreview() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    if (!editor.open) return;
    photoFrame = null;
    const image = renderPoster(source.facts,draft,source.photo,source.format,{
      previewScale: .3, crop: crops[0], secondaryPhoto: source.secondaryPhoto, secondCrop: crops[1],
      onPhotoFrame: geometry => { if (cropTarget.value === '0') photoFrame = geometry; },
      onSecondPhotoFrame: geometry => { if (cropTarget.value === '1') photoFrame = geometry; }
    });
    image.setAttribute('aria-hidden','true');
    canvasMount.replaceChildren(image);
    updateGestureAvailability();
  });
}

function updateGestureAvailability() {
  preview.toggleAttribute('data-crop-gesture',Boolean(
    window.PointerEvent && editor.open && portraitScreen.matches &&
    editor.dataset.editSection === 'crop' && photoFrame && !currentCrop().fit
  ));
}

function stopGesture() {
  const captured = [...contacts.keys()];
  contacts.clear();
  gesture = null;
  for (const id of captured) {
    if (preview.hasPointerCapture(id)) preview.releasePointerCapture(id);
  }
}

function rebaseGesture() {
  gesture = null;
  if (!contacts.size) return;
  const canvas = canvasMount.firstElementChild;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    stopGesture();
    return;
  }
  const { x, y, width, height, transform } = photoFrame;
  const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
  const toPhoto = point => {
    const local = transform.transformPoint({
      x: (point.x - rect.left) * scaleX, y: (point.y - rect.top) * scaleY
    });
    return { x: local.x - x, y: local.y - y };
  };
  const selectedPhoto = cropTarget.value === '1' ? source.secondaryPhoto : source.photo;
  const { naturalWidth: sourceWidth, naturalHeight: sourceHeight } = selectedPhoto;
  gesture = { crop: { ...currentCrop() }, geometry: { sourceWidth, sourceHeight, width, height },
    start: [...contacts.values()].map(toPhoto), toPhoto };
}

preview.addEventListener('pointerdown',event => {
  if (event.pointerType !== 'touch' || contacts.size >= 2 ||
      !preview.hasAttribute('data-crop-gesture')) return;
  contacts.set(event.pointerId,{ x: event.clientX, y: event.clientY });
  preview.setPointerCapture(event.pointerId);
  rebaseGesture();
});

preview.addEventListener('pointermove',event => {
  if (!gesture || !contacts.has(event.pointerId)) return;
  contacts.set(event.pointerId,{ x: event.clientX, y: event.clientY });
  const { geometry, start, toPhoto } = gesture;
  const next = cropFromGesture(gesture.crop,geometry,start,[...contacts.values()].map(toPhoto));
  const crop = currentCrop();
  if (next.zoom === crop.zoom && next.x === crop.x && next.y === crop.y) return;
  crops[Number(cropTarget.value)] = next;
  reflectCrop();
  drawPreview();
});

function endContact(event) {
  if (contacts.delete(event.pointerId)) rebaseGesture();
}

preview.addEventListener('pointerup',endContact);
preview.addEventListener('pointercancel',endContact);
preview.addEventListener('lostpointercapture',event => {
  if (event.target === preview) endContact(event);
});
window.addEventListener('blur',stopGesture);
window.addEventListener('resize',stopGesture);
document.addEventListener('visibilitychange',() => {
  if (document.hidden) stopGesture();
});
portraitScreen.addEventListener('change',() => {
  stopGesture();
  updateGestureAvailability();
});

function setVariant(palette, left, positioning) {
  stopGesture();
  draft = { ...posterVariant(draft.key,palette,left,positioning), lettering: lettering.value,
    typeface: typeface.value, typeSize: typeSize.value, backgroundPattern: pattern.value };
  for (const [index, button] of [...palettes.children].entries()) {
    button.setAttribute('aria-pressed',String(index === draft.palette));
  }
  layout.value = draft.layout;
  drawPreview();
}

function reflectCrop() {
  const crop = currentCrop();
  fit.checked = crop.fit;
  for (const range of ranges) {
    range.value = crop[range.name];
    range.disabled = crop.fit;
    showCropValue(range);
  }
  editor.querySelector('.center-crop').disabled = crop.fit;
  updateGestureAvailability();
}

function showCropValue(range) {
  const text = Math.round(range.valueAsNumber * 100) + '%';
  rangeReadouts.get(range.name).textContent = text;
  range.setAttribute('aria-valuetext',text);
}

function showEditSection(section) {
  stopGesture();
  editor.dataset.editSection = section;
  for (const button of editTabs) button.setAttribute('aria-pressed',String(button.dataset.editTab === section));
  editControls.scrollTop = 0;
  updateGestureAvailability();
}

export function openPosterEditor(options) {
  source = options;
  draft = options.design;
  lettering.value = draft.lettering || '';
  typeface.value = draft.typeface || '';
  typeSize.value = draft.typeSize || '';
  pattern.value = draft.backgroundPattern || '';
  cropTarget.value = '0';
  cropTarget.parentElement.hidden = !options.secondaryPhoto;
  crops = [{ ...initialCrop(), ...options.crop },{ ...initialCrop(), ...options.secondCrop }];
  layout.replaceChildren();
  for (const [key,name] of Object.entries(options.secondaryPhoto ? pairedLayouts : posterLayouts)) layout.add(new Option(name,key));
  cropControls.disabled = !options.photo;
  cropTab.disabled = !options.photo;
  cropTab.title = options.photo ? '' : '写真を選ぶと調整できます';
  showEditSection('layout');
  palettes.replaceChildren();
  draft.palettes.forEach((colors,index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label','配色 ' + (index+1));
    for (const color of colors) {
      const swatch = document.createElement('span');
      swatch.style.backgroundColor = color;
      button.append(swatch);
    }
    button.addEventListener('click',() => setVariant(index,draft.left,draft.layout));
    palettes.append(button);
  });
  reflectCrop();
  editor.showModal();
  editor.scrollTop = 0;
  setVariant(draft.palette,draft.left,draft.layout);
}

layout.addEventListener('change',() => setVariant(draft.palette,draft.left,layout.value));
for (const control of [lettering,typeface,typeSize,pattern]) {
  control.addEventListener('change',() => setVariant(draft.palette,draft.left,draft.layout));
}
editor.querySelector('.flip-poster').addEventListener('click',() => setVariant(draft.palette,!draft.left,draft.layout));
cropTarget.addEventListener('change',() => {
  stopGesture();
  photoFrame = null;
  reflectCrop();
  drawPreview();
});
fit.addEventListener('change',() => {
  stopGesture();
  currentCrop().fit = fit.checked;
  if (fit.checked) photoFrame = null;
  reflectCrop();
  drawPreview();
});
for (const range of ranges) {
  range.addEventListener('input',() => {
    stopGesture();
    currentCrop()[range.name] = range.valueAsNumber;
    showCropValue(range);
    drawPreview();
  });
}
for (const button of editTabs) button.addEventListener('click',() => showEditSection(button.dataset.editTab));
editor.querySelector('.center-crop').addEventListener('click',() => {
  stopGesture();
  const crop = currentCrop();
  crop.x = crop.y = .5;
  reflectCrop();
  drawPreview();
});
editor.querySelector('.reset-crop').addEventListener('click',() => {
  stopGesture();
  crops[Number(cropTarget.value)] = initialCrop();
  reflectCrop();
  drawPreview();
});
editor.querySelector('.reset-poster-edit').addEventListener('click',() => {
  lettering.value = '';
  typeface.value = '';
  typeSize.value = '';
  pattern.value = '';
  crops = [initialCrop(),initialCrop()];
  reflectCrop();
  setVariant(0,false);
});
editor.querySelector('.cancel-poster-edit').addEventListener('click',() => editor.close());
editor.querySelector('.apply-poster-edit').addEventListener('click',() => {
  const { apply } = source;
  editor.close();
  apply(draft,...crops);
});
editor.addEventListener('close',() => {
  if (editor.open) return;
  stopGesture();
  cancelAnimationFrame(frame);
  canvasMount.replaceChildren();
  source = draft = crops = photoFrame = null;
  updateGestureAvailability();
});
