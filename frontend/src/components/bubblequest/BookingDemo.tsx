/**
 * Booking Components Demo
 * 
 * Demonstrates the BoardingPassCard, AccommodationCard, and BookingTabs components.
 */

import React, { useState } from 'react';
import { BoardingPassCard, AccommodationCard, BookingTabs } from './index';
import type { FlightBooking, AccommodationBooking, BookingTabType } from './index';

export const BookingDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<BookingTabType>('tickets');

  // Sample flight bookings
  const flights: FlightBooking[] = [
    {
      id: '1',
      type: 'flight',
      origin: {
        code: 'LAX',
        name: 'Los Angeles',
        time: '10:30 AM',
      },
      destination: {
        code: 'NRT',
        name: 'Tokyo Narita',
        time: '3:45 PM',
      },
      flightNumber: 'NH175',
      date: 'March 15, 2024',
      route: 'Direct',
    },
    {
      id: '2',
      type: 'train',
      origin: {
        code: 'TYO',
        name: 'Tokyo',
        time: '9:00 AM',
      },
      destination: {
        code: 'KYO',
        name: 'Kyoto',
        time: '11:15 AM',
      },
      flightNumber: 'N700S-123',
      date: 'March 16, 2024',
      route: 'Shinkansen',
    },
    {
      id: '3',
      type: 'flight',
      origin: {
        code: 'KIX',
        name: 'Osaka Kansai',
        time: '6:00 PM',
      },
      destination: {
        code: 'LAX',
        name: 'Los Angeles',
        time: '12:30 PM',
      },
      flightNumber: 'NH176',
      date: 'March 25, 2024',
      route: 'Direct',
    },
  ];

  // Sample accommodation bookings
  const hotels: AccommodationBooking[] = [
    {
      id: '1',
      name: 'Grand Hotel Tokyo',
      checkIn: 'March 15, 2024',
      checkOut: 'March 18, 2024',
      location: '1-1-1 Marunouchi, Chiyoda-ku, Tokyo',
      confirmationNumber: 'ABC123456',
      notes: 'Room with city view, breakfast included',
    },
    {
      id: '2',
      name: 'Kyoto Traditional Ryokan',
      checkIn: 'March 18, 2024',
      checkOut: 'March 22, 2024',
      location: '123 Gion, Higashiyama-ku, Kyoto',
      confirmationNumber: 'XYZ789012',
      notes: 'Traditional Japanese room with tatami mats',
    },
    {
      id: '3',
      name: 'Osaka Business Hotel',
      checkIn: 'March 22, 2024',
      checkOut: 'March 25, 2024',
      location: '456 Namba, Chuo-ku, Osaka',
      confirmationNumber: 'DEF345678',
    },
  ];

  const handleEdit = (type: string, id: string) => {
    console.log(`Edit ${type}:`, id);
    alert(`Edit ${type}: ${id}`);
  };

  const handleDelete = (type: string, id: string) => {
    console.log(`Delete ${type}:`, id);
    alert(`Delete ${type}: ${id}`);
  };

  return (
    <div className="min-h-screen bg-bubblequest-neutral-50 dark:bg-bubblequest-neutral-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-bubblequest-neutral-900 dark:text-white mb-2">
            Booking Components Demo
          </h1>
          <p className="text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
            Showcasing BoardingPassCard, AccommodationCard, and BookingTabs components
          </p>
        </div>

        {/* Tabs */}
        <BookingTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          ticketsCount={flights.length}
          accommodationCount={hotels.length}
          className="mb-6"
        />

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'tickets' ? (
            <>
              <h2 className="text-xl font-semibold text-bubblequest-neutral-900 dark:text-white mb-4">
                Flight & Train Tickets ({flights.length})
              </h2>
              {flights.map((flight) => (
                <BoardingPassCard
                  key={flight.id}
                  booking={flight}
                  onEdit={() => handleEdit('flight', flight.id)}
                  onDelete={() => handleDelete('flight', flight.id)}
                />
              ))}
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-bubblequest-neutral-900 dark:text-white mb-4">
                Accommodation ({hotels.length})
              </h2>
              {hotels.map((hotel) => (
                <AccommodationCard
                  key={hotel.id}
                  booking={hotel}
                  onEdit={() => handleEdit('hotel', hotel.id)}
                  onDelete={() => handleDelete('hotel', hotel.id)}
                />
              ))}
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-12 p-6 bg-white dark:bg-bubblequest-neutral-800 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-bubblequest-neutral-900 dark:text-white mb-4">
            Interaction Guide
          </h3>
          <ul className="space-y-2 text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
            <li>• <strong>Swipe left</strong> on any card to reveal delete action</li>
            <li>• <strong>Click the three-dot menu</strong> to access edit and delete options</li>
            <li>• <strong>Switch tabs</strong> to view different booking types</li>
            <li>• <strong>Count badges</strong> show the number of items in each tab</li>
            <li>• All interactions are touch-optimized with smooth animations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
