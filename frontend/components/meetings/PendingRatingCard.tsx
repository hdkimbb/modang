"use client";

import { ActionButton } from "@seed-design/react";

import type { PendingRatingItemApi } from "@/lib/types/pending-rating";
import { rankingCategoryLabel } from "@/lib/types/ranking";

function formatDaysAgo(scheduledAt: string): string {
  const then = new Date(scheduledAt);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "오늘 다녀온 모임";
  if (days === 1) return "1일 전 다녀온 모임";
  return `${days}일 전 다녀온 모임`;
}

type PendingRatingCardProps = {
  item: PendingRatingItemApi;
  onRate: () => void;
  onDismiss: () => void;
};

export function PendingRatingCard({
  item,
  onRate,
  onDismiss,
}: PendingRatingCardProps) {
  const placeCategoryLabel = rankingCategoryLabel(item.place_category);

  return (
    <article className="relative shrink-0 w-[min(100%,20rem)] rounded-2xl border border-seed-gray-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-3 top-3 text-xs text-seed-gray-600 hover:text-seed-gray-900"
      >
        나중에
      </button>

      <h3 className="pr-14 text-base font-bold text-seed-gray-900">
        {item.place_name}
      </h3>
      <p className="mt-1 text-xs text-seed-gray-600">
        {placeCategoryLabel} · {item.meeting_title}
      </p>
      <p className="mt-2 text-xs text-seed-gray-500">
        {formatDaysAgo(item.scheduled_at)}
      </p>

      <div className="mt-4 flex justify-end">
        <ActionButton
          className="modang-action-btn"
          variant="brandSolid"
          size="small"
          onClick={onRate}
        >
          평가하기
        </ActionButton>
      </div>
    </article>
  );
}
