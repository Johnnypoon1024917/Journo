// Sticker-related types and interfaces

export type StickerCategory =
  | 'characters'
  | 'activities'
  | 'transportation'
  | 'food'
  | 'landmarks'
  | 'emotions'
  | 'weather'
  | 'seasonal';

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export interface Sticker {
  id: string;
  name?: string; // Optional name for custom stickers
  image: string; // URL or data URI
  category: StickerCategory;
  tags: string[];
  aiGenerated: boolean;
  destination?: string;
  season?: Season;
  created_at: string;
}

export interface StickerPlacement {
  id: string;
  stickerId: string;
  elementId: string;
  elementType: 'day' | 'activity' | 'booking';
  position: { x: number; y: number };
  rotation: number; // degrees
  scale: number; // 0.5 to 2.0
  value?: number; // Optional value (0-200%) for progress, discount, etc.
  created_at: string;
}

export interface CreateStickerDto {
  image: string;
  category: StickerCategory;
  tags?: string[];
  aiGenerated?: boolean;
  destination?: string;
  season?: Season;
}

export interface CreateStickerPlacementDto {
  stickerId: string;
  elementId: string;
  elementType: 'day' | 'activity' | 'booking';
  position: { x: number; y: number };
  rotation?: number;
  scale?: number;
}

export interface UpdateStickerPlacementDto {
  position?: { x: number; y: number };
  rotation?: number;
  scale?: number;
}

// AI Sticker Generation Request
export interface GenerateStickersRequest {
  destination: string;
  tripDates?: {
    startDate: string;
    endDate: string;
  };
  categories?: StickerCategory[];
  count?: number;
}

export interface GenerateStickersResponse {
  stickers: Sticker[];
}
