import type { Place } from "./place";

export type ExpandedSection =
  | "date"
  | "capacity"
  | "conditions"
  | "format"
  | null;

export interface EventDraft {
  title: string;
  date: Date;
  time: string;
  repeat: string;
  place: Place | null;
  capacity: number;
  conditions: string[];
  formats: string[];
  expandedSection: ExpandedSection;
}

export const DEFAULT_EVENT_DRAFT: EventDraft = {
  title: "편안한 카페 수다 모임🍰",
  date: new Date(2026, 4, 21),
  time: "오후 12:00",
  repeat: "없음",
  place: null,
  capacity: 4,
  conditions: ["누구나 참여 가능"],
  formats: ["시간 협의 가능", "비용 각자 부담"],
  expandedSection: null,
};
