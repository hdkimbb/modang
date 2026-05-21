export interface MeetingMemberApi {
  user_id: string;
  name: string;
  role: string;
}

export interface MeetingEventPlaceApi {
  place_id: string;
  name: string;
}

export interface MeetingEventSummaryApi {
  event_id: string;
  title: string;
  scheduled_at: string;
  status: string;
  attendee_count: number;
  place: MeetingEventPlaceApi;
  avg_rating: number | null;
  rating_count: number;
}

export interface MeetingDetailApi {
  id: string;
  name: string;
  category: string;
  neighborhood: string;
  activity_range: number;
  description: string | null;
  member_count: number;
  created_at: string;
  members: MeetingMemberApi[];
  upcoming_events: MeetingEventSummaryApi[];
}

export interface MeetingEventsListApi {
  items: MeetingEventSummaryApi[];
}

export interface PlaceHistoryItemApi {
  place: MeetingEventPlaceApi;
  visit_count: number;
  last_visited_at: string;
  avg_rating_from_us: number | null;
}

export interface MeetingPlaceHistoryApi {
  items: PlaceHistoryItemApi[];
}

export type MeetingDetailTab = "schedule" | "places";
