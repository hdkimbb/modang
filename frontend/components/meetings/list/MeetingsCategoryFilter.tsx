"use client";

import {
  MEETING_CATEGORY_CHIPS,
  type MeetingCategoryFilter,
} from "@/lib/types/meeting-list";

interface MeetingsCategoryFilterProps {
  selected: MeetingCategoryFilter;
  onChange: (category: MeetingCategoryFilter) => void;
}

export function MeetingsCategoryFilter({
  selected,
  onChange,
}: MeetingsCategoryFilterProps) {
  return (
    <div className="shrink-0 border-b border-gray-100">
      <div className="scrollbar-hide flex gap-5 overflow-x-auto px-4">
        {MEETING_CATEGORY_CHIPS.map((chip) => {
          const isActive = selected === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onChange(chip.id)}
              className={`shrink-0 whitespace-nowrap pb-2.5 pt-3 text-sm transition-colors ${
                isActive
                  ? "border-b-2 border-black font-bold text-gray-900"
                  : "border-b-2 border-transparent font-normal text-gray-500"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
