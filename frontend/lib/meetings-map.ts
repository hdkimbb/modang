import type { MeetingCategoryFilter, MeetingListItem } from "@/lib/types/meeting-list";

export type MeetingApi = {
  id: string;
  name: string;
  category: string;
  neighborhood: string;
  activity_range: number;
  description: string | null;
  member_count: number;
  created_at: string;
};

const CATEGORY_FILTER_MAP: Record<string, MeetingCategoryFilter[]> = {
  운동: ["all", "exercise"],
  동네친구: ["all", "neighbors"],
  "아웃도어/여행": ["all", "outdoor"],
  자기계발: ["all", "self"],
  "가족·육아": ["all", "family"],
  취미: ["all", "hobby"],
  음식: ["all", "food"],
  book_club: ["all", "self", "hobby"],
};

export function mapMeetingApiToListItem(meeting: MeetingApi): MeetingListItem {
  return {
    id: meeting.id,
    name: meeting.name,
    tags: [meeting.category],
    district: meeting.neighborhood,
    memberCount: meeting.member_count,
    statusText: "일정 모집 중",
    filterCategories: CATEGORY_FILTER_MAP[meeting.category] ?? [
      "all",
      "hobby",
    ],
  };
}
