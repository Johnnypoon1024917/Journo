import React, { useState } from 'react';
import { Traveler } from '../../types/packing';

interface TravelerManagerProps {
  travelers: Traveler[];
  onTravelersChange: (travelers: Traveler[]) => void;
}

export const TravelerManager: React.FC<TravelerManagerProps> = ({
  travelers,
  onTravelersChange,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTraveler, setNewTraveler] = useState<Traveler>({
    name: '',
    ageGroup: 'adult',
  });

  const handleAddTraveler = () => {
    if (newTraveler.name.trim()) {
      onTravelersChange([...travelers, newTraveler]);
      setNewTraveler({ name: '', ageGroup: 'adult' });
      setShowAddForm(false);
    }
  };

  const handleRemoveTraveler = (index: number) => {
    onTravelersChange(travelers.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Travelers</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showAddForm ? 'Cancel' : '+ Add Traveler'}
        </button>
      </div>

      {/* Traveler List */}
      {travelers.length > 0 && (
        <div className="space-y-2 mb-3">
          {travelers.map((traveler, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-white dark:bg-gray-900 p-2 rounded"
            >
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {traveler.name}
                </span>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  ({traveler.ageGroup === 'baby' ? '👶 Baby' : traveler.ageGroup === 'child' ? '🧒 Child' : '👤 Adult'})
                </span>
              </div>
              <button
                onClick={() => handleRemoveTraveler(index)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Traveler Form */}
      {showAddForm && (
        <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={newTraveler.name}
              onChange={(e) => setNewTraveler({ ...newTraveler, name: e.target.value })}
              placeholder="e.g., John, Sarah"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Age Group
            </label>
            <select
              value={newTraveler.ageGroup}
              onChange={(e) =>
                setNewTraveler({
                  ...newTraveler,
                  ageGroup: e.target.value as 'adult' | 'child' | 'baby',
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            >
              <option value="adult">👤 Adult (13+)</option>
              <option value="child">🧒 Child (2-12)</option>
              <option value="baby">👶 Baby (0-2)</option>
            </select>
          </div>

          <button
            onClick={handleAddTraveler}
            disabled={!newTraveler.name.trim()}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
          >
            Add Traveler
          </button>
        </div>
      )}

      {travelers.length === 0 && !showAddForm && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
          No travelers added yet
        </p>
      )}
    </div>
  );
};
