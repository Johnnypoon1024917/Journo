# Journo Type System

This directory contains all TypeScript type definitions for the Journo travel platform. Types are organized by domain and exported through a centralized `index.ts` file.

## Type Files

### Core Domain Types

- **`trip.ts`** - Trip, TripDay, Place interfaces and related types
- **`story.ts`** - StoryItem and TripLike interfaces for journey feeds
- **`packing.ts`** - PackingItem, PackingTemplate, and packing list types
- **`collaboration.ts`** - TripCollaborator, TripVersion, and permission types

### User and Authentication

- **`auth.ts`** - Authentication, login, and registration types
- **`user.ts`** - User profile, badges, and badge definitions

### Location and Maps

- **`maps.ts`** - Google Maps integration types (markers, routes, directions)
- **`destination.ts`** - Destination suggestions and location scraping types

### Financial

- **`currency.ts`** - Currency rates, conversions, and budget tracking types

### System and Admin

- **`analytics.ts`** - Event tracking and analytics types
- **`admin.ts`** - Admin portal, moderation, and feature flags
- **`api.ts`** - API responses, errors, and pagination types
- **`offline.ts`** - Offline sync queue and cache types

## Usage

Import types from the centralized index:

```typescript
import { Trip, Place, User, ApiResponse } from '@/types';
```

Or import from specific files:

```typescript
import { Trip, TripWithDays } from '@/types/trip';
import { PackingItem, PackingCategory } from '@/types/packing';
```

## Type Conventions

### Naming

- **Interfaces**: PascalCase (e.g., `Trip`, `PackingItem`)
- **Type Aliases**: PascalCase (e.g., `TripTheme`, `PlaceType`)
- **Enums**: PascalCase with UPPER_CASE values (e.g., `ApiErrorCode.UNAUTHORIZED`)

### DTOs (Data Transfer Objects)

Create/Update DTOs follow the pattern:
- `Create{Entity}Dto` - For creating new entities
- `Update{Entity}Dto` - For updating existing entities (all fields optional)

Example:
```typescript
interface CreateTripDto {
  title: string;
  destination?: string;
  // ...
}

interface UpdateTripDto {
  title?: string;
  destination?: string;
  // ...
}
```

### Extended Types

Types with relationships use the `With{Relation}` suffix:

```typescript
interface TripWithDays extends Trip {
  days: TripDayWithPlaces[];
}

interface StoryItemWithUser extends StoryItem {
  user: User;
}
```

## Database Alignment

All types align with the PostgreSQL database schema defined in `backend/src/migrations/`. Key mappings:

- Database `UUID` → TypeScript `string`
- Database `TIMESTAMP` → TypeScript `string` (ISO 8601 format in frontend)
- Database `DATE` → TypeScript `string` (ISO date format)
- Database `TIME` → TypeScript `string` (HH:MM format)
- Database `DECIMAL` → TypeScript `number`
- Database `JSONB` → TypeScript `any` or specific interface

## Type Safety

All types are strictly typed with no `any` except where necessary (e.g., JSONB fields, version snapshots). Use type guards and validation for runtime type safety:

```typescript
function isTrip(obj: any): obj is Trip {
  return obj && typeof obj.id === 'string' && typeof obj.title === 'string';
}
```

## Backend Types

Backend types are defined in `backend/src/types/index.ts` and mirror the frontend types but use native JavaScript `Date` objects instead of ISO strings.
