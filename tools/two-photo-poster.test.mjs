import test from 'node:test';
import assert from 'node:assert/strict';
import { announcementFacts } from '../announcement-facts.mjs';
import { posterVariant, renderPoster } from '../announcement-poster.mjs';

const first = { naturalWidth: 600, naturalHeight: 900 };
const second = { naturalWidth: 900, naturalHeight: 600 };
const facts = announcementFacts({
  title: 'Fresh スペシャル大撮影会', date: '2026/11/21', venue: 'Booty東京', time: '10:00〜16:00',
  kind: 'group_photo', status: '予約不要'
}, Date.parse('2026-11-19T12:00:00+09:00'));

function render(t, design, format, options) {
  const draws = [];
  const originalDocument = globalThis.document;
  const noop = () => {};
  const methods = {
    drawImage: (...args) => draws.push(args),
    measureText: text => ({ width: [...text].length * 25 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createPattern: () => ({}),
    getTransform: () => ({ inverse: () => ({}) })
  };
  globalThis.document = {
    createElement: () => ({
      getContext: () => new Proxy({ ...methods }, {
        get: (target, prop) => prop in target ? target[prop] : noop
      })
    })
  };
  t.after(() => { globalThis.document = originalDocument; });
  const canvas = renderPoster(facts, design, first, format, options);
  return { canvas, draws };
}

for (const [format, height] of [['story',1920],['feed',1350],['square',1080]]) {
  test(format + ' places two uncropped photos on one correctly sized canvas', t => {
    const { canvas, draws } = render(t,posterVariant('champagne',0,false,'feature'),format,{ secondaryPhoto: second });
    assert.equal(canvas.width,1080);
    assert.equal(canvas.height,height);
    assert.deepEqual(draws.map(call => call[0]),[first,second]);
    for (const [photo,x,y,w,h] of draws) {
      assert.ok(x>=0 && x+w<=canvas.width && y>=0 && y+h<=height);
      assert.ok(Math.abs(w/h - photo.naturalWidth/photo.naturalHeight)<1e-9);
    }
    assert.ok(draws[0][1]+draws[0][3]<draws[1][1]);
  });
}

test('the second photo can be cropped independently and the pair can be reversed', t => {
  const { draws } = render(t,posterVariant('champagne',0,true,'split'),'story',{
    secondaryPhoto: second, secondCrop: { zoom: 2, x: .5, y: .5 }
  });
  assert.equal(draws[0].length,5);
  assert.equal(draws[1].length,9);
  assert.ok(draws[1][5]+draws[1][7]<draws[0][1]);
  assert.ok(draws[1][3]<second.naturalWidth && draws[1][4]<second.naturalHeight);
});

test('single-photo rendering keeps the existing framing API', t => {
  const frames = [];
  const { canvas, draws } = render(t,posterVariant('champagne'),'story',{ onPhotoFrame: frame => frames.push(frame) });
  assert.equal(canvas.height,1920);
  assert.deepEqual(draws.map(call => call[0]),[first]);
  assert.equal(frames.length,1);
});
