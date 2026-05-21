"use client";

import { Divider, ListRoot } from "@seed-design/react";
import { useRouter } from "next/navigation";

import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { useEventDraft } from "@/context/EventDraftContext";
import {
  CONDITION_OPTIONS,
  FORMAT_OPTIONS,
} from "@/lib/constants/event-form";
import { formatEventDateTime } from "@/lib/format";

import { BottomFixedButton } from "./BottomFixedButton";
import { CapacitySection } from "./CapacitySection";
import { ChipSelectGroup } from "./ChipSelectGroup";
import { DateTimeSection } from "./DateTimeSection";
import { FormListRow } from "./FormListRow";

interface EventFormScreenProps {
  meetingId: string;
}

export function EventFormScreen({ meetingId }: EventFormScreenProps) {
  const router = useRouter();
  const draft = useEventDraft();

  const placeLabel = draft.place?.name ?? "미정";
  const conditionsSummary =
    draft.conditions.length > 0
      ? draft.conditions.join(", ")
      : "선택 안 함";
  const formatsSummary =
    draft.formats.length > 0 ? draft.formats.join(", ") : "선택 안 함";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScreenHeader
        variant="close"
        onAction={() => router.back()}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <h2
          style={{
            padding:
              "var(--seed-dimension-x2) var(--seed-dimension-spacing-x-global-gutter) var(--seed-dimension-x4)",
            fontSize: "var(--seed-font-size-t8)",
            lineHeight: "var(--seed-line-height-t8)",
            fontWeight: "var(--seed-font-weight-bold)",
            color: "var(--seed-color-fg-neutral)",
          }}
        >
          {draft.title}
        </h2>
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
        label="다음"
        onClick={() => alert("다음 단계는 준비 중")}
      />
    </div>
  );
}
