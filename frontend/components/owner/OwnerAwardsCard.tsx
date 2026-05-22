"use client";

import { Award, Trophy } from "lucide-react";
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
        setActiveSeason(
          seasons.find((s) => s.status === "active") ?? null,
        );
      } catch {
        setItems([]);
        setActiveSeason(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [placeId]);

  if (loading) {
    return (
      <section className="px-4 pt-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-400">어워드 불러오는 중...</p>
        </div>
      </section>
    );
  }

  const seasonCount = new Set(items.map((i) => i.season.id)).size;
  const primary = items[0];
  const secondary = items.slice(1, 3);

  return (
    <section className="px-4 pt-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-medium text-gray-900">우리 가게 어워드</p>
          <p className="text-xs text-gray-500">
            {seasonCount > 0 ? `${seasonCount}개 시즌 수상` : "수상 내역 없음"}
          </p>
        </div>

        {primary ? (
          <div className="mb-2 flex gap-3 rounded-md bg-amber-50 p-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
              <Trophy className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-amber-700">
                {primary.season.name}
              </p>
              <p className="text-base font-medium text-amber-900">
                {awardRankTitle(
                  primary.district,
                  primary.category,
                  primary.rank,
                )}
              </p>
            </div>
          </div>
        ) : (
          <p className="mb-2 text-sm text-gray-600">
            이번 시즌 어워드 후보로 올라와 있어요
          </p>
        )}

        {secondary.map((item) => (
          <div
            key={`${item.season.id}-${item.category}-${item.district}`}
            className="mb-2 flex gap-3 rounded-md bg-gray-50 p-3 last:mb-0"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500">
              <Award className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">{item.season.name}</p>
              <p className="text-sm font-medium text-gray-700">
                {awardRankTitle(item.district, item.category, item.rank)}
              </p>
            </div>
          </div>
        ))}

        {activeSeason ? (
          <p className="mt-2 text-xs text-gray-500">
            {activeSeason.name} 시즌이 진행 중이에요. 종료 후 어워드가 수여돼요.
          </p>
        ) : null}

        <Link
          href="/awards"
          className="mt-3 inline-block text-sm font-medium text-amber-700"
        >
          전체 어워드 보기 →
        </Link>
      </div>
    </section>
  );
}
