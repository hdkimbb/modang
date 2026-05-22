"use client";

import { BTN_TEXT_DISABLED } from "@/lib/button-styles";

import {
  AtSign,
  Image as ImageIcon,
  MapPin,
  Plus,
  Settings,
  Type,
  Video,
  Vote,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { AttachmentSheet } from "@/components/meetings/AttachmentSheet";
import { MentionPicker } from "@/components/meetings/MentionPicker";
import { usePersona } from "@/context/PersonaContext";
import {
  applyMentionToText,
  detectMention,
  filterMentionsInContent,
  type MentionSelection,
} from "@/lib/mention-detect";
import {
  createMeetingPost,
  getMeetingDetail,
  uploadImage,
} from "@/lib/api";
import { resolveApiMeetingId } from "@/lib/resolve-meeting-id";

interface CreatePostScreenProps {
  routeMeetingId: string;
}

type PreviewItem = { id: string; url: string; uploading?: boolean };

export function CreatePostScreen({ routeMeetingId }: CreatePostScreenProps) {
  const router = useRouter();
  const apiMeetingId = resolveApiMeetingId(routeMeetingId);
  const { userId } = usePersona();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [meetingName, setMeetingName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [content, setContent] = useState("");
  const [placeMentions, setPlaceMentions] = useState<
    { place_id: string; name: string }[]
  >([]);
  const [userMentions, setUserMentions] = useState<
    { user_id: string; name: string }[]
  >([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionAnchor, setMentionAnchor] = useState<number | null>(null);
  const [mentionQueryLen, setMentionQueryLen] = useState(0);
  const [images, setImages] = useState<PreviewItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

  useEffect(() => {
    getMeetingDetail(apiMeetingId)
      .then((d) => {
        setMeetingName(d.name);
        setNeighborhood(d.neighborhood);
      })
      .catch(() => {});
  }, [apiMeetingId]);

  const canSubmit = content.trim().length > 0 && !submitting;

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
        content,
        mentionAnchor,
        mentionQueryLen,
        item.name,
      );
      setContent(next);
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
        textareaRef.current?.focus();
        const display = `@${item.name}`;
        const pos = mentionAnchor + display.length;
        textareaRef.current?.setSelectionRange(pos, pos);
      });
    },
    [content, mentionAnchor, mentionQueryLen],
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, 10 - images.length);
    for (const file of list) {
      const id = `${Date.now()}-${file.name}`;
      setImages((prev) => [...prev, { id, url: "", uploading: true }]);
      try {
        const url = await uploadImage(file);
        setImages((prev) =>
          prev.map((item) =>
            item.id === id ? { id, url, uploading: false } : item,
          ),
        );
      } catch (e) {
        setImages((prev) => prev.filter((item) => item.id !== id));
        alert(e instanceof Error ? e.message : "업로드 실패");
      }
    }
  }, [images.length]);

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    console.log("[Submit]", {
      apiMeetingId,
      routeMeetingId,
      userId,
      content: content.trim(),
    });
    try {
      const urls = images
        .filter((i) => i.url && !i.uploading)
        .map((i) => i.url);
      const trimmed = content.trim();
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

      await createMeetingPost(apiMeetingId, {
        author_user_id: userId,
        board_type: "free",
        content: trimmed,
        image_urls: urls,
        mention_place_ids,
        mention_user_ids,
      });
      router.replace(`/meetings/${routeMeetingId}`);
    } catch (e) {
      console.error("[Submit Error]", e);
      alert(e instanceof Error ? e.message : "게시글 등록에 실패했어요");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-white">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
        <button
          type="button"
          aria-label="닫기"
          onClick={() => router.back()}
          className="p-1"
        >
          <X size={24} />
        </button>
        <div className="text-center">
          <p className="font-bold text-gray-900">글쓰기</p>
          <p className="text-xs text-gray-500">{meetingName}</p>
        </div>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => void handleSubmit()}
          className={`text-sm font-bold ${
            canSubmit ? "text-gray-900" : BTN_TEXT_DISABLED
          }`}
        >
          완료
        </button>
      </header>

      <button
        type="button"
        className="flex items-center justify-between border-b border-gray-100 px-4 py-3 text-left text-sm text-gray-900"
        onClick={() => alert("준비 중")}
      >
        자유 게시판
        <span className="text-gray-400">›</span>
      </button>

      <div className="flex-1">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            syncMentionState(
              e.target.value,
              e.target.selectionStart ?? e.target.value.length,
            );
          }}
          onClick={(e) => {
            const target = e.target as HTMLTextAreaElement;
            syncMentionState(target.value, target.selectionStart ?? 0);
          }}
          onKeyUp={(e) => {
            const target = e.currentTarget;
            syncMentionState(target.value, target.selectionStart ?? 0);
          }}
          placeholder="질문이나 이야기를 남겨보세요."
          className="min-h-[300px] w-full flex-1 resize-none p-4 text-base text-gray-900 outline-none"
        />
      </div>

      {images.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3">
          {images.map((item) => (
            <div key={item.id} className="relative h-20 w-20 shrink-0">
              {item.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt=""
                  className={`h-20 w-20 rounded-lg object-cover ${
                    item.uploading ? "opacity-50" : ""
                  }`}
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                  …
                </div>
              )}
              <button
                type="button"
                aria-label="삭제"
                onClick={() => removeImage(item.id)}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <p className="px-4 py-3 text-xs text-gray-500">
        🌐 {neighborhood || "동네"} 근처 이웃들이 볼 수 있어요
      </p>

      <footer className="sticky bottom-0 mt-auto flex items-center gap-4 border-t border-gray-100 bg-white px-4 py-3">
        <button type="button" onClick={() => setAttachOpen(true)} aria-label="첨부">
          <Plus size={24} className="text-gray-700" />
        </button>
        <button
          type="button"
          aria-label="멘션"
          onClick={() => {
            const next = `${content}@`;
            setContent(next);
            syncMentionState(next, next.length);
            textareaRef.current?.focus();
          }}
        >
          <AtSign size={22} className="text-gray-700" />
        </button>
        <button type="button" aria-label="텍스트 스타일" onClick={() => {}}>
          <Type size={22} className="text-gray-700" />
        </button>
        <button type="button" aria-label="사진" onClick={openFilePicker}>
          <ImageIcon size={22} className="text-gray-700" />
        </button>
        <button type="button" onClick={() => alert("준비 중")}>
          <Video size={22} className="text-gray-700" />
        </button>
        <button type="button" onClick={() => alert("준비 중")}>
          <Vote size={22} className="text-gray-700" />
        </button>
        <button type="button" onClick={() => alert("준비 중")}>
          <MapPin size={22} className="text-gray-700" />
        </button>
        <button
          type="button"
          className="ml-auto"
          onClick={() => alert("준비 중")}
          aria-label="설정"
        >
          <Settings size={22} className="text-gray-400" />
        </button>
      </footer>

      <AttachmentSheet
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        onPhoto={openFilePicker}
      />

      <MentionPicker
        query={mentionAnchor !== null ? (mentionQuery ?? "") : null}
        onSelect={handleSelectMention}
        onClose={closeMentionPicker}
        neighborhood={neighborhood || undefined}
        meetingId={apiMeetingId}
        excludeCloseRef={textareaRef}
      />
    </div>
  );
}
