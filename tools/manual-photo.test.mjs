import test from 'node:test';
import assert from 'node:assert/strict';
import { photoInputError } from '../manual-photo.mjs';

test('端末が写真のMIMEタイプを付けなくても、JPEG・PNG・WebPは読み込み候補にする', () => {
  for (const type of ['', 'application/octet-stream']) {
    for (const name of ['写真.JPG','写真.jpeg','写真.PNG','写真.webp']) {
      assert.equal(photoInputError({size:100,name,type}),'');
    }
  }
});

test('空ファイル・上限超過・非対応形式の理由を区別する', () => {
  const photo = {name:'写真.png',type:'image/png',size:12*1024*1024};
  assert.equal(photoInputError(photo),'');
  assert.match(photoInputError({...photo,size:0}),/空のファイル/);
  assert.match(photoInputError({...photo,size:photo.size+1}),/12MB/);
  assert.match(photoInputError({...photo,type:'text/html'}),/JPEG・PNG・WebP/);
  assert.match(photoInputError({...photo,type:'',name:'写真.heic'}),/JPEG・PNG・WebP/);
});
