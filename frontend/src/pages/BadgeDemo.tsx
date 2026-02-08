import { useState } from 'react';
import { BadgeDisplay, BadgeGrid, BadgeList } from '../components/common/BadgeDisplay';
import { UserBadge, BADGE_DEFINITIONS } from '../types/user';

// Mock badge data for demonstration
const mockBadges: UserBadge[] = [
  {
    id: '1',
    user_id: 'demo-user',
    trip_id: 'trip-1',
    badge_type: 'golden_hour',
    earned_at: '2024-01-01T19:30:00Z'
  },
  {
    id: '2',
    user_id: 'demo-user',
    trip_id: 'trip-2',
    badge_type: 'food_explorer',
    earned_at: '2024-01-05T14:20:00Z'
  },
  {
    id: '3',
    user_id: 'demo-user',
    trip_id: 'trip-3',
    badge_type: 'early_bird',
    earned_at: '2024-01-10T08:15:00Z'
  },
  {
    id: '4',
    user_id: 'demo-user',
    trip_id: 'trip-1',
    badge_type: 'golden_hour',
    earned_at: '2024-01-15T20:45:00Z'
  }
];

export function BadgeDemo() {
  const [selectedView, setSelectedView] = useState<'grid' | 'list'>('grid');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Badge System Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Demonstration of the achievement badge system for Journo travel platform
          </p>
          
          {/* View Toggle */}
          <div className="flex justify-center gap-2 mb-8">
            <button
              onClick={() => setSelectedView('grid')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedView === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setSelectedView('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedView === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              List View
            </button>
          </div>
        </div>

        {/* Badge Definitions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Available Badge Types
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(BADGE_DEFINITIONS).map((badge) => (
              <div
                key={badge.type}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-lg">
                  {badge.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {badge.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {badge.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {badge.criteria}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Earned Badges */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Earned Badges
            </h2>
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {mockBadges.length} total • {new Set(mockBadges.map(b => b.badge_type)).size} unique
            </span>
          </div>

          {selectedView === 'grid' ? (
            <BadgeGrid badges={mockBadges} />
          ) : (
            <BadgeList badges={mockBadges} />
          )}
        </div>

        {/* Individual Badge Examples */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Badge Display Examples
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Small Size
              </h3>
              <div className="flex gap-4">
                {mockBadges.slice(0, 3).map((badge) => (
                  <BadgeDisplay key={badge.id} badge={badge} size="sm" />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Medium Size with Details
              </h3>
              <div className="space-y-3">
                {mockBadges.slice(0, 2).map((badge) => (
                  <BadgeDisplay key={badge.id} badge={badge} size="md" showDetails />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Large Size with Details
              </h3>
              <BadgeDisplay badge={mockBadges[0]} size="lg" showDetails />
            </div>
          </div>
        </div>

        {/* Implementation Notes */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mt-8">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Implementation Status
          </h2>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Badge types and definitions created</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Backend badge service and API endpoints implemented</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Frontend badge display components created</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Badge checking integrated into place and story controllers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Badge display added to Settings page</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Comprehensive tests written and passing</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Badge Logic Implemented:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>Golden Hour:</strong> Awarded when uploading photos after 6 PM</li>
              <li>• <strong>Food Explorer:</strong> Awarded when adding 10+ food places across all trips</li>
              <li>• <strong>Early Bird:</strong> Awarded when adding places with start time before 9 AM</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}