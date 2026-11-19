import { posterLayouts, posterVariant, renderPoster } from './announcement-poster.mjs?v=photo-themes-1';
import { letteringOptions } from './poster-lettering.mjs?v=poster-density-1';
import { backgroundPatterns } from './poster-patterns.mjs?v=photo-themes-1';

const editor = document.querySelector('#poster-editor');
const preview = editor.querySelector('.poster-edit-preview');
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
const ranges = [...cropControls.querySelectorAll('input[type=range]')];
const rangeReadouts = new Map(ranges.map(range => [range.name,cropControls.querySelector('[data-crop-value="' + range.name + '"]')]));
const fit = cropControls.querySelector('input[name=fit]');
const defaultCrop = { zoom: 1, x: .5, y: .28, fit: false };
let source, draft, crop, frame;

for (const [key, name] of Object.entries(posterLayouts)) layout.add(new Option(name, key));
for (const [key, name] of Object.entries(letteringOptions)) lettering.add(new Option(name,key));
for (const [key, motif] of Object.entries(backgroundPatterns)) pattern.add(new Option(motif.label,key));

function drawPreview() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    if (!editor.open) return;
    const image = renderPoster(source.facts,draft,source.photo,source.format,{ previewScale: .3, crop });
    image.setAttribute('aria-hidden','true');
    preview.replaceChildren(image);
  });
}

function setVariant(palette, left, positioning) {
  draft = { ...posterVariant(draft.key,palette,left,positioning), lettering: lettering.value,
    typeface: typeface.value, typeSize: typeSize.value, backgroundPattern: pattern.value };
  for (const [index, button] of [...palettes.children].entries()) {
    button.setAttribute('aria-pressed',String(index === draft.palette));
  }
  layout.value = draft.layout;
  drawPreview();
}

function reflectCrop() {
  fit.checked = crop.fit;
  for (const range of ranges) {
    range.value = crop[range.name];
    range.disabled = crop.fit;
    showCropValue(range);
  }
  editor.querySelector('.center-crop').disabled = crop.fit;
}

function showCropValue(range) {
  const text = Math.round(range.valueAsNumber * 100) + '%';
  rangeReadouts.get(range.name).textContent = text;
  range.setAttribute('aria-valuetext',text);
}

function showEditSection(section) {
  editor.dataset.editSection = section;
  for (const button of editTabs) button.setAttribute('aria-pressed',String(button.dataset.editTab === section));
  editControls.scrollTop = 0;
}

export function openPosterEditor(options) {
  source = options;
  draft = options.design;
  lettering.value = draft.lettering || '';
  typeface.value = draft.typeface || '';
  typeSize.value = draft.typeSize || '';
  pattern.value = draft.backgroundPattern || '';
  crop = { ...defaultCrop, ...options.crop };
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
fit.addEventListener('change',() => {
  crop.fit = fit.checked;
  reflectCrop();
  drawPreview();
});
for (const range of ranges) {
  range.addEventListener('input',() => {
    crop[range.name] = range.valueAsNumber;
    showCropValue(range);
    drawPreview();
  });
}
for (const button of editTabs) button.addEventListener('click',() => showEditSection(button.dataset.editTab));
editor.querySelector('.center-crop').addEventListener('click',() => {
  crop.x = crop.y = .5;
  reflectCrop();
  drawPreview();
});
editor.querySelector('.reset-crop').addEventListener('click',() => {
  crop = { ...defaultCrop };
  reflectCrop();
  drawPreview();
});
editor.querySelector('.reset-poster-edit').addEventListener('click',() => {
  lettering.value = '';
  typeface.value = '';
  typeSize.value = '';
  pattern.value = '';
  crop = { ...defaultCrop };
  reflectCrop();
  setVariant(0,false);
});
editor.querySelector('.cancel-poster-edit').addEventListener('click',() => editor.close());
editor.querySelector('.apply-poster-edit').addEventListener('click',() => {
  const { apply } = source;
  editor.close();
  apply(draft,crop);
});
editor.addEventListener('close',() => {
  if (editor.open) return;
  cancelAnimationFrame(frame);
  preview.replaceChildren();
  source = draft = crop = null;
});
