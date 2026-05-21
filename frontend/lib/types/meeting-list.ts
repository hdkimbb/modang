/** Default thumbnail when `thumbnail_url` is absent (public/). */
export const DEFAULT_MEETING_THUMBNAIL = "/images/default-meeting.png";

/**
 * Backend `meetings` has no `thumbnail_url` yet.
 * Phase E (모임 만들기) will add upload + DB column; until then use default image.
 */
export type MeetingCategoryFilter =
  | "all"
  | "exercise"
  | "neighbors"
  | "outdoor"
  | "self"
  | "family"
  | "hobby"
  | "food";

export interface MeetingListItem {
  id: string;
  name: string;
  tags: string[];
  district: string;
  memberCount: number;
  statusText: string;
  filterCategories: MeetingCategoryFilter[];
  thumbnail_url?: string | null;
}

export const MEETING_CATEGORY_CHIPS: {
  id: MeetingCategoryFilter;
  label: string;
}[] = [
  { id: "all", label: "전체" },
  { id: "exercise", label: "운동" },
  { id: "neighbors", label: "동네친구" },
  { id: "outdoor", label: "아웃도어/여행" },
  { id: "self", label: "자기계발" },
  { id: "family", label: "가족·육아" },
  { id: "hobby", label: "취미" },
  { id: "food", label: "음식" },
];
