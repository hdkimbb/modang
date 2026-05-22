"use client";

import Link from "next/link";

import { formatMeetingSchedule } from "@/lib/format-meeting-datetime";
import type { PlaceHistoryItemApi } from "@/lib/types/meeting-detail";

interface MeetingPlaceHistoryCardProps {
  item: PlaceHistoryItemApi;
  meetingName: string;
}

export function MeetingPlaceHistoryCard({
  item,
  meetingName,
}: MeetingPlaceHistoryCardProps) {
  return (
    <Link
      href={`/places/${item.place.place_id}`}
      className="block rounded-xl border border-seed-gray-200 bg-white p-4 transition-colors hover:border-seed-gray-300"
    >
      <p className="font-bold text-seed-gray-900">{item.place.name}</p>
      <p className="mt-1 text-sm text-seed-gray-600">{meetingName}</p>
      <p className="mt-2 text-sm text-seed-gray-500">
        {formatMeetingSchedule(item.last_visited_at)}
        {item.visit_count > 1 ? ` · ${item.visit_count}회 방문` : null}
      </p>
      {item.avg_rating_from_us != null ? (
        <p className="mt-1 text-xs text-seed-gray-500">
          우리 모임 평균 {item.avg_rating_from_us.toFixed(1)}점
        </p>
      ) : null}
    </Link>
  );
}
