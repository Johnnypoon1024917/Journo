// Story-related types and interfaces

export type StoryItemType = 'photo' | 'youtube' | 'note';

export interface StoryItem {
  id: string;
  trip_id: string;
  user_id: string;
  type: StoryItemType;
  content_url: string | null;
  caption: string | null;
  created_at: string;
}

export interface StoryItemWithUser extends StoryItem {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateStoryItemDto {
  trip_id: string;
  type: StoryItemType;
  content_url?: string;
  caption?: string;
}

export interface TripLike {
  id: string;
  trip_id: string;
  user_id: string;
  created_at: string;
}

export interface CreateTripLikeDto {
  trip_id: string;
}
