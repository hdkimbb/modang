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
  distance: string | null;
  meetingCount: number;
  avgRating: number | null;
  externalProvider?: string | null;
  externalId?: string | null;
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
    distance: item.distance,
    meetingCount: item.meeting_count ?? 0,
    avgRating: item.avg_rating,
    externalProvider: item.external_provider,
    externalId: item.external_id,
  };
}
