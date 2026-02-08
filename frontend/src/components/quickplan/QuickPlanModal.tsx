import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { PlaceSuggestionsPreview, DailySuggestions, SuggestedPlace } from './PlaceSuggestionsPreview';
import { AdvancedProgressIndicator, ProgressPhase } from '../common/AdvancedProgressIndicator';
import { ErrorHandler, ErrorInfo, ErrorCreators } from '../common/ErrorHandler';
import { SuccessConfirmation, TripSummary } from '../common/SuccessConfirmation';
import { ServiceHealthMonitor } from '../common/ServiceHealthMonitor';
import { errorHandlingService } from '../../services/errorHandlingService';
import { PlaceCustomizationService } from '../../services/placeCustomizationService';
import { RegenerationMemoryService } from '../../services/regenerationMemoryService';

interface QuickPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedDestination?: string;
  onTripCreated?: (tripId: string) => void;
}

interface InterestCategory {
  id: string;
  name: string;
  icon: string;
  weight: number; // 1-5, affects suggestion priority
}

interface TravelerType {
  type: 'solo' | 'couple' | 'family' | 'friends' | 'business';
  ageGroups?: ('child' | 'teen' | 'adult' | 'senior')[];
}

interface TravelInformation {
  destination: string;
  startDate: string;
  endDate: string;
  duration: number; // calculated automatically
  interests: InterestCategory[];
  budgetLevel: 'low' | 'medium' | 'high';
  travelStyle: 'relaxed' | 'moderate' | 'fast-paced';
  groupSize: number;
  travelerTypes: TravelerType[];
  mustVisitPlaces: string[];
}

interface ValidationErrors {
  destination?: string;
  startDate?: string;
  endDate?: string;
  interests?: string;
  groupSize?: string;
  mustVisitPlaces?: string;
}

export function QuickPlanModal({ isOpen, onClose, suggestedDestination, onTripCreated }: QuickPlanModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [currentStep, setCurrentStep] = useState<'form' | 'progress' | 'preview' | 'success' | 'error'>('form');
  const [suggestions, setSuggestions] = useState<DailySuggestions[]>([]);
  const [alternativeSuggestions, setAlternativeSuggestions] = useState<{ [key: string]: SuggestedPlace[] }>({});
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  
  // Progress tracking state
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [phaseProgress, setPhaseProgress] = useState<number>(0);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>(0);
  const [processingError, setProcessingError] = useState<ErrorInfo | null>(null);
  const [tripSummary, setTripSummary] = useState<TripSummary | null>(null);
  const [preservedFormData, setPreservedFormData] = useState<TravelInformation | null>(null);
  
  const [formData, setFormData] = useState<TravelInformation>({
    destination: suggestedDestination || '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration: 7,
    interests: [],
    budgetLevel: 'medium',
    travelStyle: 'moderate',
    groupSize: 2,
    travelerTypes: [{ type: 'couple' }],
    mustVisitPlaces: []
  });

  const [mustVisitInput, setMustVisitInput] = useState('');

  // Define processing phases for progress tracking
  const processingPhases: ProgressPhase[] = [
    {
      id: 'validation',
      name: 'Validating Input',
      description: 'Checking your travel preferences and requirements',
      estimatedDuration: 1000,
      icon: '✓'
    },
    {
      id: 'searching',
      name: 'Finding Places',
      description: 'Searching for the best places that match your interests',
      estimatedDuration: 8000,
      icon: '🔍'
    },
    {
      id: 'filtering',
      name: 'Filtering Results',
      description: 'Applying your budget and travel style preferences',
      estimatedDuration: 3000,
      icon: '🎯'
    },
    {
      id: 'optimizing',
      name: 'Optimizing Routes',
      description: 'Creating the most efficient daily itineraries',
      estimatedDuration: 5000,
      icon: '🗺️'
    },
    {
      id: 'weather',
      name: 'Weather Integration',
      description: 'Adding weather forecasts and recommendations',
      estimatedDuration: 2000,
      icon: '🌤️'
    },
    {
      id: 'finalizing',
      name: 'Finalizing',
      description: 'Preparing your personalized itinerary',
      estimatedDuration: 1000,
      icon: '✨'
    }
  ];

  // Tips to show during processing
  const processingTips = [
    'We analyze thousands of places to find the perfect matches for your interests',
    'Our route optimization considers traffic patterns and opening hours',
    'Weather data helps us suggest indoor activities for rainy days',
    'Budget filtering ensures recommendations fit your spending preferences',
    'Travel style affects the number of places and pacing of your itinerary',
    'Must-visit places are prioritized and built into your route',
    'We use real-time data from multiple sources for the freshest recommendations'
  ];

  // Destination facts for enhanced user experience
  const getDestinationFacts = (destination: string) => {
    // This would ideally come from a service, but for now we'll use some generic facts
    const facts = [
      `${destination} has unique attractions waiting to be discovered`,
      `Local cuisine in ${destination} offers amazing flavors and experiences`,
      `The best time to visit places in ${destination} varies by season`,
      `${destination} has hidden gems that most tourists never find`,
      `Transportation options in ${destination} can greatly affect your itinerary`
    ];
    return facts;
  };

  const interestOptions = [
    { id: 'food', name: 'Food & Dining', icon: '🍜', weight: 1 },
    { id: 'culture', name: 'Culture & History', icon: '🏛️', weight: 1 },
    { id: 'adventure', name: 'Adventure', icon: '🏔️', weight: 1 },
    { id: 'shopping', name: 'Shopping', icon: '🛍️', weight: 1 },
    { id: 'nature', name: 'Nature', icon: '🌳', weight: 1 },
    { id: 'relaxation', name: 'Relaxation', icon: '🧘', weight: 1 },
    { id: 'nightlife', name: 'Nightlife', icon: '🌃', weight: 1 },
    { id: 'photography', name: 'Photography', icon: '📸', weight: 1 }
  ];

  const travelStyleOptions = [
    {
      value: 'relaxed' as const,
      name: 'Relaxed',
      description: '3-4 places per day, plenty of free time',
      icon: '🐌'
    },
    {
      value: 'moderate' as const,
      name: 'Moderate',
      description: '4-6 places per day, balanced schedule',
      icon: '🚶'
    },
    {
      value: 'fast-paced' as const,
      name: 'Fast-Paced',
      description: '6-8 places per day, action-packed',
      icon: '🏃'
    }
  ];

  const travelerTypeOptions = [
    { type: 'solo' as const, name: 'Solo Traveler', icon: '🧳' },
    { type: 'couple' as const, name: 'Couple', icon: '💑' },
    { type: 'family' as const, name: 'Family', icon: '👨‍👩‍👧‍👦' },
    { type: 'friends' as const, name: 'Friends', icon: '👥' },
    { type: 'business' as const, name: 'Business', icon: '💼' }
  ];

  const budgetOptions = [
    { value: 'low' as const, name: 'Budget', description: '$50-100/day', icon: '💰' },
    { value: 'medium' as const, name: 'Moderate', description: '$100-200/day', icon: '💰💰' },
    { value: 'high' as const, name: 'Luxury', description: '$200+/day', icon: '💰💰💰' }
  ];

  // Calculate duration when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0 && diffDays !== formData.duration) {
        setFormData(prev => ({ ...prev, duration: diffDays }));
      }
    }
  }, [formData.startDate, formData.endDate]);

  // Real-time validation
  useEffect(() => {
    const errors: ValidationErrors = {};

    if (!formData.destination.trim()) {
      errors.destination = 'Destination is required';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    } else if (formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      errors.endDate = 'End date must be after start date';
    }

    if (formData.interests.length === 0) {
      errors.interests = 'Please select at least one interest';
    }

    if (formData.groupSize < 1 || formData.groupSize > 20) {
      errors.groupSize = 'Group size must be between 1 and 20';
    }

    setValidationErrors(errors);
  }, [formData]);

  const handleInterestToggle = (interest: typeof interestOptions[0]) => {
    setFormData(prev => {
      const existingIndex = prev.interests.findIndex(i => i.id === interest.id);
      if (existingIndex >= 0) {
        // Remove interest
        return {
          ...prev,
          interests: prev.interests.filter(i => i.id !== interest.id)
        };
      } else {
        // Add interest
        return {
          ...prev,
          interests: [...prev.interests, interest]
        };
      }
    });
  };

  const handleInterestWeightChange = (interestId: string, weight: number) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.map(interest =>
        interest.id === interestId ? { ...interest, weight } : interest
      )
    }));
  };

  const handleTravelerTypeToggle = (type: TravelerType['type']) => {
    setFormData(prev => {
      const existingIndex = prev.travelerTypes.findIndex(t => t.type === type);
      if (existingIndex >= 0) {
        // Remove traveler type
        return {
          ...prev,
          travelerTypes: prev.travelerTypes.filter(t => t.type !== type)
        };
      } else {
        // Add traveler type
        return {
          ...prev,
          travelerTypes: [...prev.travelerTypes, { type }]
        };
      }
    });
  };

  const handleAddMustVisitPlace = () => {
    if (mustVisitInput.trim() && !formData.mustVisitPlaces.includes(mustVisitInput.trim())) {
      setFormData(prev => ({
        ...prev,
        mustVisitPlaces: [...prev.mustVisitPlaces, mustVisitInput.trim()]
      }));
      setMustVisitInput('');
    }
  };

  const handleRemoveMustVisitPlace = (place: string) => {
    setFormData(prev => ({
      ...prev,
      mustVisitPlaces: prev.mustVisitPlaces.filter(p => p !== place)
    }));
  };

  const isFormValid = () => {
    return Object.keys(validationErrors).length === 0 && 
           formData.destination.trim() && 
           formData.interests.length > 0;
  };

  // Enhanced processing with comprehensive error handling
  const simulateProcessingPhase = async (phase: ProgressPhase, onProgress: (progress: number) => void) => {
    return await errorHandlingService.executeWithRetry(
      async () => {
        const startTime = Date.now();
        const duration = phase.estimatedDuration;
        
        return new Promise<void>((resolve, reject) => {
          const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(100, (elapsed / duration) * 100);
            onProgress(progress);
            
            if (progress >= 100) {
              clearInterval(interval);
              resolve();
            }
          }, 50);
          
          // Simulate potential failures for demonstration
          if (Math.random() < 0.02) { // 2% chance of failure
            setTimeout(() => {
              clearInterval(interval);
              reject(new Error(`${phase.name} service temporarily unavailable`));
            }, duration * 0.7);
          }
        });
      },
      `quick-plan-${phase.id}`,
      {
        preserveUserData: true,
        logError: true,
        fallbackConfig: {
          enableFallback: phase.id !== 'validation', // No fallback for validation
          gracefulDegradation: true
        }
      }
    );
  };

  const executeProcessingPhases = async (travelInfo: TravelInformation) => {
    try {
      setCurrentStep('progress');
      setProcessingError(null);
      
      // Initialize session for memory and personalization
      const newSessionId = await RegenerationMemoryService.initializeSession(
        'user-id', // Would come from auth context
        travelInfo
      );
      setSessionId(newSessionId);
      
      let completedPhases = 0;
      const totalPhases = processingPhases.length;
      
      for (const phase of processingPhases) {
        setCurrentPhase(phase.id);
        setPhaseProgress(0);
        
        // Update estimated time remaining
        const remainingPhases = processingPhases.slice(completedPhases + 1);
        const remainingTime = remainingPhases.reduce((sum, p) => sum + p.estimatedDuration, 0);
        setEstimatedTimeRemaining(remainingTime);
        
        try {
          await simulateProcessingPhase(phase, (progress) => {
            setPhaseProgress(progress);
            const overallProgress = ((completedPhases + (progress / 100)) / totalPhases) * 100;
            setOverallProgress(overallProgress);
          });
          
          completedPhases++;
        } catch (phaseError: any) {
          // Handle phase-specific errors with graceful degradation
          const errorInfo = errorHandlingService.classifyError(phaseError, `quick-plan-${phase.id}`);
          
          if (phase.id === 'weather') {
            // Weather failure is non-critical, continue without weather data
            console.warn('Weather service failed, continuing without weather data');
            completedPhases++;
            continue;
          } else if (phase.id === 'optimizing') {
            // Route optimization failure, use basic ordering
            console.warn('Route optimization failed, using basic place ordering');
            completedPhases++;
            continue;
          } else {
            // Critical phase failure
            throw errorInfo;
          }
        }
      }
      
      // Generate intelligent suggestions using backend
      const enhancedRequest = {
        destination: travelInfo.destination,
        startDate: travelInfo.startDate,
        endDate: travelInfo.endDate,
        duration: travelInfo.duration,
        interests: travelInfo.interests,
        budgetLevel: travelInfo.budgetLevel,
        travelStyle: travelInfo.travelStyle,
        groupSize: travelInfo.groupSize,
        travelerTypes: travelInfo.travelerTypes,
        mustVisitPlaces: travelInfo.mustVisitPlaces
      };

      const { quickPlanService } = await import('../../services/quickPlanService');
      const suggestionsResponse = await quickPlanService.generateSuggestions(enhancedRequest);
      
      if (!suggestionsResponse.success) {
        throw new Error(suggestionsResponse.message || 'Failed to generate suggestions');
      }

      let intelligentSuggestions = suggestionsResponse.data;
      
      // Integrate must-visit places
      if (travelInfo.mustVisitPlaces.length > 0) {
        const result = await PlaceCustomizationService.integrateMustVisitPlaces(
          travelInfo.mustVisitPlaces,
          intelligentSuggestions,
          travelInfo
        );
        intelligentSuggestions = result.updatedSuggestions;
      }
      
      setSuggestions(intelligentSuggestions);
      setCurrentStep('preview');
      
    } catch (err: any) {
      console.error('Processing failed:', err);
      const errorInfo = errorHandlingService.classifyError(err, 'quick-plan-generation');
      setProcessingError(errorInfo);
      setPreservedFormData(travelInfo);
      setCurrentStep('error');
    }
  };
  const generateMockSuggestions = (travelInfo: TravelInformation): DailySuggestions[] => {
    const suggestions: DailySuggestions[] = [];
    
    // Determine places per day based on travel style
    const placesPerDay = {
      'relaxed': 3,
      'moderate': 5,
      'fast-paced': 7
    }[travelInfo.travelStyle];

    for (let day = 1; day <= travelInfo.duration; day++) {
      const dayDate = new Date(travelInfo.startDate);
      dayDate.setDate(dayDate.getDate() + day - 1);
      
      const places: SuggestedPlace[] = [];
      let totalCost = 0;
      let totalTravelTime = 0;

      for (let i = 0; i < placesPerDay; i++) {
        const placeTypes = ['attraction', 'food', 'other'] as const;
        const placeType = placeTypes[i % placeTypes.length];
        
        const estimatedCost = Math.floor(Math.random() * 50) + 10;
        const estimatedDuration = Math.floor(Math.random() * 120) + 30;
        const travelTime = i > 0 ? Math.floor(Math.random() * 30) + 5 : 0;
        
        totalCost += estimatedCost;
        totalTravelTime += travelTime;

        places.push({
          id: `place-${day}-${i}`,
          name: `${travelInfo.destination} ${placeType} ${i + 1}`,
          address: `${Math.floor(Math.random() * 999)} Main St, ${travelInfo.destination}`,
          coordinates: { lat: 40.7128 + Math.random() * 0.1, lng: -74.0060 + Math.random() * 0.1 },
          placeType,
          description: `A wonderful ${placeType} in ${travelInfo.destination} that matches your interests in ${travelInfo.interests.map(i => i.name).join(', ')}.`,
          estimatedDuration,
          estimatedCost,
          rating: 4.0 + Math.random() * 1.0,
          tips: Math.random() > 0.5 ? `Pro tip: Visit during ${Math.random() > 0.5 ? 'morning' : 'afternoon'} for the best experience.` : undefined,
          openingHours: '9:00 AM - 6:00 PM',
          travelTimeFromPrevious: travelTime,
          source: Math.random() > 0.5 ? 'scraping' : 'google_places'
        });
      }

      suggestions.push({
        dayNumber: day,
        date: dayDate.toISOString().split('T')[0],
        weather: {
          date: dayDate.toISOString().split('T')[0],
          temperature_high: Math.floor(Math.random() * 15) + 20,
          temperature_low: Math.floor(Math.random() * 10) + 10,
          condition: ['sunny', 'cloudy', 'partly_cloudy'][Math.floor(Math.random() * 3)],
          precipitation_probability: Math.floor(Math.random() * 30),
          icon: 'sunny'
        },
        places,
        totalTravelTime,
        estimatedCost: totalCost
      });
    }

    return suggestions;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      const validationError = ErrorCreators.validation(
        'Please fix the validation errors before submitting'
      );
      setProcessingError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      await executeProcessingPhases(formData);
    } catch (err: any) {
      console.error('Failed to process request:', err);
      const errorInfo = errorHandlingService.classifyError(err, 'quick-plan-submission');
      setProcessingError(errorInfo);
      setPreservedFormData(formData);
      setCurrentStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateSuggestions = async () => {
    setIsLoading(true);
    
    try {
      // Use memory-based regeneration if session exists
      if (sessionId) {
        const result = await RegenerationMemoryService.regenerateWithMemory(sessionId, {
          travelInfo: formData,
          currentSuggestions: suggestions,
          regenerationType: 'full',
          preservePreferences: true,
          diversityLevel: 'medium'
        });
        
        if (result.success) {
          setSuggestions(result.newSuggestions);
        } else {
          throw new Error(result.message);
        }
      } else {
        // Fallback to basic regeneration
        await executeProcessingPhases(formData);
      }
    } catch (err: any) {
      console.error('Regeneration failed:', err);
      const errorInfo = errorHandlingService.classifyError(err, 'quick-plan-regeneration');
      setProcessingError(errorInfo);
      setCurrentStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggestions update from customization
  const handleSuggestionsUpdate = (newSuggestions: DailySuggestions[]) => {
    setSuggestions(newSuggestions);
  };

  const handleRetryFromError = async () => {
    if (preservedFormData) {
      setCurrentStep('progress');
      setProcessingError(null);
      
      try {
        await executeProcessingPhases(preservedFormData);
      } catch (err: any) {
        const errorInfo = errorHandlingService.classifyError(err, 'quick-plan-retry');
        setProcessingError(errorInfo);
        setCurrentStep('error');
      }
    }
  };

  const handleFallbackMode = async () => {
    if (preservedFormData) {
      setCurrentStep('progress');
      setProcessingError(null);
      
      try {
        // Use basic mode - simplified processing without external services
        setCurrentPhase('basic-generation');
        setPhaseProgress(0);
        setOverallProgress(0);
        
        // Simulate basic processing
        for (let i = 0; i <= 100; i += 10) {
          setPhaseProgress(i);
          setOverallProgress(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Generate basic suggestions without external API calls
        const basicSuggestions = generateMockSuggestions(preservedFormData);
        setSuggestions(basicSuggestions);
        setCurrentStep('preview');
        
      } catch (err: any) {
        console.error('Fallback mode failed:', err);
        setProcessingError(ErrorCreators.unknown('Even basic mode failed. Please try again later.'));
        setCurrentStep('error');
      }
    }
  };

  const handleCancelProcessing = () => {
    setCurrentStep('form');
    setIsLoading(false);
    setProcessingError(null);
    setCurrentPhase('');
    setPhaseProgress(0);
    setOverallProgress(0);
  };

  const handleTripCreated = (tripId: string) => {
    // Create trip summary for success screen
    const summary: TripSummary = {
      tripId,
      destination: formData.destination,
      duration: formData.duration,
      totalPlaces: suggestions.reduce((sum, day) => sum + day.places.length, 0),
      estimatedCost: suggestions.reduce((sum, day) => sum + day.estimatedCost, 0),
      startDate: formData.startDate,
      endDate: formData.endDate,
      travelStyle: formData.travelStyle,
      interests: formData.interests.map(i => i.name)
    };
    
    setTripSummary(summary);
    setCurrentStep('success');
  };

  const handleViewTrip = (tripId: string) => {
    if (onTripCreated) {
      onTripCreated(tripId);
    }
    onClose();
  };

  const handleCreateAnotherTrip = () => {
    // Reset all state for new trip creation
    setCurrentStep('form');
    setSuggestions([]);
    setTripSummary(null);
    setProcessingError(null);
    setFormData({
      destination: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: 7,
      interests: [],
      budgetLevel: 'medium',
      travelStyle: 'moderate',
      groupSize: 2,
      travelerTypes: [{ type: 'couple' }],
      mustVisitPlaces: []
    });
  };

  const handleShowAlternatives = (dayIndex: number, placeIndex: number) => {
    // Generate mock alternative suggestions
    const key = `${dayIndex}-${placeIndex}`;
    const currentPlace = suggestions[dayIndex].places[placeIndex];
    
    const alternatives: SuggestedPlace[] = [];
    for (let i = 0; i < 3; i++) {
      alternatives.push({
        ...currentPlace,
        id: `alt-${dayIndex}-${placeIndex}-${i}`,
        name: `Alternative ${currentPlace.placeType} ${i + 1}`,
        description: `Another great ${currentPlace.placeType} option in ${formData.destination}.`,
        estimatedCost: Math.floor(Math.random() * 50) + 10,
        estimatedDuration: Math.floor(Math.random() * 120) + 30,
        rating: 4.0 + Math.random() * 1.0,
      });
    }
    
    setAlternativeSuggestions(prev => ({
      ...prev,
      [key]: alternatives
    }));
  };

  const handleMoreLikeThis = (dayIndex: number, placeIndex: number) => {
    setLoadingMessage('Finding similar places...');
    setIsLoading(true);
    
    // Simulate finding similar places
    setTimeout(() => {
      handleShowAlternatives(dayIndex, placeIndex);
      setIsLoading(false);
      setLoadingMessage('');
    }, 1000);
  };

  const handlePlaceRemove = (dayIndex: number, placeIndex: number) => {
    setSuggestions(prev => prev.map((day, idx) => {
      if (idx === dayIndex) {
        const newPlaces = day.places.filter((_, pIdx) => pIdx !== placeIndex);
        const newTotalCost = newPlaces.reduce((sum, place) => sum + place.estimatedCost, 0);
        const newTotalTravelTime = newPlaces.reduce((sum, place) => sum + (place.travelTimeFromPrevious || 0), 0);
        
        return {
          ...day,
          places: newPlaces,
          estimatedCost: newTotalCost,
          totalTravelTime: newTotalTravelTime
        };
      }
      return day;
    }));
  };

  const handlePlaceReplace = (dayIndex: number, placeIndex: number) => {
    // Mock replacement - generate a new random place
    const day = suggestions[dayIndex];
    const oldPlace = day.places[placeIndex];
    
    const newPlace: SuggestedPlace = {
      ...oldPlace,
      id: `place-${dayIndex}-${placeIndex}-${Date.now()}`,
      name: `Alternative ${oldPlace.placeType} in ${formData.destination}`,
      description: `An alternative ${oldPlace.placeType} that might interest you.`,
      estimatedCost: Math.floor(Math.random() * 50) + 10,
      estimatedDuration: Math.floor(Math.random() * 120) + 30,
      rating: 4.0 + Math.random() * 1.0,
    };

    setSuggestions(prev => prev.map((day, idx) => {
      if (idx === dayIndex) {
        const newPlaces = day.places.map((place, pIdx) => 
          pIdx === placeIndex ? newPlace : place
        );
        const newTotalCost = newPlaces.reduce((sum, place) => sum + place.estimatedCost, 0);
        
        return {
          ...day,
          places: newPlaces,
          estimatedCost: newTotalCost
        };
      }
      return day;
    }));
  };

  const handlePlaceCountChange = (dayIndex: number, newCount: number) => {
    setSuggestions(prev => prev.map((day, idx) => {
      if (idx === dayIndex) {
        const currentPlaces = day.places;
        let newPlaces = [...currentPlaces];
        
        if (newCount > currentPlaces.length) {
          // Add new places
          for (let i = currentPlaces.length; i < newCount; i++) {
            const placeTypes = ['attraction', 'food', 'other'] as const;
            const placeType = placeTypes[i % placeTypes.length];
            
            newPlaces.push({
              id: `place-${dayIndex}-${i}-${Date.now()}`,
              name: `${formData.destination} ${placeType} ${i + 1}`,
              address: `${Math.floor(Math.random() * 999)} Main St, ${formData.destination}`,
              coordinates: { lat: 40.7128 + Math.random() * 0.1, lng: -74.0060 + Math.random() * 0.1 },
              placeType,
              description: `A wonderful ${placeType} in ${formData.destination}.`,
              estimatedDuration: Math.floor(Math.random() * 120) + 30,
              estimatedCost: Math.floor(Math.random() * 50) + 10,
              rating: 4.0 + Math.random() * 1.0,
              travelTimeFromPrevious: Math.floor(Math.random() * 30) + 5,
              source: Math.random() > 0.5 ? 'scraping' : 'google_places'
            });
          }
        } else if (newCount < currentPlaces.length) {
          // Remove places
          newPlaces = newPlaces.slice(0, newCount);
        }
        
        const newTotalCost = newPlaces.reduce((sum, place) => sum + place.estimatedCost, 0);
        const newTotalTravelTime = newPlaces.reduce((sum, place) => sum + (place.travelTimeFromPrevious || 0), 0);
        
        return {
          ...day,
          places: newPlaces,
          estimatedCost: newTotalCost,
          totalTravelTime: newTotalTravelTime
        };
      }
      return day;
    }));
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
    setSuggestions([]);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={
        currentStep === 'form' ? "Create Enhanced Quick Plan" :
        currentStep === 'progress' ? `Processing ${formData.destination} Trip` :
        currentStep === 'preview' ? `${formData.destination} Itinerary Preview` :
        currentStep === 'success' ? "Trip Created Successfully!" :
        "Processing Error"
      }
      size="lg"
    >
      {currentStep === 'form' ? (
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Service Health Status */}
        <div className="bg-gray-50 rounded-lg p-3">
          <ServiceHealthMonitor 
            showDetails={false}
            onHealthChange={(status) => {
              if (status.status === 'unhealthy') {
                setProcessingError(ErrorCreators.serviceUnavailable(
                  'Our services are currently experiencing issues. Please try again later.'
                ));
              }
            }}
          />
        </div>

        {/* Destination */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Where do you want to go? *
          </label>
          <input
            type="text"
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            placeholder="e.g., Tokyo, Paris, New York"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
              validationErrors.destination ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {validationErrors.destination && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.destination}</p>
          )}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
                validationErrors.startDate ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {validationErrors.startDate && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.startDate}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date *
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              min={formData.startDate}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
                validationErrors.endDate ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {validationErrors.endDate && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.endDate}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
              {formData.duration} {formData.duration === 1 ? 'day' : 'days'}
            </div>
          </div>
        </div>

        {/* Travel Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Travel Style
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {travelStyleOptions.map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() => setFormData({ ...formData, travelStyle: style.value })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  formData.travelStyle === style.value
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <span className="text-xl mr-2">{style.icon}</span>
                  <span className="font-medium">{style.name}</span>
                </div>
                <p className="text-sm opacity-80">{style.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Group Size and Traveler Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Size *
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.groupSize}
              onChange={(e) => setFormData({ ...formData, groupSize: parseInt(e.target.value) || 1 })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
                validationErrors.groupSize ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {validationErrors.groupSize && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.groupSize}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Traveler Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {travelerTypeOptions.map((type) => (
                <button
                  key={type.type}
                  type="button"
                  onClick={() => handleTravelerTypeToggle(type.type)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                    formData.travelerTypes.some(t => t.type === type.type)
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-1">{type.icon}</span>
                  {type.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What are you interested in? *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {interestOptions.map((option) => {
              const isSelected = formData.interests.some(i => i.id === option.id);
              const selectedInterest = formData.interests.find(i => i.id === option.id);
              
              return (
                <div key={option.id} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleInterestToggle(option)}
                    className={`w-full px-3 py-3 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <span className="text-2xl mb-1">{option.icon}</span>
                      <span className="text-sm font-medium">{option.name}</span>
                    </div>
                  </button>
                  
                  {isSelected && (
                    <div className="px-2">
                      <label className="block text-xs text-gray-600 mb-1">Priority</label>
                      <select
                        value={selectedInterest?.weight || 1}
                        onChange={(e) => handleInterestWeightChange(option.id, parseInt(e.target.value))}
                        className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-black"
                      >
                        <option value={1}>Low</option>
                        <option value={2}>Medium-Low</option>
                        <option value={3}>Medium</option>
                        <option value={4}>High</option>
                        <option value={5}>Very High</option>
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {validationErrors.interests && (
            <p className="text-red-500 text-sm mt-2">{validationErrors.interests}</p>
          )}
        </div>

        {/* Budget Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Budget Level
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {budgetOptions.map((budget) => (
              <button
                key={budget.value}
                type="button"
                onClick={() => setFormData({ ...formData, budgetLevel: budget.value })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  formData.budgetLevel === budget.value
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <span className="text-xl mr-2">{budget.icon}</span>
                  <span className="font-medium">{budget.name}</span>
                </div>
                <p className="text-sm opacity-80">{budget.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Must-Visit Places */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Must-Visit Places (Optional)
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={mustVisitInput}
              onChange={(e) => setMustVisitInput(e.target.value)}
              placeholder="e.g., Eiffel Tower, Central Park"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddMustVisitPlace();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddMustVisitPlace}
              disabled={!mustVisitInput.trim()}
            >
              Add
            </Button>
          </div>
          
          {formData.mustVisitPlaces.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.mustVisitPlaces.map((place, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                >
                  {place}
                  <button
                    type="button"
                    onClick={() => handleRemoveMustVisitPlace(place)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !isFormValid()}
            className="flex-1"
          >
            {isLoading ? 'Generating Suggestions...' : 'Generate Suggestions'}
          </Button>
        </div>
      </form>
      ) : currentStep === 'progress' ? (
        <AdvancedProgressIndicator
          phases={processingPhases}
          currentPhase={currentPhase}
          progress={phaseProgress}
          overallProgress={overallProgress}
          estimatedTimeRemaining={estimatedTimeRemaining}
          tips={processingTips}
          destinationInfo={{
            name: formData.destination,
            facts: getDestinationFacts(formData.destination)
          }}
          onCancel={handleCancelProcessing}
          showCancelButton={true}
        />
      ) : currentStep === 'error' ? (
        <ErrorHandler
          error={processingError!}
          onRetry={handleRetryFromError}
          onCancel={handleCancelProcessing}
          onFallback={handleFallbackMode}
          fallbackLabel="Use Basic Mode"
          preservedData={preservedFormData}
          showDetails={true}
        />
      ) : currentStep === 'success' ? (
        <SuccessConfirmation
          tripSummary={tripSummary!}
          onViewTrip={handleViewTrip}
          onCreateAnother={handleCreateAnotherTrip}
          autoRedirectDelay={5000}
          showAutoRedirect={true}
        />
      ) : (
        <div className="max-h-[80vh] overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={handleBackToForm}
            >
              ← Back to Form
            </Button>
            <div className="text-sm text-gray-600">
              Review your itinerary and create your trip
            </div>
          </div>
          
          <PlaceSuggestionsPreview
            suggestions={suggestions}
            travelInfo={formData}
            onRegenerateClick={handleRegenerateSuggestions}
            onPlaceRemove={handlePlaceRemove}
            onPlaceReplace={handlePlaceReplace}
            isGenerating={isLoading}
            onPlaceCountChange={handlePlaceCountChange}
            onMoreLikeThis={handleMoreLikeThis}
            onShowAlternatives={handleShowAlternatives}
            alternativeSuggestions={alternativeSuggestions}
            loadingMessage={loadingMessage}
            onTripCreated={handleTripCreated}
            onSuggestionsUpdate={handleSuggestionsUpdate}
            sessionId={sessionId}
          />
        </div>
      )}
    </Modal>
  );
}
