"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export interface MentionPlaceToken {
  place_id: string;
  name: string;
}

export interface MentionUserToken {
  user_id: string;
  name: string;
}

interface MentionTextProps {
  content: string;
  mentionPlaces?: MentionPlaceToken[];
  mentionUsers?: MentionUserToken[];
  className?: string;
}

function isMentionBoundary(content: string, index: number): boolean {
  if (index >= content.length) return true;
  return /[\s\n,.!?]/.test(content[index]);
}

type MentionToken =
  | { kind: "place"; id: string; name: string }
  | { kind: "user"; id: string; name: string };

export function parseMentionContent(
  content: string,
  mentionPlaces: MentionPlaceToken[],
  mentionUsers: MentionUserToken[],
): ReactNode[] {
  if (!content) return [];

  const tokens: MentionToken[] = [
    ...mentionPlaces.map((p) => ({
      kind: "place" as const,
      id: p.place_id,
      name: p.name,
    })),
    ...mentionUsers.map((u) => ({
      kind: "user" as const,
      id: u.user_id,
      name: u.name,
    })),
  ].sort((a, b) => b.name.length - a.name.length);

  const parts: ReactNode[] = [];
  let i = 0;

  while (i < content.length) {
    const atIdx = content.indexOf("@", i);
    if (atIdx === -1) {
      parts.push(content.slice(i));
      break;
    }

    if (atIdx > i) {
      parts.push(content.slice(i, atIdx));
    }

    let matched = false;
    for (const token of tokens) {
      const label = `@${token.name}`;
      if (
        content.slice(atIdx, atIdx + label.length) === label &&
        isMentionBoundary(content, atIdx + label.length)
      ) {
        if (token.kind === "place") {
          parts.push(
            <Link
              key={`place-${token.id}-${atIdx}`}
              href={`/places/${token.id}`}
              className="inline-block rounded bg-orange-50 px-1.5 py-0.5 text-sm text-orange-600 hover:bg-orange-100"
              onClick={(e) => e.stopPropagation()}
            >
              {label}
            </Link>,
          );
        } else {
          parts.push(
            <button
              key={`user-${token.id}-${atIdx}`}
              type="button"
              className="inline-block rounded bg-blue-50 px-1.5 py-0.5 text-sm text-blue-600 hover:bg-blue-100"
              onClick={(e) => {
                e.stopPropagation();
                console.log("user mention", token.id, token.name);
              }}
            >
              {label}
            </button>,
          );
        }
        i = atIdx + label.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      parts.push(content[atIdx]);
      i = atIdx + 1;
    }
  }

  return parts;
}

export function MentionText({
  content,
  mentionPlaces = [],
  mentionUsers = [],
  className,
}: MentionTextProps) {
  const parts = parseMentionContent(content, mentionPlaces, mentionUsers);

  return (
    <p className={`whitespace-pre-wrap ${className ?? "text-sm text-gray-900"}`}>
      {parts.length > 0 ? parts : content}
    </p>
  );
}
