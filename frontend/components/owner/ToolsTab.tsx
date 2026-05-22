"use client";

import { Target } from "lucide-react";
import { useEffect, useRef } from "react";

import { AdCenterBanner } from "@/components/owner/AdCenterBanner";
import {
  BTN_CHIP_DISABLED,
  BTN_FILLED_PRIMARY,
  BTN_FILLED_PRIMARY_DISABLED,
  BTN_FILLED_PRIMARY_ENABLED,
} from "@/lib/button-styles";
import type { OwnerMessage } from "@/lib/types/owner";

const MESSAGE_MAX = 100;
const RECOMMENDATION_CHIP_CATEGORIES = [
  "독서",
  "스터디",
  "운동",
  "자기계발",
  "취미",
  "음식",
] as const;

type ToolsTabProps = {
  ownerMessage: OwnerMessage;
  editing: boolean;
  draftMessage: string;
  savingMessage: boolean;
  selectedCategories: string[];
  categoriesDirty: boolean;
  savingTargets: boolean;
  pendingMessageTemplate: string | null;
  onDraftMessageChange: (value: string) => void;
  onEditingChange: (editing: boolean) => void;
  onToggleActive: () => void;
  onSaveMessage: () => void;
  onToggleRecommendationCategory: (category: string) => void;
  onSaveRecommendationTargets: () => void;
  onPendingTemplateConsumed: () => void;
};

export function ToolsTab({
  ownerMessage,
  editing,
  draftMessage,
  savingMessage,
  selectedCategories,
  categoriesDirty,
  savingTargets,
  pendingMessageTemplate,
  onDraftMessageChange,
  onEditingChange,
  onToggleActive,
  onSaveMessage,
  onToggleRecommendationCategory,
  onSaveRecommendationTargets,
  onPendingTemplateConsumed,
}: ToolsTabProps) {
  const messageCardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!pendingMessageTemplate) return;
    onDraftMessageChange(pendingMessageTemplate.slice(0, MESSAGE_MAX));
    onEditingChange(true);
    onPendingTemplateConsumed();
    requestAnimationFrame(() => {
      messageCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [
    pendingMessageTemplate,
    onDraftMessageChange,
    onEditingChange,
    onPendingTemplateConsumed,
  ]);

  const displayMessage = ownerMessage.message.trim();
  const charCount = editing ? draftMessage.length : displayMessage.length;

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-6">
      <AdCenterBanner />

      <section
        ref={messageCardRef}
        className="rounded-2xl border border-gray-200 bg-white p-4"
      >
        <h2 className="text-base font-bold">사장님 제안 메시지</h2>
        <p className="mt-1 text-xs text-gray-500">
          사용자가 우리 가게 페이지에서 보는 메시지를 작성해보세요
        </p>

        {editing ? (
          <div className="mt-3">
            <textarea
              value={draftMessage}
              onChange={(e) =>
                onDraftMessageChange(e.target.value.slice(0, MESSAGE_MAX))
              }
              rows={4}
              maxLength={MESSAGE_MAX}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-orange-300"
              placeholder="모임 손님에게 전할 메시지를 입력해 주세요"
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {draftMessage.length}/{MESSAGE_MAX}자
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={savingMessage}
                onClick={() => void onSaveMessage()}
                className={`flex-1 rounded-full py-2 text-sm font-medium ${BTN_FILLED_PRIMARY}`}
              >
                저장
              </button>
              <button
                type="button"
                disabled={savingMessage}
                onClick={() => {
                  onDraftMessageChange(ownerMessage.message);
                  onEditingChange(false);
                }}
                className="flex-1 rounded-full border border-gray-200 py-2 text-sm text-gray-600"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl bg-gray-50 p-3">
            {displayMessage ? (
              <p className="line-clamp-3 whitespace-pre-wrap text-sm text-gray-800">
                &quot;{displayMessage}&quot;
              </p>
            ) : (
              <p className="text-sm text-gray-400">메시지를 작성해 주세요</p>
            )}
          </div>
        )}

        {!editing ? (
          <p className="mt-2 text-right text-xs text-gray-400">
            {charCount}/{MESSAGE_MAX}자
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                ownerMessage.active ? "bg-green-500" : "bg-gray-400"
              }`}
              aria-hidden
            />
            <span className="text-gray-600">
              {ownerMessage.active ? "노출 중" : "노출 중지"}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void onToggleActive()}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600"
            >
              {ownerMessage.active ? "노출 끄기" : "노출 켜기"}
            </button>
            <button
              type="button"
              onClick={() => {
                onDraftMessageChange(ownerMessage.message);
                onEditingChange(true);
              }}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600"
            >
              수정
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-orange-500" strokeWidth={1.75} />
          <h2 className="text-base font-bold">우리 가게에 잘 맞는 모임 추천 노출</h2>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          어떤 카테고리 모임에 노출하시겠어요?
        </p>
        <p className="text-xs text-gray-500">최대 3개까지 선택할 수 있어요.</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {RECOMMENDATION_CHIP_CATEGORIES.map((category) => {
            const selected = selectedCategories.includes(category);
            const disabled = !selected && selectedCategories.length >= 3;
            return (
              <button
                key={category}
                type="button"
                disabled={disabled}
                onClick={() => onToggleRecommendationCategory(category)}
                className={
                  selected
                    ? "rounded-full bg-gray-900 px-4 py-2 text-sm text-white"
                    : disabled
                      ? BTN_CHIP_DISABLED
                      : "rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700"
                }
              >
                {category}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-gray-500">
          선택한 카테고리의 모임이 장소 검색 시 상단에 우선 노출돼요
        </p>

        <button
          type="button"
          disabled={!categoriesDirty || savingTargets}
          onClick={() => void onSaveRecommendationTargets()}
          className={`mt-4 w-full rounded-full py-3 text-sm font-medium ${
            categoriesDirty && !savingTargets
              ? BTN_FILLED_PRIMARY_ENABLED
              : BTN_FILLED_PRIMARY_DISABLED
          }`}
        >
          저장하기
        </button>
      </section>
    </div>
  );
}
