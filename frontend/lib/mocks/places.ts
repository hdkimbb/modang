import type { Place } from "@/lib/types/place";

const mock = (
  id: string,
  partial: Omit<Place, "id" | "placeId" | "externalProvider" | "externalId">,
): Place => ({
  ...partial,
  id,
  placeId: id,
});

export const MOCK_PLACES: Place[] = [
  mock("plc_001", {
    name: "스타벅스 강남점",
    address: "서울 강남구 강남대로 390",
    lat: 37.4979,
    lng: 127.0276,
    distance: "2km",
    meetingCount: 47,
    avgRating: 4.6,
  }),
  mock("plc_002", {
    name: "당근카페 역삼점",
    address: "서울 강남구 역삼동 123-45",
    lat: 37.5001,
    lng: 127.0364,
    distance: "0.5km",
    meetingCount: 12,
    avgRating: 4.8,
  }),
  mock("plc_003", {
    name: "투썸플레이스",
    address: "서울 강남구 테헤란로 152",
    lat: 37.5012,
    lng: 127.0396,
    distance: "1km",
    meetingCount: 0,
    avgRating: null,
  }),
  mock("plc_004", {
    name: "성수동 코너 카페",
    address: "서울 성동구 성수동1가 12-3",
    lat: 37.5445,
    lng: 127.0559,
    distance: "1.2km",
    meetingCount: 8,
    avgRating: 4.5,
  }),
  mock("plc_005", {
    name: "○○ 베이커리",
    address: "서울 성동구 연무장길 45",
    lat: 37.541,
    lng: 127.059,
    distance: "0.8km",
    meetingCount: 3,
    avgRating: 4.2,
  }),
];

export function filterPlaces(query: string): Place[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return MOCK_PLACES.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q),
  );
}
