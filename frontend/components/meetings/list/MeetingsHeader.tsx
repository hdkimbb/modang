"use client";

import { Bell, ChevronDown, Search, User } from "lucide-react";

interface MeetingsHeaderProps {
  district?: string;
  onSearchClick?: () => void;
}

export function MeetingsHeader({
  district = "강남",
  onSearchClick,
}: MeetingsHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
      <button
        type="button"
        className="flex items-center gap-0.5 text-lg font-bold text-gray-900"
        aria-label="동네 선택"
      >
        {district}
        <ChevronDown size={18} className="text-gray-600" strokeWidth={2.5} />
      </button>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="text-gray-700"
          aria-label="내 프로필"
        >
          <User size={22} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="text-gray-700"
          aria-label="검색"
          onClick={onSearchClick}
        >
          <Search size={22} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="text-gray-700"
          aria-label="알림"
        >
          <Bell size={22} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
