import puppeteer, { Browser } from 'puppeteer';
import { pool } from '../config/database.js';
import { GoogleMapsService } from './googleMapsService.js';
import { RedisService } from '../config/redis.js';
import { DebounceManager } from '../utils/debounce.js';
import { PlaceType, ScrapedLocation } from '../types/index.js';

export interface SearchQuery {
  id?: string;
  user_id?: string;
  query_text: string;
  result_count: number;
  selected_result_id?: string;
}

export interface InterestCategory {
  id: string;
  name: string;
  weight: number; // 1-5, affects suggestion priority
}

export interface TravelerType {
  type: 'solo' | 'couple' | 'family' | 'friends' | 'business';
  ageGroups?: ('child' | 'teen' | 'adult' | 'senior')[];
}

export interface LocationSearchRequest {
  destination: string;
  interests: InterestCategory[];
  budgetLevel: 'low' | 'medium' | 'high';
  travelDates?: { start: string; end: string };
  groupSize?: number;
  travelerTypes?: TravelerType[];
  mustVisitPlaces?: string[];
}

export interface LocationSearchResult {
  places: ScrapedLocation[];
  searchMetadata: {
    totalFound: number;
    scrapingSources: string[];
    fallbackUsed: boolean;
    cacheHit: boolean;
    processingTime: number;
  };
}

export class LocationScraperService {
  private static cache = new Map<string, { data: ScrapedLocation[]; timestamp: number }>();
  private static CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  private static REDIS_CACHE_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds
  private static DEBOUNCE_DELAY = 300; // 300ms delay for debounced search
  private static browser: Browser | null = null;

  // Interest-specific query templates
  private static INTEREST_QUERY_TEMPLATES = {
    food: ['best restaurants', 'local cuisine', 'food markets', 'street food', 'dining'],
    culture: ['museums', 'cultural sites', 'historical places', 'art galleries', 'heritage'],
    adventure: ['outdoor activities', 'adventure sports', 'hiking', 'extreme sports', 'tours'],
    shopping: ['shopping centers', 'markets', 'boutiques', 'local crafts', 'souvenirs'],
    nature: ['parks', 'gardens', 'natural attractions', 'wildlife', 'scenic spots'],
    relaxation: ['spas', 'wellness', 'peaceful places', 'quiet spots', 'meditation'],
    nightlife: ['bars', 'clubs', 'entertainment', 'live music', 'nightlife'],
    photography: ['scenic views', 'photo spots', 'landmarks', 'viewpoints', 'instagram spots']
  };

  // Budget level cost ranges (per person, per activity)
  private static BUDGET_RANGES = {
    low: { min: 0, max: 25 },
    medium: { min: 20, max: 75 },
    high: { min: 50, max: 200 }
  };

  // Place type classification keywords
  private static PLACE_TYPE_KEYWORDS = {
    restaurant: ['restaurant', 'cafe', 'diner', 'bistro', 'eatery', 'food', 'cuisine'],
    attraction: ['attraction', 'landmark', 'monument', 'tower', 'bridge', 'famous'],
    museum: ['museum', 'gallery', 'exhibition', 'art', 'history', 'science'],
    park: ['park', 'garden', 'green', 'nature', 'outdoor', 'recreation'],
    shopping: ['shop', 'market', 'mall', 'store', 'boutique', 'shopping'],
    nightlife: ['bar', 'club', 'pub', 'nightlife', 'entertainment', 'music'],
    activity: ['activity', 'tour', 'experience', 'adventure', 'sport', 'fun'],
    cultural: ['temple', 'church', 'cultural', 'heritage', 'traditional', 'historic'],
    nature: ['beach', 'mountain', 'lake', 'forest', 'wildlife', 'natural'],
    entertainment: ['theater', 'cinema', 'show', 'performance', 'entertainment'],
    temple: ['temple', 'shrine', 'pagoda', 'monastery', 'religious'],
    observation_deck: ['observation', 'deck', 'viewpoint', 'lookout', 'panorama'],
    shrine: ['shrine', 'sacred', 'holy', 'worship'],
    market: ['market', 'bazaar', 'souk', 'fair', 'marketplace'],
    garden: ['garden', 'botanical', 'arboretum', 'greenhouse'],
    landmark: ['landmark', 'monument', 'memorial', 'statue', 'icon'],
    cathedral: ['cathedral', 'basilica', 'church', 'chapel', 'abbey'],
    castle: ['castle', 'fortress', 'palace', 'citadel', 'fort'],
    monument: ['monument', 'memorial', 'statue', 'obelisk'],
    district: ['district', 'quarter', 'neighborhood', 'area', 'zone']
  };

  // Enhanced search with advanced filtering
  static async searchLocationsEnhanced(
    request: LocationSearchRequest,
    userId?: string
  ): Promise<LocationSearchResult> {
    const startTime = Date.now();
    
    // Check database cache first
    const cachedResult = await this.getCachedPlaceSuggestions(request);
    if (cachedResult) {
      console.log(`Database cache hit for enhanced search: ${request.destination}`);
      return {
        ...cachedResult,
        searchMetadata: {
          ...cachedResult.searchMetadata,
          cacheHit: true,
          processingTime: Date.now() - startTime
        }
      };
    }

    // Check Redis cache as fallback
    const cacheKey = this.generateCacheKey(request);
    const redisResults = await RedisService.getJSON<LocationSearchResult>(cacheKey);
    if (redisResults) {
      console.log(`Redis cache hit for enhanced search: ${request.destination}`);
      // Also cache in database for future use
      await this.cachePlaceSuggestions(request, redisResults);
      return {
        ...redisResults,
        searchMetadata: {
          ...redisResults.searchMetadata,
          cacheHit: true,
          processingTime: Date.now() - startTime
        }
      };
    }

    console.log(`Enhanced location search for: ${request.destination}`);
    
    try {
      // Generate interest-specific queries
      const queries = this.generateInterestQueries(request.destination, request.interests);
      
      // Scrape from multiple sources with enhanced queries
      const allResults: ScrapedLocation[] = [];
      const sources: string[] = [];
      let fallbackUsed = false;

      // Try Dynamic Scraping first
      try {
        for (const query of queries) {
          const scrapedResults = await this.searchLocationsInternal(query, userId);
          allResults.push(...scrapedResults);
        }
        sources.push('dynamic_scraping');
      } catch (error) {
        console.warn('Dynamic scraping failed, trying fallback:', error);
        fallbackUsed = true;
      }

      // Fallback to Google Places if needed or insufficient results
      if (allResults.length < 10 || fallbackUsed) {
        try {
          const googleResults = await this.searchGooglePlaces(request);
          allResults.push(...googleResults);
          sources.push('google_places');
          fallbackUsed = true;
        } catch (error) {
          console.warn('Google Places fallback failed:', error);
        }
      }

      // Final fallback to default places
      if (allResults.length < 5) {
        const defaultResults = await this.getDefaultPlaces(request.destination);
        allResults.push(...defaultResults);
        sources.push('default_places');
        fallbackUsed = true;
      }

      // Enhance and filter results
      const enhancedResults = await this.enhanceAndFilterResults(allResults, request);
      
      // Apply diversity scoring and selection
      const finalResults = this.applyDiversityScoring(enhancedResults, request);

      const result: LocationSearchResult = {
        places: finalResults,
        searchMetadata: {
          totalFound: allResults.length,
          scrapingSources: sources,
          fallbackUsed,
          cacheHit: false,
          processingTime: Date.now() - startTime
        }
      };

      // Cache results in both Redis and database
      await RedisService.setJSON(cacheKey, result, this.REDIS_CACHE_DURATION);
      await this.cachePlaceSuggestions(request, result);

      return result;
    } catch (error) {
      console.error('Error in enhanced location search:', error);
      
      // Try to return cached database results as fallback
      const dbResults = await this.getCachedResultsFromDatabase(request.destination);
      const enhancedDbResults = await this.enhanceAndFilterResults(dbResults, request);
      
      const fallbackResult: LocationSearchResult = {
        places: enhancedDbResults,
        searchMetadata: {
          totalFound: dbResults.length,
          scrapingSources: ['database_cache'],
          fallbackUsed: true,
          cacheHit: false,
          processingTime: Date.now() - startTime
        }
      };
      
      // Cache the fallback result too
      await this.cachePlaceSuggestions(request, fallbackResult);
      
      return fallbackResult;
    }
  }

  // Generate cache key for enhanced search
  private static generateCacheKey(request: LocationSearchRequest): string {
    const interestIds = request.interests.map(i => i.id).sort().join(',');
    const travelerTypes = request.travelerTypes?.map(t => t.type).sort().join(',') || '';
    const mustVisit = request.mustVisitPlaces?.sort().join(',') || '';
    
    return `enhanced_search_${request.destination.toLowerCase()}_${interestIds}_${request.budgetLevel}_${request.groupSize || 1}_${travelerTypes}_${mustVisit}`;
  }

  // Generate interest-specific search queries
  private static generateInterestQueries(destination: string, interests: InterestCategory[]): string[] {
    const queries: string[] = [];
    
    // Base query
    queries.push(destination);
    
    // Interest-specific queries
    for (const interest of interests) {
      const templates = this.INTEREST_QUERY_TEMPLATES[interest.id as keyof typeof this.INTEREST_QUERY_TEMPLATES];
      if (templates) {
        // Use weight to determine how many queries to generate for this interest
        const queryCount = Math.min(interest.weight, templates.length);
        for (let i = 0; i < queryCount; i++) {
          queries.push(`${destination} ${templates[i]}`);
        }
      }
    }
    
    return queries;
  }

  // Search Google Places as fallback
  private static async searchGooglePlaces(request: LocationSearchRequest): Promise<ScrapedLocation[]> {
    const results: ScrapedLocation[] = [];
    
    try {
      // Generate queries for Google Places
      const queries = this.generateInterestQueries(request.destination, request.interests);
      
      for (const query of queries.slice(0, 5)) { // Limit to avoid API quota issues
        try {
          const places = await GoogleMapsService.searchPlaces(query);
          
          for (const place of places.slice(0, 10)) { // Limit results per query
            results.push({
              location_name: place.name || 'Unknown Place',
              source: 'google_places',
              city: 'Unknown',
              country: 'Unknown',
              rating: place.rating ?? null,
              lat: place.geometry?.location?.lat ?? null,
              lng: place.geometry?.location?.lng ?? null,
              tips: place.vicinity || place.formatted_address || null,
              visitor_count: place.user_ratings_total ?? null,
              cached_at: new Date(),
              created_at: new Date()
            });
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.warn(`Google Places query failed for: ${query}`, error);
        }
      }
    } catch (error) {
      console.error('Error searching Google Places:', error);
    }
    
    return results;
  }

  // Get default places for destination
  private static async getDefaultPlaces(destination: string): Promise<ScrapedLocation[]> {
    try {
      const query = `
        SELECT * FROM scraped_locations 
        WHERE location_name ILIKE $1 
        ORDER BY rating DESC NULLS LAST, visitor_count DESC NULLS LAST
        LIMIT 20
      `;
      
      const result = await pool.query(query, [`%${destination}%`]);
      return result.rows.map(row => ({
        ...row,
        source: 'default_places'
      }));
    } catch (error) {
      console.error('Error getting default places:', error);
      return [];
    }
  }

  // Enhance and filter results based on request criteria
  private static async enhanceAndFilterResults(
    locations: ScrapedLocation[],
    request: LocationSearchRequest
  ): Promise<ScrapedLocation[]> {
    const enhanced: ScrapedLocation[] = [];
    
    for (const location of locations) {
      try {
        // Classify place type
        const placeType = this.classifyPlaceType(location.location_name, location.tips || undefined);
        
        // Calculate interest match score
        const interestMatch = this.calculateInterestMatch(location, request.interests, placeType);
        
        // Estimate cost and duration
        const { estimatedCost, estimatedDuration } = this.estimateCostAndDuration(placeType, request.budgetLevel);
        
        // Determine budget category
        const budgetCategory = this.determineBudgetCategory(estimatedCost);
        
        // Calculate popularity score
        const popularityScore = this.calculatePopularityScore(location);
        
        // Determine weather suitability
        const weatherSuitability = this.determineWeatherSuitability(placeType);
        
        // Determine crowd level
        const crowdLevel = this.determineCrowdLevel(location.visitor_count || undefined);
        
        const enhancedLocation: ScrapedLocation = {
          ...location,
          place_type: placeType,
          estimated_cost: estimatedCost,
          estimated_duration: estimatedDuration,
          budget_category: budgetCategory,
          interest_match: interestMatch,
          popularity_score: popularityScore,
          weather_suitability: weatherSuitability,
          crowd_level: crowdLevel
        };
        
        // Filter by budget level
        if (this.matchesBudgetLevel(enhancedLocation, request.budgetLevel)) {
          // Filter by group size appropriateness
          if (this.isAppropriateForGroup(enhancedLocation, request.groupSize, request.travelerTypes)) {
            enhanced.push(enhancedLocation);
          }
        }
      } catch (error) {
        console.warn(`Error enhancing location ${location.location_name}:`, error);
        // Keep original location if enhancement fails
        enhanced.push(location);
      }
    }
    
    return enhanced;
  }

  // Classify place type based on name and description
  private static classifyPlaceType(name: string, description?: string): PlaceType {
    const text = `${name} ${description || ''}`.toLowerCase();
    
    for (const [type, keywords] of Object.entries(this.PLACE_TYPE_KEYWORDS)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return type as PlaceType;
      }
    }
    
    return 'other';
  }

  // Calculate interest match score (0-1)
  private static calculateInterestMatch(
    _location: ScrapedLocation,
    interests: InterestCategory[],
    placeType: PlaceType
  ): number {
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const interest of interests) {
      const score = this.getInterestPlaceTypeScore(interest.id, placeType);
      totalScore += score * interest.weight;
      totalWeight += interest.weight;
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  // Get score for interest-place type combination
  private static getInterestPlaceTypeScore(interestId: string, placeType: PlaceType): number {
    // Map new place types to existing ones for scoring
    const placeTypeMapping: Record<PlaceType, PlaceType> = {
      'attraction': 'attraction',
      'food': 'food',
      'hotel': 'accommodation',
      'transport': 'transport',
      'other': 'other',
      'temple': 'cultural',
      'observation_deck': 'attraction',
      'shrine': 'cultural',
      'market': 'shopping',
      'garden': 'nature',
      'landmark': 'attraction',
      'cathedral': 'cultural',
      'castle': 'cultural',
      'monument': 'cultural',
      'district': 'attraction',
      'restaurant': 'food',
      'museum': 'cultural',
      'shopping': 'shopping',
      'nightlife': 'nightlife',
      'entertainment': 'entertainment',
      'nature': 'nature',
      'park': 'nature',
      'activity': 'activity',
      'cultural': 'cultural',
      'accommodation': 'accommodation'
    };

    const mappedType = placeTypeMapping[placeType] || 'other';
    
    const scoreMatrix: Record<string, Record<string, number>> = {
      food: {
        restaurant: 1.0, food: 1.0, shopping: 0.3, cultural: 0.2, attraction: 0.1,
        museum: 0.1, park: 0.2, nightlife: 0.4, activity: 0.2, accommodation: 0.1,
        transport: 0.1, nature: 0.2, entertainment: 0.3, other: 0.1
      },
      culture: {
        museum: 1.0, cultural: 1.0, attraction: 0.8, entertainment: 0.6, shopping: 0.3,
        restaurant: 0.2, food: 0.2, park: 0.3, nightlife: 0.2, activity: 0.4,
        accommodation: 0.1, transport: 0.1, nature: 0.3, other: 0.2
      },
      adventure: {
        activity: 1.0, nature: 0.8, park: 0.7, attraction: 0.5, entertainment: 0.4,
        restaurant: 0.2, food: 0.2, museum: 0.2, cultural: 0.3, shopping: 0.1,
        nightlife: 0.3, accommodation: 0.2, transport: 0.3, other: 0.3
      },
      shopping: {
        shopping: 1.0, attraction: 0.3, cultural: 0.2, restaurant: 0.3, food: 0.3,
        museum: 0.1, park: 0.1, nightlife: 0.2, activity: 0.2, accommodation: 0.1,
        transport: 0.2, nature: 0.1, entertainment: 0.2, other: 0.2
      },
      nature: {
        nature: 1.0, park: 1.0, activity: 0.6, attraction: 0.4, restaurant: 0.2,
        food: 0.2, museum: 0.1, cultural: 0.2, shopping: 0.1, nightlife: 0.1,
        accommodation: 0.2, transport: 0.1, entertainment: 0.2, other: 0.2
      },
      relaxation: {
        park: 0.8, nature: 0.7, accommodation: 0.6, restaurant: 0.5, food: 0.5,
        museum: 0.4, cultural: 0.4, attraction: 0.3, shopping: 0.3, nightlife: 0.2,
        activity: 0.3, transport: 0.1, entertainment: 0.4, other: 0.3
      },
      nightlife: {
        nightlife: 1.0, entertainment: 0.8, restaurant: 0.6, food: 0.6, shopping: 0.3,
        attraction: 0.3, cultural: 0.2, museum: 0.1, park: 0.1, nature: 0.1,
        activity: 0.4, accommodation: 0.3, transport: 0.2, other: 0.3
      },
      photography: {
        attraction: 1.0, nature: 0.9, park: 0.8, cultural: 0.7, museum: 0.6,
        entertainment: 0.5, restaurant: 0.3, food: 0.3, shopping: 0.3, nightlife: 0.4,
        activity: 0.6, accommodation: 0.2, transport: 0.3, other: 0.4
      }
    };
    
    return scoreMatrix[interestId]?.[mappedType] || 0.1;
  }

  // Estimate cost and duration based on place type and budget level
  private static estimateCostAndDuration(placeType: PlaceType, budgetLevel: 'low' | 'medium' | 'high'): {
    estimatedCost: number;
    estimatedDuration: number;
  } {
    const baseCosts: Record<PlaceType, { low: number; medium: number; high: number }> = {
      restaurant: { low: 15, medium: 35, high: 75 },
      attraction: { low: 10, medium: 25, high: 50 },
      museum: { low: 8, medium: 20, high: 35 },
      park: { low: 0, medium: 5, high: 15 },
      shopping: { low: 20, medium: 50, high: 150 },
      nightlife: { low: 25, medium: 50, high: 100 },
      activity: { low: 30, medium: 75, high: 150 },
      cultural: { low: 5, medium: 15, high: 30 },
      nature: { low: 0, medium: 10, high: 25 },
      entertainment: { low: 15, medium: 40, high: 80 },
      food: { low: 15, medium: 35, high: 75 },
      accommodation: { low: 50, medium: 100, high: 200 },
      transport: { low: 5, medium: 15, high: 30 },
      other: { low: 10, medium: 25, high: 50 },
      hotel: { low: 50, medium: 100, high: 200 },
      temple: { low: 0, medium: 5, high: 15 },
      observation_deck: { low: 5, medium: 15, high: 30 },
      shrine: { low: 0, medium: 5, high: 15 },
      market: { low: 10, medium: 25, high: 75 },
      garden: { low: 0, medium: 5, high: 15 },
      landmark: { low: 5, medium: 15, high: 30 },
      cathedral: { low: 0, medium: 5, high: 15 },
      castle: { low: 10, medium: 25, high: 50 },
      monument: { low: 0, medium: 5, high: 15 },
      district: { low: 0, medium: 10, high: 25 }
    };
    
    const baseDurations: Record<PlaceType, number> = {
      restaurant: 90, attraction: 120, museum: 150, park: 180, shopping: 120,
      nightlife: 180, activity: 240, cultural: 90, nature: 180, entertainment: 150,
      food: 90, accommodation: 0, transport: 0, other: 120,
      hotel: 0, temple: 60, observation_deck: 45, shrine: 30, market: 90,
      garden: 120, landmark: 60, cathedral: 90, castle: 180, monument: 45, district: 120
    };
    
    const estimatedCost = baseCosts[placeType]?.[budgetLevel] || baseCosts.other[budgetLevel];
    const estimatedDuration = baseDurations[placeType] || 120;
    
    return { estimatedCost, estimatedDuration };
  }

  // Determine budget category based on estimated cost
  private static determineBudgetCategory(cost: number): 'low' | 'medium' | 'high' {
    if (cost <= this.BUDGET_RANGES.low.max) return 'low';
    if (cost <= this.BUDGET_RANGES.medium.max) return 'medium';
    return 'high';
  }

  // Calculate popularity score based on ratings and visitor count
  private static calculatePopularityScore(location: ScrapedLocation): number {
    let score = 0;
    
    // Rating component (0-5 scale normalized to 0-0.5)
    if (location.rating) {
      score += (location.rating / 5) * 0.5;
    }
    
    // Visitor count component (logarithmic scale, normalized to 0-0.5)
    if (location.visitor_count && location.visitor_count > 0) {
      const logVisitors = Math.log10(location.visitor_count);
      score += Math.min(logVisitors / 6, 0.5); // Cap at 1M visitors
    }
    
    return Math.min(score, 1.0);
  }

  // Determine weather suitability
  private static determineWeatherSuitability(placeType: PlaceType): 'indoor' | 'outdoor' | 'flexible' {
    const indoorTypes: PlaceType[] = ['museum', 'shopping', 'nightlife', 'restaurant', 'entertainment', 'hotel', 'temple', 'shrine', 'market', 'cathedral'];
    const outdoorTypes: PlaceType[] = ['nature', 'park', 'activity', 'observation_deck', 'garden', 'landmark', 'castle', 'monument', 'district'];
    
    if (indoorTypes.includes(placeType)) return 'indoor';
    if (outdoorTypes.includes(placeType)) return 'outdoor';
    return 'flexible';
  }

  // Determine crowd level based on visitor count
  private static determineCrowdLevel(visitorCount?: number): 'low' | 'medium' | 'high' {
    if (!visitorCount) return 'medium';
    if (visitorCount < 1000) return 'low';
    if (visitorCount < 10000) return 'medium';
    return 'high';
  }

  // Check if location matches budget level
  private static matchesBudgetLevel(location: ScrapedLocation, budgetLevel: 'low' | 'medium' | 'high'): boolean {
    if (!location.budget_category) return true;
    
    // Allow some flexibility - low budget can include some medium, etc.
    switch (budgetLevel) {
      case 'low':
        return location.budget_category === 'low' || 
               (location.budget_category === 'medium' && Math.random() < 0.3);
      case 'medium':
        return location.budget_category === 'low' || location.budget_category === 'medium' ||
               (location.budget_category === 'high' && Math.random() < 0.2);
      case 'high':
        return true; // High budget can afford everything
      default:
        return true;
    }
  }

  // Check if location is appropriate for group size and traveler types
  private static isAppropriateForGroup(
    location: ScrapedLocation,
    groupSize?: number,
    travelerTypes?: TravelerType[]
  ): boolean {
    if (!groupSize || !travelerTypes) return true;
    
    // Family-friendly filtering
    const hasChildren = travelerTypes.some(t => 
      t.type === 'family' && t.ageGroups?.includes('child')
    );
    
    if (hasChildren && location.place_type === 'nightlife') {
      return false; // Nightlife not appropriate for children
    }
    
    // Large group considerations
    if (groupSize > 6) {
      // Some places might not be suitable for large groups
      if (location.place_type === 'restaurant' && location.crowd_level === 'high') {
        return Math.random() < 0.5; // 50% chance to include busy restaurants for large groups
      }
    }
    
    return true;
  }

  // Apply diversity scoring and final selection
  private static applyDiversityScoring(locations: ScrapedLocation[], _request: LocationSearchRequest): ScrapedLocation[] {
    // Sort by interest match and popularity
    const sorted = locations.sort((a, b) => {
      const scoreA = (a.interest_match || 0) * 0.6 + (a.popularity_score || 0) * 0.4;
      const scoreB = (b.interest_match || 0) * 0.6 + (b.popularity_score || 0) * 0.4;
      return scoreB - scoreA;
    });
    
    // Apply diversity scoring to ensure variety
    const diverseResults: ScrapedLocation[] = [];
    const typeCount: Record<PlaceType, number> = {} as Record<PlaceType, number>;
    const maxPerType = Math.max(2, Math.floor(30 / Object.keys(this.PLACE_TYPE_KEYWORDS).length));
    
    for (const location of sorted) {
      const placeType = location.place_type || 'other';
      const currentCount = typeCount[placeType] || 0;
      
      if (currentCount < maxPerType || diverseResults.length < 15) {
        // Calculate final diversity score
        const diversityBonus = currentCount === 0 ? 0.2 : Math.max(0, 0.2 - currentCount * 0.05);
        location.diversity_score = (location.interest_match || 0) + (location.popularity_score || 0) + diversityBonus;
        
        diverseResults.push(location);
        typeCount[placeType] = currentCount + 1;
        
        if (diverseResults.length >= 30) break;
      }
    }
    
    // Final sort by diversity score
    return diverseResults.sort((a, b) => (b.diversity_score || 0) - (a.diversity_score || 0));
  }

  // Initialize browser for scraping
  private static async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  // Close browser when done
  static async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Debounced search function (300ms delay)
  static async searchLocationsDebounced(
    query: string,
    userId?: string
  ): Promise<ScrapedLocation[]> {
    const debounceKey = `search_${query.toLowerCase().trim()}_${userId || 'anonymous'}`;
    
    const debouncedSearch = DebounceManager.debounce(
      debounceKey,
      this.searchLocationsInternal.bind(this),
      this.DEBOUNCE_DELAY
    );
    
    return debouncedSearch(query, userId);
  }

  // Main search function with caching (internal, non-debounced)
  // Main search function - now uses pre-scraped database data exclusively
  static async searchLocations(
    query: string,
    userId?: string
  ): Promise<ScrapedLocation[]> {
    try {
      // Always use database-first approach with pre-scraped data
      const dbResults = await this.searchPlacesDatabase(query);
      
      if (dbResults.length > 0) {
        console.log(`📊 Found ${dbResults.length} pre-scraped places from database for: ${query}`);
        
        // Track user interactions for analytics
        if (userId) {
          const { ComprehensivePlaceScrapingService } = await import('./comprehensivePlaceScrapingService.js');
          for (const place of dbResults.slice(0, 5)) { // Track top 5 viewed
            if (place.id) {
              await ComprehensivePlaceScrapingService.trackPlaceInteraction(
                userId, 
                place.id, 
                'viewed'
              );
            }
          }
        }
        
        return this.convertDbResultsToScrapedLocations(dbResults);
      }

      // If no database results, return static fallback data instead of real-time scraping
      console.log(`🔍 No database results for "${query}", using static fallback data...`);
      const fallbackResults = await this.getStaticFallbackPlaces(query);
      return fallbackResults;
      
    } catch (error) {
      console.error('Error in searchLocations:', error);
      // Return static fallback instead of failing
      return await this.getStaticFallbackPlaces(query);
    }
  }

  // Search places database
  // Enhanced search places database with better query parsing
  private static async searchPlacesDatabase(query: string): Promise<any[]> {
    try {
      const { ComprehensivePlaceScrapingService } = await import('./comprehensivePlaceScrapingService.js');
      
      // Extract location and category from query
      const { city, country, category } = this.parseSearchQuery(query);
      
      if (!city && !country) {
        // Try broader search if no specific location found
        return await this.searchPlacesByKeywords(query);
      }
      
      // Get popular places from database using pre-scraped data
      const places = await ComprehensivePlaceScrapingService.getPopularPlaces(
        city || '',
        country || '',
        category,
        30 // Increased limit for better results
      );
      
      return places;
      
    } catch (error) {
      console.error('Error searching places database:', error);
      return [];
    }
  }

  // Search places by keywords when location is not clear
  private static async searchPlacesByKeywords(query: string): Promise<any[]> {
    try {
      const queryWords = query.toLowerCase().split(' ');
      const searchQuery = `
        SELECT * FROM place_database 
        WHERE (
          LOWER(name) LIKE ANY($1) OR
          LOWER(description) LIKE ANY($1) OR
          LOWER(category) LIKE ANY($1) OR
          LOWER(place_type) LIKE ANY($1)
        )
        ORDER BY popularity_score DESC, rating DESC NULLS LAST
        LIMIT 20
      `;
      
      const likePatterns = queryWords.map(word => `%${word}%`);
      const result = await pool.query(searchQuery, [likePatterns]);
      
      return result.rows;
    } catch (error) {
      console.error('Error searching places by keywords:', error);
      return [];
    }
  }

  // Get static fallback places when no database results
  private static async getStaticFallbackPlaces(query: string): Promise<ScrapedLocation[]> {
    const location = this.extractLocationFromQuery(query);
    const category = this.extractCategoryFromQuery(query);
    
    // Return curated static data based on popular destinations
    const staticPlaces = this.getStaticAttractionsByLocation(location);
    
    // Filter by category if specified
    if (category && category !== 'general') {
      return staticPlaces.filter(place => 
        place.place_type === category || 
        (place.category && place.category === category) ||
        (place.tips && place.tips.toLowerCase().includes(category))
      );
    }
    
    return staticPlaces;
  }

  // Extract category from query
  private static extractCategoryFromQuery(query: string): string {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('food') || queryLower.includes('restaurant') || queryLower.includes('dining')) {
      return 'food';
    } else if (queryLower.includes('culture') || queryLower.includes('museum') || queryLower.includes('temple')) {
      return 'culture';
    } else if (queryLower.includes('nature') || queryLower.includes('park') || queryLower.includes('garden')) {
      return 'nature';
    } else if (queryLower.includes('shopping') || queryLower.includes('market')) {
      return 'shopping';
    } else if (queryLower.includes('nightlife') || queryLower.includes('bar') || queryLower.includes('club')) {
      return 'nightlife';
    } else if (queryLower.includes('attraction') || queryLower.includes('sightseeing')) {
      return 'attractions';
    }
    
    return 'general';
  }

  // Enhanced search with Selenium scraping for better data volume
  static async searchWithSeleniumFallback(
    query: string,
    userId?: string
  ): Promise<ScrapedLocation[]> {
    try {
      // First try the regular database search
      const dbResults = await this.searchPlacesDatabase(query);
      
      if (dbResults.length >= 10) {
        console.log(`📊 Sufficient database results (${dbResults.length}) for: ${query}`);
        return this.convertDbResultsToScrapedLocations(dbResults);
      }

      console.log(`🤖 Insufficient database results (${dbResults.length}), using Selenium scraping for: ${query}`);
      
      // Use Selenium scraping for comprehensive data collection
      const { SeleniumScrapingService } = await import('./seleniumScrapingService.js');
      
      // Extract destination and category from query
      const { city, country, category } = this.parseSearchQuery(query);
      const destination = city && country ? `${city}, ${country}` : query;
      
      // Scrape with Selenium for much better data volume
      const seleniumResults = await SeleniumScrapingService.scrapeDestinationPlaces(
        destination,
        category
      );
      
      console.log(`🎉 Selenium scraping completed: ${seleniumResults.length} places found`);
      
      // Convert Selenium results to ScrapedLocation format
      const scrapedLocations: ScrapedLocation[] = seleniumResults.map(place => ({
        location_name: place.name,
        source: place.source,
        city: place.city || 'Unknown',
        country: place.country || 'Unknown',
        rating: place.rating ?? null,
        visitor_count: place.review_count ?? null,
        tips: place.description || `Popular ${place.place_type} in ${place.city}`,
        lat: place.latitude ?? null,
        lng: place.longitude ?? null,
        place_type: place.place_type as PlaceType || 'other',
        estimated_cost: this.estimateCostFromPriceLevel(place.price_level),
        opening_hours: place.opening_hours ? JSON.stringify(place.opening_hours) : undefined,
        popularity_score: (place.popularity_score || 0) / 100, // Convert to 0-1 scale
        address: place.address,
        cached_at: new Date(),
        created_at: new Date()
      }));
      
      // Combine with any database results
      const combinedResults = [
        ...this.convertDbResultsToScrapedLocations(dbResults),
        ...scrapedLocations
      ];
      
      // Remove duplicates and return top results
      const uniqueResults = this.removeDuplicateLocations(combinedResults);
      
      // Track user interactions for analytics
      if (userId) {
        const { ComprehensivePlaceScrapingService } = await import('./comprehensivePlaceScrapingService.js');
        for (const place of uniqueResults.slice(0, 5)) {
          if (place.id) {
            await ComprehensivePlaceScrapingService.trackPlaceInteraction(
              userId, 
              place.id, 
              'viewed'
            );
          }
        }
      }
      
      return uniqueResults.slice(0, 30); // Return top 30 results
      
    } catch (error) {
      console.error('Error in Selenium fallback search:', error);
      // Fallback to original search method
      return await this.searchLocationsInternal(query, userId);
    }
  }

  // Parse search query to extract location and category
  private static parseSearchQuery(query: string): { city?: string; country?: string; category?: string } {
    const queryLower = query.toLowerCase();
    
    // Extract city/country patterns
    let city: string | undefined;
    let country: string | undefined;
    let category: string | undefined;
    
    // Common city patterns
    const cityPatterns = [
      'tokyo', 'osaka', 'kyoto', 'seoul', 'bangkok', 'taipei', 'singapore',
      'kuala lumpur', 'manila', 'ho chi minh', 'jakarta', 'phuket', 'busan',
      'london', 'paris', 'berlin', 'rome', 'barcelona', 'amsterdam', 'zurich',
      'new york', 'los angeles', 'san francisco', 'vancouver', 'las vegas',
      'sydney', 'melbourne', 'shanghai', 'beijing', 'mumbai', 'delhi'
    ];
    
    for (const cityPattern of cityPatterns) {
      if (queryLower.includes(cityPattern)) {
        city = cityPattern;
        break;
      }
    }
    
    // Extract category from query
    if (queryLower.includes('food') || queryLower.includes('restaurant') || queryLower.includes('dining')) {
      category = 'food';
    } else if (queryLower.includes('culture') || queryLower.includes('museum') || queryLower.includes('temple')) {
      category = 'culture';
    } else if (queryLower.includes('nature') || queryLower.includes('park') || queryLower.includes('garden')) {
      category = 'nature';
    } else if (queryLower.includes('shopping') || queryLower.includes('market')) {
      category = 'shopping';
    } else if (queryLower.includes('nightlife') || queryLower.includes('bar') || queryLower.includes('club')) {
      category = 'nightlife';
    }
    
    // Map cities to countries
    const cityCountryMap: { [key: string]: string } = {
      'tokyo': 'Japan', 'osaka': 'Japan', 'kyoto': 'Japan',
      'seoul': 'South Korea', 'busan': 'South Korea',
      'bangkok': 'Thailand', 'phuket': 'Thailand',
      'taipei': 'Taiwan',
      'singapore': 'Singapore',
      'kuala lumpur': 'Malaysia',
      'manila': 'Philippines',
      'ho chi minh': 'Vietnam',
      'jakarta': 'Indonesia',
      'london': 'United Kingdom',
      'paris': 'France',
      'berlin': 'Germany',
      'rome': 'Italy',
      'barcelona': 'Spain',
      'amsterdam': 'Netherlands',
      'zurich': 'Switzerland',
      'new york': 'United States',
      'los angeles': 'United States',
      'san francisco': 'United States',
      'las vegas': 'United States',
      'vancouver': 'Canada',
      'sydney': 'Australia',
      'melbourne': 'Australia',
      'shanghai': 'China',
      'beijing': 'China',
      'mumbai': 'India',
      'delhi': 'India'
    };
    
    if (city && cityCountryMap[city]) {
      country = cityCountryMap[city];
    }
    
    return { city, country, category };
  }

  // Remove duplicate locations based on name and location similarity
  private static removeDuplicateLocations(locations: ScrapedLocation[]): ScrapedLocation[] {
    const seen = new Map<string, ScrapedLocation>();
    
    for (const location of locations) {
      const key = location.location_name.toLowerCase().trim();
      
      // If we haven't seen this location, add it
      if (!seen.has(key)) {
        seen.set(key, location);
      } else {
        // If we have seen it, keep the one with better data (more fields filled)
        const existing = seen.get(key)!;
        const existingScore = this.calculateLocationDataScore(existing);
        const newScore = this.calculateLocationDataScore(location);
        
        if (newScore > existingScore) {
          seen.set(key, location);
        }
      }
    }
    
    return Array.from(seen.values());
  }

  // Calculate a score based on how much data a location has
  private static calculateLocationDataScore(location: ScrapedLocation): number {
    let score = 0;
    
    if (location.rating) score += 2;
    if (location.visitor_count) score += 2;
    if (location.lat && location.lng) score += 3;
    if (location.tips && location.tips.length > 10) score += 1;
    if (location.place_type) score += 1;
    if (location.estimated_cost) score += 1;
    if (location.popularity_score) score += 1;
    
    return score;
  }

  // Convert database results to ScrapedLocation format
  private static convertDbResultsToScrapedLocations(dbResults: any[]): ScrapedLocation[] {
    return dbResults.map(place => ({
      location_name: place.name,
      source: place.source,
      city: place.city || 'Unknown',
      country: place.country || 'Unknown',
      rating: place.rating,
      visitor_count: place.review_count,
      tips: place.description || `Popular ${place.place_type} in ${place.city}`,
      lat: place.latitude,
      lng: place.longitude,
      place_type: place.place_type,
      estimated_cost: this.estimateCostFromPriceLevel(place.price_level),
      opening_hours: place.opening_hours,
      address: place.address,
      popularity_score: place.popularity_score,
      cached_at: new Date(),
      created_at: new Date()
    }));
  }

  // Estimate cost from price level
  private static estimateCostFromPriceLevel(priceLevel?: number): number {
    if (!priceLevel) return 15;
    
    switch (priceLevel) {
      case 1: return 10;
      case 2: return 25;
      case 3: return 50;
      case 4: return 100;
      default: return 15;
    }
  }

  // Internal search implementation
  private static async searchLocationsInternal(
    query: string,
    userId?: string
  ): Promise<ScrapedLocation[]> {
    const cacheKey = `scrape_locations_${query.toLowerCase().trim()}`;
    
    // Check Redis cache first
    const redisResults = await RedisService.getJSON<ScrapedLocation[]>(cacheKey);
    if (redisResults) {
      console.log(`Redis cache hit for query: ${query}`);
      return redisResults;
    }

    // Check memory cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`Memory cache hit for query: ${query}`);
      return cached.data;
    }

    console.log(`Scraping locations for query: ${query}`);
    
    try {
      // Track search query
      await this.trackSearchQuery(userId, query, 0);

      // Scrape from multiple sources
      const results: ScrapedLocation[] = [];
      
      // Scrape ALVA visitor statistics (if applicable)
      const alvaResults = await this.scrapeALVAData(query);
      results.push(...alvaResults);

      // Scrape multiple sources in parallel for better results
      const scrapingPromises = [
        this.scrapeTripAdvisorData(query),
        this.scrapeTripComData(query),
        this.scrapeKlookData(query),
        this.scrapeKKdayData(query),
        this.scrapeViatorData(query),
        this.scrapeStaticAttractionData(query) // Add static fallback
      ];

      // Wait for all scraping to complete, but don't fail if some sources fail
      const scrapingResults = await Promise.allSettled(scrapingPromises);
      
      scrapingResults.forEach((result, index) => {
        const sources = ['TripAdvisor', 'Trip.com', 'Klook', 'KKday', 'Viator', 'Static Data'];
        if (result.status === 'fulfilled') {
          results.push(...result.value);
          console.log(`✅ ${sources[index]} scraping successful: ${result.value.length} results`);
        } else {
          console.log(`❌ ${sources[index]} scraping failed:`, result.reason?.message || 'Unknown error');
        }
      });

      // If we still have no results, add some basic fallback data
      if (results.length === 0) {
        console.log('🔄 No results from any source, adding fallback attractions...');
        results.push(...this.getFallbackAttractions(query));
      }

      // Enrich with Google Places API for coordinates
      const enrichedResults = await this.enrichWithGooglePlaces(results);

      // Cache results in database
      await this.cacheResultsInDatabase(enrichedResults);

      // Update search query with result count
      await this.updateSearchQueryResultCount(userId, query, enrichedResults.length);

      // Cache in Redis
      await RedisService.setJSON(cacheKey, enrichedResults, this.REDIS_CACHE_DURATION);

      // Cache in memory
      this.cache.set(cacheKey, {
        data: enrichedResults,
        timestamp: Date.now()
      });

      return enrichedResults;
    } catch (error) {
      console.error('Error scraping locations:', error);
      
      // Try to return cached database results as fallback
      const dbResults = await this.getCachedResultsFromDatabase(query);
      
      // If no database results, try to return any cached results (even expired)
      if (dbResults.length === 0) {
        const expiredCache = this.cache.get(cacheKey);
        if (expiredCache) {
          console.log('Returning expired cache results due to error');
          return expiredCache.data;
        }
      }
      
      return dbResults;
    }
  }

  // Scrape ALVA visitor statistics
  private static async scrapeALVAData(query: string): Promise<ScrapedLocation[]> {
    const results: ScrapedLocation[] = [];
    
    try {
      // Note: This is a placeholder implementation
      // ALVA (if it exists) would need specific scraping logic
      // For now, we'll simulate some data structure
      
      console.log(`Scraping ALVA data for: ${query}`);
      
      // This would be replaced with actual ALVA scraping logic
      // For demonstration, we'll return empty array
      // In real implementation, you would:
      // 1. Check robots.txt
      // 2. Make HTTP request to ALVA search
      // 3. Parse HTML response
      // 4. Extract visitor statistics
      
    } catch (error) {
      console.error('Error scraping ALVA data:', error);
    }
    
    return results;
  }

  // Scrape TripAdvisor data (respecting robots.txt)
  private static async scrapeTripAdvisorData(query: string): Promise<ScrapedLocation[]> {
    const results: ScrapedLocation[] = [];
    
    try {
      console.log(`Scraping TripAdvisor data for: ${query}`);
      
      // First check robots.txt compliance
      const canScrape = await this.checkRobotsTxt('https://www.tripadvisor.com');
      if (!canScrape) {
        console.log('TripAdvisor scraping not allowed by robots.txt');
        return results;
      }

      const browser = await this.getBrowser();
      const page = await browser.newPage();
      
      // Set user agent to be less detectable
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });
      
      // Remove webdriver property
      await page.evaluateOnNewDocument(() => {
        // @ts-ignore - navigator is available in browser context
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
      });
      
      // Add delay to be respectful
      await page.setDefaultTimeout(10000);
      
      try {
        // Search TripAdvisor
        const searchUrl = `https://www.tripadvisor.com/Search?q=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });
        
        // Wait for search results to load with multiple fallback selectors
        const selectors = [
          '[data-test-target="search-results"]',
          '.search-results',
          '[data-automation="search-results"]',
          '.listContainer',
          '.result'
        ];
        
        let resultsFound = false;
        for (const selector of selectors) {
          try {
            await page.waitForSelector(selector, { timeout: 3000 });
            resultsFound = true;
            break;
          } catch (e) {
            console.log(`Selector ${selector} not found, trying next...`);
          }
        }
        
        if (!resultsFound) {
          console.log('No search results found with any selector, continuing with empty results');
          return results;
        }
        
        // Extract search results with multiple selector strategies
        const locations = await page.evaluate(() => {
          // @ts-ignore - document is available in browser context
          let items = document.querySelectorAll('[data-test-target="search-results"] [data-test-target="search-result"]');
          
          // Fallback selectors if primary doesn't work
          if (items.length === 0) {
            // @ts-ignore
            items = document.querySelectorAll('.search-results .result, .listContainer .listing, .result-item');
          }
          
          const results: any[] = [];
          
          for (let i = 0; i < Math.min(items.length, 10); i++) {
            const item = items[i];
            
            // Multiple selector strategies for name
            // @ts-ignore - DOM methods available in browser context
            let nameElement = item.querySelector('[data-test-target="title"]') || 
                             item.querySelector('.listing-title') ||
                             item.querySelector('h3') ||
                             item.querySelector('.result-title');
            
            // Multiple selector strategies for rating
            // @ts-ignore - DOM methods available in browser context
            let ratingElement = item.querySelector('[data-test-target="review-rating"]') ||
                               item.querySelector('.rating') ||
                               item.querySelector('[class*="rating"]');
            
            // Multiple selector strategies for review count
            // @ts-ignore - DOM methods available in browser context
            let reviewCountElement = item.querySelector('[data-test-target="review-count"]') ||
                                    item.querySelector('.review-count') ||
                                    item.querySelector('[class*="review"]');
            
            if (nameElement) {
              const name = nameElement.textContent?.trim();
              const ratingText = ratingElement?.getAttribute('aria-label') || ratingElement?.textContent || '';
              const reviewText = reviewCountElement?.textContent?.trim() || '';
              
              // Extract rating (e.g., "4.5 of 5 bubbles" or "4.5")
              const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
              const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;
              
              // Extract review count (e.g., "1,234 reviews")
              const reviewMatch = reviewText.match(/(\d+(?:,\d+)*)/);
              const reviewCount = reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, '')) : undefined;
              
              if (name) {
                results.push({
                  location_name: name,
                  source: 'tripadvisor',
                  rating: rating,
                  visitor_count: reviewCount,
                  tips: reviewText ? `Popular destination with ${reviewText}` : 'Popular destination'
                });
              }
            }
          }
          
          return results;
        });
        
        results.push(...locations);
        
      } catch (pageError) {
        console.error('Error scraping TripAdvisor page:', pageError);
      } finally {
        await page.close();
      }
      
    } catch (error) {
      console.error('Error scraping TripAdvisor data:', error);
    }
    
    return results;
  }

  // Check robots.txt compliance
  private static async checkRobotsTxt(baseUrl: string): Promise<boolean> {
    try {
      const robotsUrl = `${baseUrl}/robots.txt`;
      const response = await fetch(robotsUrl);
      
      if (!response.ok) {
        return true; // If robots.txt doesn't exist, assume scraping is allowed
      }
      
      const robotsText = await response.text();
      
      // Simple robots.txt parsing
      // Look for User-agent: * or User-agent: JournoBot
      const lines = robotsText.split('\n');
      let currentUserAgent = '';
      let disallowed = false;
      
      for (const line of lines) {
        const trimmedLine = line.trim().toLowerCase();
        
        if (trimmedLine.startsWith('user-agent:')) {
          currentUserAgent = trimmedLine.split(':')[1].trim();
        } else if (trimmedLine.startsWith('disallow:') && 
                   (currentUserAgent === '*' || currentUserAgent === 'journobot')) {
          const disallowPath = trimmedLine.split(':')[1].trim();
          if (disallowPath === '/' || disallowPath === '/search') {
            disallowed = true;
            break;
          }
        }
      }
      
      return !disallowed;
    } catch (error) {
      console.error('Error checking robots.txt:', error);
      return true; // Default to allowing scraping if check fails
    }
  }

  // Scrape Trip.com data
  private static async scrapeTripComData(query: string): Promise<ScrapedLocation[]> {
    const results: ScrapedLocation[] = [];
    
    try {
      console.log(`Scraping Trip.com data for: ${query}`);
      
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      try {
        const searchUrl = `https://us.trip.com/things-to-do/list?query=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 10000 });
        
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const locations = await page.evaluate(() => {
          // @ts-ignore - document is available in browser context
          const items = document.querySelectorAll('.list-card, .attraction-item, [class*="attraction"], [class*="activity"]');
          const results: any[] = [];
          
          for (let i = 0; i < Math.min(items.length, 8); i++) {
            const item = items[i];
            
            const nameElement = item.querySelector('h3, .title, [class*="title"], .name, [class*="name"]');
            const ratingElement = item.querySelector('.rating, [class*="rating"], .score, [class*="score"]');
            const priceElement = item.querySelector('.price, [class*="price"], .cost, [class*="cost"]');
            
            if (nameElement && nameElement.textContent) {
              const name = nameElement.textContent.trim();
              const ratingText = ratingElement?.textContent || '';
              const priceText = priceElement?.textContent || '';
              
              const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
              const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;
              
              const priceMatch = priceText.match(/\$(\d+)/);
              const price = priceMatch ? parseInt(priceMatch[1]) : undefined;
              
              if (name.length > 3) {
                results.push({
                  location_name: name,
                  source: 'trip.com',
                  rating: rating,
                  estimated_cost: price,
                  tips: `Popular activity on Trip.com`
                });
              }
            }
          }
          
          return results;
        });
        
        results.push(...locations);
        
      } catch (pageError) {
        console.error('Error scraping Trip.com page:', pageError);
      } finally {
        await page.close();
      }
      
    } catch (error) {
      console.error('Error scraping Trip.com data:', error);
    }
    
    return results;
  }

  // Scrape Klook data
  private static async scrapeKlookData(query: string): Promise<ScrapedLocation[]> {
    const results: ScrapedLocation[] = [];
    
    try {
      console.log(`Scraping Klook data for: ${query}`);
      
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      try {
        const searchUrl = `https://www.klook.com/en-US/search/activities/?query=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 10000 });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const locations = await page.evaluate(() => {
          // @ts-ignore - document is available in browser context
          const items = document.querySelectorAll('[class*="ActivityCard"], [class*="activity"], .card, [class*="product"]');
          const results: any[] = [];
          
          for (let i = 0; i < Math.min(items.length, 8); i++) {
            const item = items[i];
            
            const nameElement = item.querySelector('h3, h4, .title, [class*="title"], .name, [class*="name"]');
            const ratingElement = item.querySelector('[class*="rating"], .rating, [class*="score"]');
            const priceElement = item.querySelector('[class*="price"], .price');
            
            if (nameElement && nameElement.textContent) {
              const name = nameElement.textContent.trim();
              const ratingText = ratingElement?.textContent || '';
              const priceText = priceElement?.textContent || '';
              
              const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
              const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;
              
              const priceMatch = priceText.match(/\$(\d+)/);
              const price = priceMatch ? parseInt(priceMatch[1]) : undefined;
              
              if (name.length > 3) {
                results.push({
                  location_name: name,
                  source: 'klook',
                  rating: rating,
                  estimated_cost: price,
                  tips: `Bookable activity on Klook`
                });
              }
            }
          }
          
          return results;
        });
        
        results.push(...locations);
        
      } catch (pageError) {
        console.error('Error scraping Klook page:', pageError);
      } finally {
        await page.close();
      }
      
    } catch (error) {
      console.error('Error scraping Klook data:', error);
    }
    
    return results;
  }

  // Scrape KKday data
  private static async scrapeKKdayData(query: string): Promise<ScrapedLocation[]> {
    const results: ScrapedLocation[] = [];
    
    try {
      console.log(`Scraping KKday data for: ${query}`);
      
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      try {
        const searchUrl = `https://www.kkday.com/en/search/activity?keyword=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 10000 });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const locations = await page.evaluate(() => {
          // @ts-ignore - document is available in browser context
          const items = document.querySelectorAll('[class*="ProductCard"], [class*="product"], .card, [class*="activity"]');
          const results: any[] = [];
          
          for (let i = 0; i < Math.min(items.length, 8); i++) {
            const item = items[i];
            
            const nameElement = item.querySelector('h3, h4, .title, [class*="title"], .name, [class*="name"]');
            const ratingElement = item.querySelector('[class*="rating"], .rating, [class*="score"]');
            const priceElement = item.querySelector('[class*="price"], .price');
            
            if (nameElement && nameElement.textContent) {
              const name = nameElement.textContent.trim();
              const ratingText = ratingElement?.textContent || '';
              const priceText = priceElement?.textContent || '';
              
              const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
              const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;
              
              const priceMatch = priceText.match(/\$(\d+)/);
              const price = priceMatch ? parseInt(priceMatch[1]) : undefined;
              
              if (name.length > 3) {
                results.push({
                  location_name: name,
                  source: 'kkday',
                  rating: rating,
                  estimated_cost: price,
                  tips: `Experience available on KKday`
                });
              }
            }
          }
          
          return results;
        });
        
        results.push(...locations);
        
      } catch (pageError) {
        console.error('Error scraping KKday page:', pageError);
      } finally {
        await page.close();
      }
      
    } catch (error) {
      console.error('Error scraping KKday data:', error);
    }
    
    return results;
  }

  // Scrape Viator data
  private static async scrapeViatorData(query: string): Promise<ScrapedLocation[]> {
    const results: ScrapedLocation[] = [];
    
    try {
      console.log(`Scraping Viator data for: ${query}`);
      
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      try {
        const searchUrl = `https://www.viator.com/searchResults/all?text=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 10000 });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const locations = await page.evaluate(() => {
          // @ts-ignore - document is available in browser context
          const items = document.querySelectorAll('[class*="product"], .card, [class*="activity"], [class*="tour"]');
          const results: any[] = [];
          
          for (let i = 0; i < Math.min(items.length, 8); i++) {
            const item = items[i];
            
            const nameElement = item.querySelector('h3, h4, .title, [class*="title"], .name, [class*="name"]');
            const ratingElement = item.querySelector('[class*="rating"], .rating, [class*="score"]');
            const priceElement = item.querySelector('[class*="price"], .price');
            
            if (nameElement && nameElement.textContent) {
              const name = nameElement.textContent.trim();
              const ratingText = ratingElement?.textContent || '';
              const priceText = priceElement?.textContent || '';
              
              const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
              const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;
              
              const priceMatch = priceText.match(/\$(\d+)/);
              const price = priceMatch ? parseInt(priceMatch[1]) : undefined;
              
              if (name.length > 3) {
                results.push({
                  location_name: name,
                  source: 'viator',
                  rating: rating,
                  estimated_cost: price,
                  tips: `Tour available on Viator`
                });
              }
            }
          }
          
          return results;
        });
        
        results.push(...locations);
        
      } catch (pageError) {
        console.error('Error scraping Viator page:', pageError);
      } finally {
        await page.close();
      }
      
    } catch (error) {
      console.error('Error scraping Viator data:', error);
    }
    
    return results;
  }

  // Enrich results with Google Places API for coordinates
  private static async enrichWithGooglePlaces(
    locations: ScrapedLocation[]
  ): Promise<ScrapedLocation[]> {
    const enrichedResults: ScrapedLocation[] = [];
    
    for (const location of locations) {
      try {
        // Use Google Places API to get coordinates
        const placeDetails = await GoogleMapsService.searchPlaces(location.location_name);
        
        if (placeDetails && placeDetails.length > 0) {
          const place = placeDetails[0];
          enrichedResults.push({
            ...location,
            lat: place.geometry?.location?.lat,
            lng: place.geometry?.location?.lng
          });
        } else {
          // Keep original location even without coordinates
          enrichedResults.push(location);
        }
        
        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error enriching location ${location.location_name}:`, error);
        // Keep original location even if enrichment fails
        enrichedResults.push(location);
      }
    }
    
    return enrichedResults;
  }

  // Cache results in database
  private static async cacheResultsInDatabase(locations: ScrapedLocation[]): Promise<void> {
    try {
      for (const location of locations) {
        const query = `
          INSERT INTO scraped_locations (
            location_name, source, visitor_count, rating, tips, lat, lng, cached_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          ON CONFLICT (location_name, source) 
          DO UPDATE SET 
            visitor_count = EXCLUDED.visitor_count,
            rating = EXCLUDED.rating,
            tips = EXCLUDED.tips,
            lat = EXCLUDED.lat,
            lng = EXCLUDED.lng,
            cached_at = NOW()
        `;
        
        const values = [
          location.location_name,
          location.source,
          location.visitor_count,
          location.rating,
          location.tips,
          location.lat,
          location.lng
        ];
        
        await pool.query(query, values);
      }
    } catch (error) {
      console.error('Error caching results in database:', error);
    }
  }

  // Get cached results from database (with offline support)
  private static async getCachedResultsFromDatabase(query: string): Promise<ScrapedLocation[]> {
    try {
      // First try fresh results (within 7 days)
      let dbQuery = `
        SELECT * FROM scraped_locations 
        WHERE location_name ILIKE $1 
        AND cached_at > NOW() - INTERVAL '7 days'
        ORDER BY visitor_count DESC NULLS LAST, rating DESC NULLS LAST
        LIMIT 20
      `;
      
      let result = await pool.query(dbQuery, [`%${query}%`]);
      
      // If no fresh results, try older cached results (up to 30 days for offline support)
      if (result.rows.length === 0) {
        console.log('No fresh cached results, trying older cache');
        dbQuery = `
          SELECT * FROM scraped_locations 
          WHERE location_name ILIKE $1 
          AND cached_at > NOW() - INTERVAL '30 days'
          ORDER BY cached_at DESC, visitor_count DESC NULLS LAST, rating DESC NULLS LAST
          LIMIT 20
        `;
        
        result = await pool.query(dbQuery, [`%${query}%`]);
      }
      
      return result.rows;
    } catch (error) {
      console.error('Error getting cached results from database:', error);
      return [];
    }
  }

  // Track search query for analytics
  private static async trackSearchQuery(
    userId: string | undefined,
    queryText: string,
    resultCount: number
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO search_queries (user_id, query_text, result_count)
        VALUES ($1, $2, $3)
      `;
      
      await pool.query(query, [userId || null, queryText, resultCount]);
    } catch (error) {
      console.error('Error tracking search query:', error);
    }
  }

  // Update search query result count
  private static async updateSearchQueryResultCount(
    userId: string | undefined,
    queryText: string,
    resultCount: number
  ): Promise<void> {
    try {
      const query = `
        UPDATE search_queries 
        SET result_count = $1
        WHERE id = (
          SELECT id FROM search_queries 
          WHERE user_id = $2 AND query_text = $3 AND created_at > NOW() - INTERVAL '1 hour'
          ORDER BY created_at DESC
          LIMIT 1
        )
      `;
      
      await pool.query(query, [resultCount, userId || null, queryText]);
    } catch (error) {
      console.error('Error updating search query result count:', error);
    }
  }

  // Track when a user selects a scraped location
  static async trackLocationSelection(
    userId: string | undefined,
    queryText: string,
    selectedLocationId: string
  ): Promise<void> {
    try {
      const query = `
        UPDATE search_queries 
        SET selected_result_id = $1
        WHERE id = (
          SELECT id FROM search_queries 
          WHERE user_id = $2 AND query_text = $3 AND created_at > NOW() - INTERVAL '1 hour'
          ORDER BY created_at DESC
          LIMIT 1
        )
      `;
      
      await pool.query(query, [selectedLocationId, userId || null, queryText]);
    } catch (error) {
      console.error('Error tracking location selection:', error);
    }
  }

  // Get search analytics
  static async getSearchAnalytics(limit: number = 100): Promise<any[]> {
    try {
      const query = `
        SELECT 
          query_text,
          COUNT(*) as search_count,
          AVG(result_count) as avg_results,
          COUNT(selected_result_id) as selections,
          ROUND((COUNT(selected_result_id)::decimal / COUNT(*)) * 100, 2) as selection_rate,
          MAX(created_at) as last_searched,
          MIN(created_at) as first_searched
        FROM search_queries 
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY query_text
        ORDER BY search_count DESC, last_searched DESC
        LIMIT $1
      `;
      
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting search analytics:', error);
      return [];
    }
  }

  // Get popular search trends
  static async getSearchTrends(days: number = 7): Promise<any[]> {
    try {
      const query = `
        SELECT 
          query_text,
          COUNT(*) as search_count,
          DATE(created_at) as search_date
        FROM search_queries 
        WHERE created_at > NOW() - INTERVAL '${days} days'
        GROUP BY query_text, DATE(created_at)
        ORDER BY search_date DESC, search_count DESC
        LIMIT 50
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting search trends:', error);
      return [];
    }
  }

  // Get cache statistics
  static async getCacheStatistics(): Promise<any> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_cached_locations,
          COUNT(CASE WHEN cached_at > NOW() - INTERVAL '7 days' THEN 1 END) as fresh_cache_count,
          COUNT(CASE WHEN cached_at <= NOW() - INTERVAL '7 days' THEN 1 END) as stale_cache_count,
          AVG(visitor_count) as avg_visitor_count,
          AVG(rating) as avg_rating,
          COUNT(DISTINCT source) as unique_sources
        FROM scraped_locations
      `;
      
      const result = await pool.query(query);
      return result.rows[0] || {};
    } catch (error) {
      console.error('Error getting cache statistics:', error);
      return {};
    }
  }

  // Clear cache
  static clearCache(): void {
    this.cache.clear();
  }

  // Advanced Caching System Methods

  // Cache place suggestions in database
  static async cachePlaceSuggestions(
    request: LocationSearchRequest,
    result: LocationSearchResult
  ): Promise<void> {
    try {
      const destinationHash = this.generateCacheKey(request);
      
      const query = `
        INSERT INTO place_suggestions_cache (
          destination_hash, destination, interests, budget_level, group_size,
          traveler_types, suggestions_data, search_metadata, cached_at, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW() + INTERVAL '24 hours')
        ON CONFLICT (destination_hash) 
        DO UPDATE SET 
          suggestions_data = EXCLUDED.suggestions_data,
          search_metadata = EXCLUDED.search_metadata,
          cached_at = NOW(),
          expires_at = NOW() + INTERVAL '24 hours',
          last_accessed_at = NOW(),
          cache_hit_count = place_suggestions_cache.cache_hit_count + 1
      `;
      
      const values = [
        destinationHash,
        request.destination,
        JSON.stringify(request.interests),
        request.budgetLevel,
        request.groupSize || 1,
        JSON.stringify(request.travelerTypes || []),
        JSON.stringify(result.places),
        JSON.stringify(result.searchMetadata)
      ];
      
      await pool.query(query, values);
      
      // Update cache statistics
      await this.updateCacheStatistics('place_suggestions', true, result.searchMetadata.processingTime);
    } catch (error) {
      console.error('Error caching place suggestions:', error);
    }
  }

  // Get cached place suggestions from database
  static async getCachedPlaceSuggestions(
    request: LocationSearchRequest
  ): Promise<LocationSearchResult | null> {
    try {
      const destinationHash = this.generateCacheKey(request);
      
      const query = `
        SELECT * FROM place_suggestions_cache 
        WHERE destination_hash = $1 
        AND expires_at > NOW()
        LIMIT 1
      `;
      
      const result = await pool.query(query, [destinationHash]);
      
      if (result.rows.length === 0) {
        await this.updateCacheStatistics('place_suggestions', false, 0);
        return null;
      }
      
      const cached = result.rows[0];
      
      // Update last accessed time and hit count
      await pool.query(
        `UPDATE place_suggestions_cache 
         SET last_accessed_at = NOW(), cache_hit_count = cache_hit_count + 1 
         WHERE id = $1`,
        [cached.id]
      );
      
      await this.updateCacheStatistics('place_suggestions', true, 0);
      
      return {
        places: cached.suggestions_data,
        searchMetadata: {
          ...cached.search_metadata,
          cacheHit: true
        }
      };
    } catch (error) {
      console.error('Error getting cached place suggestions:', error);
      return null;
    }
  }

  // Update cache statistics
  static async updateCacheStatistics(
    cacheType: string,
    isHit: boolean,
    responseTime: number
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO cache_statistics (
          cache_type, cache_hits, cache_misses, total_requests, 
          hit_rate, avg_response_time_ms, date
        ) VALUES ($1, $2, $3, 1, $4, $5, CURRENT_DATE)
        ON CONFLICT (cache_type, date) 
        DO UPDATE SET 
          cache_hits = cache_statistics.cache_hits + $2,
          cache_misses = cache_statistics.cache_misses + $3,
          total_requests = cache_statistics.total_requests + 1,
          hit_rate = ROUND(
            ((cache_statistics.cache_hits + $2)::decimal / 
             (cache_statistics.total_requests + 1)) * 100, 
            2
          ),
          avg_response_time_ms = ROUND(
            ((cache_statistics.avg_response_time_ms * cache_statistics.total_requests + $5) / 
             (cache_statistics.total_requests + 1))::decimal,
            0
          ),
          updated_at = NOW()
      `;
      
      const values = [
        cacheType,
        isHit ? 1 : 0,
        isHit ? 0 : 1,
        isHit ? 100 : 0, // Initial hit rate for new records
        responseTime
      ];
      
      await pool.query(query, values);
    } catch (error) {
      console.error('Error updating cache statistics:', error);
    }
  }

  // Get cache statistics
  static async getCacheStatisticsReport(days: number = 7): Promise<any[]> {
    try {
      const query = `
        SELECT 
          cache_type,
          date,
          cache_hits,
          cache_misses,
          total_requests,
          hit_rate,
          avg_response_time_ms
        FROM cache_statistics 
        WHERE date > CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY date DESC, cache_type
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting cache statistics report:', error);
      return [];
    }
  }

  // Clean up expired cache entries
  static async cleanupExpiredCache(): Promise<number> {
    try {
      const result = await pool.query(`
        DELETE FROM place_suggestions_cache
        WHERE expires_at < NOW()
        RETURNING id
      `);
      
      const deletedCount = result.rowCount || 0;
      console.log(`Cleaned up ${deletedCount} expired cache entries`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired cache:', error);
      return 0;
    }
  }

  // Get popular destinations for cache warming
  static async getPopularDestinations(limit: number = 10): Promise<any[]> {
    try {
      const query = `
        SELECT 
          destination,
          COUNT(*) as search_count,
          MAX(last_accessed_at) as last_searched,
          AVG(cache_hit_count) as avg_hits
        FROM place_suggestions_cache
        WHERE cached_at > NOW() - INTERVAL '30 days'
        GROUP BY destination
        ORDER BY search_count DESC, last_searched DESC
        LIMIT $1
      `;
      
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting popular destinations:', error);
      return [];
    }
  }

  // Warm cache for popular destinations (run during off-peak hours)
  static async warmCacheForPopularDestinations(): Promise<void> {
    try {
      const popularDestinations = await this.getPopularDestinations(5);
      
      console.log(`Warming cache for ${popularDestinations.length} popular destinations`);
      
      for (const dest of popularDestinations) {
        try {
          // Create a basic request for cache warming
          const request: LocationSearchRequest = {
            destination: dest.destination,
            interests: [
              { id: 'food', name: 'Food', weight: 3 },
              { id: 'culture', name: 'Culture', weight: 3 },
              { id: 'nature', name: 'Nature', weight: 2 }
            ],
            budgetLevel: 'medium',
            groupSize: 2
          };
          
          // Check if cache exists and is fresh
          const cached = await this.getCachedPlaceSuggestions(request);
          
          if (!cached) {
            console.log(`Warming cache for: ${dest.destination}`);
            await this.searchLocationsEnhanced(request);
            
            // Add delay to avoid overwhelming external APIs
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.warn(`Failed to warm cache for ${dest.destination}:`, error);
        }
      }
      
      console.log('Cache warming completed');
    } catch (error) {
      console.error('Error warming cache:', error);
    }
  }

  // Invalidate cache for a specific destination
  static async invalidateCache(destination: string): Promise<void> {
    try {
      const result = await pool.query(
        `DELETE FROM place_suggestions_cache WHERE destination ILIKE $1`,
        [`%${destination}%`]
      );
      
      console.log(`Invalidated ${result.rowCount || 0} cache entries for: ${destination}`);
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }

  // Get cache performance metrics
  static async getCachePerformanceMetrics(): Promise<any> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_cached_entries,
          COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active_entries,
          COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired_entries,
          AVG(cache_hit_count) as avg_hit_count,
          MAX(cache_hit_count) as max_hit_count,
          SUM(cache_hit_count) as total_hits,
          COUNT(DISTINCT destination) as unique_destinations,
          AVG(EXTRACT(EPOCH FROM (NOW() - cached_at))) as avg_age_seconds
        FROM place_suggestions_cache
      `;
      
      const result = await pool.query(query);
      
      // Get recent statistics
      const statsQuery = `
        SELECT 
          SUM(cache_hits) as total_cache_hits,
          SUM(cache_misses) as total_cache_misses,
          SUM(total_requests) as total_requests,
          ROUND(AVG(hit_rate), 2) as avg_hit_rate,
          ROUND(AVG(avg_response_time_ms), 0) as avg_response_time
        FROM cache_statistics
        WHERE date > CURRENT_DATE - INTERVAL '7 days'
      `;
      
      const statsResult = await pool.query(statsQuery);
      
      return {
        cache_entries: result.rows[0],
        performance: statsResult.rows[0]
      };
    } catch (error) {
      console.error('Error getting cache performance metrics:', error);
      return {};
    }
  }

  // Clear Redis cache for a specific query
  static async clearRedisCache(query?: string): Promise<void> {
    if (query) {
      const cacheKey = `scrape_locations_${query.toLowerCase().trim()}`;
      await RedisService.del(cacheKey);
    } else {
      // Clear all scraping cache
      await RedisService.flushAll();
    }
  }

  // Scrape static attraction data as fallback
  private static async scrapeStaticAttractionData(query: string): Promise<ScrapedLocation[]> {
    const results: ScrapedLocation[] = [];
    
    try {
      console.log(`Using static attraction data for: ${query}`);
      
      // Extract location from query
      const location = this.extractLocationFromQuery(query);
      const staticData = this.getStaticAttractionsByLocation(location);
      
      results.push(...staticData);
      
    } catch (error) {
      console.error('Error getting static attraction data:', error);
    }
    
    return results;
  }

  // Extract location name from search query
  private static extractLocationFromQuery(query: string): string {
    // Simple extraction - look for common patterns
    const words = query.toLowerCase().split(' ');
    
    // Common location patterns
    const locationKeywords = ['attractions', 'things', 'to', 'do', 'places', 'visit', 'activities', 'tours'];
    const location = words.filter(word => !locationKeywords.includes(word)).join(' ');
    
    return location || 'general';
  }

  // Get static attractions by location
  private static getStaticAttractionsByLocation(location: string): ScrapedLocation[] {
    const locationLower = location.toLowerCase();
    
    // Tokyo attractions
    if (locationLower.includes('tokyo')) {
      return [
        {
          location_name: 'Senso-ji Temple',
          source: 'static_data',
          rating: 4.3,
          place_type: 'temple',
          tips: 'Ancient Buddhist temple in Asakusa district, famous for its traditional atmosphere',
          estimated_cost: 0,
          lat: 35.7148,
          lng: 139.7967,
          visitor_count: 30000000,
          cached_at: new Date(),
          created_at: new Date()
        },
        {
          location_name: 'Tokyo Skytree',
          source: 'static_data',
          rating: 4.1,
          place_type: 'observation_deck',
          tips: 'Tallest structure in Japan with panoramic city views',
          estimated_cost: 25,
          lat: 35.7101,
          lng: 139.8107,
          visitor_count: 6000000,
          cached_at: new Date(),
          created_at: new Date()
        },
        {
          location_name: 'Meiji Shrine',
          source: 'static_data',
          rating: 4.4,
          place_type: 'shrine',
          tips: 'Peaceful Shinto shrine dedicated to Emperor Meiji, surrounded by forest',
          estimated_cost: 0,
          lat: 35.6764,
          lng: 139.6993,
          visitor_count: 3000000,
          cached_at: new Date(),
          created_at: new Date()
        },
        {
          location_name: 'Tsukiji Outer Market',
          source: 'static_data',
          rating: 4.2,
          place_type: 'market',
          tips: 'Famous fish market with fresh sushi and street food',
          estimated_cost: 15,
          lat: 35.6654,
          lng: 139.7707,
          visitor_count: 40000,
          cached_at: new Date(),
          created_at: new Date()
        },
        {
          location_name: 'Imperial Palace East Gardens',
          source: 'static_data',
          rating: 4.0,
          place_type: 'garden',
          tips: 'Beautiful traditional Japanese gardens with seasonal flowers',
          estimated_cost: 0,
          lat: 35.6852,
          lng: 139.7594,
          visitor_count: 1000000,
          cached_at: new Date(),
          created_at: new Date()
        }
      ];
    }
    
    // Paris attractions
    if (locationLower.includes('paris')) {
      return [
        {
          location_name: 'Eiffel Tower',
          source: 'static_data',
          rating: 4.5,
          place_type: 'landmark',
          tips: 'Iconic iron tower and symbol of Paris with stunning city views',
          estimated_cost: 20,
          lat: 48.8584,
          lng: 2.2945,
          visitor_count: 7000000,
          cached_at: new Date(),
          created_at: new Date()
        },
        {
          location_name: 'Louvre Museum',
          source: 'static_data',
          rating: 4.6,
          place_type: 'museum',
          tips: 'World\'s largest art museum, home to the Mona Lisa',
          estimated_cost: 17,
          lat: 48.8606,
          lng: 2.3376,
          visitor_count: 10000000,
          cached_at: new Date(),
          created_at: new Date()
        },
        {
          location_name: 'Notre-Dame Cathedral',
          source: 'static_data',
          rating: 4.4,
          place_type: 'cathedral',
          tips: 'Gothic masterpiece on Île de la Cité (currently under restoration)',
          estimated_cost: 0,
          lat: 48.8530,
          lng: 2.3499,
          visitor_count: 12000000,
          cached_at: new Date(),
          created_at: new Date()
        }
      ];
    }
    
    // London attractions
    if (locationLower.includes('london')) {
      return [
        {
          location_name: 'Tower of London',
          source: 'static_data',
          rating: 4.4,
          place_type: 'castle',
          tips: 'Historic castle housing the Crown Jewels',
          estimated_cost: 30,
          lat: 51.5081,
          lng: -0.0759,
          visitor_count: 3000000,
          cached_at: new Date(),
          created_at: new Date()
        },
        {
          location_name: 'British Museum',
          source: 'static_data',
          rating: 4.5,
          place_type: 'museum',
          tips: 'World-class museum with artifacts from around the globe',
          estimated_cost: 0,
          lat: 51.5194,
          lng: -0.1270,
          visitor_count: 6000000,
          cached_at: new Date(),
          created_at: new Date()
        },
        {
          location_name: 'Big Ben',
          source: 'static_data',
          rating: 4.3,
          place_type: 'landmark',
          tips: 'Iconic clock tower and symbol of London',
          estimated_cost: 0,
          lat: 51.4994,
          lng: -0.1245,
          visitor_count: 2000000,
          cached_at: new Date(),
          created_at: new Date()
        }
      ];
    }
    
    // New York attractions
    if (locationLower.includes('new york') || locationLower.includes('nyc')) {
      return [
        {
          location_name: 'Statue of Liberty',
          source: 'static_data',
          rating: 4.4,
          place_type: 'monument',
          tips: 'Iconic symbol of freedom and democracy',
          estimated_cost: 25,
          lat: 40.6892,
          lng: -74.0445,
          visitor_count: 4000000,
          cached_at: new Date(),
          created_at: new Date()
        },
        {
          location_name: 'Central Park',
          source: 'static_data',
          rating: 4.3,
          place_type: 'park',
          tips: 'Massive urban park perfect for walking and relaxation',
          estimated_cost: 0,
          lat: 40.7829,
          lng: -73.9654,
          visitor_count: 42000000,
          cached_at: new Date(),
          created_at: new Date()
        },
        {
          location_name: 'Times Square',
          source: 'static_data',
          rating: 4.0,
          place_type: 'district',
          tips: 'Bustling commercial intersection known for bright lights and Broadway shows',
          estimated_cost: 0,
          lat: 40.7580,
          lng: -73.9855,
          visitor_count: 50000000,
          cached_at: new Date(),
          created_at: new Date()
        }
      ];
    }
    
    // Generic fallback attractions
    return [
      {
        location_name: `${location} City Center`,
        source: 'static_data',
        rating: 4.0,
        place_type: 'district',
        tips: `Historic city center with shops, restaurants, and local attractions`,
        estimated_cost: 0,
        visitor_count: 100000,
        lat: null,
        lng: null,
        cached_at: new Date(),
        created_at: new Date()
      },
      {
        location_name: `${location} Museum`,
        source: 'static_data',
        rating: 4.1,
        place_type: 'museum',
        tips: `Local museum showcasing the history and culture of ${location}`,
        estimated_cost: 12,
        visitor_count: 50000,
        lat: null,
        lng: null,
        cached_at: new Date(),
        created_at: new Date()
      },
      {
        location_name: `${location} Park`,
        source: 'static_data',
        rating: 4.2,
        place_type: 'park',
        tips: `Beautiful public park perfect for relaxation and outdoor activities`,
        estimated_cost: 0,
        visitor_count: 75000,
        lat: null,
        lng: null,
        cached_at: new Date(),
        created_at: new Date()
      }
    ];
  }

  // Get fallback attractions when all scraping fails
  private static getFallbackAttractions(query: string): ScrapedLocation[] {
    const location = this.extractLocationFromQuery(query);
    
    return [
      {
        location_name: `Popular Attraction in ${location}`,
        source: 'fallback',
        rating: 4.0 + Math.random() * 0.8,
        place_type: 'attraction',
        tips: `Must-visit attraction in ${location} recommended by travelers`,
        estimated_cost: Math.floor(Math.random() * 30) + 5,
        visitor_count: Math.floor(Math.random() * 100000) + 10000,
        lat: null,
        lng: null,
        cached_at: new Date(),
        created_at: new Date()
      },
      {
        location_name: `${location} Cultural Site`,
        source: 'fallback',
        rating: 4.1 + Math.random() * 0.7,
        place_type: 'cultural',
        tips: `Experience the rich culture and history of ${location}`,
        estimated_cost: Math.floor(Math.random() * 20) + 8,
        visitor_count: Math.floor(Math.random() * 80000) + 5000,
        lat: null,
        lng: null,
        cached_at: new Date(),
        created_at: new Date()
      },
      {
        location_name: `${location} Local Market`,
        source: 'fallback',
        rating: 4.2 + Math.random() * 0.6,
        place_type: 'market',
        tips: `Authentic local market with food, crafts, and local products`,
        estimated_cost: Math.floor(Math.random() * 15) + 5,
        visitor_count: Math.floor(Math.random() * 50000) + 2000,
        lat: null,
        lng: null,
        cached_at: new Date(),
        created_at: new Date()
      }
    ];
  }
}