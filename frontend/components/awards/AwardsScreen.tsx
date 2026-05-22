"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { getSeasonAwards, getSeasons } from "@/lib/api";
import {
  awardGroupLabel,
  type SeasonAwardsResponseApi,
  type SeasonSummaryApi,
} from "@/lib/types/award";

function RankBadge({ rank }: { rank: number }) {
  const isFirst = rank === 1;
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
        isFirst
          ? "bg-amber-50 text-amber-800"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {rank}
    </span>
  );
}

export function AwardsScreen() {
  const router = useRouter();
  const [seasons, setSeasons] = useState<SeasonSummaryApi[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [data, setData] = useState<SeasonAwardsResponseApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSeason =
    seasons.find((s) => s.id === selectedId) ?? null;
  const isActiveSeason = selectedSeason?.status === "active";

  useEffect(() => {
    void (async () => {
      try {
        const list = await getSeasons();
        setSeasons(list);
        if (list.length > 0) {
          setSelectedId(list[0].id);
        }
      } catch {
        setError("시즌 목록을 불러오지 못했어요");
      }
    })();
  }, []);

  const loadAwards = useCallback(async (seasonId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSeasonAwards(seasonId);
      setData(result);
    } catch {
      setError("어워드를 불러오지 못했어요");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    if (isActiveSeason) {
      setLoading(false);
      setError(null);
      setData(null);
      return;
    }
    void loadAwards(selectedId);
  }, [selectedId, isActiveSeason, loadAwards]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScreenHeader
        variant="back"
        title="어워드"
        onAction={() => router.back()}
        divider
      />

      {seasons.length > 0 ? (
        <div className="scrollbar-hide flex gap-2 overflow-x-auto border-b border-gray-100 px-4 py-3">
          {seasons.map((season) => {
            const active = selectedId === season.id;
            return (
              <button
                key={season.id}
                type="button"
                onClick={() => setSelectedId(season.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-amber-700 bg-white text-amber-800"
                    : "border-gray-200 bg-white text-gray-500"
                }`}
              >
                {season.name}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {isActiveSeason ? (
          <p className="py-16 text-center text-sm text-gray-600">
            시즌이 진행 중이에요. 종료 시 어워드가 수여돼요.
          </p>
        ) : loading ? (
          <p className="py-16 text-center text-sm text-gray-500">불러오는 중...</p>
        ) : error ? (
          <p className="py-16 text-center text-sm text-red-600">{error}</p>
        ) : data && data.groups.length > 0 ? (
          <div className="flex flex-col gap-6">
            {data.groups.map((group) => (
              <section key={`${group.district}-${group.category}`}>
                <p className="mb-2 text-sm text-gray-500">
                  {awardGroupLabel(group.district, group.category)}
                </p>
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  {group.winners.map((winner, index) => (
                    <div
                      key={winner.place.id}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        index < group.winners.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }`}
                    >
                      <RankBadge rank={winner.rank} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">
                          {winner.place.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          점수 {winner.score.toFixed(1)} · 모임{" "}
                          {winner.signal_count}건
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-gray-400">
            이 시즌에 수상 내역이 없어요
          </p>
        )}
      </div>
    </div>
  );
}
