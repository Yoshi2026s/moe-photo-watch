export function posterThemeProfile({ title = '', venue = '', highlight = '', details = '' }) {
  const theme = title + ' ' + highlight;
  const [base, option = ''] = String(details || '').split(/オプション(?:料金)?[：:]/);
  const swim = /水着|競泳|ビキニ|マイクロビキニ|swim/i;
  const unavailableSwim = /(?:水着|ビキニ)[\s：:はのが]*(?:撮影|着用|オプション)?[\s：:]*(?:不可|禁止|なし|NG|対象外)/i;
  const allowsSwim = text => swim.test(text) && !unavailableSwim.test(text);
  const wardrobe = [
    [/浴衣|着物|和装|袴/, 'kimono'], [/ドレス|dressy|ブライダル/i, 'dress'],
    [/制服|セーラー服/, 'uniform'], [/私服|カジュアル/, 'casual'], [/animal|バニー|アニマル/i, 'animal']
  ];
  const outfit = wardrobe.find(([match]) => match.test(theme + ' ' + base))?.[1] || (allowsSwim(theme + ' ' + base) ? 'swim' : '');
  const optionSwim = allowsSwim(option);
  const setting = theme + ' ' + venue;
  const scene = /夜景|イルミネーション|ナイト/.test(setting) ? 'night'
    : /学園|学校|教室/.test(setting) ? 'school'
    : /古民家|畳|和室|レトロ|昭和/.test(setting) || outfit === 'kimono' ? 'retro'
    : /ホテル|舞台|mademoiselle|ブライダル/i.test(setting) || outfit === 'dress' ? 'luxury'
    : /花|flower|フラワー|バラ園/i.test(setting) ? 'flower'
    : /プール|ビーチ|海岸|しらこばと/.test(setting) ? 'pool'
    : /野外|屋外|公園|庭園|ガーデン|東京ドーム/.test(setting) ? 'outdoor'
    : /ホワイト|白壁|白基調/.test(setting) ? 'light'
    : /モノトーン|グレー|黒壁/.test(setting) ? 'monochrome'
    : '';
  return { outfit, optionSwim, scene };
}
