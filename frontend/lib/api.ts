import type { MeetingApi } from "@/lib/meetings-map";
import {
  mapPlaceSearchItem,
  type Place,
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

export async function searchPlaces(query: string): Promise<Place[]> {
  const params = new URLSearchParams({ q: query.trim() });
  const data = await fetchApi<PlaceSearchResponse>(
    `/api/v1/places/search?${params.toString()}`,
  );
  return data.items.map(mapPlaceSearchItem);
}

export async function getRecommendedPlaces(limit = 2): Promise<Place[]> {
  const params = new URLSearchParams({ limit: String(limit) });
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
};

export async function getMeetings(): Promise<MeetingApi[]> {
  const data = await fetchApi<{ items: MeetingApi[] }>("/api/v1/meetings");
  return data.items;
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
