/**
 * Default Packing Items
 * 
 * Comprehensive list of default packing items organized by category
 * for trips to cold weather destinations (e.g., Japan in winter)
 */

import { PackingCategory } from '@/types/packing';

export interface DefaultPackingItem {
  item: string;
  category: PackingCategory;
  priority: 'important' | 'normal';
  notes?: string;
}

export const DEFAULT_PACKING_ITEMS: DefaultPackingItem[] = [
  // 服飾 (Clothing) - 重要
  { item: '超極暖內層上衣', category: 'clothing', priority: 'important' },
  { item: '超極暖保暖長褲', category: 'clothing', priority: 'important' },
  { item: '長袖上衣', category: 'clothing', priority: 'important' },
  { item: '厚毛衣 / 衛衣', category: 'clothing', priority: 'important' },
  { item: '長褲 / 牛仔褲', category: 'clothing', priority: 'important' },
  { item: '內褲', category: 'clothing', priority: 'important' },
  { item: '襪子 (厚款優先)', category: 'clothing', priority: 'important' },
  { item: '睡衣 / 家居服', category: 'clothing', priority: 'important' },
  { item: '輕便外套 / 防風外套', category: 'clothing', priority: 'important' },
  { item: '保暖羽絨服 / 大衣', category: 'clothing', priority: 'important' },

  // 保暖/內層 (Warm Layers) - 一般
  { item: '圍巾 / 頸巾', category: 'warm_layers', priority: 'normal' },
  { item: '毛帽 / 冷帽', category: 'warm_layers', priority: 'normal' },
  { item: '手套', category: 'warm_layers', priority: 'normal' },
  { item: '耳罩', category: 'warm_layers', priority: 'normal' },

  // 個人護理 (Personal Care / Toiletries) - 一般
  { item: '牙刷 + 牙膏', category: 'toiletries', priority: 'normal' },
  { item: '洗面乳 / 潔面', category: 'toiletries', priority: 'normal' },
  { item: '洗髮精 / 護髮素 (旅行裝)', category: 'toiletries', priority: 'normal' },
  { item: '沐浴乳', category: 'toiletries', priority: 'normal' },
  { item: '護膚品 (保濕霜、唇膏)', category: 'toiletries', priority: 'normal' },
  { item: '除臭劑', category: 'toiletries', priority: 'normal' },
  { item: '衛生用品', category: 'toiletries', priority: 'normal' },
  { item: '毛巾 (快乾款)', category: 'toiletries', priority: 'normal' },
  { item: '梳子', category: 'toiletries', priority: 'normal' },
  { item: '指甲剪', category: 'toiletries', priority: 'normal' },

  // 電子產品 (Electronics) - 重要
  { item: '手機 + 充電線', category: 'electronics', priority: 'important' },
  { item: '行動電源', category: 'electronics', priority: 'important' },
  { item: '轉換插頭', category: 'electronics', priority: 'important' },
  { item: '耳機', category: 'electronics', priority: 'important' },
  { item: '相機 (可選)', category: 'electronics', priority: 'normal' },
  { item: '充電線收納', category: 'electronics', priority: 'normal' },

  // 文件/重要物品 (Documents / Essentials) - 重要
  { item: '護照', category: 'documents', priority: 'important' },
  { item: '身份證 / 回鄉證', category: 'documents', priority: 'important' },
  { item: '機票 / 電子登機證', category: 'documents', priority: 'important' },
  { item: '酒店預訂確認', category: 'documents', priority: 'important' },
  { item: '信用卡 / 現金', category: 'documents', priority: 'important' },
  { item: '旅行保險證明', category: 'documents', priority: 'important' },

  // 健康/藥品 (Health / Medications) - 重要
  { item: '個人常用藥 (感冒藥、胃藥等)', category: 'health', priority: 'important' },
  { item: '暈車藥', category: 'health', priority: 'important' },
  { item: '創可貼 / 消毒用品', category: 'health', priority: 'important' },
  { item: '口罩', category: 'health', priority: 'important' },
  { item: '維他命 / 補充劑', category: 'health', priority: 'normal' },
  { item: '眼藥水', category: 'health', priority: 'normal' },

  // 其他 (Others / Miscellaneous) - 一般
  { item: '折疊雨傘 / 輕便雨衣', category: 'misc', priority: 'normal' },
  { item: '環保水樽', category: 'misc', priority: 'normal' },
  { item: '輕便背包 / 日用小包', category: 'misc', priority: 'normal' },
  { item: '購物袋 (環保袋)', category: 'misc', priority: 'normal' },
  { item: '筆 + 小記事本', category: 'misc', priority: 'normal' },
  { item: '壓縮袋 / 收納袋', category: 'misc', priority: 'normal' },
];
