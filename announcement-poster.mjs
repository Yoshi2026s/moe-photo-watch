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
const W = 1080;

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

export function renderPosters(facts, design, photo, format = 'story') {
  const story = format === 'story';
  const H = story ? 1920 : 1350;
  const time = facts.rows.find(([label]) => label === '開催時間')?.[1] || '';
  const heroTime = time && [...time].length <= 18;
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
    ctx.font = '700 ' + (first ? 56 : 36) + 'px ' + serif;
    ctx.fillText('雪餅羽もえ',62,first ? 100 : 66);
    ctx.textAlign = 'right';
    ctx.font = '24px Georgia,serif';
    ctx.fillText('N O W A N   M O E',W-62,first ? 93 : 62);
    ctx.textAlign = 'left';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    const ruleY = first ? 129 : 89;
    ctx.beginPath();
    ctx.moveTo(62,ruleY); ctx.lineTo(W-62,ruleY); ctx.stroke();
    if (first) {
      let size = story ? 68 : 54;
      let titleLines;
      const titleGroups = facts.title.split(/\s*(?=[「（])/u);
      do {
        ctx.font = '700 ' + size + 'px ' + serif;
        titleLines = titleGroups.flatMap(group => lines(ctx,group.trim(),950));
        if (titleLines.length <= 2 || size <= 38) break;
        size -= 4;
      } while (true);
      const extended = titleLines.length > 3;
      const heading = extended ? ['出演のご案内'] : titleLines;
      let baseline = ruleY + size + 28;
      for (const line of heading) {
        ctx.fillText(line,62,baseline);
        baseline += size + 12;
      }
      const top = baseline - size + 24;
      const pw = story ? 444 : 340, ph = story ? 550 : 275;
      const px = design.left ? 68 : W-68-pw;
      const tx = design.left ? px+pw+56 : 62;
      const tw = W-pw-192;
      portrait(ctx,photo,px,top,pw,ph,accent);
      if (photo) {
        ctx.font = '23px ' + sans;
        ctx.fillStyle = ink;
        ctx.fillText('参考写真',px,top+ph+39);
      }
      motif(ctx,tx+tw-28,top+32,26,design.key,accent);
      ctx.fillStyle = ink;
      ctx.font = '600 32px ' + sans;
      if (facts.day) {
        ctx.fillText(facts.day.year + '年　' + facts.day.weekday + '曜日',tx,top+45);
        ctx.font = 'bold ' + (story ? 106 : 80) + 'px Georgia,serif';
        ctx.fillText(facts.day.month + '.' + String(facts.day.day).padStart(2,'0'),tx,top+(story ? 165 : 133));
      } else {
        ctx.fillText(facts.dateLabel,tx,top+107);
      }
      if (heroTime) {
        ctx.font = '600 25px ' + sans;
        ctx.fillText('開催時間',tx,top+(story ? 219 : 175));
        ctx.font = '700 ' + (story ? 41 : 32) + 'px ' + sans;
        ctx.fillText(time,tx,top+(story ? 274 : 217),tw);
      }
      if (facts.banner) {
        ctx.font = '700 ' + (story ? 38 : 32) + 'px ' + sans;
        const bannerLines = lines(ctx,facts.banner,tw-40);
        const lineHeight = story ? 52 : 43;
        const bandY = top + (story ? 325 : heroTime ? 239 : 172);
        const bandHeight = bannerLines.length * lineHeight + 18;
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.moveTo(tx,bandY);
        ctx.lineTo(tx+tw,bandY);
        ctx.lineTo(tx+tw-11,bandY+bandHeight/2);
        ctx.lineTo(tx+tw,bandY+bandHeight);
        ctx.lineTo(tx,bandY+bandHeight);
        ctx.lineTo(tx+11,bandY+bandHeight/2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        bannerLines.forEach((line,i) => ctx.fillText(line,tx+tw/2,bandY+(i+1)*lineHeight-1));
        ctx.textAlign = 'left';
        y = bandY+bandHeight+70;
      } else {
        y = top+ph+72;
      }
      y = Math.max(y,top+ph+(photo ? 97 : 68));
      if (extended) row('イベント名',facts.title);
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
    ctx.font = story ? '600 39px ' + sans : '600 34px ' + sans;
    const wrapped = lines(ctx,value,900);
    let i = 0;
    while (i < wrapped.length) {
      if (y + 90 > H - 105) startPage(false);
      ctx.fillStyle = accent;
      ctx.fillRect(60,y-18,6,25);
      ctx.fillStyle = ink;
      ctx.font = story ? '700 29px ' + sans : '700 25px ' + sans;
      ctx.fillText(label + (i ? '（続き）' : ''),83,y+2);
      y += story ? 56 : 49;
      ctx.font = story ? '600 39px ' + sans : '600 34px ' + sans;
      while (i < wrapped.length && y <= H - 105) {
        ctx.fillText(wrapped[i++],83,y);
        y += story ? 57 : 47;
      }
      y += 19;
    }
  }
  startPage(true);
  for (const [label,value] of facts.rows) {
    if ((label === '受付' && value === facts.banner) || (label === '開催時間' && heroTime)) continue;
    row(label,value);
  }
  pages.forEach((canvas,i) => {
    const c = canvas.getContext('2d');
    c.fillStyle = ink;
    c.fillRect(0,H-92,W,92);
    c.fillStyle = '#fff';
    c.font = '27px ' + sans;
    if (facts.note) c.fillText(facts.note,58,H-55,W-116);
    c.fillText(facts.checked ? '情報確認　' + facts.checked + '（日本時間）' : '最新情報は公式案内へ',58,H-19);
    c.textAlign = 'right';
    c.fillText((i+1) + ' / ' + pages.length,W-58,H-27);
  });
  return pages;
}
