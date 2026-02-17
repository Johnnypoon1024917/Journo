/**
 * Sync Conflict Resolution Dialog
 * 
 * Displays when a sync conflict is detected and allows the user to choose
 * which version to keep (local or server).
 * 
 * Validates Requirement 11.6: Show conflict resolution dialog and allow user to choose version
 */

import React from 'react';
import { X } from 'lucide-react';

export interface SyncConflict {
  id: string;
  resourceType: 'trip' | 'trip_day' | 'place' | 'story_item' | 'packing_item';
  resourceId: string;
  resourceName: string;
  localData: any;
  serverData: any;
  localModifiedAt: string;
  serverModifiedAt: string;
}

interface SyncConflictDialogProps {
  conflict: SyncConflict;
  onResolve: (conflictId: string, choice: 'local' | 'server') => void;
  onCancel: () => void;
}

/**
 * SyncConflictDialog Component
 * 
 * Shows a dialog when a sync conflict is detected, displaying both versions
 * and allowing the user to choose which one to keep.
 */
export const SyncConflictDialog: React.FC<SyncConflictDialogProps> = ({
  conflict,
  onResolve,
  onCancel,
}) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getResourceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      trip: 'Trip',
      trip_day: 'Trip Day',
      place: 'Place',
      story_item: 'Story Item',
      packing_item: 'Packing Item',
    };
    return labels[type] || type;
  };

  const renderDataPreview = (data: any) => {
    if (!data) return <p className="text-gray-500">No data</p>;

    // Show relevant fields based on resource type
    const fields: Record<string, string[]> = {
      trip: ['title', 'destination', 'start_date', 'end_date'],
      place: ['name', 'address', 'time_start', 'time_end', 'notes'],
      packing_item: ['item', 'category', 'is_checked'],
      story_item: ['type', 'caption'],
    };

    const relevantFields = fields[conflict.resourceType] || Object.keys(data).slice(0, 5);

    return (
      <div className="space-y-1">
        {relevantFields.map((field) => {
          const value = data[field];
          if (value === undefined || value === null) return null;

          return (
            <div key={field} className="text-sm">
              <span className="font-medium text-gray-700">{field}: </span>
              <span className="text-gray-900">
                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      role="dialog"
      aria-labelledby="conflict-dialog-title"
      aria-describedby="conflict-dialog-description"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 id="conflict-dialog-title" className="text-xl font-semibold text-gray-900">
            Sync Conflict Detected
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <p id="conflict-dialog-description" className="text-gray-700 mb-4">
            Changes were made to this {getResourceTypeLabel(conflict.resourceType).toLowerCase()}{' '}
            both locally and on the server. Please choose which version to keep.
          </p>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Resource:</strong> {conflict.resourceName}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Local Version */}
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Your Local Changes</h3>
                <span className="text-xs text-gray-500">
                  {formatDate(conflict.localModifiedAt)}
                </span>
              </div>
              {renderDataPreview(conflict.localData)}
            </div>

            {/* Server Version */}
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Server Version</h3>
                <span className="text-xs text-gray-500">
                  {formatDate(conflict.serverModifiedAt)}
                </span>
              </div>
              {renderDataPreview(conflict.serverData)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onResolve(conflict.id, 'server')}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Keep Server Version
          </button>
          <button
            onClick={() => onResolve(conflict.id, 'local')}
            className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            Keep My Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncConflictDialog;
