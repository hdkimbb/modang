"use client";

import { Star } from "lucide-react";
import Link from "next/link";

import type { RankingItemApi } from "@/lib/types/ranking";

function rankLabel(rank: number): string {
  if (rank === 1) return "1위";
  if (rank === 2) return "2위";
  if (rank === 3) return "3위";
  return `${rank}위`;
}

interface RankingListItemProps {
  item: RankingItemApi;
}

export function RankingListItem({ item }: RankingListItemProps) {
  const { place, score, stats } = item;
  const isTopThree = item.rank <= 3;

  return (
    <Link
      href={`/places/${place.place_id}`}
      className={`block rounded-2xl border bg-white p-4 transition hover:border-gray-300 ${
        isTopThree ? "border-orange-200" : "border-gray-100"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`shrink-0 text-sm font-bold ${
            isTopThree ? "text-orange-600" : "text-gray-500"
          }`}
        >
          {rankLabel(item.rank)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-gray-900">{place.name}</p>
          <p className="mt-1 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">
              {score.total.toFixed(1)}점
            </span>
            <span className="text-gray-400"> · </span>
            모임 {stats.total_meetings_30d}건
            {stats.avg_rating != null ? (
              <>
                <span className="text-gray-400"> · </span>
                <span className="inline-flex items-center gap-0.5">
                  <Star
                    className="h-3.5 w-3.5 fill-orange-400 text-orange-400"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  {stats.avg_rating.toFixed(1)}
                </span>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </Link>
  );
}
