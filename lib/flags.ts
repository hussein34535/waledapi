export function getFlagEmoji(name: string = ''): string {
  if (!name) return '🌐 ';
  const lower = name.toLowerCase();
  // Check if string already contains a flag emoji (Unicode Regional Indicator Symbols U+1F1E6 to U+1F1FF)
  if (/[\u{1F1E6}-\u{1F1FF}]/u.test(name)) return '';

  if (lower.includes('فرنسا') || lower.includes('fr') || lower.includes('france')) return '🇫🇷 ';
  if (lower.includes('بريطانيا') || lower.includes('uk') || lower.includes('england') || lower.includes('gb')) return '🇬🇧 ';
  if (lower.includes('المانيا') || lower.includes('ألمانيا') || lower.includes('de') || lower.includes('germany')) return '🇩🇪 ';
  if (lower.includes('امريكا') || lower.includes('أمريكا') || lower.includes('us') || lower.includes('usa')) return '🇺🇸 ';
  if (lower.includes('هولندا') || lower.includes('nl') || lower.includes('netherlands')) return '🇳🇱 ';
  if (lower.includes('سنغافورة') || lower.includes('sg') || lower.includes('singapore')) return '🇸🇬 ';
  if (lower.includes('كندا') || lower.includes('ca') || lower.includes('canada')) return '🇨🇦 ';
  if (lower.includes('تركيا') || lower.includes('tr') || lower.includes('turkey')) return '🇹🇷 ';
  if (lower.includes('مصر') || lower.includes('eg') || lower.includes('egypt')) return '🇪🇬 ';
  return '🌐 ';
}

export function formatServerWithFlag(item: any) {
  if (!item || typeof item !== 'object') return item;
  const rawName = item.server_name || item.name || 'Server';
  const flag = getFlagEmoji(rawName);
  const formattedName = flag && !rawName.trim().startsWith(flag.trim()) ? `${flag}${rawName.trim()}` : rawName;
  return {
    ...item,
    server_name: formattedName,
    name: formattedName,
  };
}
