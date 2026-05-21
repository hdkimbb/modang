import type { MeetingApi } from "@/lib/meetings-map";
import type {
  MeetingDetailApi,
  MeetingEventsListApi,
  MeetingPlaceHistoryApi,
} from "@/lib/types/meeting-detail";
import type { Persona, PersonaListApi } from "@/lib/types/persona";
import type { RankingResponseApi } from "@/lib/types/ranking";
import {
  mapPlaceSearchItem,
  type Place,
  type PlaceDetailApi,
  type PlaceMeetingHistoryApi,
  type PlaceRatingsApi,
  type PlaceSearchResponse,
} from "@/lib/types/place";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchApi<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getHealth(): Promise<{ message: string }> {
  return fetchApi("/");
}

export async function searchPlaces(
  query: string,
  meetingCategory?: string | null,
): Promise<Place[]> {
  const params = new URLSearchParams({ q: query.trim() });
  if (meetingCategory?.trim()) {
    params.set("meeting_category", meetingCategory.trim());
  }
  const data = await fetchApi<PlaceSearchResponse>(
    `/api/v1/places/search?${params.toString()}`,
  );
  return data.items.map(mapPlaceSearchItem);
}

export async function getRecommendedPlaces(
  limit = 2,
  meetingCategory?: string | null,
): Promise<Place[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (meetingCategory?.trim()) {
    params.set("meeting_category", meetingCategory.trim());
  }
  const data = await fetchApi<PlaceSearchResponse>(
    `/api/v1/places/recommendations?${params.toString()}`,
  );
  return data.items.map(mapPlaceSearchItem);
}

export type CreateEventRequest = {
  title: string;
  scheduled_at: string;
  attendee_count: number;
  place_id: string;
};

export type CreateEventResponse = {
  event_id: string;
  meeting_id: string;
  place_id: string;
  title: string;
  scheduled_at: string;
  attendee_count: number;
  status: string;
  created_at: string;
  signal_id: string;
};

export async function createMeetingEvent(
  meetingId: string,
  data: CreateEventRequest,
): Promise<CreateEventResponse> {
  const res = await fetch(`${API_BASE}/api/v1/meetings/${meetingId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(
      err.detail?.error?.message || "일정 등록에 실패했어요",
    );
  }
  return res.json() as Promise<CreateEventResponse>;
}

export type CreateMeetingRequest = {
  name: string;
  category: string;
  neighborhood: string;
  activity_range: number;
  description?: string;
  host_user_id?: string;
};

export async function getPersonas(): Promise<Persona[]> {
  const data = await fetchApi<PersonaListApi>("/api/v1/users/personas");
  return data.items;
}

export async function getMeetings(): Promise<MeetingApi[]> {
  const data = await fetchApi<{ items: MeetingApi[] }>("/api/v1/meetings");
  return data.items;
}

export async function getMeetingDetail(
  meetingId: string,
): Promise<MeetingDetailApi> {
  return fetchApi(`/api/v1/meetings/${meetingId}`);
}

export async function getMeetingEvents(
  meetingId: string,
): Promise<MeetingEventsListApi> {
  return fetchApi(`/api/v1/meetings/${meetingId}/events`);
}

export async function getMeetingPlaceHistory(
  meetingId: string,
): Promise<MeetingPlaceHistoryApi> {
  return fetchApi(`/api/v1/meetings/${meetingId}/place_history`);
}

export async function getPlaceDetail(placeId: string): Promise<PlaceDetailApi> {
  return fetchApi<PlaceDetailApi>(`/api/v1/places/${placeId}`);
}

export async function getPlaceRatings(placeId: string): Promise<PlaceRatingsApi> {
  return fetchApi<PlaceRatingsApi>(`/api/v1/places/${placeId}/ratings`);
}

export async function getPlaceMeetingHistory(
  placeId: string,
  limit = 20,
): Promise<PlaceMeetingHistoryApi> {
  const params = new URLSearchParams({ limit: String(limit) });
  return fetchApi<PlaceMeetingHistoryApi>(
    `/api/v1/places/${placeId}/meeting-history?${params.toString()}`,
  );
}

export type CreateRatingRequest = {
  user_id: string;
  rating: number;
  would_revisit: boolean;
};

export type RatingResponse = {
  id: string;
  event_id: string;
  user_id: string;
  rating: number;
  would_revisit: boolean;
  created_at: string;
};

export async function createEventRating(
  eventId: string,
  data: CreateRatingRequest,
): Promise<RatingResponse> {
  const res = await fetch(`${API_BASE}/api/v1/events/${eventId}/ratings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(
      err.detail?.error?.message || "평가 등록에 실패했어요",
    );
  }
  return res.json() as Promise<RatingResponse>;
}

export async function getRanking(
  district: string,
  category: string,
  limit = 10,
): Promise<RankingResponseApi> {
  const params = new URLSearchParams({
    district,
    category,
    limit: String(limit),
  });
  return fetchApi(`/api/v1/ranking?${params.toString()}`);
}

export async function createMeeting(
  data: CreateMeetingRequest,
): Promise<MeetingApi> {
  const res = await fetch(`${API_BASE}/api/v1/meetings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(
      err.detail?.error?.message || "모임 만들기에 실패했어요",
    );
  }
  return res.json() as Promise<MeetingApi>;
}
