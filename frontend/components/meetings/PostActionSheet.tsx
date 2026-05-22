"use client";

import { CalendarCheck, Edit3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface PostActionSheetProps {
  open: boolean;
  meetingId: string;
  onClose: () => void;
}

export function PostActionSheet({
  open,
  meetingId,
  onClose,
}: PostActionSheetProps) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="닫기"
        className="fixed inset-0 z-30 bg-black/40"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md rounded-t-2xl bg-white p-4 pb-8">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" />
        <h2 className="mb-4 text-lg font-bold text-gray-900">모임 글쓰기</h2>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push(`/meetings/${meetingId}/posts/new`);
            }}
            className="flex w-full items-center gap-3 rounded-xl bg-blue-50 p-4 text-left"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Edit3 size={20} className="text-blue-500" aria-hidden />
            </span>
            <span className="flex-1 font-medium text-gray-900">
              게시판에 글쓰기
            </span>
            <span className="text-gray-400" aria-hidden>
              ›
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push(`/meetings/${meetingId}/events/new`);
            }}
            className="flex w-full items-center gap-3 rounded-xl bg-purple-50 p-4 text-left"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <CalendarCheck size={20} className="text-purple-500" aria-hidden />
            </span>
            <span className="flex-1 font-medium text-gray-900">일정 만들기</span>
            <span className="text-gray-400" aria-hidden>
              ›
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
