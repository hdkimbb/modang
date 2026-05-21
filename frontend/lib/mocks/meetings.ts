import type {
  MeetingCategoryFilter,
  MeetingListItem,
} from "@/lib/types/meeting-list";

export const MOCK_MEETING_LIST: MeetingListItem[] = [
  {
    id: "1",
    name: "성수 독서모임",
    tags: ["친목", "자기계발", "카페"],
    district: "성수동",
    memberCount: 5,
    statusText: "일정 모집 중",
    filterCategories: ["all", "self", "hobby"],
  },
  {
    id: "2",
    name: "강남 러닝크루",
    tags: ["운동", "친목"],
    district: "역삼동",
    memberCount: 12,
    statusText: "18분 전 활동",
    filterCategories: ["all", "exercise", "neighbors"],
  },
  {
    id: "3",
    name: "연남 브런치 탐방",
    tags: ["음식", "맛집", "카페"],
    district: "연남동",
    memberCount: 8,
    statusText: "일정 모집 중",
    filterCategories: ["all", "food", "hobby"],
  },
  {
    id: "4",
    name: "주말 등산 모임",
    tags: ["아웃도어/여행", "운동"],
    district: "성수동",
    memberCount: 15,
    statusText: "2시간 전 활동",
    filterCategories: ["all", "outdoor", "exercise"],
  },
  {
    id: "5",
    name: "육아맘 소통방",
    tags: ["가족·육아", "친목"],
    district: "역삼동",
    memberCount: 22,
    statusText: "5분 전 활동",
    filterCategories: ["all", "family", "neighbors"],
  },
  {
    id: "6",
    name: "보드게임 번개",
    tags: ["취미", "친목"],
    district: "연남동",
    memberCount: 6,
    statusText: "일정 모집 중",
    filterCategories: ["all", "hobby", "neighbors"],
  },
];

export function filterMeetings(
  meetings: MeetingListItem[],
  category: MeetingCategoryFilter,
  query: string,
): MeetingListItem[] {
  const q = query.trim().toLowerCase();
  return meetings.filter((m) => {
    const categoryMatch =
      category === "all" || m.filterCategories.includes(category);
    if (!categoryMatch) return false;
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.district.toLowerCase().includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}
