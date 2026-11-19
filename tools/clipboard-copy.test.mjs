import test from 'node:test';
import assert from 'node:assert/strict';
import { createCopyRequest } from '../clipboard-copy.mjs';

test('コピー成功と手動コピーへの切り替えを判定する', async () => {
  const copied = [];
  const action = createCopyRequest(text => copied.push(text));
  assert.equal(await action.write('撮影会 🎀'),'copied');
  assert.deepEqual(copied,['撮影会 🎀']);
  const denied = createCopyRequest(() => Promise.reject(Error('permission')));
  assert.equal(await denied.write('投稿文'),'manual');
  const missing = createCopyRequest(() => { throw new TypeError('unavailable'); });
  assert.equal(await missing.write('投稿文'),'manual');
});

test('閉じた画面や次のコピーに、古い処理の結果を返さない', async () => {
  const complete = new Map();
  const action = createCopyRequest(text => new Promise((resolve,reject) => complete.set(text,{resolve,reject})));
  const old = action.write('古い投稿文');
  action.cancel();
  const next = action.write('次の投稿文');
  complete.get('次の投稿文').resolve();
  assert.equal(await next,'copied');
  complete.get('古い投稿文').reject(Error('denied'));
  assert.equal(await old,null);
});
