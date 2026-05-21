"use client";

import { ChevronDown } from "lucide-react";

export function MeetingsSortBar() {
  return (
    <div className="flex shrink-0 items-center gap-2 px-4 py-3">
      <button
        type="button"
        className="flex items-center gap-1 rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-900"
        aria-label="정렬: 추천"
      >
        추천
        <ChevronDown size={14} className="text-gray-600" />
      </button>
      <button
        type="button"
        className="rounded-full px-4 py-1.5 text-sm text-gray-500"
        aria-label="정렬: 인기"
      >
        인기
      </button>
    </div>
  );
}
