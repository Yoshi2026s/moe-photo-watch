export const defaultCrop = { zoom: 1, x: .5, y: .28, fit: false };

export function cropWindow(sourceWidth, sourceHeight, width, height, crop) {
  crop ??= defaultCrop;
  const scale = Math.max(width / sourceWidth,height / sourceHeight) * (crop.zoom || 1);
  const sw = Math.min(sourceWidth,width / scale);
  const sh = Math.min(sourceHeight,height / scale);
  return {
    left: (sourceWidth - sw) * (crop.x ?? defaultCrop.x),
    top: (sourceHeight - sh) * (crop.y ?? defaultCrop.y),
    width: sw,
    height: sh
  };
}

function midpoint([first, second = first]) {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

function distance([first, second = first]) {
  return Math.hypot(first.x - second.x,first.y - second.y);
}

function position(anchor, start, end, oldSize, newSize, frameSize, travel, fallback) {
  if (travel < 1e-8) return fallback;
  // Keep the source pixel under the starting finger or midpoint under the current one.
  const offset = anchor + (start * oldSize - end * newSize) / frameSize;
  return Math.round(Math.max(0,Math.min(1,offset / travel)) * 100) / 100;
}

export function cropFromGesture(crop, { sourceWidth, sourceHeight, width, height }, start, current) {
  const startDistance = distance(start);
  const ratio = startDistance ? distance(current) / startDistance : 1;
  const zoom = Math.round(Math.max(1,Math.min(2.5,crop.zoom * ratio)) * 20) / 20;
  const before = cropWindow(sourceWidth,sourceHeight,width,height,crop);
  const after = cropWindow(sourceWidth,sourceHeight,width,height,{ ...crop, zoom });
  const a = midpoint(start), b = midpoint(current);
  return {
    ...crop,
    zoom,
    x: position(before.left,a.x,b.x,before.width,after.width,width,sourceWidth-after.width,crop.x),
    y: position(before.top,a.y,b.y,before.height,after.height,height,sourceHeight-after.height,crop.y)
  };
}
