"use client";

import { Calendar, MapPin, Star } from "lucide-react";
import Link from "next/link";

import { formatMeetingSchedule } from "@/lib/format-meeting-datetime";
import type { MeetingEventSummaryApi } from "@/lib/types/meeting-detail";

interface MeetingEventCardProps {
  event: MeetingEventSummaryApi;
  onRate?: () => void;
}

export function MeetingEventCard({ event, onRate }: MeetingEventCardProps) {
  const isEnded = event.status === "ended";

  return (
    <article className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex items-start gap-2 text-sm text-gray-700">
        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900">
            {formatMeetingSchedule(event.scheduled_at)}
            {isEnded ? (
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                종료
              </span>
            ) : null}
          </p>
          <p className="mt-1 truncate font-bold text-gray-900">{event.title}</p>
        </div>
      </div>

      <Link
        href={`/places/${event.place.place_id}`}
        className="mt-3 flex items-center gap-1.5 text-sm text-gray-600 hover:text-orange-600"
      >
        <MapPin className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.75} />
        <span className="truncate">{event.place.name}</span>
      </Link>

      <p className="mt-2 text-sm text-gray-500">
        참석 {event.attendee_count}명
      </p>

      {isEnded && event.rating_count > 0 && event.avg_rating != null ? (
        <p className="mt-2 inline-flex items-center gap-1 text-sm text-gray-700">
          <Star
            className="h-4 w-4 fill-orange-400 text-orange-400"
            strokeWidth={1.5}
            aria-hidden
          />
          {event.avg_rating.toFixed(1)} ({event.rating_count}명 평가)
        </p>
      ) : null}

      {isEnded && onRate ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onRate}
            className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700"
          >
            평가하기
          </button>
          <button
            type="button"
            onClick={() => alert("정산 기능은 준비 중이에요")}
            className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600"
          >
            정산하기
          </button>
        </div>
      ) : null}
    </article>
  );
}
