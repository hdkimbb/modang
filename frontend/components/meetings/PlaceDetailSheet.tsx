"use client";

import { ChevronRight, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { PlaceMiniMap } from "@/components/maps/PlaceMiniMap";
import type { Place } from "@/lib/types/place";

interface PlaceDetailSheetProps {
  place: Place;
  open: boolean;
  onClose: () => void;
  onSelect: () => void;
  meetingId?: string | null;
}

export function PlaceDetailSheet({
  place,
  open,
  onClose,
  onSelect,
  meetingId,
}: PlaceDetailSheetProps) {
  const router = useRouter();
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const detailPlaceId = place.placeId ?? (/^plc_/.test(place.id) ? place.id : null);
  const hasCoords = Number.isFinite(place.lat) && Number.isFinite(place.lng);

  const handleViewDetail = () => {
    if (!detailPlaceId) return;
    const qs = meetingId ? `?meeting_id=${encodeURIComponent(meetingId)}` : "";
    router.push(`/places/${detailPlaceId}${qs}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="닫기"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-detail-title"
        className="relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl"
      >
        <div className="flex justify-center pt-3 pb-2">
          <button
            type="button"
            onClick={onClose}
            className="h-1 w-10 rounded-full bg-gray-300"
            aria-label="시트 닫기"
          />
        </div>

        <div className="px-4 pb-3">
          <h2 id="place-detail-title" className="text-lg font-bold text-gray-900">
            {place.name}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{place.address}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-700">
            {place.avgRating != null ? (
              <span className="inline-flex items-center gap-1 font-medium">
                <Star
                  className="h-4 w-4 fill-orange-400 text-orange-400"
                  strokeWidth={1.5}
                  aria-hidden
                />
                {place.avgRating.toFixed(1)}
              </span>
            ) : null}
            {place.meetingCount > 0 ? (
              <span className="text-gray-600">모임 {place.meetingCount}건</span>
            ) : null}
          </div>
        </div>

        {hasCoords ? (
          <PlaceMiniMap place={place} active={open} />
        ) : (
          <div className="mx-4 flex h-48 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500">
            지도를 표시할 수 없어요
          </div>
        )}

        {place.ownerMessage ? (
          <p className="mx-4 mt-4 whitespace-pre-line rounded-xl bg-amber-50 p-4 text-sm text-gray-800">
            {place.ownerMessage}
          </p>
        ) : null}

        {detailPlaceId ? (
          <div className="px-4 pt-2">
            <button
              type="button"
              onClick={handleViewDetail}
              className="flex w-full items-center justify-center gap-1 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              자세히 보기
              <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        ) : null}

        <div className="sticky bottom-0 mt-4 bg-white px-4 pb-4 pt-2">
          <button
            type="button"
            onClick={onSelect}
            className="w-full rounded-xl bg-orange-500 py-4 text-base font-bold text-white"
          >
            이 장소 선택
          </button>
        </div>
      </div>
    </div>
  );
}
