import { useRealtimeStore } from '../stores/realtimeStore';

/**
 * Connection status indicator component
 * Shows real-time connection status and viewer count
 */
export const ConnectionStatus = ({ tripId }: { tripId?: string }) => {
  const { isConnected, connectionError, presence } = useRealtimeStore();

  const tripPresence = tripId ? presence[tripId] : null;

  if (!isConnected && !connectionError) {
    return null; // Don't show anything while connecting
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Connection status badge */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium ${
          isConnected
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}
        />
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>

      {/* Viewer count for trip */}
      {isConnected && tripPresence && tripPresence.viewerCount > 0 && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span>
            {tripPresence.viewerCount}{' '}
            {tripPresence.viewerCount === 1 ? 'viewer' : 'viewers'}
          </span>
        </div>
      )}

      {/* Error message */}
      {connectionError && (
        <div className="mt-2 px-3 py-2 rounded-lg shadow-lg text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          {connectionError}
        </div>
      )}
    </div>
  );
};
