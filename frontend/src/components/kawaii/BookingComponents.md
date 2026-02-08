# Booking Components

This document describes the booking-related components for the Kawaii UI redesign.

## Components

### BoardingPassCard

Displays flight/train bookings in a boarding pass style with pink gradient background.

**Features:**
- Pink gradient background with white text
- Displays origin, destination, times, flight number, and date
- Three-dot menu for edit/delete actions
- Swipe to delete gesture
- Touch-optimized interactions
- Decorative elements (circles, perforated edge)

**Props:**
```typescript
interface BoardingPassCardProps {
  booking: FlightBooking;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

interface FlightBooking {
  id: string;
  type: 'flight' | 'train';
  origin: LocationInfo;
  destination: LocationInfo;
  flightNumber: string;
  date: string;
  route?: string;
}

interface LocationInfo {
  code: string;
  name: string;
  time: string;
}
```

**Usage:**
```tsx
import { BoardingPassCard } from '@/components/kawaii/BoardingPassCard';

<BoardingPassCard
  booking={{
    id: '1',
    type: 'flight',
    origin: {
      code: 'LAX',
      name: 'Los Angeles',
      time: '10:30 AM'
    },
    destination: {
      code: 'NRT',
      name: 'Tokyo Narita',
      time: '3:45 PM'
    },
    flightNumber: 'NH175',
    date: 'March 15, 2024',
    route: 'Direct'
  }}
  onEdit={() => console.log('Edit')}
  onDelete={() => console.log('Delete')}
/>
```

### AccommodationCard

Displays hotel/accommodation bookings with optional image.

**Features:**
- Card layout with optional image or placeholder
- Displays hotel name, check-in/out dates, location
- Confirmation number display
- Three-dot menu for edit/delete actions
- Swipe to delete gesture
- Touch-optimized interactions

**Props:**
```typescript
interface AccommodationCardProps {
  booking: AccommodationBooking;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

interface AccommodationBooking {
  id: string;
  name: string;
  checkIn: string;
  checkOut: string;
  location: string;
  confirmationNumber?: string;
  image?: string;
  notes?: string;
}
```

**Usage:**
```tsx
import { AccommodationCard } from '@/components/kawaii/AccommodationCard';

<AccommodationCard
  booking={{
    id: '1',
    name: 'Grand Hotel Tokyo',
    checkIn: 'March 15, 2024',
    checkOut: 'March 20, 2024',
    location: '1-1-1 Marunouchi, Chiyoda-ku, Tokyo',
    confirmationNumber: 'ABC123456',
    image: '/hotel-image.jpg',
    notes: 'Room with city view'
  }}
  onEdit={() => console.log('Edit')}
  onDelete={() => console.log('Delete')}
/>
```

### BookingTabs

Tab navigation for switching between Tickets and Accommodation views.

**Features:**
- Two tabs: Tickets and Accommodation
- Count badges showing number of items in each tab
- Active tab highlighting with primary color
- Smooth animations with Framer Motion
- Touch-optimized interactions

**Props:**
```typescript
interface BookingTabsProps {
  activeTab: BookingTabType;
  onTabChange: (tab: BookingTabType) => void;
  ticketsCount?: number;
  accommodationCount?: number;
  className?: string;
}

type BookingTabType = 'tickets' | 'accommodation';
```

**Usage:**
```tsx
import { BookingTabs } from '@/components/kawaii/BookingTabs';

const [activeTab, setActiveTab] = useState<BookingTabType>('tickets');

<BookingTabs
  activeTab={activeTab}
  onTabChange={setActiveTab}
  ticketsCount={3}
  accommodationCount={2}
/>
```

## Complete Example

```tsx
import React, { useState } from 'react';
import { BookingTabs, BoardingPassCard, AccommodationCard } from '@/components/kawaii';

const BookingScreen = () => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'accommodation'>('tickets');

  const flights = [
    {
      id: '1',
      type: 'flight' as const,
      origin: { code: 'LAX', name: 'Los Angeles', time: '10:30 AM' },
      destination: { code: 'NRT', name: 'Tokyo Narita', time: '3:45 PM' },
      flightNumber: 'NH175',
      date: 'March 15, 2024',
      route: 'Direct'
    }
  ];

  const hotels = [
    {
      id: '1',
      name: 'Grand Hotel Tokyo',
      checkIn: 'March 15, 2024',
      checkOut: 'March 20, 2024',
      location: '1-1-1 Marunouchi, Chiyoda-ku, Tokyo',
      confirmationNumber: 'ABC123456'
    }
  ];

  return (
    <div className="p-4">
      <BookingTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ticketsCount={flights.length}
        accommodationCount={hotels.length}
      />

      <div className="mt-6 space-y-4">
        {activeTab === 'tickets' ? (
          flights.map(flight => (
            <BoardingPassCard
              key={flight.id}
              booking={flight}
              onEdit={() => console.log('Edit', flight.id)}
              onDelete={() => console.log('Delete', flight.id)}
            />
          ))
        ) : (
          hotels.map(hotel => (
            <AccommodationCard
              key={hotel.id}
              booking={hotel}
              onEdit={() => console.log('Edit', hotel.id)}
              onDelete={() => console.log('Delete', hotel.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
```

## Swipe to Delete

Both BoardingPassCard and AccommodationCard support swipe-to-delete gestures:
- Swipe left to reveal delete action
- Swipe more than 100px to trigger delete
- Smooth spring animations
- Visual feedback with red background

## Accessibility

All components include:
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus indicators
- Touch-optimized targets (44px minimum)
- Screen reader support

## Internationalization

All text is internationalized using react-i18next:
- Tab labels
- Booking type labels
- Check-in/check-out labels
- Confirmation number format

## Requirements Validation

- ✅ **10.1**: BoardingPassCard with pink gradient, origin/destination, times, flight number, date, menu, swipe-to-delete
- ✅ **10.2**: BookingTabs with tickets/accommodation tabs and counts
- ✅ **10.3**: BoardingPassCard displays all required booking data
- ✅ **10.4**: AccommodationCard with hotel name, dates, location, image support, edit/delete actions
