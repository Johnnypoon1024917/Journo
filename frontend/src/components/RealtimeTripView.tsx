import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useRealtimeStore } from '../stores/realtimeStore';
import { ConnectionStatus } from './ConnectionStatus';

interface RealtimeTripViewProps {
  tripId: string;
  children: React.ReactNode;
}

/**
 * Wrapper component that enables real-time updates for a trip
 * Handles Socket.IO connection and event subscriptions
 */
export const RealtimeTripView = ({ tripId, children }: RealtimeTripViewProps) => {
  const [updates, setUpdates] = useState<any[]>([]);
  const { setConnected, setConnectionError, updatePresence } = useRealtimeStore();

  // Setup socket connection with event handlers
  const { isConnected, error } = useSocket({
    autoConnect: true,
    tripId,
    onTripUpdated: (data) => {
      console.log('Trip updated in real-time:', data);
      setUpdates((prev) => [...prev, { type: 'trip', data, timestamp: Date.now() }]);
      // Trigger a refetch or update local state here
    },
    onStoryAdded: (data) => {
      console.log('Story item added in real-time:', data);
      setUpdates((prev) => [...prev, { type: 'story', data, timestamp: Date.now() }]);
      // Add story item to local state
    },
    onPackingUpdated: (data) => {
      console.log('Packing list updated in real-time:', data);
      setUpdates((prev) => [...prev, { type: 'packing', data, timestamp: Date.now() }]);
      // Update packing list in local state
    },
    onPlaceAdded: (data) => {
      console.log('Place added in real-time:', data);
      setUpdates((prev) => [...prev, { type: 'place-added', data, timestamp: Date.now() }]);
      // Add place to local state
    },
    onPlaceUpdated: (data) => {
      console.log('Place updated in real-time:', data);
      setUpdates((prev) => [...prev, { type: 'place-updated', data, timestamp: Date.now() }]);
      // Update place in local state
    },
    onPlaceDeleted: (data) => {
      console.log('Place deleted in real-time:', data);
      setUpdates((prev) => [...prev, { type: 'place-deleted', data, timestamp: Date.now() }]);
      // Remove place from local state
    },
    onPresenceUpdate: (data) => {
      console.log('Presence updated:', data);
      updatePresence(tripId, {
        viewerCount: data.viewerCount,
        viewers: data.viewers,
      });
    },
  });

  // Update realtime store with connection status
  useEffect(() => {
    setConnected(isConnected);
  }, [isConnected, setConnected]);

  useEffect(() => {
    if (error) {
      setConnectionError(error.message);
    } else {
      setConnectionError(null);
    }
  }, [error, setConnectionError]);

  return (
    <div className="relative">
      {children}
      <ConnectionStatus tripId={tripId} />
      
      {/* Debug: Show recent updates in development */}
      {import.meta.env.DEV && updates.length > 0 && (
        <div className="fixed bottom-20 right-4 max-w-sm bg-gray-900 text-white p-4 rounded-lg shadow-lg text-xs z-40 max-h-64 overflow-y-auto">
          <div className="font-bold mb-2">Real-time Updates (Dev Only)</div>
          {updates.slice(-5).reverse().map((update, idx) => (
            <div key={idx} className="mb-2 pb-2 border-b border-gray-700">
              <div className="font-semibold text-blue-400">{update.type}</div>
              <div className="text-gray-400 text-xs">
                {new Date(update.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
