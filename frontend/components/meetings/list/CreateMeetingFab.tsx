"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

export function CreateMeetingFab() {
  return (
    <Link
      href="/meetings/new"
      className="absolute bottom-6 right-4 z-20 flex items-center gap-1.5 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-orange-600"
    >
      <Plus size={20} strokeWidth={2.5} aria-hidden />
      모임 만들기
    </Link>
  );
}
