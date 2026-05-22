import { rankingCategoryLabel } from "@/lib/types/ranking";

export type SeasonSummaryApi = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  total_awards: number;
};

export type AwardPlaceSummaryApi = {
  id: string;
  name: string;
  address: string;
  district: string;
  category: string;
};

export type SeasonAwardWinnerApi = {
  rank: number;
  place: AwardPlaceSummaryApi;
  score: number;
  signal_count: number;
};

export type SeasonAwardGroupApi = {
  category: string;
  district: string;
  winners: SeasonAwardWinnerApi[];
};

export type SeasonAwardsResponseApi = {
  season: SeasonSummaryApi;
  groups: SeasonAwardGroupApi[];
};

export type PlaceAwardItemApi = {
  season: SeasonSummaryApi;
  rank: number;
  category: string;
  district: string;
  score: number;
};

export type PlaceAwardsResponseApi = {
  items: PlaceAwardItemApi[];
};

const MEETING_CATEGORY_LABELS: Record<string, string> = {
  book_club: "독서",
  운동: "운동",
  자기계발: "자기계발",
};

export function awardCategoryLabel(categoryId: string): string {
  return (
    MEETING_CATEGORY_LABELS[categoryId] ??
    rankingCategoryLabel(categoryId)
  );
}

export function awardGroupLabel(district: string, category: string): string {
  return `${district} · ${awardCategoryLabel(category)}`;
}

export function awardRankTitle(
  district: string,
  category: string,
  rank: number,
): string {
  return `${district} ${awardCategoryLabel(category)} ${rank}위`;
}
