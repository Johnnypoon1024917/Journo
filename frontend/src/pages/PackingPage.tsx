import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';
import { tripService } from '../services/tripService';
import { PackingList } from '../components/packing/PackingList';
import { Spinner } from '../components/common/Spinner';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Trip {
  id: string;
  title: string;
  destination?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export function PackingPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { accessToken, logout } = useEnhancedAuthStore();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId || !accessToken) {
        navigate('/login');
        return;
      }

      try {
        setIsLoading(true);
        const response = await tripService.getTripById(tripId, accessToken);
        setTrip(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching trip:', err);
        
        if (err.status === 404) {
          setError('Trip not found. It may have been deleted.');
          setTimeout(() => navigate('/'), 3000);
        } else if (err.status === 401) {
          await logout();
          navigate('/login');
        } else {
          setError(err.message || 'Failed to load trip');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrip();
  }, [tripId, accessToken, navigate, logout]);

  const handleBack = () => {
    if (tripId) {
      navigate(`/trip/${tripId}`);
    } else {
      navigate('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f3eb] dark:bg-kawaii-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="large" />
          <p className="text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mt-4">Loading trip...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-[#f7f3eb] dark:bg-kawaii-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Trip not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-kawaii-primary-600 hover:bg-kawaii-primary-700 text-white rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f3eb] dark:bg-kawaii-neutral-900">
      {/* Header */}
      <div className="bg-white dark:bg-kawaii-neutral-800 shadow-sm border-b border-kawaii-neutral-200 dark:border-kawaii-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Back to trip"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Packing List
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {trip.title} {trip.destination && `• ${trip.destination}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <PackingList tripId={tripId!} tripTitle={trip.title} />
        </div>
      </div>
    </div>
  );
}