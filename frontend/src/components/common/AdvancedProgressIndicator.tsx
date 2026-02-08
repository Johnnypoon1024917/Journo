import React, { useState, useEffect } from 'react';
import { ProgressBar } from './ProgressBar';
import { Spinner } from './Spinner';

export interface ProgressPhase {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number; // in milliseconds
  icon?: string;
}

export interface ProgressIndicatorProps {
  phases: ProgressPhase[];
  currentPhase: string;
  progress: number; // 0-100 for current phase
  overallProgress: number; // 0-100 for entire process
  estimatedTimeRemaining?: number; // in milliseconds
  tips?: string[];
  destinationInfo?: {
    name: string;
    facts?: string[];
  };
  onCancel?: () => void;
  showCancelButton?: boolean;
  error?: string;
}

export const AdvancedProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  phases,
  currentPhase,
  progress,
  overallProgress,
  estimatedTimeRemaining,
  tips = [],
  destinationInfo,
  onCancel,
  showCancelButton = true,
  error
}) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showTips, setShowTips] = useState(false);

  // Rotate tips every 3 seconds
  useEffect(() => {
    if (tips.length > 1) {
      const interval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [tips.length]);

  // Show tips after 5 seconds of processing
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTips(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const currentPhaseData = phases.find(phase => phase.id === currentPhase);
  const currentPhaseIndex = phases.findIndex(phase => phase.id === currentPhase);

  const formatTimeRemaining = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-6xl text-red-500">⚠️</div>
        <div className="text-center max-w-md">
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Processing Error
          </h3>
          <p className="text-red-700 mb-4">{error}</p>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6 max-w-2xl mx-auto">
      {/* Main Progress Indicator */}
      <div className="flex items-center space-x-4">
        <Spinner size="large" />
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {currentPhaseData?.name || 'Processing...'}
          </h3>
          <p className="text-gray-600">
            {currentPhaseData?.description || 'Please wait while we process your request...'}
          </p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="w-full max-w-md">
        <ProgressBar
          progress={overallProgress}
          label="Overall Progress"
          showPercentage={true}
        />
      </div>

      {/* Current Phase Progress */}
      {currentPhaseData && (
        <div className="w-full max-w-md">
          <ProgressBar
            progress={progress}
            label={`${currentPhaseData.name} Progress`}
            showPercentage={true}
            variant="success"
          />
        </div>
      )}

      {/* Phase Timeline */}
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Processing Steps</span>
          {estimatedTimeRemaining && (
            <span className="text-sm text-gray-500">
              ~{formatTimeRemaining(estimatedTimeRemaining)} remaining
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {phases.map((phase, index) => (
            <React.Fragment key={phase.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index < currentPhaseIndex
                      ? 'bg-green-500 text-white'
                      : index === currentPhaseIndex
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index < currentPhaseIndex ? (
                    '✓'
                  ) : index === currentPhaseIndex ? (
                    <Spinner size="small" />
                  ) : (
                    phase.icon || (index + 1)
                  )}
                </div>
                <span className="text-xs text-gray-600 mt-1 text-center max-w-16 truncate">
                  {phase.name}
                </span>
              </div>
              {index < phases.length - 1 && (
                <div
                  className={`flex-1 h-0.5 transition-colors ${
                    index < currentPhaseIndex ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Tips and Destination Info */}
      {showTips && (tips.length > 0 || destinationInfo) && (
        <div className="w-full max-w-md bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-blue-500 mt-0.5">💡</div>
            <div className="flex-1">
              {tips.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    Pro Tip
                  </h4>
                  <p className="text-sm text-blue-800 transition-opacity duration-300">
                    {tips[currentTipIndex]}
                  </p>
                </div>
              )}
              
              {destinationInfo && (
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    About {destinationInfo.name}
                  </h4>
                  {destinationInfo.facts && destinationInfo.facts.length > 0 && (
                    <p className="text-sm text-blue-800">
                      {destinationInfo.facts[currentTipIndex % destinationInfo.facts.length]}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Button */}
      {showCancelButton && onCancel && (
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel and Return to Form
        </button>
      )}

      {/* Processing Details */}
      <div className="text-center text-xs text-gray-500 max-w-md">
        <p>
          We're analyzing thousands of places and optimizing your route for the best experience.
          This process ensures you get personalized recommendations that match your interests and travel style.
        </p>
      </div>
    </div>
  );
};