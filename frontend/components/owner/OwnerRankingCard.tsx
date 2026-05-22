"use client";

import Link from "next/link";

import { rankingCategoryLabel } from "@/lib/types/ranking";
import type { OwnerRankingSummary } from "@/lib/types/owner";

type OwnerRankingCardProps = {
  ranking: OwnerRankingSummary | null;
};

export function OwnerRankingCard({ ranking }: OwnerRankingCardProps) {
  const href =
    ranking && ranking.rank != null
      ? `/ranking?district=${encodeURIComponent(ranking.district)}&category=${encodeURIComponent(ranking.category)}`
      : "/ranking";

  const hasRank = ranking != null && ranking.rank != null;

  return (
    <Link
      href={href}
      className="flex h-full flex-col rounded-2xl border-[0.5px] border-seed-gray-300 bg-white p-4 transition hover:bg-seed-gray-100"
    >
      <p className="text-xs text-seed-gray-600">우리 가게 랭킹</p>
      {hasRank && ranking ? (
        <>
          <p className="mt-2 text-sm font-bold text-seed-gray-900">
            {ranking.district} {rankingCategoryLabel(ranking.category)}{" "}
            {ranking.rank}위
          </p>
          <p className="mt-1 text-xs text-seed-gray-500">
            {ranking.score.toFixed(1)}점
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-seed-gray-600">랭킹 데이터 준비 중</p>
      )}
    </Link>
  );
}
