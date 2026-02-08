import React from 'react';
import { PackingListProgress } from '../../types/packing';

interface PackingProgressProps {
  progress: PackingListProgress;
}

export const PackingProgress: React.FC<PackingProgressProps> = ({ progress }) => {
  const { checked_items, total_items, percentage } = progress;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Packing Progress
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {checked_items} / {total_items} items packed
          </p>
        </div>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {percentage}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Completion Message */}
      {percentage === 100 && (
        <div className="mt-4 text-center">
          <p className="text-green-600 dark:text-green-400 font-medium">
            🎉 All packed and ready to go!
          </p>
        </div>
      )}
    </div>
  );
};
