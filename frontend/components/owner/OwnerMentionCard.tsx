"use client";

import { AtSign } from "lucide-react";

import type { OwnerMentionStats } from "@/lib/types/owner";

type OwnerMentionCardProps = {
  stats: OwnerMentionStats;
};

export function OwnerMentionCard({ stats }: OwnerMentionCardProps) {
  const { total, this_month } = stats;
  const isEmpty = total === 0;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <AtSign className="h-5 w-5 text-orange-500" strokeWidth={1.75} aria-hidden />
        <h2 className="text-base font-bold">게시판 멘션</h2>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        모임 게시판·댓글에서 우리 가게가 @멘션된 횟수예요
      </p>

      {isEmpty ? (
        <p className="py-8 text-center text-sm text-gray-400">
          아직 멘션이 없어요
        </p>
      ) : (
        <div className="mt-4 rounded-xl bg-gray-50 p-3">
          <p className="text-sm font-bold text-gray-900">
            이번 달 {this_month}건
          </p>
          <p className="mt-1 text-sm text-gray-600">전체 {total}건</p>
        </div>
      )}
    </section>
  );
}
