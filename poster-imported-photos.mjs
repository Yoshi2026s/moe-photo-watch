import { posterThemeProfile } from './poster-theme-profile.mjs';

const entries = 'photos';
const originals = 'originals';

function photoStorage(stores, mode, operation) {
  return new Promise((resolve,reject) => {
    const open = indexedDB.open('moe-photo-imports',1);
    open.onupgradeneeded = () => {
      open.result.createObjectStore(entries,{keyPath:'id'});
      open.result.createObjectStore(originals);
    };
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      try {
        const tx = db.transaction(stores,mode);
        const result = operation(tx);
        tx.oncomplete = () => { db.close(); resolve(result()); };
        tx.onabort = () => { db.close(); reject(tx.error); };
      } catch (error) {
        db.close();
        reject(error);
      }
    };
  });
}

function imageType(buffer) {
  const header = new Uint8Array(buffer,0,Math.min(buffer.byteLength,12));
  if ([255,216,255].every((value,index) => header[index] === value)) return 'image/jpeg';
  if ([137,80,78,71,13,10,26,10].every((value,index) => header[index] === value)) return 'image/png';
  const text = String.fromCharCode(...header);
  return text.startsWith('RIFF') && text.slice(8) === 'WEBP' ? 'image/webp' : '';
}

async function previewBytes(bytes, type) {
  const image = new Image();
  const url = URL.createObjectURL(new Blob([bytes],{type}));
  try {
    image.src = url;
    await image.decode();
    const scale = Math.min(1,320/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1,Math.round(image.naturalWidth*scale));
    canvas.height = Math.max(1,Math.round(image.naturalHeight*scale));
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/webp',.78));
    canvas.width = canvas.height = 1;
    if (!blob) throw Error('Preview');
    return { data:await blob.arrayBuffer(), type:blob.type };
  } finally { URL.revokeObjectURL(url); }
}

function addPhoto(record, bytes) {
  return photoStorage([entries,originals],'readwrite',tx => {
    const photos = tx.objectStore(entries);
    const request = photos.getKey(record.id);
    let added = false;
    request.onsuccess = () => {
      if (request.result !== undefined) return;
      photos.add(record);
      tx.objectStore(originals).add(bytes,record.id);
      added = true;
    };
    return () => added;
  });
}

export async function importDrivePhotos(files) {
  const counts = { added:0, duplicate:0, invalid:0, unreadable:0, storageFailed:false };
  for (const file of files) {
    if (!file.size || file.size > 12*1024*1024) {
      counts.invalid++;
      continue;
    }
    let bytes, type, thumbnail;
    try {
      bytes = await file.arrayBuffer();
      type = imageType(bytes);
      if (!type) {
        counts.invalid++;
        continue;
      }
      thumbnail = await previewBytes(bytes,type);
    } catch {
      counts.unreadable++;
      continue;
    }
    try {
      const hash = await crypto.subtle.digest('SHA-256',bytes);
      const id = Array.from(new Uint8Array(hash),byte => byte.toString(16).padStart(2,'0')).join('');
      const added = await addPhoto({id,name:file.name,type,thumbnail,savedAt:Date.now()},bytes);
      if (added) counts.added++;
      else counts.duplicate++;
    } catch {
      counts.storageFailed = true;
      break;
    }
  }
  return counts;
}

function loadOriginal(id,type) {
  return photoStorage([originals],'readonly',tx => {
    const request = tx.objectStore(originals).get(id);
    return () => request.result ? new Blob([request.result],{type}) : null;
  });
}

export async function savedDrivePhotos() {
  const items = await photoStorage([entries],'readonly',tx => {
    const request = tx.objectStore(entries).getAll();
    return () => request.result;
  });
  return items.sort((a,b) => b.savedAt-a.savedAt || a.name.localeCompare(b.name,'ja')).map(item => {
    const { outfit, scene } = posterThemeProfile({title:item.name});
    return {
      src:'import:' + item.id, label:item.name,
      outfits:outfit ? [outfit] : [], scenes:scene ? [scene] : [],
      thumbnail:new Blob([item.thumbnail.data],{type:item.thumbnail.type}),
      loadFile:() => loadOriginal(item.id,item.type)
    };
  });
}

export function clearSavedDrivePhotos() {
  return photoStorage([entries,originals],'readwrite',tx => {
    tx.objectStore(entries).clear();
    tx.objectStore(originals).clear();
    return () => undefined;
  });
}
