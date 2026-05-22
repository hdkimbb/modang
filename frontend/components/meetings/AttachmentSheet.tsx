"use client";

import {
  Calendar,
  Flame,
  Image as ImageIcon,
  MapPin,
  Video,
  Vote,
} from "lucide-react";
import { useEffect } from "react";

interface AttachmentSheetProps {
  open: boolean;
  onClose: () => void;
  onPhoto: () => void;
}

const OPTIONS = [
  { id: "photo", label: "사진", icon: ImageIcon, action: "photo" as const },
  { id: "video", label: "동영상", icon: Video, action: "alert" as const },
  { id: "schedule", label: "일정", icon: Calendar, action: "alert" as const },
  { id: "challenge", label: "챌린지", icon: Flame, action: "alert" as const, badge: true },
  { id: "vote", label: "투표", icon: Vote, action: "alert" as const },
  { id: "place", label: "장소", icon: MapPin, action: "alert" as const },
];

export function AttachmentSheet({
  open,
  onClose,
  onPhoto,
}: AttachmentSheetProps) {
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
      <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md rounded-t-2xl bg-white px-4 pb-8 pt-3">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" />
        <ul>
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-4 border-b border-gray-100 py-4 text-left last:border-0"
                  onClick={() => {
                    if (opt.action === "photo") {
                      onClose();
                      onPhoto();
                    } else {
                      alert("준비 중");
                    }
                  }}
                >
                  <Icon size={24} className="text-gray-700" aria-hidden />
                  <span className="flex-1 text-base text-gray-900">
                    {opt.label}
                  </span>
                  {opt.badge ? (
                    <span className="rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      N
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
