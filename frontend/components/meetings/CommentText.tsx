"use client";

import type { CommentMentionPlaceApi } from "@/lib/types/meeting-comment";
import type { CommentMentionUserApi } from "@/lib/types/meeting-comment";

import { MentionText } from "./MentionText";

interface CommentTextProps {
  content: string;
  mentions: CommentMentionPlaceApi[];
  mentionUsers?: CommentMentionUserApi[];
  className?: string;
}

export function CommentText({
  content,
  mentions,
  mentionUsers = [],
  className,
}: CommentTextProps) {
  return (
    <MentionText
      content={content}
      mentionPlaces={mentions}
      mentionUsers={mentionUsers}
      className={className}
    />
  );
}
