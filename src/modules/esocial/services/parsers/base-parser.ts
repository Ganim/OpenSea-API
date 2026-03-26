/**
 * Base interface and utilities for eSocial XML event parsers.
 *
 * S-5xxx events are "totalizadores" — read-only events returned by the
 * government after processing transmitted events. They are NEVER transmitted
 * by the employer; they are received and parsed for reporting/reconciliation.
 *
 * @template TOutput - The typed result extracted from the XML.
 */
export interface EsocialEventParser<TOutput> {
  readonly eventType: string;
  parse(xml: string): TOutput;
}

// ---------------------------------------------------------------------------
// XML extraction helpers (lightweight — no external XML library needed)
// ---------------------------------------------------------------------------

/**
 * Extract the text content of a single XML tag.
 * Returns `null` if the tag is not found.
 *
 * Example: extractTag('<cpfTrab>12345678909</cpfTrab>', 'cpfTrab') => '12345678909'
 */
export function extractTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}>([^<]*)</${tagName}>`);
  const match = xml.match(regex);
  return match ? match[1] : null;
}

/**
 * Extract the text content of a tag and parse it as a number.
 * Returns `null` if the tag is not found or the value is not a valid number.
 */
export function extractTagAsNumber(
  xml: string,
  tagName: string,
): number | null {
  const raw = extractTag(xml, tagName);
  if (raw === null) return null;
  const parsed = Number(raw);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Extract ALL occurrences of a named group tag, returning their inner XML.
 *
 * Example: extractAllGroups('<item><a>1</a></item><item><a>2</a></item>', 'item')
 *   => ['<a>1</a>', '<a>2</a>']
 */
export function extractAllGroups(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 'gs');
  const groups: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(xml)) !== null) {
    groups.push(match[1]);
  }

  return groups;
}

/**
 * Extract the FIRST occurrence of a named group tag, returning its inner XML.
 * Returns `null` if the tag is not found.
 */
export function extractGroup(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 's');
  const match = xml.match(regex);
  return match ? match[1] : null;
}

/**
 * Unescape basic XML entities back to their original characters.
 */
export function unescapeXml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
