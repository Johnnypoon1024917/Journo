// Centralized type exports for the Journo travel platform

// Authentication and User types
export * from './auth';
export * from './user';

// Trip and Place types (excluding SyncQueueItem to avoid conflict)
export type {
  TripTheme,
  Trip,
  WeatherData,
  DailyForecast,
  TripDay,
  PlaceType,
  BudgetCategory,
  TransportMode,
  Place,
  TripWithDays,
  TripDayWithPlaces,
  CreateTripDto,
  UpdateTripDto,
  CreateTripDayDto,
  CreatePlaceDto,
  UpdatePlaceDto,
  RouteStep,
  TransportRoute,
  CreateTransportRouteDto,
  SyncOperationType,
  SyncResourceType,
  SyncStatus,
  CreateSyncQueueItemDto,
} from './trip';

// Re-export SyncQueueItem from trip as TripSyncQueueItem to avoid naming conflict
export type { SyncQueueItem as TripSyncQueueItem } from './trip';
export * from './story';
export * from './packing';
export * from './collaboration';

// Location and Maps types
export * from './maps';
export * from './destination';

// Budget and Currency types
export * from './currency';

// Analytics and Admin types
export * from './analytics';
export * from './admin';

// API and Error types
export * from './api';

// Offline functionality types
export * from './offline';

// Socket.IO real-time types
export * from './socket';

// Sticker types
export * from './sticker';

