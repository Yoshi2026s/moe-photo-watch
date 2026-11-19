import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../',import.meta.url));
const site = new URL('https://yoshi2026s.github.io/moe-photo-watch/');
const requested = process.argv.slice(2);
const sha256 = data => createHash('sha256').update(data).digest('hex');

async function verify(path, relativeUrl) {
  const expected = execFileSync('git',['show','HEAD:' + path],{cwd:root});
  const response = await fetch(new URL(relativeUrl,site),{cache:'no-store',signal:AbortSignal.timeout(30000)});
  assert.equal(response.status,200,path);
  const actual = Buffer.from(await response.arrayBuffer());
  assert.equal(sha256(actual),sha256(expected),path + ' が検証済みコミットと一致しません');
  return actual;
}

let current = (await verify('index.html','./')).toString();
for (const filename of ['app.js','announcement-ui.mjs','poster-photos.mjs','photo-library.mjs']) {
  const ref = current.match(new RegExp('["\'](?:\\./)?(' + filename.replace('.', '\\.') + '\\?v=[\\w-]+)["\']'));
  assert.ok(ref,'公開版からの参照がありません: ' + filename);
  current = (await verify(filename,ref[1])).toString();
}
const rows = JSON.parse(current.trim().replace(/^export default /,'').replace(/;$/,''));
const catalog = new Set(rows.map(([slug])=>'photos/' + slug + '.webp'));
assert.equal(catalog.size,rows.length);
const paths = requested.length ? [...new Set(requested)] : [...catalog];
for (const path of paths) assert.ok(catalog.has(path) && /^photos\/[a-z0-9-]+\.webp$/.test(path),path);
for (let i=0; i<paths.length; i+=6) {
  await Promise.all(paths.slice(i,i+6).map(path=>verify(path,path)));
}
console.log('公開一覧 ' + catalog.size + '枚、画像 ' + paths.length + '枚の一致を確認しました。');
