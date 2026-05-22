"use client";

import { OwnerAwardsCard } from "@/components/owner/OwnerAwardsCard";
import { OwnerRankingCard } from "@/components/owner/OwnerRankingCard";
import {
  OWNER_FILTER_EMPTY_MESSAGE,
  type OwnerMeetingFilter,
} from "@/lib/owner-meeting-filter";
import type { OwnerDashboard, OwnerMeetingVisit } from "@/lib/types/owner";

const LIST_TITLE: Record<OwnerMeetingFilter, string> = {
  all: "다녀간 모임",
  this_month: "이번 달 모임",
  upcoming: "예정된 모임",
};

function formatVisitDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${day} ${h}:${min}`;
}

type HomeTabProps = {
  data: OwnerDashboard;
  meetingFilter: OwnerMeetingFilter;
  onMeetingFilterChange: (filter: OwnerMeetingFilter) => void;
  filteredMeetings: OwnerMeetingVisit[];
};

export function HomeTab({
  data,
  meetingFilter,
  onMeetingFilterChange,
  filteredMeetings,
}: HomeTabProps) {
  const filterChips: { id: OwnerMeetingFilter; label: string; count: number }[] =
    [
      { id: "all", label: "전체", count: data.stats.total_visits },
      { id: "this_month", label: "이번 달", count: data.stats.this_month_visits },
      { id: "upcoming", label: "예정", count: data.stats.upcoming_count },
    ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <section className="grid grid-cols-2 gap-3 px-4 pt-3">
        <OwnerAwardsCard placeId={data.place.id} />
        <OwnerRankingCard ranking={data.ranking} />
      </section>

      <section className="grid grid-cols-3 gap-3 px-4 pb-2 pt-3">
        {filterChips.map((chip) => {
          const active = meetingFilter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              aria-pressed={active}
              onClick={() => onMeetingFilterChange(chip.id)}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                active
                  ? "border-orange-400 bg-orange-100 ring-2 ring-orange-300"
                  : "border-orange-100 bg-orange-50 hover:border-orange-200"
              }`}
            >
              <p className="text-xs text-gray-600">{chip.label}</p>
              <p className="mt-1 text-3xl font-bold">{chip.count}</p>
              <p className="text-xs text-gray-500">모임</p>
            </button>
          );
        })}
      </section>

      <section className="pb-6">
        <h2 className="px-4 text-lg font-bold">{LIST_TITLE[meetingFilter]}</h2>
        {data.meetings.length === 0 ? (
          <p className="py-12 text-center text-gray-400">
            아직 다녀간 모임이 없어요
          </p>
        ) : filteredMeetings.length === 0 ? (
          <p className="py-12 text-center text-gray-400">
            {meetingFilter === "all"
              ? "표시할 모임이 없어요"
              : OWNER_FILTER_EMPTY_MESSAGE[meetingFilter]}
          </p>
        ) : (
          <ul>
            {filteredMeetings.map((m) => (
              <li
                key={`${m.meeting_id}-${m.scheduled_at}`}
                className="flex items-center justify-between border-b border-gray-100 p-4"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <p className="text-base font-bold">{m.name}</p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {m.category} · {m.member_count}명
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatVisitDate(m.scheduled_at)}
                  </p>
                </div>
                <span
                  className={
                    m.is_upcoming
                      ? "shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600"
                      : "shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                  }
                >
                  {m.is_upcoming ? "예정" : "다녀감"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
