export type OwnerTabId = "home" | "insights" | "tools";

export type OwnerRankingSummary = {
  district: string;
  category: string;
  rank: number | null;
  score: number;
  listed_count: number;
};

export type OwnerMentionStats = {
  total: number;
  this_month: number;
};

export type OwnerDashboard = {
  place: {
    id: string;
    name: string;
    address: string;
    district: string;
    category: string;
  };
  stats: {
    total_visits: number;
    this_month_visits: number;
    upcoming_count: number;
  };
  mention_stats: OwnerMentionStats;
  meetings: OwnerMeetingVisit[];
  ranking: OwnerRankingSummary | null;
};

export type OwnerMeetingVisit = {
  meeting_id: string;
  name: string;
  category: string;
  member_count: number;
  scheduled_at: string;
  is_upcoming: boolean;
  place_signal_count: number;
};

export type OwnerMessage = { message: string; active: boolean };

export type RecommendedAction = {
  type: string;
  label: string;
  template: string;
};

export type CategoryInsight = {
  category: string;
  count: number;
  percentage: number;
  avg_member_count: number;
  recommended_action: RecommendedAction;
};

export type OwnerInsights = {
  total_meetings: number;
  top_categories: CategoryInsight[];
};

export type TimeslotInsight = {
  key: string;
  label: string;
  count: number;
  percentage: number;
};

export type OwnerTimeslotInsights = {
  total_events: number;
  slots: TimeslotInsight[];
  peak_slot: string | null;
  low_slot: string | null;
  peak_recommendation: string;
};

export type OwnerRatingStats = {
  average: number | null;
  total_count: number;
  distribution: Record<string, number>;
};

export type OwnerRegularMeetingItem = {
  meeting_id: string;
  title: string;
  category: string;
  visit_count: number;
};

export type OwnerRegularMeetings = {
  items: OwnerRegularMeetingItem[];
};
