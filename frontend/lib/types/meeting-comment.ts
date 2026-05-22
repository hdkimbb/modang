export interface CommentAuthorApi {
  user_id: string;
  name: string;
  avatar_url: string | null;
  is_host: boolean;
}

export interface CommentMentionPlaceApi {
  place_id: string;
  name: string;
}

export interface CommentMentionUserApi {
  user_id: string;
  name: string;
  avatar_url: string | null;
}

export interface MeetingPostCommentApi {
  id: string;
  author: CommentAuthorApi;
  content: string;
  mentions: CommentMentionPlaceApi[];
  mention_users: CommentMentionUserApi[];
  created_at: string;
  relative_time: string;
}

export interface MeetingPostCommentListApi {
  items: MeetingPostCommentApi[];
  total: number;
}

export type CreateMeetingPostCommentRequest = {
  author_user_id: string;
  content: string;
  mention_place_ids: string[];
  mention_user_ids?: string[];
};

export interface PlaceQuickSearchItemApi {
  place_id: string;
  name: string;
  address: string;
  meeting_count: number;
}

export interface PlaceQuickSearchApi {
  items: PlaceQuickSearchItemApi[];
}
