import test from 'node:test';
import assert from 'node:assert/strict';
import { cropFromGesture, cropWindow, defaultCrop } from '../poster-crop.mjs';

const square = { sourceWidth: 1000, sourceHeight: 1000, width: 100, height: 100 };
const point = (x,y) => ({ x, y });

test('初期の切り取りと写真変更時のnullは従来の構図を保つ', () => {
  assert.deepEqual(cropWindow(1000,1500,100,100,null),{
    left: 0, top: 500 * .28, width: 1000, height: 1000
  });
});

test('1本指で写真を指の方向へ移動し、枠の端で止まる', () => {
  const crop = { ...defaultCrop, zoom: 2, y: .5 };
  const start = [point(50,50)];
  const next = cropFromGesture(crop,square,start,[point(70,40)]);
  assert.deepEqual(next,{ zoom: 2, x: .3, y: .6, fit: false });
  assert.deepEqual(cropFromGesture(crop,square,start,[point(200,-150)]),{
    zoom: 2, x: 0, y: 1, fit: false
  });
});

test('元の拡大率で余白のない方向は動かない', () => {
  assert.deepEqual(cropFromGesture(defaultCrop,square,[point(25,35)],[point(45,55)]),defaultCrop);
  const vertical = { ...square, sourceHeight: 2000 };
  assert.deepEqual(cropFromGesture(defaultCrop,vertical,[point(25,35)],[point(45,55)]),{ ...defaultCrop, y: .08 });
});

test('ピンチの中心で拡大し、2本指の移動にも追従する', () => {
  const start = [point(40,25),point(60,25)];
  const current = [point(40,35),point(80,35)];
  const crop = cropFromGesture(defaultCrop,square,start,current);
  assert.deepEqual(crop,{ ...defaultCrop, zoom: 2, x: .4, y: .15 });
  const area = cropWindow(1000,1000,100,100,crop);
  assert.equal(area.left + area.width * .6,500);
  assert.equal(area.top + area.height * .35,250);
});

test('ピンチの最大・最小はスライダーと同じ範囲に収まる', () => {
  const start = [point(40,50),point(60,50)];
  assert.equal(cropFromGesture(defaultCrop,square,start,[point(0,50),point(100,50)]).zoom,2.5);
  const crop = { ...defaultCrop, zoom: 2 };
  assert.equal(cropFromGesture(crop,square,start,[point(49,50),point(51,50)]).zoom,1);
});
