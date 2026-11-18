// Layouts based on the supplied poster samples. Decorations are drawn locally.
const samples = [
  ['lanternNight','夜紺イルミネーション','feature','lights','oval',[
    ['#171638','#fff5db','#f0c378'],['#21223f','#fff2ed','#e69bb0'],['#222c3a','#fff1dc','#efae70']
  ]],
  ['roseIllumination','ローズ色の予約帯','banner','lights','round',[
    ['#252037','#fff3e3','#ec9ca9'],['#141833','#fff3e3','#e98aaf'],['#32223a','#fff4e8','#efbf99']
  ]],
  ['lavenderBouquet','ラベンダーブーケ','stack','blossom','oval',[
    ['#f3eafa','#493263','#9675bc'],['#e8ecf9','#394470','#a080c5'],['#f4e7f4','#5c3a6c','#ad85ba']
  ]],
  ['pinkRoseLace','ロゼレース','split','lace','oval',[
    ['#fae7e8','#772e51','#bd6b89'],['#fff0f2','#732c4a','#c47a88'],['#f1e4ef','#662f57','#ba7aa8']
  ]],
  ['retroDiner','ストロベリーダイナー','feature','diner','tilt',[
    ['#fff1d4','#143e40','#b82c3b'],['#e8f5e7','#16454a','#d64c46'],['#fff5de','#144f52','#da4e55']
  ]],
  ['coralStars','ブルーソーダと星','stack','stars','tilt',[
    ['#e0f1ff','#215277','#ec7183'],['#daf4f0','#225671','#ed829f'],['#efe9fd','#4d4177','#ec778f']
  ]],
  ['goldCurtains','深紅の舞台と金の額縁','split','curtain','oval',[
    ['#430d22','#fff3d5','#e9b965'],['#4f1325','#fff7d9','#e7a665'],['#35142c','#fff1df','#e4c17e']
  ]],
  ['mintRibbon','ミントの市松リボン','feature','diner','round',[
    ['#e2f5e8','#25594e','#cf688e'],['#f2fff2','#2a645b','#ca6b74'],['#e8f7f6','#28565d','#bf7298']
  ]],
  ['ivoryLace','アイボリーレース','split','lace','oval',[
    ['#fcf1e3','#753951','#bc7889'],['#fff5e8','#653945','#b97974'],['#faf0ea','#614257','#bf90a1']
  ]],
  ['mapleGold','紅葉と金の飾り枠','feature','maple','round',[
    ['#fff0d6','#762330','#b86b32'],['#f7e7ca','#702a25','#aa5f39'],['#f9eccf','#583d2c','#a96342']
  ]],
  ['velvetHotel','ベルベットホテル','feature','curtain','round',[
    ['#511a2c','#fff1d7','#dfad64'],['#411a22','#fff3db','#dfba74'],['#452435','#fff3da','#d9aa6f']
  ]],
  ['chalkboard','放課後の黒板とノート','feature','classroom','tilt',[
    ['#263832','#f8f6e5','#ecb990'],['#263c3c','#fff8e7','#e798ab'],['#333a35','#f9f0df','#d1b47d']
  ]],
  ['roseLights','暖灯と深紅のバラ','banner','lights','round',[
    ['#472128','#fff1db','#ecab69'],['#431e2e','#ffece4','#d8878e'],['#553020','#fff0d8','#e3af71']
  ]],
  ['pressedAutumn','秋の押し花と古紙','feature','maple','round',[
    ['#faf0d9','#5d422d','#a7654e'],['#f9e9d7','#663a3a','#bc7658'],['#f4eedc','#54533a','#b3784e']
  ]],
  ['winterPetals','冬空の白い花','feature','winter','round',[
    ['#ecf5fd','#274f70','#ba7496'],['#e5f1f6','#355676','#789abb'],['#eceefa','#44527f','#b586a7']
  ]],
  ['pinkMaple','桜色の花と紅葉','feature','maple','oval',[
    ['#fff0e9','#862b4f','#cc688c'],['#fae7ed','#752f55','#c96c70'],['#fff1df','#743b47','#bf7181']
  ]]
];

export const referencePosterThemes = Object.fromEntries(samples.map(([key,label,layout,scene,shape,palettes]) =>
  [key,{ label, layout, frame: 'reference', scene, shape, palettes, bold: ['diner','stars','classroom'].includes(scene) }]));

function flower(ctx,x,y,radius,color,pastel) {
  ctx.save();
  ctx.translate(x,y);
  for (let petal = 0; petal < 5; petal++) {
    ctx.rotate(Math.PI*2/5);
    ctx.fillStyle = pastel;
    ctx.beginPath();
    ctx.ellipse(0,-radius*.52,radius*.42,radius*.59,0,0,Math.PI*2);
    ctx.fill();
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0,0,radius*.2,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

export function drawReferenceDecor(ctx,width,height,design) {
  const [paper,ink,accent] = design.colors;
  const { scene } = design;
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle = accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(21,21,width-42,height-42);
  ctx.strokeRect(30,30,width-60,height-60);
  if (scene === 'lights') {
    for (let i = 0; i < 48; i++) {
      const x = i%2 ? width-34-(i*17)%57 : 37+(i*19)%54;
      const y = 39+(i*83)%(height-75);
      const r = 10+(i*13)%28;
      const light = ctx.createRadialGradient(x,y,0,x,y,r);
      light.addColorStop(0,i%4 ? '#ffeac1df' : accent+'dd');
      light.addColorStop(.25,accent+'72');
      light.addColorStop(1,accent+'00');
      ctx.fillStyle = light;
      ctx.fillRect(x-r,y-r,r*2,r*2);
    }
  } else if (scene === 'curtain') {
    for (const mirrored of [false,true]) {
      ctx.save();
      if (mirrored) {
        ctx.translate(width,0);
        ctx.scale(-1,1);
      }
      const fold = ctx.createLinearGradient(0,0,218,0);
      fold.addColorStop(0,paper);
      fold.addColorStop(.41,accent+'7c');
      fold.addColorStop(1,paper);
      ctx.fillStyle = fold;
      ctx.beginPath();
      ctx.moveTo(0,12);
      ctx.lineTo(231,12);
      ctx.quadraticCurveTo(119,176,41,209);
      ctx.quadraticCurveTo(63,318,16,430);
      ctx.lineTo(0,430);
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.beginPath();
      ctx.moveTo(0,194);
      ctx.quadraticCurveTo(61,216,91,182);
      ctx.stroke();
      ctx.restore();
    }
  } else if (scene === 'diner') {
    for (const offset of [19,height-62]) for (let x = 22; x < width-43; x += 38) {
      ctx.fillStyle = ink+'83';
      ctx.fillRect(x,offset,19,19);
      ctx.fillRect(x+19,offset+19,19,19);
    }
  } else if (scene === 'classroom') {
    ctx.setLineDash([7,9]);
    ctx.strokeStyle = ink+'90';
    ctx.strokeRect(39,38,width-78,height*.47);
    ctx.setLineDash([]);
  } else {
    for (let i = 0; i < 38; i++) {
      const x = i%2 ? width-28-(i*17)%32 : 28+(i*13)%36;
      const y = 29+(i*67)%(height-58);
      const r = 9+(i*7)%16;
      if (scene === 'lace') {
        ctx.strokeStyle = accent+'90';
        ctx.beginPath();
        ctx.arc(x,y,r+7,0,Math.PI*2);
        ctx.stroke();
      }
      if (scene === 'winter' || scene === 'stars') {
        ctx.strokeStyle = i%2 ? accent+'be' : ink+'80';
        ctx.beginPath();
        ctx.moveTo(x-r,y);
        ctx.lineTo(x+r,y);
        ctx.moveTo(x,y-r);
        ctx.lineTo(x,y+r);
        ctx.moveTo(x-r*.62,y-r*.62);
        ctx.lineTo(x+r*.62,y+r*.62);
        ctx.stroke();
      } else if (scene === 'maple' && i%3) {
        ctx.fillStyle = i%2 ? accent+'b9' : '#b65b38ac';
        ctx.beginPath();
        ctx.ellipse(x,y,r,r*.42,i*.54,0,Math.PI*2);
        ctx.fill();
      } else {
        flower(ctx,x,y,r,accent,accent+'50');
      }
    }
  }
  ctx.restore();
}
