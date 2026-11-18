import { drawReferenceDecor, referencePosterThemes } from './poster-reference-themes.mjs?v=reference-1';
import { drawLettering, posterLettering, ribbonColors } from './poster-lettering.mjs?v=poster-density-1';
import { drawPosterPattern, posterPatternKey } from './poster-patterns.mjs';

export const posterThemes = {
  invitation: { label: '花束の招待状', frame: 'round', layout: 'feature', scene: 'blossom', palettes: [
    ['#fff6f2','#66364a','#ba697b'], ['#f0f5ec','#324f43','#799679'], ['#f7f0fb','#573d67','#ae88ae']
  ] },
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
  pearl: { label: 'パールジュエル', frame: 'round', wide: true, palettes: [
    ['#f6ecdf','#4b343f','#b87b8a'], ['#eef0f5','#38415b','#a188c0'], ['#eaf0e9','#304938','#8fa275']
  ] },
  noir: { label: 'モノクロシック', frame: 'offset', wide: true, bold: true, palettes: [
    ['#181a20','#f9f7f3','#aeb5c5'], ['#1b2020','#f2efde','#b7a487'], ['#231c23','#f0edef','#bc92a5']
  ] },
  artdeco: { label: 'アールデコ・ベルベット', frame: 'deco', stacked: true, palettes: [
    ['#122e2b','#fff2cf','#dcb46e'], ['#302139','#fff4d5','#d9a364'], ['#34191e','#fff2d9','#c48656']
  ] },
  heart: { label: 'ハートメロウ', frame: 'round', stacked: true, palettes: [
    ['#ffd7e4','#73243d','#dc6984'], ['#ffeddf','#703b34','#eb817d'], ['#e7dcfc','#583978','#a36abc']
  ] },
  candy: { label: 'キャンディチェック', frame: 'round', palettes: [
    ['#ffe6ed','#6a284a','#e880b4'], ['#e2f8ef','#245449','#74c8af'], ['#e9ecff','#40376c','#9a94e2']
  ] },
  doll: { label: 'ドールパステル', frame: 'deco', stacked: true, palettes: [
    ['#fdf1fb','#5b4058','#bc8aac'], ['#ebf2ff','#324878','#86a8e4'], ['#fff7e1','#5c4434','#cfab70']
  ] },
  comic: { label: 'コミックポスター', frame: 'offset', bold: true, palettes: [
    ['#fff2a3','#262944','#e44356'], ['#d2f1fc','#123452','#ed6848'], ['#fce0c7','#4b2455','#8a52cf']
  ] },
  neon: { label: 'ネオンステージ', frame: 'offset', wide: true, bold: true, palettes: [
    ['#20143b','#fff4fb','#f47ceb'], ['#102c33','#ecfff9','#58e2a8'], ['#17233f','#eefaff','#5baef9']
  ] },
  soda: { label: 'クリームソーダ', frame: 'round', layout: 'banner', bold: true, palettes: [
    ['#c9f5e4','#164b42','#31ad91'], ['#f4e2ff','#533671','#b77dda'], ['#ffe8c3','#654022','#e38e51']
  ] },
  print: { label: 'カラーブロック', frame: 'offset', wide: true, bold: true, palettes: [
    ['#fbebd0','#2e3449','#e35d49'], ['#eaeef5','#2f3656','#2d75da'], ['#daf4de','#244537','#22ac79']
  ] },
  coastal: { label: 'サンセットビーチ', frame: 'round', layout: 'banner', palettes: [
    ['#ffdcbf','#65382c','#df765b'], ['#d5f3f7','#23474c','#67bfc8'], ['#fce6cc','#614650','#d8819a']
  ] },
  paper: { label: '和紙モダン', frame: 'deco', layout: 'banner', palettes: [
    ['#faf2de','#4d3828','#bf955e'], ['#e8f1e6','#324b3f','#7f9b7a'], ['#f8e5de','#643a43','#bb706d']
  ] },
  ...referencePosterThemes
};

export const posterThemeGroups = {
  '華やか': ['glamour','editorial','pearl','noir','artdeco'],
  'かわいい': ['cute','floral','heart','candy','doll','invitation'],
  'POP': ['pop','comic','neon','soda','print'],
  '季節・レトロ': ['retro','natural','night','coastal','paper'],
  '保存した見本': Object.keys(referencePosterThemes)
};

export const posterLayouts = {
  split: '左右並び',
  feature: '左右並び・写真大',
  stack: '中央に写真',
  banner: '横長の写真'
};

const seasons = [
  ['night','glamour','cute','noir','winterPetals','roseIllumination'],
  ['floral','cute','natural','heart','lavenderBouquet','ivoryLace'],
  ['pop','natural','editorial','soda','coastal','retroDiner','coralStars'],
  ['retro','glamour','editorial','paper','artdeco','mapleGold','pressedAutumn','pinkMaple']
];
const serif = '"Yu Mincho","Hiragino Mincho ProN","Noto Serif CJK JP",serif';
const sans = '"Yu Gothic","Hiragino Sans","Meiryo","Noto Sans CJK JP",sans-serif';
const W = 1080;

export function posterVariant(key, palette = 0, left = false, layout) {
  const theme = posterThemes[key];
  const defaultLayout = theme.layout || (theme.stacked ? 'stack' : theme.wide ? 'feature' : 'split');
  layout ||= defaultLayout;
  return { ...theme, key, palette, colors: theme.palettes[palette], left, layout, id: key + palette + left + layout };
}

export function nextDesign(facts, previous, selectedTheme) {
  const season = seasons[Math.floor(((facts.month || 1) % 12) / 3)];
  const special = /イルミネーション|夜景|ナイト/.test(facts.title) ? ['lanternNight','roseIllumination']
    : /学園|学校|制服/.test(facts.title) ? ['chalkboard','cute']
    : /レトロ|浴衣|古民家/.test(facts.title) ? ['retro','retroDiner','pressedAutumn']
    : /ドレス|ホテル|舞台/.test(facts.title) ? ['glamour','goldCurtains','velvetHotel','roseLights']
    : /花|flower/i.test(facts.title) ? ['floral','pinkRoseLace','lavenderBouquet']
    : /animal|バニー/i.test(facts.title) ? ['cute','mintRibbon','ivoryLace']
    : /野外|屋外|公園|ガーデン/.test(facts.title) ? ['natural','winterPetals','pinkMaple'] : [];
  const automatic = !Object.hasOwn(posterThemes, selectedTheme);
  const keys = automatic ? [...new Set([...special, ...season, ...Object.keys(posterThemes)])] : [selectedTheme];
  const choices = automatic ? keys.filter(key => key !== previous?.key) : keys;
  const weighted = choices.flatMap(key => Array(special.includes(key) ? 5 : season.includes(key) ? 3 : 1).fill(key));
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
  drawPosterPattern(ctx,W,height,design);
  const patterned = posterPatternKey(design) !== 'none';
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;
  if (design.scene && patterned) {
    drawReferenceDecor(ctx,W,height,design);
  } else if (design.scene || design.frame === 'deco') {
    ctx.lineWidth = 2;
    ctx.strokeRect(28,25,W-56,height-49);
    ctx.strokeRect(38,35,W-76,height-69);
    ctx.globalAlpha = .24;
    for (const radius of patterned ? [130,170,210] : []) {
      ctx.beginPath();
      ctx.arc(W-18,105,radius,0,2*Math.PI);
      ctx.stroke();
    }
  } else if (design.frame === 'offset') {
    ctx.globalAlpha = .22;
    for (let y = 48; patterned && y < 350; y += 21) {
      for (let x = W-126; x < W-24; x += 22) {
        ctx.beginPath();
        ctx.arc(x,y,3.5,0,2*Math.PI);
        ctx.fill();
      }
    }
    ctx.fillRect(26,28,11,height-56);
  } else if (patterned) {
    ctx.globalAlpha = .14;
    for (const [x,y,radius] of [[W-24,150,180],[18,height-245,150],[W-34,height-158,74]]) {
      ctx.beginPath();
      ctx.arc(x,y,radius,0,2*Math.PI);
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.fillStyle = ink;
  ctx.fillRect(0,0,W,12);
}

function lines(ctx, value, width) {
  const result = [];
  for (const para of value.split('\n')) {
    let line = '';
    const words = para.match(/(?:（税込）|[A-Za-z0-9]+(?:[.,:：/〜～-][A-Za-z0-9]+)*[円年月日時分部枠]?)[、。]?|./gu) || [];
    const tokens = words.flatMap(word => word.length > 1 && ctx.measureText(word).width > width ? [...word] : [word]);
    for (const token of tokens) {
      if (line && ctx.measureText(line + token).width > width) {
        if (/^[、。）」』】！？，．]/.test(token) || /[「『（【]$/.test(line)) {
          const chars = Array.from(line);
          line = chars.pop();
          if (chars.length) result.push(chars.join(''));
        } else {
          result.push(line);
          line = '';
        }
      }
      line += token;
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
  const radius = design.frame === 'round' || design.shape === 'round' ? 48 : 0;
  const outline = (left,top,width,height,corner) => {
    ctx.beginPath();
    if (design.shape === 'oval') ctx.ellipse(left+width/2,top+height/2,width/2,height/2,0,0,Math.PI*2);
    else ctx.roundRect(left,top,width,height,corner);
  };
  ctx.save();
  if (design.shape === 'tilt') {
    ctx.translate(x+w/2,y+h/2);
    ctx.rotate(design.left ? -.039 : .039);
    ctx.translate(-x-w/2,-y-h/2);
  }
  if (design.frame === 'offset') {
    ctx.fillStyle = accent;
    ctx.fillRect(x+5,y+5,w+17,h+17);
  }
  ctx.fillStyle = design.scene || design.frame === 'deco' ? accent : '#fff';
  outline(x-8,y-8,w+16,h+16,radius+4);
  ctx.fill();
  outline(x,y,w,h,radius);
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
    outline(x+8,y+8,w-16,h-16,radius);
    ctx.stroke();
  }
  ctx.restore();
}

function measureDetails(ctx, rows, size, columns) {
  const gap = 30;
  const width = (W-124-(columns-1)*gap)/columns;
  const labelSize = Math.round(size*.73);
  const labelStep = Math.ceil(labelSize*1.25);
  const textStep = Math.ceil(size*1.35);
  const measured = rows.map(([label,value]) => {
    const emphasized = /料金|オプション/.test(label);
    ctx.font = '700 ' + labelSize + 'px ' + sans;
    const labels = lines(ctx,label,width-18);
    ctx.font = (emphasized ? '700 ' : '600 ') + size + 'px ' + sans;
    const values = lines(ctx,value,width-18);
    const height = labels.length*labelStep + values.length*textStep + Math.round(size*.6);
    return { labels, values, height, emphasized };
  });
  const total = measured.reduce((height,row) => height+row.height,0);
  let split = measured.length, height = total;
  if (columns === 2) {
    let left = 0;
    for (let i = 1; i < measured.length; i++) {
      left += measured[i-1].height;
      const taller = Math.max(left,total-left);
      if (taller < height) {
        split = i;
        height = taller;
      }
    }
  }
  return { groups: [measured.slice(0,split),measured.slice(split)], height, width, gap, size, labelSize, labelStep, textStep };
}

function drawDetails(ctx, rows, design, lettering, top, bottom, story) {
  if (!rows.length) return;
  const available = bottom-top;
  const [,ink,accent] = design.colors;
  let layout;
  const preferred = (story ? 48 : 39) + (design.typeSize === 'large' ? 8 : 0);
  for (const size of [preferred,story ? 39 : 34,30,26,22,18]) {
    const single = measureDetails(ctx,rows,size,1);
    if (single.height <= available) {
      layout = single;
      break;
    }
    const double = measureDetails(ctx,rows,size,2);
    layout = double.height < single.height ? double : single;
    if (layout.height <= available) break;
  }
  const fit = Math.min(1,available/layout.height);
  const rowGap = Math.min(layout.size*.55, (available/fit-layout.height)/Math.max(1,...layout.groups.map(group => group.length)));
  const panelHeight = Math.max(...layout.groups.map(group => group.reduce((sum,row) => sum+row.height+rowGap,0)));
  ctx.save();
  ctx.translate(W*(1-fit)/2,top);
  ctx.scale(fit,fit);
  if (design.scene || posterPatternKey(design) !== 'none') {
    ctx.fillStyle = design.scene ? lettering.body : lettering.body+'dc';
    ctx.beginPath();
    ctx.roundRect(46,-9,W-92,panelHeight+18,18);
    ctx.fill();
    if (design.scene) {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  const textColor = design.scene ? '#382737' : ink;
  for (const [index, group] of layout.groups.entries()) {
    const x = 62 + index*(layout.width+layout.gap);
    let y = 0;
    for (const { labels, values, height, emphasized } of group) {
      let baseline = y + layout.labelSize;
      ctx.fillStyle = accent;
      ctx.fillRect(x,y+3,5,layout.labelSize);
      ctx.font = '700 ' + layout.labelSize + 'px ' + sans;
      const labelLift = layout.labelSize*.9;
      const chipWidth = Math.max(...labels.map(label => ctx.measureText(label).width)) + 16;
      ctx.fillStyle = lettering.chip;
      ctx.beginPath();
      ctx.roundRect(x+11,baseline-labelLift,chipWidth,layout.labelStep*labels.length,Math.min(layout.labelSize*.36,9));
      ctx.fill();
      ctx.fillStyle = lettering.labelInk;
      for (const label of labels) {
        ctx.fillText(label,x+18,baseline);
        baseline += layout.labelStep;
      }
      baseline += layout.size-layout.labelSize;
      ctx.font = (emphasized ? '700 ' : '600 ') + layout.size + 'px ' + sans;
      for (const value of values) {
        ctx.fillStyle = emphasized ? lettering.emphasis : textColor;
        if (labels[0].startsWith('予約枠') && /^第[0-9]+部/.test(value)) {
          const open = /(?:空き|予約受付中)$/.test(value);
          const darkTable = lettering.dark && !design.scene;
          ctx.fillStyle = darkTable ? (open ? '#235547' : '#433447') : (open ? '#e3f0e3' : '#f1e3e3');
          ctx.fillRect(x+11,baseline-layout.size+2,layout.width-12,layout.textStep-2);
          ctx.fillStyle = darkTable ? '#fff8ed' : (open ? '#215c44' : '#654050');
        }
        ctx.fillText(value,x+18,baseline);
        baseline += layout.textStep;
      }
      y += height + rowGap;
    }
  }
  ctx.restore();
}

function drawAnnouncementMessage(ctx, message, top, design) {
  const { size, font, textLines, height } = message;
  const [paper,ink,accent] = design.colors;
  ctx.save();
  ctx.translate(0,top);
  ctx.fillStyle = paper;
  ctx.beginPath();
  ctx.roundRect(48,0,W-96,height,design.frame === 'round' ? 30 : 4);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const y of [8,height-8]) { ctx.moveTo(72,y); ctx.lineTo(W-72,y); }
  ctx.stroke();
  motif(ctx,88,height/2,18,design.key,accent);
  motif(ctx,W-88,height/2,18,design.key,accent);
  ctx.textAlign = 'center';
  ctx.font = font;
  ctx.fillStyle = ink;
  textLines.forEach((line,i) => ctx.fillText(line,W/2,25+size+i*Math.ceil(size*1.3)));
  ctx.restore();
}

export function renderPoster(facts, design, photo, format = 'story', { previewScale = 1, crop } = {}) {
  const story = format === 'story';
  const square = format === 'square';
  const H = story ? 1920 : square ? 1080 : 1350;
  const banner = design.layout === 'banner';
  const stacked = design.layout === 'stack' || banner;
  const wide = design.layout === 'feature';
  const time = facts.rows.find(([label]) => label === '開催時間')?.[1] || '';
  const heroTime = time && [...time].length <= 18;
  const [,ink,accent] = design.colors;
  const lettering = posterLettering(design);
  const headingFont = design.typeface === 'serif' ? serif : design.typeface === 'sans' || lettering.bold || design.bold ? sans : serif;
  const canvas = document.createElement('canvas');
  canvas.width = W*previewScale;
  canvas.height = H*previewScale;
  const ctx = canvas.getContext('2d');
  ctx.scale(previewScale,previewScale);
  backdrop(ctx,H,design);
  ctx.font = '800 56px ' + headingFont;
  drawLettering(ctx,'雪餅羽もえ',62,100,56,lettering,{ gleam: true });
  ctx.textAlign = 'left';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  const ruleY = 129;
  ctx.beginPath();
  ctx.moveTo(62,ruleY);
  ctx.lineTo(W-62,ruleY);
  ctx.stroke();

  let size = (story ? 74 : 58) + (design.typeSize === 'large' ? 10 : 0);
  let titleLines;
  const posterTitle = facts.title.replace(/(^|\s)雪餅羽もえ(?=\s|$)/u,'$1').trim().replace(/\s+/gu,' ') || facts.title;
  const titleGroups = posterTitle.split(/\s*(?=[「（])/u);
  do {
    ctx.font = '800 ' + size + 'px ' + headingFont;
    titleLines = titleGroups.flatMap(group => lines(ctx,group.trim(),950));
    if (titleLines.length <= 2 || size <= 38) break;
    size -= 4;
  } while (true);
  const extended = titleLines.length > 3;
  const heading = extended ? ['出演のご案内'] : titleLines;
  const titleY = ruleY + size + 28;
  const top = titleY + heading.length*(size+12) - size + 24;
  const opening = facts.rows.find(([label,value]) => label === '受付' && value.startsWith('予約受付開始　'))?.[1];
  const bannerText = (design.scene && opening) || facts.banner;
  let details = facts.rows.filter(([label,value]) =>
    !(label === '受付' && value === bannerText) && !(label === '開催時間' && heroTime)
    && !(label === '予約枠' && value === '枠ごとの状況は未確認'));
  if (extended) details.unshift(['イベント名',facts.title]);
  const detailBottom = H-52;
  const highlight = details.find(([label]) => label === '撮影会について');
  const messageText = highlight?.[1] || '';
  const messageSize = (story ? 43 : 35) + (design.typeSize === 'large' ? 4 : 0);
  const messageFont = '700 ' + messageSize + 'px ' + headingFont;
  ctx.font = messageFont;
  const textLines = messageText ? lines(ctx,messageText,W-252) : [];
  const messageHeight = 50 + textLines.length*Math.ceil(messageSize*1.3);
  const otherRows = highlight ? details.filter(row => row !== highlight) : details;
  const minBody = Math.min(measureDetails(ctx,otherRows,30,1).height,measureDetails(ctx,otherRows,30,2).height);
  const showMessage = textLines.length > 0 && textLines.length <= 3 && detailBottom-H*.52-minBody >= messageHeight+56;
  if (showMessage) details = otherRows;
  const messageSpace = showMessage ? messageHeight+44 : 0;
  const bodyBottom = detailBottom-messageSpace;
  const normalBody = measureDetails(ctx,details,story ? 46 : 36,1).height;
  const height = banner ? (story ? 442 : 265) : stacked ? (story ? 515 : 310) : story ? (wide ? 610 : 545) : (wide ? 320 : 275);
  const baseHeight = square ? Math.min(height,225) : height;
  const infoSpace = (stacked ? 245 : 90) + ((stacked || design.scene) && bannerText ? 100 : 0);
  const surplus = Math.max(0,bodyBottom-top-baseHeight-infoSpace-normalBody);
  const growth = photo ? Math.min(story ? 450 : 175,surplus*.86) : 0;
  const baseWidth = stacked ? (story ? 645 : 530) : story ? (wide ? 505 : 414) : (wide ? 425 : 340);
  const pw = banner ? 930 : Math.min(stacked ? 898 : 545,baseWidth + growth*(stacked ? .8 : .34));
  const ph = baseHeight + growth;
  const px = stacked ? (W-pw)/2 : design.left ? 68 : W-68-pw;
  const tx = stacked ? (design.left ? 62 : W/2+24) : design.left ? px+pw+56 : 62;
  const tw = stacked ? W/2-86 : W-pw-192;
  const infoTop = stacked ? top+ph+27 : top;
  const bandFont = '700 ' + (story ? 38 : 32) + 'px ' + sans;
  ctx.font = bandFont;
  const fullBand = stacked || design.scene;
  const bandWidth = fullBand ? W-126 : tw;
  const bannerLines = bannerText ? lines(ctx,bannerText,bandWidth-40) : [];
  const bandLineHeight = story ? 52 : 43;
  const bandX = fullBand ? 63 : tx;
  const infoBottom = Math.max(top+ph+52,
    infoTop+(!stacked && heroTime ? (story ? 305 : 249) : story ? 196 : 160));
  const bandY = fullBand ? infoBottom : infoTop + (heroTime ? (story ? 325 : 239) : story ? 205 : 172);
  const bandHeight = bannerLines.length*bandLineHeight + 18;
  const heroBottom = Math.max(
    top+ph+56,
    stacked ? infoBottom+22 : 0,
    bannerLines.length ? bandY+bandHeight+(fullBand ? 34 : 60) : 0
  );
  const venue = details.find(([label]) => label === '会場');
  const venueY = fullBand || !bannerLines.length ? infoTop+(heroTime ? (story ? 329 : 263) : 207) : bandY+bandHeight+45;
  const venueSize = (story ? 42 : 33) + (design.typeSize === 'large' ? 4 : 0);
  const venueStep = Math.ceil(venueSize*1.3);
  const venueFont = '700 ' + venueSize + 'px ' + sans;
  ctx.font = venueFont;
  const venueLines = !stacked && venue && details.length > 1 ? lines(ctx,venue[1],tw-12) : [];
  const showVenue = venueLines.length > 0 && venueY+43+venueStep*venueLines.length <= top+ph;
  if (showVenue) details = details.filter(row => row !== venue);
  const idealDetails = Math.min(
    measureDetails(ctx,details,30,1).height,
    measureDetails(ctx,details,30,2).height
  );
  const heroLimit = Math.max(H*.51,bodyBottom-idealDetails);
  const heroFit = Math.min(1,(heroLimit-ruleY)/(heroBottom-ruleY));

  ctx.save();
  ctx.translate(W*(1-heroFit)/2,ruleY*(1-heroFit));
  ctx.scale(heroFit,heroFit);
  ctx.fillStyle = ink;
  ctx.font = '800 ' + size + 'px ' + headingFont;
  if (stacked) ctx.textAlign = 'center';
  heading.forEach((line,index) => drawLettering(ctx,line,stacked ? W/2 : 62,titleY+index*(size+12),size,lettering));
  ctx.textAlign = 'left';
  portrait(ctx,photo,px,top,pw,ph,design,crop);
  motif(ctx,stacked ? (heroTime ? W/2 : W/2+185) : tx+tw-28,infoTop+32,22,design.key,accent);
  ctx.fillStyle = ink;
  ctx.font = '600 32px ' + sans;
  const dateX = stacked && !heroTime ? W/2 : tx;
  if (stacked && !heroTime) ctx.textAlign = 'center';
  if (facts.day) {
    ctx.fillText(facts.day.year + '年　' + facts.day.weekday + '曜日',dateX,infoTop+45);
    const dateSize = story ? 106 : 80;
    ctx.font = '800 ' + dateSize + 'px ' + (lettering.bold ? sans : 'Georgia,serif');
    drawLettering(ctx,facts.day.month + '.' + String(facts.day.day).padStart(2,'0'),dateX,infoTop+(story ? 165 : 133),dateSize,lettering);
  } else {
    ctx.fillText(facts.dateLabel,dateX,infoTop+107);
  }
  if (heroTime) {
    ctx.font = '600 25px ' + sans;
    const timeX = stacked ? W-tx-tw : tx;
    ctx.fillText('開催時間',timeX,infoTop+(stacked ? 45 : story ? 219 : 175));
    ctx.font = '700 ' + (story ? 41 : 32) + 'px ' + sans;
    ctx.fillText(time,timeX,infoTop+(stacked ? (story ? 137 : 108) : story ? 274 : 217),tw);
  }
  if (showVenue) {
    ctx.fillStyle = ink;
    ctx.font = '700 28px ' + sans;
    ctx.fillText('会場',tx,venueY+28);
    ctx.fillStyle = accent;
    ctx.fillRect(tx+73,venueY+16,tw-85,2);
    ctx.fillStyle = ink;
    ctx.font = venueFont;
    venueLines.forEach((line,i) => ctx.fillText(line,tx,venueY+40+venueSize+i*venueStep));
  }
  if (bannerLines.length) {
    const [ribbonTop,ribbonBottom] = ribbonColors(bannerText,lettering);
    const ribbon = ctx.createLinearGradient(bandX,bandY,bandX,bandY+bandHeight);
    ribbon.addColorStop(0,ribbonTop);
    ribbon.addColorStop(1,ribbonBottom);
    ctx.fillStyle = ribbon;
    ctx.beginPath();
    ctx.moveTo(bandX,bandY);
    ctx.lineTo(bandX+bandWidth,bandY);
    ctx.lineTo(bandX+bandWidth-11,bandY+bandHeight/2);
    ctx.lineTo(bandX+bandWidth,bandY+bandHeight);
    ctx.lineTo(bandX,bandY+bandHeight);
    ctx.lineTo(bandX+11,bandY+bandHeight/2);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = lettering.key === 'gold' ? '#e7b96a' : '#fff5df75';
    ctx.stroke();
    ctx.font = bandFont;
    ctx.textAlign = 'center';
    bannerLines.forEach((line,index) => drawLettering(ctx,line,bandX+bandWidth/2,
      bandY+(index+1)*bandLineHeight-1,story ? 38 : 32,lettering,{ ribbon: true }));
  }
  ctx.restore();

  const detailTop = ruleY + (heroBottom-ruleY)*heroFit;
  drawDetails(ctx,details,design,lettering,detailTop,bodyBottom,story);
  if (showMessage) drawAnnouncementMessage(ctx,{ size:messageSize, font:messageFont, textLines, height:messageHeight },
    detailBottom-messageHeight,design);

  ctx.fillStyle = accent;
  ctx.fillRect(62,H-30,W-124,2);
  return canvas;
}
