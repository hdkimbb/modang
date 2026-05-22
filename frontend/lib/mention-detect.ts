export type MentionSelection =
  | { type: "place"; id: string; name: string }
  | { type: "user"; id: string; name: string };

export function detectMention(
  text: string,
  cursor: number,
): { query: string; anchorIndex: number } | null {
  const before = text.slice(0, cursor);
  const atIndex = before.lastIndexOf("@");
  if (atIndex === -1) return null;
  const fragment = before.slice(atIndex + 1);
  if (/[\s\n]/.test(fragment)) return null;
  return { query: fragment, anchorIndex: atIndex };
}

export function applyMentionToText(
  text: string,
  anchorIndex: number,
  queryLength: number,
  displayName: string,
): string {
  const queryEnd = anchorIndex + 1 + queryLength;
  const display = `@${displayName}`;
  return text.slice(0, anchorIndex) + display + text.slice(queryEnd);
}

export function filterMentionsInContent<T extends { name: string }>(
  mentions: T[],
  content: string,
  getToken: (item: T) => string,
): T[] {
  return mentions.filter((m) => content.includes(getToken(m)));
}
