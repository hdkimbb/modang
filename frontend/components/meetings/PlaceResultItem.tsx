"use client";

import { Star } from "lucide-react";

import type { Place } from "@/lib/types/place";

interface PlaceResultItemProps {
  place: Place;
  selected: boolean;
  onPress: () => void;
}

export function PlaceResultItem({ place, selected, onPress }: PlaceResultItemProps) {
  const addressLine = [place.address, place.distance].filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      onClick={onPress}
      aria-pressed={selected}
      className={`w-full rounded-2xl border bg-white p-4 text-left transition hover:border-gray-300 hover:shadow-sm ${
        selected
          ? "border-2 border-orange-500 bg-orange-50"
          : "border border-gray-200"
      }`}
    >
      <p className="text-base font-bold text-gray-900">{place.name}</p>
      {addressLine ? (
        <p className="mt-1 text-sm text-gray-500">{addressLine}</p>
      ) : null}
      {place.meetingCount > 0 ? (
        <p className="mt-2 inline-flex items-center gap-1 text-sm text-orange-600">
          이 가게에서 모임 {place.meetingCount}건 다녀감
          {place.avgRating != null ? (
            <>
              <span aria-hidden>·</span>
              <Star
                className="h-3.5 w-3.5 fill-orange-400 text-orange-400"
                strokeWidth={1.5}
                aria-hidden
              />
              {place.avgRating.toFixed(1)}
            </>
          ) : null}
        </p>
      ) : null}
    </button>
  );
}
