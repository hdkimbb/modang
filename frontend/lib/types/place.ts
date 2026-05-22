/** API response shape (snake_case) */
export interface PlaceSearchItemApi {
  place_id: string | null;
  name: string;
  address: string;
  district: string | null;
  category: string;
  lat: number;
  lng: number;
  business_id: string | null;
  verified: boolean;
  thumbnail_url: string | null;
  distance: string | null;
  external_provider: string | null;
  external_id: string | null;
  meeting_count: number;
  avg_rating: number | null;
  rating_count?: number;
  would_revisit_rate?: number | null;
  owner_message?: string | null;
  is_owner_recommended?: boolean;
}

export interface PlaceScoreSummaryApi {
  total: number;
  selected: number;
  rated: number;
  mentioned: number;
  selected_share_pct: number;
  rated_share_pct: number;
  mentioned_share_pct: number;
}

export interface PlaceDetailApi {
  id: string;
  name: string;
  address: string;
  district: string;
  category: string;
  lat: number;
  lng: number;
  meeting_count: number;
  avg_rating: number | null;
  rating_count: number;
  would_revisit_rate: number | null;
  owner_message: string | null;
  score: PlaceScoreSummaryApi | null;
}

export interface PlaceRatingsApi {
  total_count: number;
  avg_rating: number | null;
  would_revisit_rate: number | null;
  distribution: Record<string, number>;
  recent: { rating: number; would_revisit: boolean; created_at: string }[];
}

export interface PlaceMeetingHistoryApi {
  items: {
    event_id: string;
    meeting_id: string;
    meeting_name: string;
    category: string;
    scheduled_at: string;
    status: string;
    attendee_count: number;
  }[];
}

export interface PlaceSearchResponse {
  items: PlaceSearchItemApi[];
  next_cursor: string | null;
}

/** UI / draft state (camelCase) */
export interface Place {
  id: string;
  placeId: string | null;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance: string | null;
  meetingCount: number;
  avgRating: number | null;
  ratingCount?: number;
  wouldRevisitRate?: number | null;
  externalProvider?: string | null;
  externalId?: string | null;
  ownerMessage?: string | null;
  isOwnerRecommended?: boolean;
}

export function mapPlaceDetailToPlace(detail: PlaceDetailApi): Place {
  return {
    id: detail.id,
    placeId: detail.id,
    name: detail.name,
    address: detail.address,
    lat: detail.lat,
    lng: detail.lng,
    distance: null,
    meetingCount: detail.meeting_count,
    avgRating: detail.avg_rating,
    ratingCount: detail.rating_count,
    wouldRevisitRate: detail.would_revisit_rate,
    ownerMessage: detail.owner_message,
  };
}

export function mapPlaceSearchItem(item: PlaceSearchItemApi): Place {
  const id =
    item.place_id ??
    (item.external_id ? `${item.external_provider ?? "kakao"}:${item.external_id}` : item.name);

  return {
    id,
    placeId: item.place_id,
    name: item.name,
    address: item.address,
    lat: item.lat,
    lng: item.lng,
    distance: item.distance,
    meetingCount: item.meeting_count ?? 0,
    avgRating: item.avg_rating,
    ratingCount: item.rating_count ?? 0,
    wouldRevisitRate: item.would_revisit_rate ?? null,
    externalProvider: item.external_provider,
    externalId: item.external_id,
    ownerMessage: item.owner_message ?? null,
    isOwnerRecommended: item.is_owner_recommended ?? false,
  };
}
