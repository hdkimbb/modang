"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

/** 모임 목록 — 뷰포트 하단 고정 FAB (시트 z-40 아래) */
export function CreateMeetingFab() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center"
      aria-hidden={false}
    >
      <div className="pointer-events-auto flex w-full max-w-md justify-end pr-4">
        <Link
          href="/meetings/new"
          className="flex items-center gap-1.5 rounded-full bg-seed-carrot-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-orange-600"
        >
          <Plus size={20} strokeWidth={2.5} aria-hidden />
          모임 만들기
        </Link>
      </div>
    </div>
  );
}
