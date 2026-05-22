export type PendingRatingItemApi = {
  event_id: string;
  meeting_id: string;
  meeting_title: string;
  event_title: string;
  place_id: string;
  place_name: string;
  place_category: string;
  scheduled_at: string;
  ended_at_calculated: string;
};

export type PendingRatingsListApi = {
  items: PendingRatingItemApi[];
};
