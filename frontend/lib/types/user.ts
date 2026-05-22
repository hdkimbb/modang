export interface UserSearchItemApi {
  user_id: string;
  name: string;
  profile_image_url: string | null;
}

export interface UserSearchApi {
  items: UserSearchItemApi[];
}
