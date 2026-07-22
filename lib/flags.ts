export function getFlagEmoji(name: string = ''): string {
  if (!name) return '🌐 ';
  const lower = name.toLowerCase();

  // If name already starts with any emoji or flag, don't add another emoji
  if (/^[\u{1F300}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}]/u.test(name.trim())) return '';

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
  let rawName = (item.server_name || item.name || 'Server').trim();
  // Strip leading globe emojis if present to avoid duplication
  rawName = rawName.replace(/^🌐\s*/g, '').trim();

  const flag = getFlagEmoji(rawName);
  const formattedName = flag ? `${flag}${rawName}` : rawName;
  return {
    ...item,
    server_name: formattedName,
    name: formattedName,
  };
}
