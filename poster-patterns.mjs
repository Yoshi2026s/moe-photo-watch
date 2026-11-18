function segment(ctx,x1,y1,x2,y2) {
  ctx.moveTo(x1,y1);
  ctx.lineTo(x2,y2);
}

function flower(ctx,x,y,radius,petals) {
  ctx.save();
  ctx.translate(x,y);
  for (let i = 0; i < petals; i++) {
    ctx.rotate(Math.PI*2/petals);
    ctx.beginPath();
    ctx.ellipse(0,-radius*.52,radius*.32,radius*.53,0,0,Math.PI*2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0,0,radius*.15,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function star(ctx,x,y,radius) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI/2+i*Math.PI/5;
    const r = i%2 ? radius*.42 : radius;
    ctx.lineTo(x+Math.cos(angle)*r,y+Math.sin(angle)*r);
  }
  ctx.closePath();
  ctx.stroke();
}

export const backgroundPatterns = {
  ribbons: { label:'サテンのリボン柄', size:180, draw(ctx) {
    for (const [x,y,angle,scale] of [[48,48,-.21,1],[133,135,.25,.65]]) {
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(angle);
      ctx.scale(scale,scale);
      ctx.beginPath();
      for (const side of [-1,1]) {
        ctx.moveTo(0,0);
        ctx.bezierCurveTo(29*side,-29,47*side,-16,36*side,7);
        ctx.quadraticCurveTo(26*side,13,0,0);
        ctx.quadraticCurveTo(15*side,11,22*side,26);
        ctx.lineTo(6*side,19);
        ctx.lineTo(0,26);
      }
      ctx.stroke();
      ctx.fillRect(-4,-4,8,8);
      ctx.restore();
    }
  } },
  bouquet: { label:'花束と小花', size:190, draw(ctx) {
    for (const [x,y] of [[43,51],[137,145]]) {
      flower(ctx,x,y,28,6);
      flower(ctx,x+23,y+27,12,5);
      flower(ctx,x-24,y+22,9,5);
      ctx.beginPath();
      ctx.moveTo(x,y+57);
      ctx.quadraticCurveTo(x-19,y+32,x-28,y+36);
      ctx.quadraticCurveTo(x-28,y+50,x,y+57);
      ctx.stroke();
    }
  } },
  jewels: { label:'宝石と金のきらめき', size:168, opacity:.32, draw(ctx) {
    for (const [x,y] of [[47,44],[125,122]]) {
      ctx.beginPath();
      ctx.moveTo(x,y-20);
      ctx.lineTo(x+15,y);
      ctx.lineTo(x,y+20);
      ctx.lineTo(x-15,y);
      ctx.closePath();
      segment(ctx,x-15,y,x+15,y);
      ctx.stroke();
      star(ctx,x+29,y+19,10);
      star(ctx,x-23,y-22,7);
    }
  } },
  flowers: { label: '小花柄', size: 156, draw(ctx) {
    flower(ctx,42,42,24,5);
    flower(ctx,114,114,16,5);
  } },
  lace: { label: 'レース模様', size: 180, draw(ctx) {
    for (const [x,y,r] of [[90,90,37],[45,45,14],[135,135,14]]) {
      ctx.beginPath();
      ctx.arc(x,y,r+5,0,Math.PI*2);
      ctx.stroke();
      flower(ctx,x,y,r,r>20 ? 9 : 5);
    }
  } },
  hearts: { label: 'ハート柄', size: 132, opacity: .19, draw(ctx) {
    for (const [x,y,size] of [[34,34,19],[99,97,12]]) {
      ctx.beginPath();
      ctx.moveTo(x,y+size);
      ctx.bezierCurveTo(x-size*1.9,y-size*.17,x-size*.61,y-size*1.32,x,y-size*.62);
      ctx.bezierCurveTo(x+size*.61,y-size*1.32,x+size*1.9,y-size*.17,x,y+size);
      ctx.fill();
    }
  } },
  dots: { label: 'ポルカドット', size: 90, opacity: .24, draw(ctx) {
    for (const [x,y,r] of [[23,23,8],[68,68,6]]) {
      ctx.beginPath();
      ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fill();
    }
  } },
  gingham: { label: 'ギンガムチェック', size: 118, opacity: .17, draw(ctx,size) {
    ctx.globalAlpha = .62;
    ctx.fillRect(0,0,size/2,size);
    ctx.fillRect(0,0,size,size/2);
  } },
  check: { label: '市松模様', size: 104, opacity: .13, draw(ctx,size) {
    ctx.fillRect(0,0,size/2,size/2);
    ctx.fillRect(size/2,size/2,size/2,size/2);
  } },
  stripe: { label: '斜めストライプ', size: 72, opacity: .16, draw(ctx,size) {
    ctx.lineWidth = 11;
    ctx.beginPath();
    segment(ctx,-12,size+12,size+12,-12);
    segment(ctx,-12,12,12,-12);
    segment(ctx,size-12,size+12,size+12,size-12);
    ctx.stroke();
  } },
  argyle: { label: 'アーガイル', size: 144, draw(ctx,size) {
    ctx.beginPath();
    ctx.moveTo(size/2,1.5);
    ctx.lineTo(size-1.5,size/2);
    ctx.lineTo(size/2,size-1.5);
    ctx.lineTo(1.5,size/2);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([5,7]);
    ctx.beginPath();
    segment(ctx,0,0,size,size);
    segment(ctx,size,0,0,size);
    ctx.stroke();
  } },
  stars: { label: '星柄', size: 155, opacity: .22, draw(ctx) {
    star(ctx,46,39,25);
    star(ctx,111,106,14);
  } },
  snow: { label: '雪の結晶', size: 170, draw(ctx) {
    for (const [x,y,r] of [[49,52,29],[125,126,21]]) {
      ctx.save();
      ctx.translate(x,y);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI/3);
        segment(ctx,0,0,0,-r);
        ctx.moveTo(-r*.26,-r*.78);
        ctx.lineTo(0,-r*.55);
        ctx.lineTo(r*.26,-r*.78);
      }
      ctx.stroke();
      ctx.restore();
    }
  } },
  waves: { label: '青海波', size: 144, draw(ctx,size) {
    for (const [x,y] of [[0,72],[size,72],[72,size]]) for (const r of [24,45,66]) {
      ctx.beginPath();
      ctx.arc(x,y,r,Math.PI,Math.PI*2);
      ctx.stroke();
    }
  } },
  asanoha: { label: '麻の葉', size: 144, draw(ctx,size) {
    const points = [[72,6],[129,39],[129,105],[72,138],[15,105],[15,39]];
    ctx.beginPath();
    points.forEach(([x,y],i) => {
      const [nx,ny] = points[(i+1)%points.length];
      segment(ctx,x,y,nx,ny);
      segment(ctx,size/2,size/2,x,y);
      const mx = (x+nx+size/2)/3, my = (y+ny+size/2)/3;
      segment(ctx,x,y,mx,my);
      ctx.lineTo(nx,ny);
    });
    ctx.stroke();
  } },
  leaves: { label: '木の葉', size: 164, draw(ctx) {
    for (const [x,y,angle] of [[44,52,-.5],[117,119,.8]]) {
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0,-31);
      ctx.quadraticCurveTo(38,-5,0,32);
      ctx.quadraticCurveTo(-30,3,0,-31);
      segment(ctx,0,-31,0,32);
      ctx.stroke();
      ctx.restore();
    }
  } },
  confetti: { label: '紙吹雪', size: 142, opacity: .22, draw(ctx) {
    for (const [x,y,angle] of [[26,23,-.7],[96,44,.48],[57,98,.82],[117,118,-.42]]) {
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(angle);
      ctx.fillRect(-8,-4,16,8);
      ctx.restore();
    }
  } },
  artdeco: { label: 'アールデコの扇', size: 160, draw(ctx,size) {
    const fan = (x,y) => {
      for (const r of [22,41,60]) {
        ctx.beginPath();
        ctx.arc(x,y,r,1.18*Math.PI,1.82*Math.PI);
        ctx.stroke();
      }
    };
    fan(size/2,size-8);
    fan(0,size/2-8);
    fan(size,size/2-8);
  } }
};

const byScene = {
  lights: ['stars','artdeco','dots'],
  blossom: ['bouquet','lace','ribbons'],
  lace: ['lace','bouquet','ribbons'],
  diner: ['gingham','check','stripe'],
  stars: ['stars','confetti','dots'],
  curtain: ['jewels','artdeco','lace'],
  classroom: ['argyle','stripe','check'],
  maple: ['leaves','asanoha','flowers'],
  winter: ['snow','lace','argyle']
};
const byTheme = {
  glamour: ['jewels','lace','artdeco'],
  cute: ['ribbons','flowers','hearts'],
  pop: ['confetti','stripe','dots'],
  editorial: ['stripe','argyle','check'],
  floral: ['bouquet','lace','flowers'],
  retro: ['asanoha','check','artdeco'],
  natural: ['leaves','gingham','flowers'],
  night: ['stars','snow','artdeco'],
  pearl: ['dots','lace','artdeco'],
  noir: ['argyle','stripe','artdeco'],
  artdeco: ['artdeco','argyle','stripe'],
  heart: ['hearts','lace','dots'],
  candy: ['gingham','check','confetti'],
  doll: ['lace','flowers','dots'],
  comic: ['stars','confetti','stripe'],
  neon: ['argyle','stars','check'],
  soda: ['dots','waves','gingham'],
  print: ['confetti','check','stripe'],
  coastal: ['waves','stripe','leaves'],
  paper: ['asanoha','waves','leaves']
};

export function posterPatternKey(design) {
  if (design.backgroundPattern === 'none' || Object.hasOwn(backgroundPatterns,design.backgroundPattern)) {
    return design.backgroundPattern;
  }
  if (design.pattern) return design.pattern;
  const candidates = (design.scene ? byScene[design.scene] : byTheme[design.key]) || ['dots'];
  return candidates[(design.palette || 0)%candidates.length];
}

export function drawPosterPattern(ctx,width,height,design) {
  const motif = backgroundPatterns[posterPatternKey(design)];
  if (!motif) return;
  const tile = document.createElement('canvas');
  tile.width = tile.height = motif.size;
  const brush = tile.getContext('2d');
  brush.strokeStyle = brush.fillStyle = posterPatternKey(design) === 'jewels' ? design.colors[2] : design.colors[1];
  brush.lineWidth = 2.8;
  brush.lineCap = 'round';
  motif.draw(brush,motif.size);
  const repeat = ctx.createPattern(tile,'repeat');
  if (!repeat) return;
  ctx.save();
  ctx.fillStyle = repeat;
  ctx.globalAlpha = motif.opacity || .22;
  ctx.fillRect(0,0,width,height);
  ctx.restore();
}
