export const posterThemes = {
  glamour: { label: 'ゴールドグラビア', frame: 'deco', wide: true, palettes: [
    ['#201320','#fff7e4','#e9bc66'], ['#291528','#fff5f3','#f7bbbe'], ['#101f2e','#f7f3e6','#dbc488']
  ] },
  cute: { label: 'スイートリボン', frame: 'round', stacked: true, palettes: [
    ['#ffeaf2','#642440','#db4e83'], ['#f0edff','#4c2c75','#9474d6'], ['#fff1e4','#643727','#dd7851']
  ] },
  pop: { label: 'ビビッドPOP', frame: 'offset', wide: true, bold: true, palettes: [
    ['#fff465','#302249','#e7207d'], ['#aff6ed','#173b55','#006fc9'], ['#ffc4eb','#461950','#5d3fcc']
  ] },
  editorial: { label: 'グラビア誌風', frame: 'offset', wide: true, bold: true, palettes: [
    ['#f7efdf','#252124','#b6253b'], ['#f2f4f8','#282e4c','#3f64ae'], ['#f9e3de','#382227','#a63052']
  ] },
  floral: { label: '花びらレース', frame: 'round', wide: false, palettes: [
    ['#fff0f4','#68304c','#be7392'], ['#f8f1ff','#513d6a','#9c83b4'], ['#eaf5e8','#31523b','#659e79']
  ] },
  retro: { label: '昭和レトロ', frame: 'deco', wide: false, palettes: [
    ['#faf0e2','#653c41','#b77562'], ['#edf4eb','#37564a','#779780'], ['#fff1ce','#61412b','#b47431']
  ] },
  natural: { label: 'ナチュラル日和', frame: 'round', wide: true, palettes: [
    ['#eaf8f4','#20575e','#539ba6'], ['#fff5de','#66431f','#c28942'], ['#e9f3df','#364c31','#749c50']
  ] },
  night: { label: '星空シネマ', frame: 'deco', stacked: true, palettes: [
    ['#15192f','#f1f2ff','#9daaf2'], ['#242044','#fff0f8','#d390d7'], ['#102d37','#ebfbf9','#72d0be']
  ] },
  pearl: { label: 'パールジュエル', frame: 'round', wide: true, pattern: 'pearls', palettes: [
    ['#f6ecdf','#4b343f','#b87b8a'], ['#eef0f5','#38415b','#a188c0'], ['#eaf0e9','#304938','#8fa275']
  ] },
  noir: { label: 'モノクロシック', frame: 'offset', wide: true, bold: true, pattern: 'stripes', palettes: [
    ['#181a20','#f9f7f3','#aeb5c5'], ['#1b2020','#f2efde','#b7a487'], ['#231c23','#f0edef','#bc92a5']
  ] },
  artdeco: { label: 'アールデコ・ベルベット', frame: 'deco', stacked: true, pattern: 'rays', palettes: [
    ['#122e2b','#fff2cf','#dcb46e'], ['#302139','#fff4d5','#d9a364'], ['#34191e','#fff2d9','#c48656']
  ] },
  heart: { label: 'ハートメロウ', frame: 'round', stacked: true, pattern: 'hearts', palettes: [
    ['#ffd7e4','#73243d','#dc6984'], ['#ffeddf','#703b34','#eb817d'], ['#e7dcfc','#583978','#a36abc']
  ] },
  candy: { label: 'キャンディチェック', frame: 'round', pattern: 'check', palettes: [
    ['#ffe6ed','#6a284a','#e880b4'], ['#e2f8ef','#245449','#74c8af'], ['#e9ecff','#40376c','#9a94e2']
  ] },
  doll: { label: 'ドールパステル', frame: 'deco', stacked: true, pattern: 'pearls', palettes: [
    ['#fdf1fb','#5b4058','#bc8aac'], ['#ebf2ff','#324878','#86a8e4'], ['#fff7e1','#5c4434','#cfab70']
  ] },
  comic: { label: 'コミックポスター', frame: 'offset', bold: true, pattern: 'rays', palettes: [
    ['#fff2a3','#262944','#e44356'], ['#d2f1fc','#123452','#ed6848'], ['#fce0c7','#4b2455','#8a52cf']
  ] },
  neon: { label: 'ネオンステージ', frame: 'offset', wide: true, bold: true, pattern: 'grid', palettes: [
    ['#20143b','#fff4fb','#f47ceb'], ['#102c33','#ecfff9','#58e2a8'], ['#17233f','#eefaff','#5baef9']
  ] },
  soda: { label: 'クリームソーダ', frame: 'round', layout: 'banner', bold: true, pattern: 'pearls', palettes: [
    ['#c9f5e4','#164b42','#31ad91'], ['#f4e2ff','#533671','#b77dda'], ['#ffe8c3','#654022','#e38e51']
  ] },
  print: { label: 'カラーブロック', frame: 'offset', wide: true, bold: true, pattern: 'blocks', palettes: [
    ['#fbebd0','#2e3449','#e35d49'], ['#eaeef5','#2f3656','#2d75da'], ['#daf4de','#244537','#22ac79']
  ] },
  coastal: { label: 'サンセットビーチ', frame: 'round', layout: 'banner', pattern: 'waves', palettes: [
    ['#ffdcbf','#65382c','#df765b'], ['#d5f3f7','#23474c','#67bfc8'], ['#fce6cc','#614650','#d8819a']
  ] },
  paper: { label: '和紙モダン', frame: 'deco', layout: 'banner', pattern: 'stripes', palettes: [
    ['#faf2de','#4d3828','#bf955e'], ['#e8f1e6','#324b3f','#7f9b7a'], ['#f8e5de','#643a43','#bb706d']
  ] }
};

export const posterThemeGroups = {
  '華やか': ['glamour','editorial','pearl','noir','artdeco'],
  'かわいい': ['cute','floral','heart','candy','doll'],
  'POP': ['pop','comic','neon','soda','print'],
  '季節・レトロ': ['retro','natural','night','coastal','paper']
};

export const posterLayouts = {
  split: '左右並び',
  feature: '左右並び・写真大',
  stack: '中央に写真',
  banner: '横長の写真'
};

const seasons = [
  ['night','glamour','cute','noir'], ['floral','cute','natural','heart'],
  ['pop','natural','editorial','soda','coastal'], ['retro','glamour','editorial','paper','artdeco']
];
const serif = '"Yu Mincho","Hiragino Mincho ProN",serif';
const sans = '"Yu Gothic","Hiragino Sans","Meiryo",sans-serif';
const W = 1080;

export function posterVariant(key, palette = 0, left = false, layout) {
  const theme = posterThemes[key];
  const defaultLayout = theme.layout || (theme.stacked ? 'stack' : theme.wide ? 'feature' : 'split');
  layout ||= defaultLayout;
  return { ...theme, key, palette, colors: theme.palettes[palette], left, layout, id: key + palette + left + layout };
}

export function nextDesign(facts, previous, selectedTheme) {
  const season = seasons[Math.floor(((facts.month || 1) % 12) / 3)];
  const special = /レトロ|浴衣|古民家/.test(facts.title) ? 'retro'
    : /ドレス/.test(facts.title) ? 'glamour'
    : /花|flower/i.test(facts.title) ? 'floral'
    : /学園|animal|バニー/i.test(facts.title) ? 'cute'
    : /野外|屋外|公園|ガーデン/.test(facts.title) ? 'natural' : '';
  const automatic = !Object.hasOwn(posterThemes, selectedTheme);
  const keys = automatic ? [...new Set([special, ...season, ...Object.keys(posterThemes)].filter(Boolean))] : [selectedTheme];
  const choices = automatic ? keys.filter(key => key !== previous?.key) : keys;
  const weighted = choices.flatMap(key => Array(special === key ? 5 : season.includes(key) ? 3 : 1).fill(key));
  const key = weighted[Math.floor(Math.random() * weighted.length)];
  const theme = posterThemes[key];
  const variants = theme.palettes.flatMap((_, index) =>
    [false, true].map(left => posterVariant(key,index,left)));
  const candidates = variants.filter(variant => variant.id !== previous?.id);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function backdrop(ctx, height, design) {
  const [paper, ink, accent] = design.colors;
  const wash = ctx.createLinearGradient(0,0,W,height);
  wash.addColorStop(0,paper);
  wash.addColorStop(1,design.frame === 'offset' ? paper : accent + '30');
  ctx.fillStyle = paper;
  ctx.fillRect(0,0,W,height);
  ctx.fillStyle = wash;
  ctx.fillRect(0,0,W,height);
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;
  if (design.frame === 'deco') {
    ctx.lineWidth = 2;
    ctx.strokeRect(28,25,W-56,height-49);
    ctx.strokeRect(38,35,W-76,height-69);
    ctx.globalAlpha = .24;
    for (const radius of [130,170,210]) {
      ctx.beginPath();
      ctx.arc(W-18,105,radius,0,2*Math.PI);
      ctx.stroke();
    }
  } else if (design.frame === 'offset') {
    ctx.globalAlpha = .22;
    for (let y = 48; y < 350; y += 21) {
      for (let x = W-126; x < W-24; x += 22) {
        ctx.beginPath();
        ctx.arc(x,y,3.5,0,2*Math.PI);
        ctx.fill();
      }
    }
    ctx.fillRect(26,28,11,height-56);
  } else {
    ctx.globalAlpha = .14;
    for (const [x,y,radius] of [[W-24,150,180],[18,height-245,150],[W-34,height-158,74]]) {
      ctx.beginPath();
      ctx.arc(x,y,radius,0,2*Math.PI);
      ctx.fill();
    }
  }
  ctx.restore();
  texture(ctx,height,design.pattern,accent);
  ctx.fillStyle = ink;
  ctx.fillRect(0,0,W,12);
}

function texture(ctx, height, pattern, color) {
  if (!pattern) return;
  ctx.save();
  ctx.fillStyle = ctx.strokeStyle = color;
  ctx.globalAlpha = .19;
  ctx.beginPath();
  if (pattern === 'rays') {
    ctx.lineWidth = 7;
    for (let x = -260; x < W+400; x += 86) {
      ctx.moveTo(W-68,60);
      ctx.lineTo(x,350);
    }
    ctx.stroke();
  } else if (pattern === 'waves') {
    for (let y = height-325; y < height; y += 46) {
      ctx.moveTo(10,y);
      ctx.bezierCurveTo(300,y-140,770,y+120,W-10,y);
    }
    ctx.lineWidth = 4;
    ctx.stroke();
  } else if (pattern === 'blocks') {
    ctx.fillRect(W-190,54,157,301);
    ctx.fillRect(38,height-335,178,236);
  } else {
    for (let row = 0; row < 5; row++) {
      for (let column = 0; column < 6; column++) {
        const x = W-216+column*34, y = 148+row*36;
        if (pattern === 'check' && (row+column) % 2 === 0) ctx.fillRect(x,y,32,32);
        if (pattern === 'grid') ctx.strokeRect(x,y,30,30);
        if (pattern === 'stripes') {
          ctx.moveTo(x,y+18);
          ctx.lineTo(x+22,y);
        }
        if (pattern === 'pearls') {
          ctx.moveTo(x+7,y);
          ctx.arc(x,y,7,0,2*Math.PI);
        }
        if (pattern === 'hearts') {
          ctx.moveTo(x,y+11);
          ctx.bezierCurveTo(x-22,y-7,x-7,y-16,x,y-7);
          ctx.bezierCurveTo(x+7,y-16,x+22,y-7,x,y+11);
        }
      }
    }
    if (pattern === 'stripes') ctx.stroke();
    else ctx.fill();
  }
  ctx.restore();
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
  if (key === 'cute') {
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.bezierCurveTo(-radius*1.5,-radius,-radius*1.5,radius,0,0);
    ctx.bezierCurveTo(radius*1.5,-radius,radius*1.5,radius,0,0);
    ctx.lineTo(-radius*.45,radius*.8);
    ctx.moveTo(0,0);
    ctx.lineTo(radius*.45,radius*.8);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const stars = key === 'night' || key === 'glamour' || key === 'pop';
  const count = stars ? 4 : 5;
  for (let i = 0; i < count; i++) {
    ctx.rotate(2 * Math.PI / count);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    if (stars) {
      ctx.lineTo(-radius*.18,-radius*.18);
      ctx.lineTo(0,-radius);
      ctx.lineTo(radius*.18,-radius*.18);
      ctx.lineTo(0,0);
    } else {
      ctx.bezierCurveTo(-radius * .52,-radius * .53,-radius * .25,-radius,0,-radius);
      ctx.bezierCurveTo(radius * .35,-radius,radius * .44,-radius * .46,0,0);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function portrait(ctx, photo, x, y, w, h, design, crop) {
  const accent = design.colors[2];
  const radius = design.frame === 'round' ? 48 : 0;
  if (design.frame === 'offset') {
    ctx.fillStyle = accent;
    ctx.fillRect(x+5,y+5,w+17,h+17);
  }
  ctx.fillStyle = design.frame === 'deco' ? accent : '#fff';
  ctx.beginPath();
  ctx.roundRect(x-8,y-8,w+16,h+16,radius+4);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x,y,w,h,radius);
  ctx.clip();
  if (photo && crop?.fit) {
    const scale = Math.min(w / photo.naturalWidth,h / photo.naturalHeight);
    const fittedWidth = photo.naturalWidth * scale, fittedHeight = photo.naturalHeight * scale;
    ctx.fillStyle = design.colors[0];
    ctx.fillRect(x,y,w,h);
    ctx.drawImage(photo,x+(w-fittedWidth)/2,y+(h-fittedHeight)/2,fittedWidth,fittedHeight);
  } else if (photo) {
    const scale = Math.max(w / photo.naturalWidth, h / photo.naturalHeight) * (crop?.zoom || 1);
    const sw = w / scale, sh = h / scale;
    ctx.drawImage(photo, (photo.naturalWidth-sw)*(crop?.x ?? .5),(photo.naturalHeight-sh)*(crop?.y ?? .28),sw,sh,x,y,w,h);
  } else {
    ctx.strokeStyle = accent;
    ctx.setLineDash([9,10]);
    ctx.fillStyle = design.colors[0];
    ctx.fillRect(x,y,w,h);
    ctx.beginPath();
    ctx.roundRect(x+8,y+8,w-16,h-16,radius);
    ctx.stroke();
  }
  ctx.restore();
}

export function renderPosters(facts, design, photo, format = 'story', { thumbnail = false, previewScale = .2, crop } = {}) {
  const story = format === 'story';
  const square = format === 'square';
  const H = story ? 1920 : square ? 1080 : 1350;
  const banner = design.layout === 'banner';
  const stacked = design.layout === 'stack' || banner;
  const wide = design.layout === 'feature';
  const time = facts.rows.find(([label]) => label === '開催時間')?.[1] || '';
  const heroTime = time && [...time].length <= 18;
  const [, ink, accent] = design.colors;
  const headingFont = design.bold ? sans : serif;
  const pages = [];
  const scale = thumbnail ? previewScale : 1;
  let ctx, y;
  function startPage(first) {
    const canvas = document.createElement('canvas');
    canvas.width = W * scale;
    canvas.height = H * scale;
    pages.push(canvas);
    ctx = canvas.getContext('2d');
    ctx.scale(scale,scale);
    backdrop(ctx,H,design);
    ctx.font = '700 ' + (first ? 56 : 36) + 'px ' + headingFont;
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
        ctx.font = '700 ' + size + 'px ' + headingFont;
        titleLines = titleGroups.flatMap(group => lines(ctx,group.trim(),950));
        if (titleLines.length <= 2 || size <= 38) break;
        size -= 4;
      } while (true);
      const extended = titleLines.length > 3;
      const heading = extended ? ['出演のご案内'] : titleLines;
      let baseline = ruleY + size + 28;
      if (stacked) ctx.textAlign = 'center';
      for (const line of heading) {
        ctx.fillText(line,stacked ? W/2 : 62,baseline);
        baseline += size + 12;
      }
      ctx.textAlign = 'left';
      const top = baseline - size + 24;
      const pw = banner ? 930 : stacked ? (story ? 588 : 530) : story ? (wide ? 505 : 414) : (wide ? 425 : 340);
      const height = banner ? (story ? 442 : 265) : stacked ? (story ? 515 : 310) : story ? (wide ? 610 : 545) : (wide ? 320 : 275);
      const ph = square ? Math.min(height,225) : height;
      const px = stacked ? (W-pw)/2 : design.left ? 68 : W-68-pw;
      const tx = stacked ? (design.left ? 62 : W/2+24) : design.left ? px+pw+56 : 62;
      const tw = stacked ? W/2-86 : W-pw-192;
      const infoTop = stacked ? top+ph+(photo ? 55 : 27) : top;
      portrait(ctx,photo,px,top,pw,ph,design,crop);
      if (photo) {
        ctx.font = '23px ' + sans;
        ctx.fillStyle = ink;
        ctx.fillText('参考写真',px,top+ph+39);
      }
      motif(ctx,tx+tw-28,infoTop+32,26,design.key,accent);
      ctx.fillStyle = ink;
      ctx.font = '600 32px ' + sans;
      if (facts.day) {
        ctx.fillText(facts.day.year + '年　' + facts.day.weekday + '曜日',tx,infoTop+45);
        ctx.font = 'bold ' + (story ? 106 : 80) + 'px Georgia,serif';
        ctx.fillText(facts.day.month + '.' + String(facts.day.day).padStart(2,'0'),tx,infoTop+(story ? 165 : 133));
      } else {
        ctx.fillText(facts.dateLabel,tx,infoTop+107);
      }
      if (heroTime) {
        ctx.font = '600 25px ' + sans;
        ctx.fillText('開催時間',tx,infoTop+(story ? 219 : 175));
        ctx.font = '700 ' + (story ? 41 : 32) + 'px ' + sans;
        ctx.fillText(time,tx,infoTop+(story ? 274 : 217),tw);
      }
      if (facts.banner) {
        ctx.font = '700 ' + (story ? 38 : 32) + 'px ' + sans;
        const bannerLines = lines(ctx,facts.banner,tw-40);
        const lineHeight = story ? 52 : 43;
        const bandX = stacked ? W-tx-tw : tx;
        const bandY = infoTop + (stacked ? 82 : story ? 325 : heroTime ? 239 : 172);
        const bandHeight = bannerLines.length * lineHeight + 18;
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.moveTo(bandX,bandY);
        ctx.lineTo(bandX+tw,bandY);
        ctx.lineTo(bandX+tw-11,bandY+bandHeight/2);
        ctx.lineTo(bandX+tw,bandY+bandHeight);
        ctx.lineTo(bandX,bandY+bandHeight);
        ctx.lineTo(bandX+11,bandY+bandHeight/2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = design.colors[0];
        ctx.textAlign = 'center';
        bannerLines.forEach((line,i) => ctx.fillText(line,bandX+tw/2,bandY+(i+1)*lineHeight-1));
        ctx.textAlign = 'left';
        y = bandY+bandHeight+70;
      } else {
        y = top+ph+72;
      }
      y = Math.max(y,top+ph+(photo ? 97 : 68));
      if (stacked) y = Math.max(y,infoTop+(heroTime ? (story ? 340 : 279) : 228));
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
      if (y + 90 > H - 105) {
        if (thumbnail) return false;
        startPage(false);
      }
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
    if (row(label,value) === false) break;
  }
  pages.forEach((canvas,i) => {
    const c = canvas.getContext('2d');
    c.fillStyle = ink;
    c.fillRect(0,H-92,W,92);
    c.fillStyle = design.colors[0];
    c.font = '27px ' + sans;
    if (facts.note) c.fillText(facts.note,58,H-55,W-116);
    c.fillText(facts.checked ? '情報確認　' + facts.checked + '（日本時間）' : '最新情報は公式案内へ',58,H-19);
    c.textAlign = 'right';
    if (!thumbnail) c.fillText((i+1) + ' / ' + pages.length,W-58,H-27);
  });
  return pages;
}
