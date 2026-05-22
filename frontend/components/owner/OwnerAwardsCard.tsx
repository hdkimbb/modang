"use client";

import { Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getPlaceAwards, getSeasons } from "@/lib/api";
import {
  awardRankTitle,
  type PlaceAwardItemApi,
  type SeasonSummaryApi,
} from "@/lib/types/award";

type OwnerAwardsCardProps = {
  placeId: string;
};

export function OwnerAwardsCard({ placeId }: OwnerAwardsCardProps) {
  const [items, setItems] = useState<PlaceAwardItemApi[]>([]);
  const [activeSeason, setActiveSeason] = useState<SeasonSummaryApi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [awardsRes, seasons] = await Promise.all([
          getPlaceAwards(placeId),
          getSeasons(),
        ]);
        setItems(awardsRes.items);
        setActiveSeason(seasons.find((s) => s.status === "active") ?? null);
      } catch {
        setItems([]);
        setActiveSeason(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [placeId]);

  const primary = items[0];

  if (loading) {
    return (
      <div className="flex h-full flex-col rounded-2xl border-[0.5px] border-seed-gray-300 bg-white p-4">
        <p className="text-xs text-seed-gray-600">우리 가게 어워드</p>
        <p className="mt-2 text-xs text-seed-gray-400">불러오는 중...</p>
      </div>
    );
  }

  return (
    <Link
      href="/awards"
      className="flex h-full flex-col rounded-2xl border-[0.5px] border-seed-gray-300 bg-white p-4 transition hover:bg-seed-gray-100"
    >
      <p className="text-xs text-seed-gray-600">우리 가게 어워드</p>
      {primary ? (
        <>
          <div className="mt-2 flex min-w-0 items-center gap-1.5">
            <Trophy
              className="h-[18px] w-[18px] shrink-0 text-amber-500"
              aria-hidden
            />
            <p className="truncate text-sm font-bold text-seed-gray-900">
              {awardRankTitle(
                primary.district,
                primary.category,
                primary.rank,
              )}
            </p>
          </div>
          <p className="mt-1 text-xs text-seed-gray-500">{primary.season.name}</p>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-seed-gray-600">아직 수상 없음</p>
          {activeSeason ? (
            <p className="mt-1 text-xs text-seed-gray-500">
              {activeSeason.name} 시즌 진행 중
            </p>
          ) : null}
        </>
      )}
    </Link>
  );
}
