"use client";

import type { OwnerTabId } from "@/lib/types/owner";

const TABS: { id: OwnerTabId; label: string }[] = [
  { id: "home", label: "홈" },
  { id: "insights", label: "인사이트" },
  { id: "tools", label: "도구" },
];

type OwnerTabNavProps = {
  activeTab: OwnerTabId;
  onTabChange: (tab: OwnerTabId) => void;
};

export function OwnerTabNav({ activeTab, onTabChange }: OwnerTabNavProps) {
  return (
    <nav
      className="flex shrink-0 border-b border-gray-200 bg-white"
      aria-label="사장 대시보드 탭"
    >
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-3 text-center text-sm transition-colors ${
              active
                ? "border-b-2 border-orange-500 font-bold text-gray-900"
                : "font-medium text-gray-500"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
