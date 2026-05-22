"use client";

import { Divider, ListRoot } from "@seed-design/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { NavigationTop } from "@/components/common/NavigationTop";
import { useEventDraft } from "@/context/EventDraftContext";
import { createMeetingEvent, getMeetings, getPlaceDetail } from "@/lib/api";
import { mapPlaceDetailToPlace } from "@/lib/types/place";
import {
  CONDITION_OPTIONS,
  FORMAT_OPTIONS,
} from "@/lib/constants/event-form";
import { draftDateTimeToIso, formatEventDateTime } from "@/lib/format";

import { BottomFixedButton } from "./BottomFixedButton";
import { CapacitySection } from "./CapacitySection";
import { ChipSelectGroup } from "./ChipSelectGroup";
import { DateTimeSection } from "./DateTimeSection";
import { FormListRow } from "./FormListRow";

interface EventFormScreenProps {
  meetingId: string;
  apiMeetingId: string;
}

export function EventFormScreen({
  meetingId,
  apiMeetingId,
}: EventFormScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draft = useEventDraft();
  const { setPlace, setMeetingCategory } = draft;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => draft.title.trim().length > 0 && Boolean(draft.place?.placeId),
    [draft.title, draft.place?.placeId],
  );

  const largeTitle = draft.title.trim() || "일정 만들기";

  useEffect(() => {
    const placeId = searchParams.get("place_id");
    if (!placeId) return;
    getPlaceDetail(placeId)
      .then((detail) => setPlace(mapPlaceDetailToPlace(detail)))
      .catch(() => undefined);
  }, [searchParams, setPlace]);

  useEffect(() => {
    getMeetings()
      .then((meetings) => {
        const meeting = meetings.find((m) => m.id === apiMeetingId);
        setMeetingCategory(meeting?.category ?? null);
      })
      .catch(() => setMeetingCategory(null));
  }, [apiMeetingId, setMeetingCategory]);

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    const title = draft.title.trim();
    const placeId = draft.place?.placeId;
    if (!placeId) return;

    setIsSubmitting(true);
    try {
      await createMeetingEvent(apiMeetingId, {
        title,
        scheduled_at: draftDateTimeToIso(draft.date, draft.time),
        attendee_count: draft.capacity,
        place_id: placeId,
      });
      router.push(`/meetings/${meetingId}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "일정 등록에 실패했어요";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const placeLabel = draft.place?.name ?? "미정";
  const conditionsSummary =
    draft.conditions.length > 0
      ? draft.conditions.join(", ")
      : "선택 안 함";
  const formatsSummary =
    draft.formats.length > 0 ? draft.formats.join(", ") : "선택 안 함";

  return (
    <div className="flex min-h-dvh flex-col bg-seed-gray-00 pb-28">
      <NavigationTop
        variant="large"
        largeTitle={largeTitle}
        onBack={() => router.back()}
        divider
        className="sticky top-0 z-10 shrink-0"
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ListRoot>
          <FormListRow
            icon="📅"
            label="날짜 및 시간"
            value={formatEventDateTime(draft.date, draft.time)}
            expanded={draft.expandedSection === "date"}
            onClick={() => draft.toggleSection("date")}
          >
            <DateTimeSection />
          </FormListRow>
          <Divider />
          <FormListRow
            icon="📍"
            label="장소"
            value={placeLabel}
            onClick={() =>
              router.push(`/meetings/${meetingId}/events/new/place`)
            }
          />
          <Divider />
          <FormListRow
            icon="👥"
            label="인원"
            value={`${draft.capacity}명`}
            expanded={draft.expandedSection === "capacity"}
            onClick={() => draft.toggleSection("capacity")}
          >
            <CapacitySection />
          </FormListRow>
          <Divider />
          <FormListRow
            icon="✓"
            label="참여 조건"
            value={conditionsSummary}
            expanded={draft.expandedSection === "conditions"}
            onClick={() => draft.toggleSection("conditions")}
          >
            <ChipSelectGroup
              options={CONDITION_OPTIONS}
              selected={draft.conditions}
              onToggle={draft.toggleCondition}
            />
          </FormListRow>
          <Divider />
          <FormListRow
            icon="⚑"
            label="진행 방식"
            value={formatsSummary}
            expanded={draft.expandedSection === "format"}
            onClick={() => draft.toggleSection("format")}
          >
            <ChipSelectGroup
              options={FORMAT_OPTIONS}
              selected={draft.formats}
              onToggle={draft.toggleFormat}
            />
          </FormListRow>
        </ListRoot>
      </div>
      <BottomFixedButton
        label={isSubmitting ? "등록 중..." : "일정 등록"}
        onClick={() => void handleSubmit()}
        disabled={!canSubmit}
        loading={isSubmitting}
      />
    </div>
  );
}
