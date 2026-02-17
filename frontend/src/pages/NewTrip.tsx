/**
 * NewTrip Page
 * 
 * Full-page wrapper for the new trip creation flow.
 * Provides a clean, focused experience for trip creation.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NewTripFlow } from '@/components/bubblequest/NewTripFlow';

export const NewTrip: React.FC = () => {
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate('/');
  };

  const handleComplete = (tripId: string) => {
    navigate(`/trip/${tripId}/schedule`);
  };

  return (
    <div className="min-h-screen bg-[#f7f3eb] dark:bg-bubblequest-neutral-900 py-8 px-4">
      <NewTripFlow
        onCancel={handleCancel}
        onComplete={handleComplete}
      />
    </div>
  );
};

export default NewTrip;
