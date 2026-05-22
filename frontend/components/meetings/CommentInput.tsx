"use client";

import { AtSign, Image as ImageIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { usePersona } from "@/context/PersonaContext";
import {
  applyMentionToText,
  detectMention,
  filterMentionsInContent,
  type MentionSelection,
} from "@/lib/mention-detect";

import { MentionPicker } from "./MentionPicker";

interface CommentInputProps {
  onSubmit: (payload: {
    content: string;
    mention_place_ids: string[];
    mention_user_ids: string[];
  }) => Promise<void>;
  disabled?: boolean;
  neighborhood?: string;
  meetingId?: string;
}

type PlaceMention = { place_id: string; name: string };
type UserMention = { user_id: string; name: string };

export function CommentInput({
  onSubmit,
  disabled,
  neighborhood,
  meetingId,
}: CommentInputProps) {
  const { persona } = usePersona();
  const inputRef = useRef<HTMLInputElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [pickerBottomOffset, setPickerBottomOffset] = useState(0);
  const [text, setText] = useState("");
  const [placeMentions, setPlaceMentions] = useState<PlaceMention[]>([]);
  const [userMentions, setUserMentions] = useState<UserMention[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionAnchor, setMentionAnchor] = useState<number | null>(null);
  const [mentionQueryLen, setMentionQueryLen] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const syncMentionState = useCallback((value: string, cursor: number) => {
    const detected = detectMention(value, cursor);
    if (detected) {
      setMentionQuery(detected.query);
      setMentionAnchor(detected.anchorIndex);
      setMentionQueryLen(detected.query.length);
    } else {
      setMentionQuery(null);
      setMentionAnchor(null);
      setMentionQueryLen(0);
    }
  }, []);

  const closeMentionPicker = useCallback(() => {
    setMentionQuery(null);
    setMentionAnchor(null);
    setMentionQueryLen(0);
  }, []);

  const handleSelectMention = useCallback(
    (item: MentionSelection) => {
      if (mentionAnchor === null) return;
      const next = applyMentionToText(
        text,
        mentionAnchor,
        mentionQueryLen,
        item.name,
      );
      setText(next);
      if (item.type === "place") {
        setPlaceMentions((prev) => {
          if (prev.some((m) => m.place_id === item.id)) return prev;
          return [...prev, { place_id: item.id, name: item.name }];
        });
      } else {
        setUserMentions((prev) => {
          if (prev.some((m) => m.user_id === item.id)) return prev;
          return [...prev, { user_id: item.id, name: item.name }];
        });
      }
      setMentionQuery(null);
      setMentionAnchor(null);
      setMentionQueryLen(0);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        const display = `@${item.name}`;
        const pos = mentionAnchor + display.length;
        inputRef.current?.setSelectionRange(pos, pos);
      });
    },
    [mentionAnchor, mentionQueryLen, text],
  );

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting || disabled) return;
    setSubmitting(true);
    try {
      const mention_place_ids = filterMentionsInContent(
        placeMentions,
        trimmed,
        (m) => `@${m.name}`,
      ).map((m) => m.place_id);
      const mention_user_ids = filterMentionsInContent(
        userMentions,
        trimmed,
        (m) => `@${m.name}`,
      ).map((m) => m.user_id);
      await onSubmit({ content: trimmed, mention_place_ids, mention_user_ids });
      setText("");
      setPlaceMentions([]);
      setUserMentions([]);
      setMentionQuery(null);
      setMentionAnchor(null);
    } finally {
      setSubmitting(false);
    }
  };

  const pickerQuery = mentionAnchor !== null ? (mentionQuery ?? "") : null;

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const update = () => setPickerBottomOffset(el.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <>
      <div
        ref={barRef}
        className="border-t border-seed-gray-200 bg-seed-gray-00 px-3 py-2"
      >
        <div className="flex items-center gap-2">
        <button
          type="button"
          className="shrink-0 text-gray-400"
          aria-label="사진"
          onClick={(e) => {
            e.stopPropagation();
            alert("준비 중");
          }}
        >
          <ImageIcon size={22} />
        </button>
        <button
          type="button"
          className="shrink-0 text-gray-400"
          aria-label="멘션"
          onClick={(e) => {
            e.stopPropagation();
            const cursor = text.length;
            const next = `${text}@`;
            setText(next);
            syncMentionState(next, cursor + 1);
            inputRef.current?.focus();
          }}
        >
          <AtSign size={22} />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={text}
          disabled={disabled || submitting}
          placeholder="댓글을 입력해주세요."
          className="min-w-0 flex-1 rounded-full bg-gray-100 px-4 py-2.5 text-sm text-gray-900 outline-none focus:bg-gray-50"
          onChange={(e) => {
            setText(e.target.value);
            syncMentionState(
              e.target.value,
              e.target.selectionStart ?? e.target.value.length,
            );
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && mentionQuery === null) {
              e.preventDefault();
              void handleSubmit();
            }
          }}
        />
        <button
          type="button"
          disabled={!text.trim() || submitting || disabled}
          onClick={(e) => {
            e.stopPropagation();
            void handleSubmit();
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white disabled:bg-gray-disabled disabled:text-white disabled:cursor-not-allowed disabled:opacity-100"
          aria-label="전송"
        >
          {persona.name.charAt(0)}
        </button>
        </div>
      </div>

      <MentionPicker
        query={pickerQuery}
        onSelect={handleSelectMention}
        onClose={closeMentionPicker}
        neighborhood={neighborhood}
        meetingId={meetingId}
        excludeCloseRef={barRef}
        bottomOffset={pickerBottomOffset}
      />
    </>
  );
}
