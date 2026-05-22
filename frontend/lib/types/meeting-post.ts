export interface MeetingPostAuthorApi {
  user_id: string;
  name: string;
  avatar_url: string | null;
  is_host: boolean;
}

export interface MentionPlaceApi {
  place_id: string;
  name: string;
}

export interface MentionUserApi {
  user_id: string;
  name: string;
  avatar_url?: string | null;
}

export interface MeetingPostItemApi {
  id: string;
  author: MeetingPostAuthorApi;
  board_type: string;
  content: string;
  image_urls: string[];
  mention_places: MentionPlaceApi[];
  mention_users: MentionUserApi[];
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  relative_time: string;
}

export interface MeetingPostListApi {
  items: MeetingPostItemApi[];
  total: number;
  board_counts: Record<string, number>;
}

export type CreateMeetingPostRequest = {
  author_user_id: string;
  board_type: string;
  content: string;
  image_urls: string[];
  mention_place_ids: string[];
  mention_user_ids?: string[];
};

export const BOARD_TYPE_LABELS: Record<string, string> = {
  free: "자유 게시판",
  notice: "공지",
};
