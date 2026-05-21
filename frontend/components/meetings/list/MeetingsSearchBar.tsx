"use client";

import { Search } from "lucide-react";

interface MeetingsSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function MeetingsSearchBar({ value, onChange }: MeetingsSearchBarProps) {
  return (
    <div className="shrink-0 border-b border-gray-100 px-4 py-2">
      <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2.5">
        <Search size={18} className="shrink-0 text-gray-400" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="모임 이름이나 동네로 검색"
          className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-500"
          aria-label="모임 검색"
        />
      </div>
    </div>
  );
}
