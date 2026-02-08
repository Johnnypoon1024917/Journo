import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import { SuccessAnimation } from './SuccessAnimation';

export interface TripSummary {
  tripId: string;
  destination: string;
  duration: number;
  totalPlaces: number;
  estimatedCost: number;
  startDate: string;
  endDate: string;
  travelStyle: string;
  interests: string[];
}

export interface SuccessConfirmationProps {
  tripSummary: TripSummary;
  onViewTrip: (tripId: string) => void;
  onCreateAnother?: () => void;
  autoRedirectDelay?: number; // in milliseconds, default 5000
  showAutoRedirect?: boolean;
}

export const SuccessConfirmation: React.FC<SuccessConfirmationProps> = ({
  tripSummary,
  onViewTrip,
  onCreateAnother,
  autoRedirectDelay = 5000,
  showAutoRedirect = true
}) => {
  const [countdown, setCountdown] = useState(Math.ceil(autoRedirectDelay / 1000));
  const [autoRedirectCancelled, setAutoRedirectCancelled] = useState(false);

  useEffect(() => {
    if (!showAutoRedirect || autoRedirectCancelled) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onViewTrip(tripSummary.tripId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showAutoRedirect, autoRedirectCancelled, onViewTrip, tripSummary.tripId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleViewTrip = () => {
    setAutoRedirectCancelled(true);
    onViewTrip(tripSummary.tripId);
  };

  const handleCreateAnother = () => {
    setAutoRedirectCancelled(true);
    if (onCreateAnother) {
      onCreateAnother();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8 max-w-2xl mx-auto">
      {/* Success Animation */}
      <SuccessAnimation show={true} />

      {/* Success Message */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🎉 Trip Created Successfully!
        </h2>
        <p className="text-gray-600 text-lg">
          Your {tripSummary.duration}-day adventure to {tripSummary.destination} is ready
        </p>
      </div>

      {/* Trip Summary Card */}
      <div className="w-full max-w-md bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 shadow-sm">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {tripSummary.destination}
          </h3>
          <p className="text-sm text-gray-600">
            {formatDate(tripSummary.startDate)} - {formatDate(tripSummary.endDate)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{tripSummary.totalPlaces}</div>
            <div className="text-xs text-gray-600">Places to Visit</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(tripSummary.estimatedCost)}</div>
            <div className="text-xs text-gray-600">Estimated Cost</div>
          </div>
        </div>

        <div className="text-center mb-4">
          <div className="text-sm text-gray-700 mb-2">
            <span className="font-medium">Travel Style:</span> {tripSummary.travelStyle}
          </div>
          <div className="flex flex-wrap justify-center gap-1">
            {tripSummary.interests.slice(0, 3).map((interest, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {interest}
              </span>
            ))}
            {tripSummary.interests.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{tripSummary.interests.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Features Included */}
        <div className="bg-white rounded-lg p-3 mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">What's Included:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center">
              <span className="text-green-500 mr-1">✓</span>
              Optimized routes
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-1">✓</span>
              Weather forecasts
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-1">✓</span>
              Smart packing list
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-1">✓</span>
              Budget tracking
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="w-full max-w-md bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
          <span className="mr-2">🚀</span>
          What's Next?
        </h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Customize places, times, and details</li>
          <li>• Invite friends to collaborate</li>
          <li>• Add photos and notes during your trip</li>
          <li>• Export your itinerary as PDF</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <Button
          variant="primary"
          onClick={handleViewTrip}
          className="flex-1 flex items-center justify-center space-x-2"
        >
          <span>👀</span>
          <span>View My Trip</span>
        </Button>
        
        {onCreateAnother && (
          <Button
            variant="secondary"
            onClick={handleCreateAnother}
            className="flex-1 flex items-center justify-center space-x-2"
          >
            <span>➕</span>
            <span>Create Another</span>
          </Button>
        )}
      </div>

      {/* Auto-redirect Notice */}
      {showAutoRedirect && !autoRedirectCancelled && countdown > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">
            Automatically redirecting to your trip in {countdown} second{countdown !== 1 ? 's' : ''}
          </p>
          <button
            onClick={() => setAutoRedirectCancelled(true)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Cancel auto-redirect
          </button>
        </div>
      )}

      {/* Share Options */}
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2">
          Love your itinerary? Share it with others!
        </p>
        <div className="flex justify-center space-x-4 text-xs">
          <button className="text-blue-600 hover:text-blue-800 underline">
            Copy Link
          </button>
          <button className="text-blue-600 hover:text-blue-800 underline">
            Share on Social
          </button>
          <button className="text-blue-600 hover:text-blue-800 underline">
            Send via Email
          </button>
        </div>
      </div>
    </div>
  );
};