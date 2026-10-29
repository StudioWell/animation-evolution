/**
 * Metadata from third parties is treated as untrusted plain text. React escapes
 * text on render; these helpers additionally normalise it and cap its size so
 * malformed metadata can't break layouts or smuggle markup.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Decode the small set of HTML entities the YouTube API uses in snippets. Output is plain text. */
export function decodeEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code < 32 || code > 0x10ffff) return "";
      try {
        return String.fromCodePoint(code);
      } catch {
        return "";
      }
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

/** Strip control/bidi-override characters, collapse whitespace and cap length. */
export function cleanText(input: unknown, maxLength = 300): string {
  if (typeof input !== "string") return "";
  const decoded = decodeEntities(input)
    // C0/C1 controls and bidirectional overrides that can disguise text.
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F‪-‮⁦-⁩]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (decoded.length <= maxLength) return decoded;
  return `${decoded.slice(0, maxLength - 1).trimEnd()}…`;
}

/** First sentence-ish chunk of a long description, for card summaries. */
export function summarize(input: unknown, maxLength = 180): string {
  const text = cleanText(input, 2000);
  if (!text) return "";
  // Drop URLs and hashtags that fill most YouTube descriptions.
  const withoutLinks = text.replace(/https?:\/\/\S+/g, "").replace(/#\w+/g, "").replace(/\s+/g, " ").trim();
  return cleanText(withoutLinks, maxLength);
}
