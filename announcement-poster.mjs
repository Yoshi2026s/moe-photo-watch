const palettes = {
  spring: [['#fff4f6','#6d3553','#c87894'],['#fff9ed','#68394f','#cd8191']],
  summer: [['#ebf9f8','#20575e','#539ba6'],['#fff5de','#66431f','#c28942']],
  autumn: [['#fff3e9','#663b43','#b97459'],['#fbefed','#603750','#af677b']],
  winter: [['#eef4ff','#344c71','#8197bd'],['#f7f0fb','#593c67','#aa83b5']],
  floral: [['#fff0f4','#68304c','#be7392'],['#f8f1ff','#513d6a','#9c83b4']],
  retro: [['#faf0e2','#653c41','#b77562'],['#edf4eb','#37564a','#779780']]
};
const serif = '"Yu Mincho","Hiragino Mincho ProN",serif';
const sans = '"Yu Gothic","Hiragino Sans","Meiryo",sans-serif';
const W = 1080, H = 1350;

export function nextDesign(facts, previous) {
  const m = facts.month || 1;
  const season = ['winter','spring','summer','autumn'][Math.floor((m % 12) / 3)];
  const special = /レトロ|浴衣|学園|古民家/.test(facts.title) ? 'retro'
    : /ドレス|flower|花/i.test(facts.title) ? 'floral' : season;
  const options = [...new Set([special, season])].flatMap(key =>
    palettes[key].flatMap((colors, i) => [false,true].map(left => ({key, colors, left, id: key + i + left}))));
  const candidates = options.filter(o => o.id !== previous?.id);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function lines(ctx, value, width) {
  const result = [];
  for (const para of value.split('\n')) {
    let line = '';
    for (const char of para) {
      if (line && ctx.measureText(line + char).width > width) {
        if (/^[、。）」』】！？，．]/.test(char) || /[「『（【]$/.test(line)) {
          const chars = Array.from(line);
          line = chars.pop();
          if (chars.length) result.push(chars.join(''));
        } else {
          result.push(line);
          line = '';
        }
      }
      line += char;
    }
    result.push(line);
  }
  return result;
}

function motif(ctx, x, y, radius, key, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  const count = key === 'winter' ? 6 : 5;
  for (let i = 0; i < count; i++) {
    ctx.rotate(2 * Math.PI / count);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    if (key === 'winter') {
      ctx.lineTo(0, -radius);
      ctx.moveTo(-radius * .26, -radius * .72);
      ctx.lineTo(0, -radius * .48);
      ctx.lineTo(radius * .26, -radius * .72);
    } else {
      ctx.bezierCurveTo(-radius * .52,-radius * .53,-radius * .25,-radius,0,-radius);
      ctx.bezierCurveTo(radius * .35,-radius,radius * .44,-radius * .46,0,0);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function portrait(ctx, photo, x, y, w, h, accent) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - 9,y - 9,w + 18,h + 18);
  if (photo) {
    const scale = Math.max(w / photo.naturalWidth, h / photo.naturalHeight);
    const sw = w / scale, sh = h / scale;
    ctx.drawImage(photo, (photo.naturalWidth-sw)/2,(photo.naturalHeight-sh)*.28,sw,sh,x,y,w,h);
  } else {
    ctx.strokeStyle = accent;
    ctx.setLineDash([9,10]);
    ctx.strokeRect(x,y,w,h);
    ctx.setLineDash([]);
  }
}

export function renderPosters(facts, design, photo) {
  const [paper, ink, accent] = design.colors;
  const pages = [];
  let ctx, y;
  function startPage(first) {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    pages.push(canvas);
    ctx = canvas.getContext('2d');
    ctx.fillStyle = paper;
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = ink;
    ctx.fillRect(0,0,W,12);
    ctx.font = '600 24px Georgia,serif';
    ctx.fillText('N O W A N    M O E',58,66);
    ctx.font = '600 23px ' + sans;
    ctx.textAlign = 'right';
    ctx.fillText('雪餅羽もえ',W-58,66);
    ctx.textAlign = 'left';
    ctx.strokeStyle = accent;
    ctx.beginPath();
    ctx.moveTo(58,89); ctx.lineTo(W-58,89); ctx.stroke();
    if (first) {
      const tx = design.left ? 472 : 60;
      const px = design.left ? 66 : 663;
      portrait(ctx,photo,px,132,350,337,accent);
      if (photo) {
        ctx.font = '22px ' + sans;
        ctx.fillStyle = ink;
        ctx.fillText('参考写真',px,508);
      }
      motif(ctx,tx + 45,184,28,design.key,accent);
      ctx.fillStyle = ink;
      let size = 51;
      let titleLines;
      const groups = facts.title.replace(/\s*(?=[「（])/g,'\n').trim().split('\n');
      do {
        ctx.font = '700 ' + size + 'px ' + serif;
        titleLines = groups.flatMap(group => lines(ctx,group,545));
        if (titleLines.length <= 4 && (size <= 42 || groups.every(g=>ctx.measureText(g).width<=545)) || size <= 31) break;
        size -= 3;
      } while (true);
      const shortTitle = titleLines.length > 4;
      const heading = shortTitle ? ['出演のご案内'] : titleLines;
      heading.forEach((line,i) => ctx.fillText(line,tx,273 + i * (size + 11)));
      ctx.font = '700 33px ' + sans;
      ctx.fillText(facts.dateLabel,tx,507);
      y = 570;
      if (shortTitle) row('イベント名',facts.title);
    } else {
      y = 155;
      ctx.font = '700 32px ' + serif;
      const heading = lines(ctx, facts.title, 950);
      ctx.fillText(heading.length === 1 ? heading[0] : heading[0].slice(0,-1) + '…',60,y);
      y += 48;
      ctx.font = '600 28px ' + sans;
      ctx.fillText(facts.dateLabel,60,y);
      y += 76;
    }
  }
  function row(label, value) {
    ctx.font = '600 34px ' + sans;
    const wrapped = lines(ctx,value,900);
    let i = 0;
    while (i < wrapped.length) {
      if (y + 90 > H - 105) startPage(false);
      ctx.fillStyle = accent;
      ctx.fillRect(60,y-18,6,25);
      ctx.fillStyle = ink;
      ctx.font = '700 25px ' + sans;
      ctx.fillText(label + (i ? '（続き）' : ''),83,y+2);
      y += 49;
      ctx.font = '600 34px ' + sans;
      while (i < wrapped.length && y <= H - 105) {
        ctx.fillText(wrapped[i++],83,y);
        y += 47;
      }
      y += 19;
    }
  }
  startPage(true);
  for (const [label,value] of facts.rows) row(label,value);
  pages.forEach((canvas,i) => {
    const c = canvas.getContext('2d');
    c.fillStyle = ink;
    c.fillRect(0,H-92,W,92);
    c.fillStyle = '#fff';
    c.font = '24px ' + sans;
    if (facts.note) c.fillText(facts.note,58,H-55);
    c.fillText(facts.checked ? '情報確認　' + facts.checked + '（日本時間）' : '最新情報は公式案内へ',58,H-19);
    c.textAlign = 'right';
    c.fillText((i+1) + ' / ' + pages.length,W-58,H-27);
  });
  return pages;
}
