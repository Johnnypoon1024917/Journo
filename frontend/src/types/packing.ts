// Packing list types and interfaces

export type PackingCategory = 
  | 'clothing'        // 服飾
  | 'warm_layers'     // 保暖/內層
  | 'toiletries'      // 個人護理
  | 'electronics'     // 電子產品
  | 'documents'       // 文件/重要物品
  | 'health'          // 健康/藥品
  | 'misc'            // 其他
  | 'snacks';         // 零食/飲食

export interface PackingItem {
  id: string;
  packing_list_id: string;
  name: string;
  category: PackingCategory | null;
  quantity: number;
  is_packed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  trip_id?: string; // Added by JOIN in API
}

export interface PackingItemWithUser extends PackingItem {
  user: {
    id: string;
    name: string;
  };
}

export interface CreatePackingItemDto {
  name: string;
  category: PackingCategory;
  notes?: string;
  quantity?: number;
}

export interface UpdatePackingItemDto {
  name?: string;
  category?: PackingCategory;
  is_packed?: boolean;
  notes?: string;
  quantity?: number;
}

export interface PackingTemplate {
  id: string;
  destination_type: string | null;
  weather_condition: string | null;
  trip_duration_days: number | null;
  item: string;
  category: string;
  created_at: string;
}

export interface PackingListProgress {
  total_items: number;
  checked_items: number;
  percentage: number;
  by_category: {
    [key in PackingCategory]?: {
      total: number;
      checked: number;
    };
  };
}

export interface Traveler {
  name: string;
  age?: number;
  ageGroup?: 'adult' | 'child' | 'baby';
}

export interface PackingSuggestionParams {
  destination?: string;
  destination_type?: string;
  weather?: {
    maxTemp: number;
    minTemp: number;
    condition: string;
  };
  trip_duration_days?: number;
  activities?: string[];
  travelers?: Traveler[];
}
