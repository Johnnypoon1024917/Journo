/**
 * Card System Showcase
 * 
 * Demonstrates the usage of TravelCard, CardGrid, and CardCarousel components
 * with various configurations and examples.
 */

import React, { useState } from 'react';
import { TravelCard } from '../molecules/TravelCard';
import { CardGrid } from '../organisms/CardGrid';
import { CardCarousel } from '../organisms/CardCarousel';
import { spacing } from '../tokens';

// Sample destination data
const sampleDestinations = [
  {
    id: '1',
    title: 'Paris, France',
    description: 'The City of Light awaits with its iconic landmarks, world-class museums, and charming cafes.',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    category: 'City',
    rating: 4.8,
    priceLevel: 3 as const,
  },
  {
    id: '2',
    title: 'Tokyo, Japan',
    description: 'Experience the perfect blend of ancient traditions and cutting-edge technology.',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    category: 'City',
    rating: 4.9,
    priceLevel: 4 as const,
  },
  {
    id: '3',
    title: 'Santorini, Greece',
    description: 'Stunning sunsets, white-washed buildings, and crystal-clear Mediterranean waters.',
    image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
    category: 'Island',
    rating: 4.7,
    priceLevel: 3 as const,
  },
  {
    id: '4',
    title: 'New York City, USA',
    description: 'The city that never sleeps offers endless entertainment, culture, and dining.',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
    category: 'City',
    rating: 4.6,
    priceLevel: 4 as const,
  },
  {
    id: '5',
    title: 'Bali, Indonesia',
    description: 'Tropical paradise with lush rice terraces, ancient temples, and pristine beaches.',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    category: 'Island',
    rating: 4.8,
    priceLevel: 2 as const,
  },
  {
    id: '6',
    title: 'Barcelona, Spain',
    description: 'Gaudí\'s architectural masterpieces, vibrant culture, and Mediterranean charm.',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
    category: 'City',
    rating: 4.7,
    priceLevel: 3 as const,
  },
];

export const CardSystemShowcase: React.FC = () => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  const containerStyle: React.CSSProperties = {
    padding: spacing['2xl'],
    maxWidth: '1400px',
    margin: '0 auto',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: spacing['4xl'],
  };

  const headingStyle: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: '600',
    marginBottom: spacing.lg,
    color: '#0f172a',
  };

  const subheadingStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: '500',
    marginBottom: spacing.md,
    marginTop: spacing['2xl'],
    color: '#334155',
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: '1rem',
    color: '#64748b',
    marginBottom: spacing.xl,
    lineHeight: '1.6',
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ ...headingStyle, fontSize: '2.5rem', marginBottom: spacing['2xl'] }}>
        Card System Showcase
      </h1>
      <p style={descriptionStyle}>
        Explore the modern card-based layout system with TravelCard, CardGrid, and CardCarousel components.
      </p>

      {/* TravelCard Variants */}
      <section style={sectionStyle}>
        <h2 style={headingStyle}>TravelCard Variants</h2>
        <p style={descriptionStyle}>
          Different card styles for various use cases.
        </p>

        <h3 style={subheadingStyle}>Default Variant</h3>
        <div style={{ maxWidth: '400px' }}>
          <TravelCard
            {...sampleDestinations[0]}
            variant="default"
            interactive
            onClick={() => console.log('Card clicked')}
            onFavorite={() => toggleFavorite(sampleDestinations[0].id)}
            isFavorite={favorites.has(sampleDestinations[0].id)}
          />
        </div>

        <h3 style={subheadingStyle}>Elevated Variant</h3>
        <div style={{ maxWidth: '400px' }}>
          <TravelCard
            {...sampleDestinations[1]}
            variant="elevated"
            interactive
            onClick={() => console.log('Card clicked')}
            onFavorite={() => toggleFavorite(sampleDestinations[1].id)}
            isFavorite={favorites.has(sampleDestinations[1].id)}
          />
        </div>

        <h3 style={subheadingStyle}>Outlined Variant</h3>
        <div style={{ maxWidth: '400px' }}>
          <TravelCard
            {...sampleDestinations[2]}
            variant="outlined"
            interactive
            onClick={() => console.log('Card clicked')}
            onFavorite={() => toggleFavorite(sampleDestinations[2].id)}
            isFavorite={favorites.has(sampleDestinations[2].id)}
          />
        </div>

        <h3 style={subheadingStyle}>Card Sizes</h3>
        <div style={{ display: 'flex', gap: spacing.lg, flexWrap: 'wrap' }}>
          <div style={{ width: '250px' }}>
            <TravelCard
              title="Small Card"
              description="Compact size for dense layouts"
              image={sampleDestinations[0].image}
              size="sm"
              variant="elevated"
            />
          </div>
          <div style={{ width: '350px' }}>
            <TravelCard
              title="Medium Card"
              description="Default size for most use cases"
              image={sampleDestinations[1].image}
              size="md"
              variant="elevated"
            />
          </div>
          <div style={{ width: '450px' }}>
            <TravelCard
              title="Large Card"
              description="Prominent display for featured content"
              image={sampleDestinations[2].image}
              size="lg"
              variant="elevated"
            />
          </div>
        </div>
      </section>

      {/* CardGrid */}
      <section style={sectionStyle}>
        <h2 style={headingStyle}>CardGrid - Responsive Grid Layout</h2>
        <p style={descriptionStyle}>
          Automatically responsive grid that adapts to different screen sizes.
        </p>

        <CardGrid
          columns={{ mobile: 1, tablet: 2, desktop: 3 }}
          gap="lg"
          animateEntrance
        >
          {sampleDestinations.map(dest => (
            <TravelCard
              key={dest.id}
              {...dest}
              variant="elevated"
              interactive
              onClick={() => console.log(`Clicked ${dest.title}`)}
              onFavorite={() => toggleFavorite(dest.id)}
              isFavorite={favorites.has(dest.id)}
            />
          ))}
        </CardGrid>
      </section>

      {/* CardCarousel */}
      <section style={sectionStyle}>
        <h2 style={headingStyle}>CardCarousel - Horizontal Scrolling</h2>
        <p style={descriptionStyle}>
          Smooth horizontal scrolling with navigation controls and touch support.
        </p>

        <CardCarousel
          showArrows
          showDots
          gap="lg"
          cardWidth={{
            mobile: '280px',
            tablet: '320px',
            desktop: '360px',
          }}
        >
          {sampleDestinations.map(dest => (
            <TravelCard
              key={dest.id}
              {...dest}
              variant="elevated"
              interactive
              onClick={() => console.log(`Clicked ${dest.title}`)}
              onFavorite={() => toggleFavorite(dest.id)}
              isFavorite={favorites.has(dest.id)}
            />
          ))}
        </CardCarousel>
      </section>

      {/* Loading States */}
      <section style={sectionStyle}>
        <h2 style={headingStyle}>Loading States</h2>
        <p style={descriptionStyle}>
          Skeleton screens provide visual feedback during content loading.
        </p>

        <h3 style={subheadingStyle}>Loading Grid</h3>
        <CardGrid
          columns={{ mobile: 1, tablet: 2, desktop: 3 }}
          gap="lg"
          loading
          skeletonCount={6}
        />

        <h3 style={subheadingStyle}>Loading Carousel</h3>
        <CardCarousel
          showArrows
          gap="lg"
          loading
          skeletonCount={5}
        />
      </section>

      {/* Empty States */}
      <section style={sectionStyle}>
        <h2 style={headingStyle}>Empty States</h2>
        <p style={descriptionStyle}>
          Helpful guidance when no content is available.
        </p>

        <CardGrid
          emptyState={
            <div style={{ textAlign: 'center', padding: spacing['2xl'] }}>
              <div style={{ fontSize: '3rem', marginBottom: spacing.md }}>🗺️</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: spacing.sm }}>
                No destinations found
              </h3>
              <p style={{ color: '#64748b', marginBottom: spacing.lg }}>
                Start exploring by adding your first destination
              </p>
              <button
                style={{
                  padding: `${spacing.md} ${spacing.xl}`,
                  backgroundColor: '#0ea5e9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Add Destination
              </button>
            </div>
          }
        />
      </section>

      {/* Masonry Layout */}
      <section style={sectionStyle}>
        <h2 style={headingStyle}>Masonry Layout</h2>
        <p style={descriptionStyle}>
          Dynamic grid that adapts to content height for a Pinterest-style layout.
        </p>

        <CardGrid
          layout="masonry"
          gap="lg"
          minCardWidth="300px"
        >
          {sampleDestinations.map((dest, index) => (
            <TravelCard
              key={dest.id}
              {...dest}
              variant="elevated"
              interactive
              onClick={() => console.log(`Clicked ${dest.title}`)}
              onFavorite={() => toggleFavorite(dest.id)}
              isFavorite={favorites.has(dest.id)}
              // Vary description length for masonry effect
              description={
                index % 3 === 0
                  ? dest.description + ' ' + dest.description
                  : dest.description
              }
            />
          ))}
        </CardGrid>
      </section>
    </div>
  );
};

export default CardSystemShowcase;
