// Shopping list types and interfaces

export type ShoppingTag = '一般' | '寄食' | '服飾' | '重要' | '其他';
export type ShoppingPriority = 'normal' | 'important';

export interface ShoppingItem {
  id: string;
  trip_id: string;
  name: string;
  store?: string;
  image?: string;
  weblink?: string;
  tags: ShoppingTag[];
  checked: boolean;
  priority: ShoppingPriority;
  created_at: string;
  updated_at: string;
}

export interface CreateShoppingItemDto {
  trip_id: string;
  name: string;
  store?: string;
  image?: string;
  weblink?: string;
  tags?: ShoppingTag[];
  priority?: ShoppingPriority;
}

export interface UpdateShoppingItemDto {
  name?: string;
  store?: string;
  image?: string;
  weblink?: string;
  tags?: ShoppingTag[];
  checked?: boolean;
  priority?: ShoppingPriority;
}

export interface ShoppingStats {
  toBuy: number;
  bought: number;
  total: number;
}

export interface ShoppingFilterOption {
  id: string;
  label: string;
  tag?: ShoppingTag;
  count: number;
}
