"use client";

import { Bell, Search, User } from "lucide-react";

import { NavigationTop } from "@/components/common/NavigationTop";

interface MeetingsHeaderProps {
  district?: string;
  onSearchClick?: () => void;
}

export function MeetingsHeader({
  district = "강남",
  onSearchClick,
}: MeetingsHeaderProps) {
  return (
    <NavigationTop
      variant="main"
      title={district}
      showExpandMore
      onTitleClick={() => alert("동네 선택은 준비 중이에요")}
      divider
      rightItems={[
        <button
          key="profile"
          type="button"
          className="text-seed-gray-900"
          aria-label="내 프로필"
        >
          <User size={24} strokeWidth={2} />
        </button>,
        <button
          key="search"
          type="button"
          className="text-seed-gray-900"
          aria-label="검색"
          onClick={onSearchClick}
        >
          <Search size={24} strokeWidth={2} />
        </button>,
        <button
          key="bell"
          type="button"
          className="text-seed-gray-900"
          aria-label="알림"
        >
          <Bell size={24} strokeWidth={2} />
        </button>,
      ]}
    />
  );
}
