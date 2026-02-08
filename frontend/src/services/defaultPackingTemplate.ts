import { PackingCategory } from '../types/packing';

export interface DefaultPackingItem {
  item: string;
  category: PackingCategory;
}

// Default packing list template based on common travel needs
export const DEFAULT_PACKING_ITEMS: DefaultPackingItem[] = [
  // Important Documents (重要證件)
  { item: '護照', category: 'documents' },
  { item: '信用卡', category: 'documents' },
  { item: '外幣', category: 'documents' },
  { item: '國際駕照', category: 'documents' },

  // Clothing (衣物類)
  { item: '上服', category: 'clothing' },
  { item: '褲子', category: 'clothing' },
  { item: '內衣褲', category: 'clothing' },
  { item: '睡衣', category: 'clothing' },
  { item: '鞋子與拖鞋', category: 'clothing' },
  { item: '襪子', category: 'clothing' },

  // Electronics (3C物品)
  { item: '手機', category: 'electronics' },
  { item: '行動電源', category: 'electronics' },
  { item: '手機充電器', category: 'electronics' },
  { item: 'Wi-Fi分享器/上網卡', category: 'electronics' },
  { item: '耳機', category: 'electronics' },

  // Toiletries (日常盥洗用品)
  { item: '牙刷/牙膏/毛巾', category: 'toiletries' },
  { item: '洗面乳/沐浴乳', category: 'toiletries' },
  { item: '防曬油', category: 'toiletries' },
  { item: '隨身藥品', category: 'health' },

  // Other Items (其他物品)
  { item: '水瓶或保溫瓶', category: 'misc' },
  { item: '筆', category: 'misc' },
  { item: '塑膠袋', category: 'misc' },
  { item: '雨傘', category: 'misc' },
  { item: '環保餐具', category: 'misc' },
];

// Category labels in Traditional Chinese
export const CATEGORY_LABELS: Record<PackingCategory, string> = {
  documents: '重要證件',
  clothing: '衣物類',
  electronics: '3C物品',
  toiletries: '日常盥洗用品',
  health: '健康用品',
  essentials: '必需品',
  activities: '活動用品',
  misc: '其他物品',
};

// Get default items by category
export function getDefaultItemsByCategory(): Map<PackingCategory, DefaultPackingItem[]> {
  const grouped = new Map<PackingCategory, DefaultPackingItem[]>();
  
  DEFAULT_PACKING_ITEMS.forEach((item) => {
    const existing = grouped.get(item.category) || [];
    grouped.set(item.category, [...existing, item]);
  });
  
  return grouped;
}

// Get category display order
export function getCategoryOrder(): PackingCategory[] {
  return [
    'documents',
    'clothing',
    'electronics',
    'toiletries',
    'health',
    'misc',
    'essentials',
    'activities',
  ];
}

// Count items by category
export function getDefaultItemCounts(): Record<PackingCategory, number> {
  const counts: Partial<Record<PackingCategory, number>> = {};
  
  DEFAULT_PACKING_ITEMS.forEach((item) => {
    counts[item.category] = (counts[item.category] || 0) + 1;
  });
  
  return counts as Record<PackingCategory, number>;
}
