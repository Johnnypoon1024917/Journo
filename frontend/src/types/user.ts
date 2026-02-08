// User and badge types
import { User } from './auth';

export type { User };

export interface UserProfile extends User {
  badges: UserBadge[];
  trip_count: number;
  community_post_count: number;
}

export type BadgeType = 
  | 'golden_hour' 
  | 'food_explorer' 
  | 'early_bird'
  | 'world_traveler'
  | 'budget_master'
  | 'packing_pro';

export interface UserBadge {
  id: string;
  user_id: string;
  trip_id: string | null;
  badge_type: BadgeType;
  earned_at: string;
}

export interface UserBadgeWithTrip extends UserBadge {
  trip?: {
    id: string;
    title: string;
    destination: string;
  };
}

export interface CreateUserBadgeDto {
  user_id: string;
  trip_id?: string;
  badge_type: BadgeType;
}

export interface BadgeDefinition {
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  criteria: string;
}

// Badge definitions for display
export const BADGE_DEFINITIONS: Record<BadgeType, BadgeDefinition> = {
  golden_hour: {
    type: 'golden_hour',
    name: 'Golden Hour',
    description: 'Uploaded a photo after 6 PM',
    icon: '🌅',
    criteria: 'Upload a photo with timestamp after 6 PM'
  },
  food_explorer: {
    type: 'food_explorer',
    name: 'Food Explorer',
    description: 'Added 10+ food places across all trips',
    icon: '🍕',
    criteria: 'Add 10 or more places with type "food"'
  },
  early_bird: {
    type: 'early_bird',
    name: 'Early Bird',
    description: 'Added a place with start time before 9 AM',
    icon: '🌄',
    criteria: 'Add a place with start time before 9 AM'
  },
  world_traveler: {
    type: 'world_traveler',
    name: 'World Traveler',
    description: 'Created trips to 5+ different countries',
    icon: '🌍',
    criteria: 'Create trips to 5 or more different countries'
  },
  budget_master: {
    type: 'budget_master',
    name: 'Budget Master',
    description: 'Completed a trip within budget',
    icon: '💰',
    criteria: 'Complete a trip with total spent <= total budget'
  },
  packing_pro: {
    type: 'packing_pro',
    name: 'Packing Pro',
    description: 'Checked off all items on a packing list',
    icon: '🎒',
    criteria: 'Check all items on a packing list'
  }
};
