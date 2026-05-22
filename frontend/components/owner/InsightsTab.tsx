"use client";

import { useState } from "react";
import { Clock, Lightbulb } from "lucide-react";

import { InsightChipFilter } from "@/components/common/InsightChipFilter";
import { OwnerMentionCard } from "@/components/owner/OwnerMentionCard";
import { OwnerRatingStatsCard } from "@/components/owner/OwnerRatingStatsCard";
import { OwnerRegularMeetingsCard } from "@/components/owner/OwnerRegularMeetingsCard";
import type {
  OwnerInsights,
  OwnerMentionStats,
  OwnerRatingStats,
  OwnerRegularMeetingItem,
  OwnerTimeslotInsights,
} from "@/lib/types/owner";

type InsightChip = "rating" | "analysis";

const INSIGHT_CHIPS = [
  { value: "rating" as const, label: "평가" },
  { value: "analysis" as const, label: "분석" },
];

type InsightsTabProps = {
  insights: OwnerInsights | null;
  timeslots: OwnerTimeslotInsights | null;
  mentionStats: OwnerMentionStats;
  ratingStats: OwnerRatingStats | null;
  regularMeetings: OwnerRegularMeetingItem[];
  onApplyMessageTemplate: (template: string) => void;
};

export function InsightsTab({
  insights,
  timeslots,
  mentionStats,
  ratingStats,
  regularMeetings,
  onApplyMessageTemplate,
}: InsightsTabProps) {
  const [chip, setChip] = useState<InsightChip>("rating");

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-6">
      <InsightChipFilter
        options={INSIGHT_CHIPS}
        value={chip}
        onChange={setChip}
      />

      {chip === "rating" ? (
        <>
          <OwnerRatingStatsCard stats={ratingStats} />
          <OwnerMentionCard stats={mentionStats} />
        </>
      ) : (
        <>
          <OwnerRegularMeetingsCard items={regularMeetings} />

          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" strokeWidth={1.75} />
              <h2 className="text-base font-bold">모임이 가장 많이 오는 시간</h2>
            </div>

            {!timeslots || timeslots.total_events === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                아직 다녀간 모임이 없어 시간대 분석을 할 수 없어요
              </p>
            ) : (
              <>
                <ul className="mt-4 space-y-3">
                  {timeslots.slots.map((slot) => {
                    const isPeak = slot.key === timeslots.peak_slot;
                    const isLow =
                      slot.key === timeslots.low_slot && slot.count > 0;
                    const isEmpty = slot.count === 0;
                    return (
                      <li key={slot.key}>
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span
                            className={
                              isPeak
                                ? "font-bold text-orange-600"
                                : isLow || isEmpty
                                  ? "text-gray-400"
                                  : "text-gray-800"
                            }
                          >
                            {slot.label}
                            {isLow && slot.count > 0 ? " (비수기)" : ""}
                          </span>
                          <span
                            className={
                              isPeak
                                ? "font-bold text-orange-600"
                                : "text-gray-500"
                            }
                          >
                            {slot.percentage}%
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                          <div
                            className={`h-2 rounded-full ${
                              isPeak
                                ? "bg-orange-500"
                                : isLow || isEmpty
                                  ? "bg-gray-300"
                                  : "bg-orange-400"
                            }`}
                            style={{
                              width: `${Math.max(slot.percentage, slot.count > 0 ? 4 : 0)}%`,
                            }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {timeslots.peak_recommendation ? (
                  <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                    <p className="font-medium text-gray-900">추천 액션</p>
                    <p className="mt-1">{timeslots.peak_recommendation}</p>
                  </div>
                ) : null}
              </>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-orange-500" strokeWidth={1.75} />
              <h2 className="text-base font-bold">우리 가게에 자주 오는 모임</h2>
            </div>

            {!insights || insights.total_meetings === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                아직 다녀간 모임이 없어 인사이트를 만들 수 없어요
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {insights.top_categories.map((item, index) => (
                  <li key={item.category}>
                    <p className="text-sm font-bold text-gray-900">
                      {index + 1}위 {item.category} ({item.count}팀,{" "}
                      {item.percentage}%)
                    </p>
                    <div className="mt-2 rounded-xl bg-gray-50 p-3">
                      <p className="text-sm text-gray-600">
                        평균 {item.avg_member_count}명
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          onApplyMessageTemplate(item.recommended_action.template)
                        }
                        className="mt-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-medium text-orange-600"
                      >
                        {item.recommended_action.label}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
