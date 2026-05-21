"use client";

import { MapPin, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { RatingModal } from "@/components/meetings/RatingModal";
import {
  getMeetingDetail,
  getMeetingEvents,
  getMeetingPlaceHistory,
} from "@/lib/api";
import { formatMeetingSchedule } from "@/lib/format-meeting-datetime";
import { resolveApiMeetingId } from "@/lib/resolve-meeting-id";
import {
  DEFAULT_MEETING_THUMBNAIL,
} from "@/lib/types/meeting-list";
import type {
  MeetingDetailApi,
  MeetingDetailTab,
  MeetingEventSummaryApi,
  PlaceHistoryItemApi,
} from "@/lib/types/meeting-detail";

import { MeetingEventCard } from "./MeetingEventCard";

const TABS: { id: MeetingDetailTab; label: string }[] = [
  { id: "schedule", label: "일정" },
  { id: "places", label: "장소 이력" },
];

interface MeetingDetailScreenProps {
  routeMeetingId: string;
}

export function MeetingDetailScreen({ routeMeetingId }: MeetingDetailScreenProps) {
  const router = useRouter();
  const apiMeetingId = resolveApiMeetingId(routeMeetingId);

  const [tab, setTab] = useState<MeetingDetailTab>("schedule");
  const [detail, setDetail] = useState<MeetingDetailApi | null>(null);
  const [events, setEvents] = useState<MeetingEventSummaryApi[]>([]);
  const [placeHistory, setPlaceHistory] = useState<PlaceHistoryItemApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingEvent, setRatingEvent] = useState<MeetingEventSummaryApi | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [detailData, eventsData, historyData] = await Promise.all([
        getMeetingDetail(apiMeetingId),
        getMeetingEvents(apiMeetingId),
        getMeetingPlaceHistory(apiMeetingId),
      ]);
      setDetail(detailData);
      setEvents(eventsData.items);
      setPlaceHistory(historyData.items);
    } catch {
      alert("모임 정보를 불러오지 못했어요");
    } finally {
      setLoading(false);
    }
  }, [apiMeetingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const now = Date.now();
  const { upcoming, past } = useMemo(() => {
    const up: MeetingEventSummaryApi[] = [];
    const pa: MeetingEventSummaryApi[] = [];
    for (const ev of events) {
      const isFuture =
        ev.status === "scheduled" && new Date(ev.scheduled_at).getTime() >= now;
      if (isFuture) {
        up.push(ev);
      } else {
        pa.push(ev);
      }
    }
    up.sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
    );
    pa.sort(
      (a, b) =>
        new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime(),
    );
    return { upcoming: up, past: pa };
  }, [events, now]);

  if (loading) {
    return (
      <p className="px-4 py-24 text-center text-sm text-gray-500">
        불러오는 중...
      </p>
    );
  }

  if (!detail) {
    return (
      <p className="px-4 py-24 text-center text-sm text-gray-400">
        모임을 표시할 수 없어요
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-24">
      <ScreenHeader
        variant="back"
        title={detail.name}
        onAction={() => router.back()}
      />

      <section className="border-b border-gray-100 px-4 py-4">
        <div className="flex gap-3.5">
          <Image
            src={DEFAULT_MEETING_THUMBNAIL}
            alt=""
            width={60}
            height={60}
            className="h-[60px] w-[60px] shrink-0 rounded-2xl bg-gray-100 object-cover"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-gray-900">{detail.name}</h1>
            <p className="mt-1 text-sm text-gray-600">{detail.category}</p>
            <p className="mt-1.5 flex flex-wrap items-center gap-1 text-sm text-gray-600">
              <span className="inline-flex items-center gap-0.5">
                <MapPin size={14} className="text-gray-400" aria-hidden />
                {detail.neighborhood}
              </span>
              <span className="text-gray-400" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-0.5">
                <Users size={14} className="text-gray-400" aria-hidden />
                멤버 {detail.member_count}명
              </span>
            </p>
          </div>
        </div>
        {detail.description ? (
          <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600">
            {detail.description}
          </p>
        ) : null}
      </section>

      <div className="shrink-0 border-b border-gray-100">
        <div className="flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {tab === "schedule" ? (
          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-sm font-bold text-gray-900">
                다가올 일정
              </h2>
              {upcoming.length > 0 ? (
                <ul className="space-y-3">
                  {upcoming.map((ev) => (
                    <li key={ev.event_id}>
                      <MeetingEventCard event={ev} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl bg-gray-50 py-8 text-center text-sm text-gray-400">
                  예정된 일정이 없어요
                </p>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-sm font-bold text-gray-900">
                지난 일정
              </h2>
              {past.length > 0 ? (
                <ul className="space-y-3">
                  {past.map((ev) => (
                    <li key={ev.event_id}>
                      <MeetingEventCard
                        event={ev}
                        onRate={
                          ev.status === "ended"
                            ? () => setRatingEvent(ev)
                            : undefined
                        }
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl bg-gray-50 py-8 text-center text-sm text-gray-400">
                  지난 일정이 없어요
                </p>
              )}
            </section>
          </div>
        ) : (
          <section>
            {placeHistory.length > 0 ? (
              <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
                {placeHistory.map((item) => (
                  <li key={item.place.place_id} className="p-4">
                    <Link
                      href={`/places/${item.place.place_id}`}
                      className="font-bold text-gray-900 hover:text-orange-600"
                    >
                      {item.place.name}
                    </Link>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.visit_count}회 방문 · 마지막{" "}
                      {formatMeetingSchedule(item.last_visited_at).slice(0, 11)}
                      {item.avg_rating_from_us != null
                        ? ` · 평균 ${item.avg_rating_from_us.toFixed(1)}`
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl bg-gray-50 py-8 text-center text-sm text-gray-400">
                아직 다녀간 장소가 없어요
              </p>
            )}
          </section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-gray-100 bg-white p-4">
        <Link
          href={`/meetings/${routeMeetingId}/events/new`}
          className="flex w-full items-center justify-center rounded-full bg-orange-500 py-3 text-sm font-medium text-white"
        >
          새 일정 등록
        </Link>
      </div>

      {ratingEvent ? (
        <RatingModal
          open={Boolean(ratingEvent)}
          onClose={() => setRatingEvent(null)}
          eventId={ratingEvent.event_id}
          placeName={ratingEvent.place.name}
          meetingLabel={`${ratingEvent.title} · ${formatMeetingSchedule(ratingEvent.scheduled_at).slice(0, 11)}`}
          onSuccess={() => {
            setRatingEvent(null);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
