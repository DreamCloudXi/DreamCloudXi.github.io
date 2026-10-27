/**
 * Helpers for platforms that return HTML rather than Markdown.
 *
 * WordPress and Shopify both hand back rendered HTML with encoded entities.
 * Titles and excerpts need to be plain text before they reach a schema, while
 * the body is passed through as-is and rendered by `<Content />`.
 */

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘',
  rdquo: '”', ldquo: '“', laquo: '«', raquo: '»', deg: '°',
};

/** Decodes the named and numeric entities these APIs commonly return. */
export function decodeEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match);
}

/** Strips tags and decodes entities — for fields the schema expects as text. */
export function toText(html: string | undefined | null): string {
  if (!html) return '';
  return decodeEntities(html.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}

/** Truncates at a word boundary, for excerpts a platform does not provide. */
export function summarize(html: string | undefined | null, max = 160): string {
  const text = toText(html);
  if (text.length <= max) return text;
  return text.slice(0, text.lastIndexOf(' ', max)).replace(/[,;:.]$/, '') + '…';
}
