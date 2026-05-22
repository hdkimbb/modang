"use client";

import { Share2, Star } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { NavigationTop } from "@/components/common/NavigationTop";
import { RatingModal } from "@/components/meetings/RatingModal";
import {
  getPlaceDetail,
  getPlaceMeetingHistory,
  getPlaceRatings,
} from "@/lib/api";
import { formatRelativeDays } from "@/lib/format-relative";
import type { PlaceDetailApi, PlaceMeetingHistoryApi, PlaceRatingsApi } from "@/lib/types/place";

function formatVisitDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${day} ${h}:${min}`;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((v) => (
        <Star
          key={v}
          className={`h-3.5 w-3.5 ${
            v <= rating ? "fill-orange-400 text-orange-400" : "text-gray-300"
          }`}
          strokeWidth={1.5}
          aria-hidden
        />
      ))}
    </span>
  );
}

function PlaceDetailBody({
  placeId,
  meetingId,
}: {
  placeId: string;
  meetingId: string | null;
}) {
  const router = useRouter();

  const [place, setPlace] = useState<PlaceDetailApi | null>(null);
  const [ratings, setRatings] = useState<PlaceRatingsApi | null>(null);
  const [history, setHistory] = useState<PlaceMeetingHistoryApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [detail, ratingData, historyData] = await Promise.all([
        getPlaceDetail(placeId),
        getPlaceRatings(placeId),
        getPlaceMeetingHistory(placeId),
      ]);
      setPlace(detail);
      setRatings(ratingData);
      setHistory(historyData);
    } catch {
      alert("장소 정보를 불러오지 못했어요");
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const rateTargetEvent = useMemo(() => {
    if (!history?.items.length) return null;
    return (
      history.items.find((item) => item.status === "ended") ?? history.items[0]
    );
  }, [history]);

  const maxDistribution = useMemo(() => {
    if (!ratings) return 1;
    return Math.max(1, ...Object.values(ratings.distribution).map(Number));
  }, [ratings]);

  if (loading) {
    return (
      <p className="px-4 py-24 text-center text-sm text-gray-500">불러오는 중...</p>
    );
  }

  if (!place) {
    return (
      <p className="px-4 py-24 text-center text-sm text-gray-400">
        장소를 표시할 수 없어요
      </p>
    );
  }

  const revisitPct =
    place.would_revisit_rate != null
      ? Math.round(place.would_revisit_rate * 100)
      : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-28">
      <NavigationTop
        variant="sub"
        onBack={() => router.back()}
        divider
        rightItems={[
          <button
            key="share"
            type="button"
            className="text-seed-gray-900"
            aria-label="공유"
            onClick={() => alert("공유는 준비 중이에요")}
          >
            <Share2 size={24} strokeWidth={2} />
          </button>,
        ]}
      />

      <section className="px-4 py-5">
        <h1 className="text-2xl font-bold">{place.name}</h1>
        <p className="mt-1 text-sm text-gray-500">{place.address}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-700">
          {place.avg_rating != null ? (
            <span className="inline-flex items-center gap-1 text-lg font-bold text-gray-900">
              <Star className="h-5 w-5 fill-orange-400 text-orange-400" />
              {place.avg_rating.toFixed(1)}
            </span>
          ) : null}
          {place.rating_count > 0 ? (
            <span className="text-gray-500">평가 {place.rating_count}개</span>
          ) : null}
          {revisitPct != null ? (
            <span className="text-gray-500">재방문율 {revisitPct}%</span>
          ) : null}
        </div>
        {place.meeting_count > 0 ? (
          <span className="mt-3 inline-block rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
            모임 {place.meeting_count}건 다녀감
          </span>
        ) : null}
      </section>

      {place.score && place.score.total > 0 ? (
        <section className="mx-4 mb-4 rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="text-base font-bold">동네 신뢰 점수</h2>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {place.score.total.toFixed(1)}
            <span className="ml-1 text-sm font-normal text-gray-500">점</span>
          </p>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-gray-100">
            {place.score.selected_share_pct > 0 ? (
              <div
                className="bg-blue-500"
                style={{ width: `${place.score.selected_share_pct}%` }}
                title={`일정 선택 ${place.score.selected_share_pct}%`}
              />
            ) : null}
            {place.score.rated_share_pct > 0 ? (
              <div
                className="bg-orange-400"
                style={{ width: `${place.score.rated_share_pct}%` }}
                title={`별점 ${place.score.rated_share_pct}%`}
              />
            ) : null}
            {place.score.mentioned_share_pct > 0 ? (
              <div
                className="bg-emerald-500"
                style={{ width: `${place.score.mentioned_share_pct}%` }}
                title={`멘션 ${place.score.mentioned_share_pct}%`}
              />
            ) : null}
          </div>
          <ul className="mt-3 space-y-1 text-xs text-gray-600">
            <li>
              일정 선택 {place.score.selected.toFixed(1)}점 (
              {place.score.selected_share_pct}%)
            </li>
            <li>
              별점 {place.score.rated.toFixed(1)}점 ({place.score.rated_share_pct}%)
            </li>
            <li>
              멘션 {place.score.mentioned.toFixed(1)}점 (
              {place.score.mentioned_share_pct}%)
            </li>
          </ul>
        </section>
      ) : null}

      {place.owner_message ? (
        <p className="mx-4 mb-4 whitespace-pre-wrap rounded-2xl bg-amber-50 p-4 text-sm text-gray-800">
          {place.owner_message}
        </p>
      ) : null}

      <section className="mx-4 mb-4 rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="text-base font-bold">전체 평가</h2>
        {ratings && ratings.total_count > 0 ? (
          <ul className="mt-4 space-y-2">
            {(["5", "4", "3", "2", "1"] as const).map((key) => {
              const count = ratings.distribution[key] ?? 0;
              const pct = Math.round((count / maxDistribution) * 100);
              return (
                <li key={key} className="flex items-center gap-2 text-sm">
                  <span className="w-8 shrink-0 text-gray-600">{key}점</span>
                  <div className="h-2 flex-1 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-orange-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-gray-500">
                    {count}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-gray-400">아직 평가가 없어요</p>
        )}
      </section>

      {ratings && ratings.recent.length > 0 ? (
        <section className="mx-4 mb-4">
          <h2 className="mb-3 text-base font-bold">최근 평가</h2>
          <ul className="space-y-3">
            {ratings.recent.map((item, idx) => (
              <li
                key={`${item.created_at}-${idx}`}
                className="rounded-xl border border-gray-100 bg-white p-4"
              >
                <StarRow rating={item.rating} />
                {item.would_revisit ? (
                  <span className="mt-2 inline-block rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                    다시 올 거예요
                  </span>
                ) : null}
                <p className="mt-2 text-xs text-gray-400">
                  {formatRelativeDays(item.created_at)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mx-4 mb-4">
        <h2 className="mb-3 text-base font-bold">다녀간 모임</h2>
        {history && history.items.length > 0 ? (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
            {history.items.map((item) => (
              <li
                key={item.event_id}
                className="p-4"
                onClick={() => console.log("meeting", item.meeting_id)}
                onKeyDown={() => undefined}
                role="presentation"
              >
                <p className="font-bold text-gray-900">{item.meeting_name}</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {item.category} · {item.attendee_count}명
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {formatVisitDate(item.scheduled_at)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">
            아직 다녀간 모임이 없어요
          </p>
        )}
      </section>

      {rateTargetEvent ? (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => setRatingModalOpen(true)}
            className="w-full rounded-full border border-orange-200 bg-orange-50 py-3 text-sm font-medium text-orange-700"
          >
            최근 다녀온 모임 평가하기
          </button>
        </div>
      ) : null}

      {meetingId ? (
        <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-gray-100 bg-white p-4">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/meetings/${meetingId}/events/new?place_id=${encodeURIComponent(placeId)}`,
              )
            }
            className="w-full rounded-full bg-orange-500 py-3 text-sm font-medium text-white"
          >
            이 장소로 일정 등록
          </button>
        </div>
      ) : null}

      {rateTargetEvent ? (
        <RatingModal
          open={ratingModalOpen}
          onClose={() => setRatingModalOpen(false)}
          eventId={rateTargetEvent.event_id}
          placeName={place.name}
          meetingLabel={`${rateTargetEvent.meeting_name} · ${formatVisitDate(rateTargetEvent.scheduled_at).slice(0, 10)}`}
          onSuccess={() => void load()}
        />
      ) : null}
    </div>
  );
}

function PlaceDetailWithParams({ placeId }: { placeId: string }) {
  const searchParams = useSearchParams();
  const meetingId = searchParams.get("meeting_id");
  return <PlaceDetailBody placeId={placeId} meetingId={meetingId} />;
}

export default function PlaceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <Suspense
      fallback={
        <p className="px-4 py-24 text-center text-sm text-gray-500">
          불러오는 중...
        </p>
      }
    >
      <PlaceDetailWithParams placeId={params.id} />
    </Suspense>
  );
}
