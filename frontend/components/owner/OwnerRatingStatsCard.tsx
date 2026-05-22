"use client";

import { Star } from "lucide-react";

import type { OwnerRatingStats } from "@/lib/types/owner";

const STAR_KEYS = ["5", "4", "3", "2", "1"] as const;

type OwnerRatingStatsCardProps = {
  stats: OwnerRatingStats | null;
};

function StarsRow({ average }: { average: number }) {
  const full = Math.round(average);
  return (
    <div className="mt-1 flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`h-4 w-4 ${
            value <= full
              ? "fill-orange-400 text-orange-400"
              : "text-gray-300"
          }`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export function OwnerRatingStatsCard({ stats }: OwnerRatingStatsCardProps) {
  const isEmpty = !stats || stats.total_count === 0;

  const maxCount = isEmpty
    ? 0
    : Math.max(...STAR_KEYS.map((k) => stats.distribution[k] ?? 0), 1);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      <h2 className="text-base font-bold text-gray-900">별점 평가</h2>

      {isEmpty ? (
        <p className="py-8 text-center text-sm text-gray-400">
          아직 별점 평가가 없어요
        </p>
      ) : (
        <>
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1 text-[26px] font-bold leading-none text-gray-900">
                <Star
                  className="h-6 w-6 fill-orange-400 text-orange-400"
                  strokeWidth={1.5}
                  aria-hidden
                />
                {stats.average?.toFixed(1)}
              </p>
              {stats.average != null ? (
                <StarsRow average={stats.average} />
              ) : null}
            </div>
            <p className="shrink-0 text-sm text-gray-500">
              총 {stats.total_count}건
            </p>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="text-sm font-bold text-gray-900">별점 분포</p>
            <ul className="mt-3 space-y-2">
              {STAR_KEYS.map((star) => {
                const count = stats.distribution[star] ?? 0;
                const widthPct =
                  maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
                return (
                  <li
                    key={star}
                    className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2 text-sm"
                  >
                    <span className="text-gray-700">{star}☆</span>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full ${
                          count > 0 ? "bg-seed-carrot-300" : "bg-gray-200"
                        }`}
                        style={{
                          width: `${count > 0 ? Math.max(widthPct, 4) : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-right text-gray-600">{count}명</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
