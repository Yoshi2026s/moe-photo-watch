export const letteringOptions = {
  soft: 'ふんわり縁取り',
  gold: 'ゴールドの光沢',
  pop: '立体ポップ',
  glow: 'イルミネーション',
  clean: 'すっきり強調',
  press: '活版の陰影'
};

const accentStyles = {
  press: ['invitation'],
  soft: ['cute','floral','heart','candy','doll','pearl','lavenderBouquet','pinkRoseLace','mintRibbon','ivoryLace','winterPetals','pinkMaple'],
  gold: ['glamour','artdeco','retro','goldCurtains','mapleGold','velvetHotel','roseLights','pressedAutumn'],
  pop: ['pop','comic','soda','print','retroDiner','coralStars'],
  glow: ['night','neon','lanternNight','roseIllumination']
};

function channels(color) {
  return [1,3,5].map(index => Number.parseInt(color.slice(index,index+2),16));
}

function mix(base, accent, fraction) {
  const target = channels(accent);
  const components = channels(base).map((channel,index) =>
    Math.round(channel+(target[index]-channel)*fraction).toString(16).padStart(2,'0'));
  return '#' + components.join('');
}

function luminance(color) {
  const [r,g,b] = channels(color).map(channel => {
    const value = channel/255;
    return value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4;
  });
  return r*.2126+g*.7152+b*.0722;
}

function readable(color, background, fallback) {
  const check = luminance(color)+.05, base = luminance(background)+.05;
  return Math.max(check,base)/Math.min(check,base) >= 4.5 ? color : fallback;
}

export function posterLettering(design) {
  const [paper,ink,accent] = design.colors;
  const key = design.lettering || Object.keys(accentStyles).find(style => accentStyles[style].includes(design.key)) || 'clean';
  const dark = luminance(paper) < .28;
  const body = design.scene ? (design.scene === 'winter' ? '#f4faff' : '#fff6e8') : paper;
  const bodyInk = design.scene ? '#382737' : ink;
  const chip = mix(body,accent,dark && !design.scene ? .17 : .22);
  return {
    key, paper, ink, accent, dark, body, chip,
    labelInk: readable(mix(bodyInk,accent,.42),chip,bodyInk),
    emphasis: readable(mix(bodyInk,accent,.36),body,bodyInk),
    bold: key === 'soft' || key === 'pop'
  };
}

export function drawLettering(ctx,text,x,y,size,style,{ ribbon = false, gleam = false } = {}) {
  const { key, paper, ink, accent, dark } = style;
  ctx.save();
  ctx.lineJoin = 'round';
  if (ribbon) {
    ctx.fillStyle = '#fff8ee';
    if (key !== 'clean') {
      ctx.lineWidth = Math.max(2,size*.085);
      ctx.strokeStyle = '#16091d80';
      ctx.strokeText(text,x,y+size*.045);
    }
  } else {
    const halo = dark ? mix(paper,'#000000',.32) : '#fff7f4';
    const depth = dark ? accent : mix(ink,accent,.63);
    const highlight = ctx.createLinearGradient(x,y-size*.83,x,y+size*.13);
    if (key === 'gold') {
      highlight.addColorStop(0,dark ? '#fff9de' : ink);
      highlight.addColorStop(.47,dark ? '#f6ca7b' : mix(ink,'#ad6521',.34));
      highlight.addColorStop(.72,dark ? '#ffe6a7' : mix(ink,'#744818',.18));
      highlight.addColorStop(1,dark ? '#dba24c' : ink);
    } else {
      highlight.addColorStop(0,ink);
      highlight.addColorStop(1,readable(mix(ink,accent,.24),paper,ink));
    }
    ctx.fillStyle = highlight;
    if (key === 'pop' || key === 'gold') {
      ctx.lineWidth = Math.max(3,size*.095);
      ctx.strokeStyle = depth;
      ctx.strokeText(text,x+size*.042,y+size*.065);
    }
    if (key === 'soft') {
      ctx.lineWidth = Math.max(3,size*.18);
      ctx.strokeStyle = mix(halo,accent,.52);
      ctx.strokeText(text,x,y);
    }
    if (key === 'press') {
      ctx.lineWidth = Math.max(2,size*.05);
      ctx.strokeStyle = mix(paper,accent,.62);
      ctx.strokeText(text,x+size*.028,y+size*.048);
      ctx.strokeStyle = dark ? ink : '#fffaf5';
      ctx.lineWidth = Math.max(1,size*.025);
      ctx.strokeText(text,x-size*.016,y-size*.023);
    } else if (key !== 'clean') {
      ctx.lineWidth = Math.max(2,size*(key === 'glow' ? .16 : .11));
      ctx.strokeStyle = key === 'glow' ? accent+'98' : halo;
      ctx.strokeText(text,x,y);
    }
    if (key === 'glow') {
      ctx.lineWidth = size*.06;
      ctx.strokeStyle = halo;
      ctx.strokeText(text,x,y);
    }
  }
  ctx.fillText(text,x,y);
  if (gleam && (key === 'gold' || key === 'glow')) {
    const base = x+ctx.measureText(text).width;
    ctx.fillStyle = dark ? '#ffdfa0' : mix(ink,accent,.52);
    for (const [gx,gy,r] of [[base+size*.28,y-size*.64,size*.13],[base+size*.57,y-size*.49,size*.075]]) {
      ctx.beginPath();
      ctx.moveTo(gx,gy-r);
      ctx.quadraticCurveTo(gx+r*.23,gy-r*.23,gx+r,gy);
      ctx.quadraticCurveTo(gx+r*.23,gy+r*.23,gx,gy+r);
      ctx.quadraticCurveTo(gx-r*.23,gy+r*.23,gx-r,gy);
      ctx.quadraticCurveTo(gx-r*.23,gy-r*.23,gx,gy-r);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function ribbonColors(text, style) {
  if (/満枠|すべて予約済|満席|完売/.test(text)) return ['#823050','#512941'];
  if (/受付終了|中止|開催日経過/.test(text)) return ['#685168','#413346'];
  if (/^予約不要/.test(text)) return ['#306467','#194b50'];
  if (style.key === 'pop') return ['#a42b58','#5c285a'];
  if (style.key === 'gold') return ['#782a4b','#56213a'];
  if (style.key === 'soft') return ['#9e3468','#723658'];
  if (style.key === 'glow') return ['#624293','#402f67'];
  return [readable(style.ink,'#fff8ee','#83395b'),'#423646'];
}
