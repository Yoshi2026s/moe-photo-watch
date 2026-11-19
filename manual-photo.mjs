const photoTypes = new Set(['image/jpeg','image/png','image/webp']);

export function photoInputError(file) {
  if (!file.size) return '空のファイルです。別の写真を選んでください。';
  if (file.size > 12*1024*1024) return '12MB以下の写真を選んでください。';
  const genericMime = !file.type || file.type === 'application/octet-stream';
  if (!photoTypes.has(file.type) && !(genericMime && /\.(?:jpe?g|png|webp)$/i.test(file.name))) {
    return 'JPEG・PNG・WebPのいずれかを選んでください。';
  }
  return '';
}
