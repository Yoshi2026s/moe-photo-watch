import { posterThemeProfile } from './poster-theme-profile.mjs';

export const supportsMaterialFolder = typeof globalThis.showDirectoryPicker === 'function';
const storeName = 'source';
const folderKey = 'announcement-photos';

function folderStorage(mode, access) {
  return new Promise((resolve,reject) => {
    const open = indexedDB.open('moe-photo-materials',1);
    open.onupgradeneeded = () => open.result.createObjectStore(storeName);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const transaction = db.transaction(storeName,mode);
      const request = access(transaction.objectStore(storeName));
      transaction.oncomplete = () => { db.close(); resolve(request.result); };
      transaction.onabort = () => { db.close(); reject(transaction.error); };
    };
  });
}

export function savedMaterialFolder() {
  return folderStorage('readonly',store => store.get(folderKey));
}

export function saveMaterialFolder(handle) {
  return folderStorage('readwrite',store => handle ? store.put(handle,folderKey) : store.delete(folderKey));
}

export function usablePhoto(file) {
  return file && ['image/jpeg','image/png','image/webp'].includes(file.type) && file.size > 0 && file.size <= 12*1024*1024;
}

export async function listMaterialPhotos(folder) {
  if (!folder) return { state:'none', photos:[] };
  if (await folder.queryPermission({mode:'read'}) !== 'granted') return { state:'permission', photos:[] };
  const photos = [];
  for await (const entry of folder.values()) {
    if (entry.kind !== 'file' || !/\.(?:jpe?g|png|webp)$/i.test(entry.name)) continue;
    // A file may be replaced while a sync is still running.
    const file = await entry.getFile().catch(() => null);
    if (!usablePhoto(file)) continue;
    const profile = posterThemeProfile({title:file.name});
    photos.push({
      file, label:file.name, src:'local:' + file.name, outfits:profile.outfit ? [profile.outfit] : [],
      scenes:profile.scene ? [profile.scene] : []
    });
  }
  photos.sort((a,b) => b.file.lastModified-a.file.lastModified || a.label.localeCompare(b.label,'ja'));
  return { state:'ready', photos };
}
