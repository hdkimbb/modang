export type RankingCategoryId = "cafe" | "restaurant" | "beauty" | "study_room";

export type RankingDistrictId = "성수동" | "연남동" | "역삼동";

export const RANKING_DISTRICTS: { id: RankingDistrictId; label: string }[] = [
  { id: "성수동", label: "성수동" },
  { id: "연남동", label: "연남동" },
  { id: "역삼동", label: "역삼동" },
];

export const RANKING_CATEGORIES: { id: RankingCategoryId; label: string }[] = [
  { id: "cafe", label: "카페" },
  { id: "restaurant", label: "식당" },
  { id: "beauty", label: "미용" },
  { id: "study_room", label: "스터디룸" },
];

export function rankingCategoryLabel(categoryId: string): string {
  return RANKING_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
}

export interface RankingItemApi {
  rank: number;
  place: {
    place_id: string;
    name: string;
    thumbnail_url: string | null;
  };
  score: {
    total: number;
    meetup_signal: number;
    mention: number;
    review: number;
  };
  stats: {
    total_meetings_30d: number;
    avg_rating: number | null;
  };
}

export interface RankingResponseApi {
  district: string;
  category: string;
  season_label: string;
  items: RankingItemApi[];
}
