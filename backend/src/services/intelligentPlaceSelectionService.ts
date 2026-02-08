import { ScrapedLocation, InterestCategory, TravelerType, PlaceType } from '../types/index.js';

export interface PlaceSelectionRequest {
  places: ScrapedLocation[];
  interests: InterestCategory[];
  budgetLevel: 'low' | 'medium' | 'high';
  groupSize: number;
  travelerTypes: TravelerType[];
  travelDates?: { start: string; end: string };
  travelStyle: 'relaxed' | 'moderate' | 'fast-paced';
  mustVisitPlaces?: string[];
}

export interface PlaceSelectionResult {
  selectedPlaces: EnhancedPlace[];
  diversityScore: number;
  selectionMetadata: {
    totalCandidates: number;
    diversityApplied: boolean;
    popularityWeighted: boolean;
    seasonalAdjusted: boolean;
    groupFiltered: boolean;
    interestMatched: boolean;
  };
}

export interface EnhancedPlace extends ScrapedLocation {
  diversityScore: number;
  popularityWeight: number;
  seasonalRelevance: number;
  groupAppropriatenessScore: number;
  interestMatchScore: number;
  finalScore: number;
  selectionReason: string[];
}

export interface SeasonalFactors {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  weatherSuitability: number; // 0-1 score
  crowdLevel: number; // 0-1 score (0 = less crowded, 1 = very crowded)
  priceMultiplier: number; // Seasonal price adjustment
}

export class IntelligentPlaceSelectionService {
  // Main place selection algorithm
  static async selectOptimalPlaces(request: PlaceSelectionRequest): Promise<PlaceSelectionResult> {
    const startTime = Date.now();
    
    // Step 1: Apply diversity scoring
    const diversityEnhanced = this.applyDiversityScoring(request.places, request.interests);
    
    // Step 2: Apply popularity weighting
    const popularityWeighted = this.applyPopularityWeighting(diversityEnhanced);
    
    // Step 3: Apply seasonal and temporal relevance
    const seasonalAdjusted = this.applySeasonalRelevance(popularityWeighted, request.travelDates);
    
    // Step 4: Apply group-size appropriate filtering
    const groupFiltered = this.applyGroupSizeFiltering(seasonalAdjusted, request.groupSize, request.travelerTypes);
    
    // Step 5: Apply interest matching with fuzzy logic
    const interestMatched = this.applyFuzzyInterestMatching(groupFiltered, request.interests);
    
    // Step 6: Calculate final scores and select top places
    const finalScored = this.calculateFinalScores(interestMatched, request);
    
    // Step 7: Ensure must-visit places are included
    const withMustVisit = this.ensureMustVisitPlaces(finalScored, request.mustVisitPlaces || []);
    
    // Step 8: Apply final diversity balancing
    const selectedPlaces = this.applyFinalDiversityBalancing(withMustVisit, request.travelStyle);
    
    const processingTime = Date.now() - startTime;
    console.log(`Intelligent place selection completed in ${processingTime}ms`);
    
    return {
      selectedPlaces,
      diversityScore: this.calculateOverallDiversityScore(selectedPlaces),
      selectionMetadata: {
        totalCandidates: request.places.length,
        diversityApplied: true,
        popularityWeighted: true,
        seasonalAdjusted: !!request.travelDates,
        groupFiltered: true,
        interestMatched: true
      }
    };
  }

  // 1. Diversity scoring to ensure balanced itineraries
  private static applyDiversityScoring(places: ScrapedLocation[], interests: InterestCategory[]): EnhancedPlace[] {
    const enhanced: EnhancedPlace[] = [];
    const typeCount: Record<PlaceType, number> = {} as Record<PlaceType, number>;
    
    // Calculate ideal distribution based on interests
    const idealDistribution = this.calculateIdealPlaceTypeDistribution(interests);
    
    for (const place of places) {
      const placeType = place.place_type || 'other';
      const currentCount = typeCount[placeType] || 0;
      const idealCount = idealDistribution[placeType] || 0;
      
      // Diversity score: higher if we need more of this type
      let diversityScore = 0.5; // Base score
      
      if (idealCount > 0) {
        const ratio = currentCount / idealCount;
        if (ratio < 1) {
          // We need more of this type
          diversityScore = Math.max(0.8, 1.0 - ratio * 0.3);
        } else {
          // We have enough or too many of this type
          diversityScore = Math.max(0.2, 0.5 - (ratio - 1) * 0.1);
        }
      }
      
      // Boost score for underrepresented types
      if (currentCount === 0 && idealCount > 0) {
        diversityScore = 1.0;
      }
      
      const enhancedPlace: EnhancedPlace = {
        ...place,
        diversityScore,
        popularityWeight: 0,
        seasonalRelevance: 0,
        groupAppropriatenessScore: 0,
        interestMatchScore: 0,
        finalScore: 0,
        selectionReason: [`Diversity score: ${diversityScore.toFixed(2)}`]
      };
      
      enhanced.push(enhancedPlace);
      typeCount[placeType] = currentCount + 1;
    }
    
    return enhanced;
  }

  // Calculate ideal place type distribution based on interests
  private static calculateIdealPlaceTypeDistribution(interests: InterestCategory[]): Record<PlaceType, number> {
    const distribution: Record<PlaceType, number> = {} as Record<PlaceType, number>;
    
    // Base distribution (minimum variety)
    const baseTypes: PlaceType[] = ['restaurant', 'attraction', 'cultural', 'nature'];
    baseTypes.forEach(type => {
      distribution[type] = 1;
    });
    
    // Add weight based on interests
    for (const interest of interests) {
      const weight = interest.weight;
      
      switch (interest.id) {
        case 'food':
          distribution.restaurant = (distribution.restaurant || 0) + weight;
          distribution.food = (distribution.food || 0) + weight;
          break;
        case 'culture':
          distribution.cultural = (distribution.cultural || 0) + weight;
          distribution.museum = (distribution.museum || 0) + weight;
          break;
        case 'adventure':
          distribution.activity = (distribution.activity || 0) + weight;
          distribution.nature = (distribution.nature || 0) + weight;
          break;
        case 'shopping':
          distribution.shopping = (distribution.shopping || 0) + weight;
          break;
        case 'nature':
          distribution.nature = (distribution.nature || 0) + weight;
          distribution.park = (distribution.park || 0) + weight;
          break;
        case 'nightlife':
          distribution.nightlife = (distribution.nightlife || 0) + weight;
          distribution.entertainment = (distribution.entertainment || 0) + weight;
          break;
        case 'relaxation':
          distribution.park = (distribution.park || 0) + weight;
          distribution.nature = (distribution.nature || 0) + weight;
          break;
        case 'photography':
          distribution.attraction = (distribution.attraction || 0) + weight;
          distribution.nature = (distribution.nature || 0) + weight;
          break;
      }
    }
    
    return distribution;
  }

  // 2. Popularity weighting based on multiple data sources
  private static applyPopularityWeighting(places: EnhancedPlace[]): EnhancedPlace[] {
    return places.map(place => {
      let popularityWeight = 0;
      const reasons: string[] = [...place.selectionReason];
      
      // Rating component (0-5 scale, normalized to 0-0.4)
      if (place.rating && place.rating > 0) {
        const ratingScore = (place.rating / 5) * 0.4;
        popularityWeight += ratingScore;
        reasons.push(`Rating: ${place.rating}/5 (${ratingScore.toFixed(2)})`);
      }
      
      // Visitor count component (logarithmic scale, normalized to 0-0.3)
      if (place.visitor_count && place.visitor_count > 0) {
        const logVisitors = Math.log10(place.visitor_count);
        const visitorScore = Math.min(logVisitors / 6, 0.3); // Cap at 1M visitors
        popularityWeight += visitorScore;
        reasons.push(`Visitors: ${place.visitor_count} (${visitorScore.toFixed(2)})`);
      }
      
      // Source reliability component (0-0.3)
      const sourceScore = this.getSourceReliabilityScore(place.source);
      popularityWeight += sourceScore;
      reasons.push(`Source: ${place.source} (${sourceScore.toFixed(2)})`);
      
      // Existing popularity score from scraping (if available)
      if (place.popularity_score) {
        popularityWeight = Math.max(popularityWeight, place.popularity_score);
        reasons.push(`Existing popularity: ${place.popularity_score.toFixed(2)}`);
      }
      
      return {
        ...place,
        popularityWeight: Math.min(popularityWeight, 1.0),
        selectionReason: reasons
      };
    });
  }

  // Get source reliability score
  private static getSourceReliabilityScore(source?: string): number {
    if (!source) return 0.1;
    
    const sourceScores: Record<string, number> = {
      'tripadvisor': 0.3,
      'google_places': 0.25,
      'dynamic_scraping': 0.2,
      'yelp': 0.25,
      'foursquare': 0.2,
      'local_guide': 0.15,
      'default_places': 0.1,
      'user_input': 0.3
    };
    
    return sourceScores[source.toLowerCase()] || 0.1;
  }

  // 3. Seasonal and temporal relevance scoring
  private static applySeasonalRelevance(places: EnhancedPlace[], travelDates?: { start: string; end: string }): EnhancedPlace[] {
    if (!travelDates) {
      // No travel dates provided, use current season
      return places.map(place => ({
        ...place,
        seasonalRelevance: 0.5, // Neutral score
        selectionReason: [...place.selectionReason, 'No seasonal data available']
      }));
    }
    
    const seasonalFactors = this.calculateSeasonalFactors(travelDates.start);
    
    return places.map(place => {
      let seasonalRelevance = 0.5; // Base score
      const reasons: string[] = [...place.selectionReason];
      
      // Weather suitability
      const weatherScore = this.calculateWeatherSuitabilityScore(place, seasonalFactors);
      seasonalRelevance += weatherScore * 0.3;
      reasons.push(`Weather suitability: ${weatherScore.toFixed(2)}`);
      
      // Crowd level adjustment
      const crowdScore = this.calculateCrowdLevelScore(place, seasonalFactors);
      seasonalRelevance += crowdScore * 0.2;
      reasons.push(`Crowd level: ${crowdScore.toFixed(2)}`);
      
      // Seasonal activity relevance
      const activityScore = this.calculateSeasonalActivityScore(place, seasonalFactors.season);
      seasonalRelevance += activityScore * 0.3;
      reasons.push(`Seasonal activity: ${activityScore.toFixed(2)}`);
      
      return {
        ...place,
        seasonalRelevance: Math.min(seasonalRelevance, 1.0),
        selectionReason: reasons
      };
    });
  }

  // Calculate seasonal factors for given date
  private static calculateSeasonalFactors(startDate: string): SeasonalFactors {
    const date = new Date(startDate);
    const month = date.getMonth() + 1; // 1-12
    
    let season: 'spring' | 'summer' | 'fall' | 'winter';
    let weatherSuitability: number;
    let crowdLevel: number;
    let priceMultiplier: number;
    
    if (month >= 3 && month <= 5) {
      season = 'spring';
      weatherSuitability = 0.8;
      crowdLevel = 0.6;
      priceMultiplier = 1.0;
    } else if (month >= 6 && month <= 8) {
      season = 'summer';
      weatherSuitability = 0.9;
      crowdLevel = 1.0; // Peak season
      priceMultiplier = 1.3;
    } else if (month >= 9 && month <= 11) {
      season = 'fall';
      weatherSuitability = 0.7;
      crowdLevel = 0.7;
      priceMultiplier = 1.1;
    } else {
      season = 'winter';
      weatherSuitability = 0.6;
      crowdLevel = 0.4;
      priceMultiplier = 0.9;
    }
    
    return { season, weatherSuitability, crowdLevel, priceMultiplier };
  }

  // Calculate weather suitability score
  private static calculateWeatherSuitabilityScore(place: EnhancedPlace, factors: SeasonalFactors): number {
    const weatherSuitability = place.weather_suitability;
    
    if (!weatherSuitability) return 0.5;
    
    switch (weatherSuitability) {
      case 'indoor':
        // Indoor places are good in winter, okay in other seasons
        return factors.season === 'winter' ? 0.8 : 0.6;
      case 'outdoor':
        // Outdoor places are best in spring/summer, poor in winter
        return factors.season === 'summer' ? 1.0 : 
               factors.season === 'spring' ? 0.9 :
               factors.season === 'fall' ? 0.7 : 0.3;
      case 'flexible':
        // Flexible places are always good
        return 0.8;
      default:
        return 0.5;
    }
  }

  // Calculate crowd level score (lower crowds = higher score for most travelers)
  private static calculateCrowdLevelScore(place: EnhancedPlace, factors: SeasonalFactors): number {
    const placeCrowdLevel = place.crowd_level || 'medium';
    const seasonalCrowdMultiplier = factors.crowdLevel;
    
    let baseCrowdScore: number;
    switch (placeCrowdLevel) {
      case 'low':
        baseCrowdScore = 0.8;
        break;
      case 'medium':
        baseCrowdScore = 0.6;
        break;
      case 'high':
        baseCrowdScore = 0.3;
        break;
      default:
        baseCrowdScore = 0.5;
    }
    
    // Adjust for seasonal crowds
    const adjustedScore = baseCrowdScore * (1 - seasonalCrowdMultiplier * 0.3);
    return Math.max(0.1, adjustedScore);
  }

  // Calculate seasonal activity score
  private static calculateSeasonalActivityScore(place: EnhancedPlace, season: string): number {
    const placeType = place.place_type;
    
    const seasonalScores: Record<string, Record<PlaceType, number>> = {
      spring: {
        nature: 0.9, park: 0.9, activity: 0.8, attraction: 0.7, restaurant: 0.6,
        museum: 0.6, cultural: 0.7, shopping: 0.6, nightlife: 0.5, entertainment: 0.6,
        food: 0.6, accommodation: 0.5, transport: 0.5, other: 0.5,
        hotel: 0.5, temple: 0.7, observation_deck: 0.8, shrine: 0.7, market: 0.6,
        garden: 0.9, landmark: 0.7, cathedral: 0.7, castle: 0.8, monument: 0.7, district: 0.6
      },
      summer: {
        nature: 1.0, park: 1.0, activity: 1.0, attraction: 0.9, restaurant: 0.8,
        museum: 0.5, cultural: 0.6, shopping: 0.7, nightlife: 0.9, entertainment: 0.8,
        food: 0.8, accommodation: 0.7, transport: 0.6, other: 0.6,
        hotel: 0.7, temple: 0.6, observation_deck: 0.9, shrine: 0.6, market: 0.7,
        garden: 1.0, landmark: 0.9, cathedral: 0.6, castle: 0.8, monument: 0.8, district: 0.7
      },
      fall: {
        nature: 0.8, park: 0.7, activity: 0.6, attraction: 0.8, restaurant: 0.7,
        museum: 0.8, cultural: 0.9, shopping: 0.8, nightlife: 0.6, entertainment: 0.7,
        food: 0.7, accommodation: 0.6, transport: 0.5, other: 0.6,
        hotel: 0.6, temple: 0.9, observation_deck: 0.7, shrine: 0.9, market: 0.8,
        garden: 0.8, landmark: 0.8, cathedral: 0.9, castle: 0.9, monument: 0.8, district: 0.7
      },
      winter: {
        nature: 0.3, park: 0.3, activity: 0.4, attraction: 0.6, restaurant: 0.8,
        museum: 0.9, cultural: 0.8, shopping: 0.9, nightlife: 0.7, entertainment: 0.8,
        food: 0.8, accommodation: 0.7, transport: 0.5, other: 0.6,
        hotel: 0.7, temple: 0.8, observation_deck: 0.4, shrine: 0.8, market: 0.9,
        garden: 0.3, landmark: 0.6, cathedral: 0.8, castle: 0.7, monument: 0.7, district: 0.8
      }
    };
    
    return seasonalScores[season]?.[placeType || 'other'] || 0.5;
  }

  // 4. Group-size appropriate filtering
  private static applyGroupSizeFiltering(
    places: EnhancedPlace[], 
    groupSize: number, 
    travelerTypes: TravelerType[]
  ): EnhancedPlace[] {
    return places.map(place => {
      let groupScore = 0.5; // Base score
      const reasons: string[] = [...place.selectionReason];
      
      // Group size considerations
      const sizeScore = this.calculateGroupSizeScore(place, groupSize);
      groupScore += sizeScore * 0.4;
      reasons.push(`Group size (${groupSize}): ${sizeScore.toFixed(2)}`);
      
      // Traveler type considerations
      const typeScore = this.calculateTravelerTypeScore(place, travelerTypes);
      groupScore += typeScore * 0.6;
      reasons.push(`Traveler types: ${typeScore.toFixed(2)}`);
      
      return {
        ...place,
        groupAppropriatenessScore: Math.min(groupScore, 1.0),
        selectionReason: reasons
      };
    });
  }

  // Calculate group size appropriateness score
  private static calculateGroupSizeScore(place: EnhancedPlace, groupSize: number): number {
    const placeType = place.place_type;
    
    // Different place types have different optimal group sizes
    const optimalSizes: Record<PlaceType, { min: number; max: number; ideal: number }> = {
      attraction: { min: 1, max: 50, ideal: 6 },
      food: { min: 1, max: 12, ideal: 4 },
      hotel: { min: 1, max: 20, ideal: 4 },
      transport: { min: 1, max: 100, ideal: 10 },
      other: { min: 1, max: 20, ideal: 6 },
      temple: { min: 1, max: 40, ideal: 6 },
      observation_deck: { min: 1, max: 50, ideal: 8 },
      shrine: { min: 1, max: 40, ideal: 6 },
      market: { min: 1, max: 30, ideal: 5 },
      garden: { min: 1, max: 100, ideal: 10 },
      landmark: { min: 1, max: 100, ideal: 12 },
      cathedral: { min: 1, max: 50, ideal: 8 },
      castle: { min: 1, max: 80, ideal: 10 },
      monument: { min: 1, max: 100, ideal: 15 },
      district: { min: 1, max: 200, ideal: 20 },
      restaurant: { min: 1, max: 12, ideal: 4 },
      museum: { min: 1, max: 30, ideal: 4 },
      shopping: { min: 1, max: 20, ideal: 3 },
      nightlife: { min: 2, max: 15, ideal: 6 },
      entertainment: { min: 1, max: 50, ideal: 8 },
      nature: { min: 1, max: 100, ideal: 10 },
      park: { min: 1, max: 100, ideal: 8 },
      activity: { min: 1, max: 25, ideal: 8 },
      cultural: { min: 1, max: 40, ideal: 6 },
      accommodation: { min: 1, max: 20, ideal: 4 }
    };
    
    const optimal = optimalSizes[placeType || 'other'];
    
    if (groupSize < optimal.min || groupSize > optimal.max) {
      return 0.2; // Not suitable
    }
    
    // Calculate score based on distance from ideal
    const distance = Math.abs(groupSize - optimal.ideal);
    const maxDistance = Math.max(optimal.ideal - optimal.min, optimal.max - optimal.ideal);
    const score = 1.0 - (distance / maxDistance) * 0.6;
    
    return Math.max(0.2, score);
  }

  // Calculate traveler type appropriateness score
  private static calculateTravelerTypeScore(place: EnhancedPlace, travelerTypes: TravelerType[]): number {
    if (travelerTypes.length === 0) return 0.5;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const travelerType of travelerTypes) {
      const typeScore = this.getPlaceTypeScoreForTravelerType(place, travelerType);
      totalScore += typeScore;
      totalWeight += 1;
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0.5;
  }

  // Get place appropriateness score for specific traveler type
  private static getPlaceTypeScoreForTravelerType(place: EnhancedPlace, travelerType: TravelerType): number {
    const placeType = place.place_type || 'other';
    const hasChildren = travelerType.ageGroups?.includes('child') || false;
    const hasSeniors = travelerType.ageGroups?.includes('senior') || false;
    
    // Base scores for different traveler types
    const baseScores: Record<string, Record<PlaceType, number>> = {
      solo: {
        restaurant: 0.8, attraction: 0.9, museum: 0.9, park: 0.7, shopping: 0.8,
        nightlife: 0.6, activity: 0.7, cultural: 0.9, nature: 0.8, entertainment: 0.7,
        food: 0.8, accommodation: 0.8, transport: 0.7, other: 0.7,
        hotel: 0.8, temple: 0.9, observation_deck: 0.9, shrine: 0.9, market: 0.8,
        garden: 0.8, landmark: 0.9, cathedral: 0.9, castle: 0.9, monument: 0.9, district: 0.8
      },
      couple: {
        restaurant: 0.9, attraction: 0.8, museum: 0.7, park: 0.9, shopping: 0.7,
        nightlife: 0.9, activity: 0.8, cultural: 0.8, nature: 0.9, entertainment: 0.8,
        food: 0.9, accommodation: 0.9, transport: 0.7, other: 0.7,
        hotel: 0.9, temple: 0.8, observation_deck: 0.8, shrine: 0.8, market: 0.7,
        garden: 0.9, landmark: 0.8, cathedral: 0.8, castle: 0.8, monument: 0.8, district: 0.7
      },
      family: {
        restaurant: 0.8, attraction: 0.9, museum: 0.7, park: 1.0, shopping: 0.6,
        nightlife: 0.2, activity: 0.8, cultural: 0.6, nature: 0.9, entertainment: 0.9,
        food: 0.8, accommodation: 0.8, transport: 0.6, other: 0.6,
        hotel: 0.8, temple: 0.6, observation_deck: 0.7, shrine: 0.6, market: 0.6,
        garden: 1.0, landmark: 0.8, cathedral: 0.6, castle: 0.8, monument: 0.7, district: 0.7
      },
      friends: {
        restaurant: 0.9, attraction: 0.8, museum: 0.6, park: 0.8, shopping: 0.8,
        nightlife: 1.0, activity: 0.9, cultural: 0.6, nature: 0.8, entertainment: 0.9,
        food: 0.9, accommodation: 0.7, transport: 0.7, other: 0.7,
        hotel: 0.7, temple: 0.6, observation_deck: 0.8, shrine: 0.6, market: 0.8,
        garden: 0.8, landmark: 0.8, cathedral: 0.6, castle: 0.7, monument: 0.7, district: 0.8
      },
      business: {
        restaurant: 0.8, attraction: 0.5, museum: 0.6, park: 0.4, shopping: 0.7,
        nightlife: 0.6, activity: 0.4, cultural: 0.7, nature: 0.4, entertainment: 0.6,
        food: 0.8, accommodation: 0.9, transport: 0.8, other: 0.6,
        hotel: 0.9, temple: 0.7, observation_deck: 0.5, shrine: 0.7, market: 0.7,
        garden: 0.4, landmark: 0.6, cathedral: 0.7, castle: 0.6, monument: 0.6, district: 0.7
      }
    };
    
    let score = baseScores[travelerType.type]?.[placeType] || 0.5;
    
    // Adjust for age groups
    if (hasChildren) {
      // Reduce score for inappropriate places for children
      if (placeType === 'nightlife') score *= 0.1;
      if (placeType === 'activity' && place.tips?.toLowerCase().includes('extreme')) score *= 0.3;
      
      // Boost score for family-friendly places
      if (placeType === 'park' || placeType === 'nature') score *= 1.2;
      if (place.tips?.toLowerCase().includes('family')) score *= 1.3;
    }
    
    if (hasSeniors) {
      // Reduce score for physically demanding activities
      if (placeType === 'activity' && place.tips?.toLowerCase().includes('hiking')) score *= 0.7;
      if (placeType === 'nightlife') score *= 0.8;
      
      // Boost score for accessible places
      if (placeType === 'museum' || placeType === 'cultural') score *= 1.1;
      if (place.tips?.toLowerCase().includes('accessible')) score *= 1.2;
    }
    
    return Math.min(score, 1.0);
  }

  // 5. Interest matching with fuzzy logic
  private static applyFuzzyInterestMatching(places: EnhancedPlace[], interests: InterestCategory[]): EnhancedPlace[] {
    return places.map(place => {
      const interestScore = this.calculateFuzzyInterestMatch(place, interests);
      
      return {
        ...place,
        interestMatchScore: interestScore,
        selectionReason: [...place.selectionReason, `Interest match: ${interestScore.toFixed(2)}`]
      };
    });
  }

  // Calculate fuzzy interest matching score
  private static calculateFuzzyInterestMatch(place: EnhancedPlace, interests: InterestCategory[]): number {
    if (interests.length === 0) return 0.5;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const interest of interests) {
      // Direct match score
      const directScore = this.getDirectInterestMatch(place, interest);
      
      // Fuzzy match score (semantic similarity)
      const fuzzyScore = this.getFuzzyInterestMatch(place, interest);
      
      // Combine direct and fuzzy scores
      const combinedScore = Math.max(directScore, fuzzyScore * 0.7);
      
      totalScore += combinedScore * interest.weight;
      totalWeight += interest.weight;
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0.5;
  }

  // Get direct interest match score
  private static getDirectInterestMatch(place: EnhancedPlace, interest: InterestCategory): number {
    // Use existing interest match score if available
    if (place.interest_match) {
      return place.interest_match;
    }
    
    // Calculate based on place type and interest
    const placeType = place.place_type || 'other';
    
    const interestMatches: Record<string, Record<PlaceType, number>> = {
      food: {
        restaurant: 1.0, food: 1.0, shopping: 0.3, cultural: 0.2, attraction: 0.1,
        museum: 0.1, park: 0.2, nightlife: 0.4, activity: 0.2, accommodation: 0.1,
        transport: 0.1, nature: 0.2, entertainment: 0.3, other: 0.1,
        hotel: 0.1, temple: 0.1, observation_deck: 0.1, shrine: 0.1, market: 0.6,
        garden: 0.2, landmark: 0.1, cathedral: 0.1, castle: 0.1, monument: 0.1, district: 0.2
      },
      culture: {
        museum: 1.0, cultural: 1.0, attraction: 0.8, entertainment: 0.6, shopping: 0.3,
        restaurant: 0.2, food: 0.2, park: 0.3, nightlife: 0.2, activity: 0.4,
        accommodation: 0.1, transport: 0.1, nature: 0.3, other: 0.2,
        hotel: 0.1, temple: 1.0, observation_deck: 0.5, shrine: 1.0, market: 0.4,
        garden: 0.3, landmark: 0.8, cathedral: 1.0, castle: 1.0, monument: 1.0, district: 0.6
      },
      adventure: {
        activity: 1.0, nature: 0.8, park: 0.7, attraction: 0.5, entertainment: 0.4,
        restaurant: 0.2, food: 0.2, museum: 0.2, cultural: 0.3, shopping: 0.1,
        nightlife: 0.3, accommodation: 0.2, transport: 0.3, other: 0.3,
        hotel: 0.2, temple: 0.3, observation_deck: 0.7, shrine: 0.3, market: 0.2,
        garden: 0.6, landmark: 0.5, cathedral: 0.3, castle: 0.6, monument: 0.4, district: 0.4
      },
      shopping: {
        shopping: 1.0, attraction: 0.3, cultural: 0.2, restaurant: 0.3, food: 0.3,
        museum: 0.1, park: 0.1, nightlife: 0.2, activity: 0.2, accommodation: 0.1,
        transport: 0.2, nature: 0.1, entertainment: 0.2, other: 0.2,
        hotel: 0.1, temple: 0.1, observation_deck: 0.1, shrine: 0.1, market: 1.0,
        garden: 0.1, landmark: 0.2, cathedral: 0.1, castle: 0.2, monument: 0.1, district: 0.6
      },
      nature: {
        nature: 1.0, park: 1.0, activity: 0.6, attraction: 0.4, restaurant: 0.2,
        food: 0.2, museum: 0.1, cultural: 0.2, shopping: 0.1, nightlife: 0.1,
        accommodation: 0.2, transport: 0.1, entertainment: 0.2, other: 0.2,
        hotel: 0.2, temple: 0.3, observation_deck: 0.8, shrine: 0.3, market: 0.1,
        garden: 1.0, landmark: 0.4, cathedral: 0.2, castle: 0.3, monument: 0.3, district: 0.2
      },
      relaxation: {
        park: 0.8, nature: 0.7, accommodation: 0.6, restaurant: 0.5, food: 0.5,
        museum: 0.4, cultural: 0.4, attraction: 0.3, shopping: 0.3, nightlife: 0.2,
        activity: 0.3, transport: 0.1, entertainment: 0.4, other: 0.3,
        hotel: 0.8, temple: 0.6, observation_deck: 0.4, shrine: 0.6, market: 0.2,
        garden: 0.9, landmark: 0.3, cathedral: 0.5, castle: 0.4, monument: 0.4, district: 0.3
      },
      nightlife: {
        nightlife: 1.0, entertainment: 0.8, restaurant: 0.6, food: 0.6, shopping: 0.3,
        attraction: 0.3, cultural: 0.2, museum: 0.1, park: 0.1, nature: 0.1,
        activity: 0.4, accommodation: 0.3, transport: 0.2, other: 0.3,
        hotel: 0.3, temple: 0.1, observation_deck: 0.2, shrine: 0.1, market: 0.3,
        garden: 0.1, landmark: 0.2, cathedral: 0.1, castle: 0.2, monument: 0.1, district: 0.6
      },
      photography: {
        attraction: 1.0, nature: 0.9, park: 0.8, cultural: 0.7, museum: 0.6,
        entertainment: 0.5, restaurant: 0.3, food: 0.3, shopping: 0.3, nightlife: 0.4,
        activity: 0.6, accommodation: 0.2, transport: 0.3, other: 0.4,
        hotel: 0.2, temple: 0.8, observation_deck: 1.0, shrine: 0.8, market: 0.4,
        garden: 0.9, landmark: 1.0, cathedral: 0.9, castle: 1.0, monument: 1.0, district: 0.6
      }
    };
    
    return interestMatches[interest.id]?.[placeType] || 0.1;
  }

  // Get fuzzy interest match score using semantic similarity
  private static getFuzzyInterestMatch(place: EnhancedPlace, interest: InterestCategory): number {
    const placeName = place.location_name.toLowerCase();
    const placeTips = (place.tips || '').toLowerCase();
    const searchText = `${placeName} ${placeTips}`;
    
    // Define fuzzy keywords for each interest
    const fuzzyKeywords: Record<string, string[]> = {
      food: ['eat', 'taste', 'cuisine', 'dish', 'meal', 'cook', 'flavor', 'delicious', 'local food'],
      culture: ['history', 'heritage', 'traditional', 'ancient', 'art', 'historic', 'cultural', 'monument'],
      adventure: ['exciting', 'thrill', 'outdoor', 'extreme', 'climb', 'hike', 'adventure', 'sport'],
      shopping: ['buy', 'shop', 'market', 'store', 'boutique', 'souvenir', 'craft', 'local goods'],
      nature: ['natural', 'scenic', 'wildlife', 'green', 'forest', 'mountain', 'beach', 'landscape'],
      relaxation: ['peaceful', 'quiet', 'calm', 'serene', 'tranquil', 'spa', 'wellness', 'rest'],
      nightlife: ['night', 'evening', 'bar', 'club', 'music', 'dance', 'party', 'entertainment'],
      photography: ['scenic', 'beautiful', 'view', 'panoramic', 'photo', 'instagram', 'picturesque']
    };
    
    const keywords = fuzzyKeywords[interest.id] || [];
    let matchCount = 0;
    
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        matchCount++;
      }
    }
    
    // Normalize score based on number of keywords
    return keywords.length > 0 ? matchCount / keywords.length : 0;
  }

  // 6. Calculate final scores
  private static calculateFinalScores(places: EnhancedPlace[], request: PlaceSelectionRequest): EnhancedPlace[] {
    return places.map(place => {
      // Weighted combination of all scores
      const weights = {
        diversity: 0.25,
        popularity: 0.20,
        seasonal: 0.15,
        group: 0.20,
        interest: 0.20
      };
      
      const finalScore = 
        place.diversityScore * weights.diversity +
        place.popularityWeight * weights.popularity +
        place.seasonalRelevance * weights.seasonal +
        place.groupAppropriatenessScore * weights.group +
        place.interestMatchScore * weights.interest;
      
      return {
        ...place,
        finalScore,
        selectionReason: [...place.selectionReason, `Final score: ${finalScore.toFixed(3)}`]
      };
    });
  }

  // 7. Ensure must-visit places are included
  private static ensureMustVisitPlaces(places: EnhancedPlace[], mustVisitPlaces: string[]): EnhancedPlace[] {
    if (mustVisitPlaces.length === 0) return places;
    
    const result = [...places];
    
    for (const mustVisit of mustVisitPlaces) {
      const existing = result.find(place => 
        place.location_name.toLowerCase().includes(mustVisit.toLowerCase()) ||
        mustVisit.toLowerCase().includes(place.location_name.toLowerCase())
      );
      
      if (existing) {
        // Boost the score of existing must-visit place
        existing.finalScore = Math.max(existing.finalScore, 0.9);
        existing.selectionReason.push('Must-visit place (boosted)');
      } else {
        // Create a placeholder for must-visit place not found in results
        const placeholder: EnhancedPlace = {
          id: `placeholder-${Date.now()}`,
          location_name: mustVisit,
          source: 'user_input',
          city: 'Unknown',
          country: 'Unknown',
          place_type: 'attraction',
          visitor_count: null,
          rating: null,
          tips: null,
          lat: null,
          lng: null,
          cached_at: new Date(),
          created_at: new Date(),
          diversityScore: 0.8,
          popularityWeight: 0.7,
          seasonalRelevance: 0.5,
          groupAppropriatenessScore: 0.8,
          interestMatchScore: 0.7,
          finalScore: 0.95,
          selectionReason: ['Must-visit place (user specified)']
        };
        
        result.push(placeholder);
      }
    }
    
    return result;
  }

  // 8. Apply final diversity balancing
  private static applyFinalDiversityBalancing(places: EnhancedPlace[], travelStyle: string): EnhancedPlace[] {
    // Sort by final score
    const sorted = places.sort((a, b) => b.finalScore - a.finalScore);
    
    // Determine number of places based on travel style
    const maxPlaces = this.getMaxPlacesForTravelStyle(travelStyle);
    
    // Apply diversity balancing while selecting top places
    const selected: EnhancedPlace[] = [];
    const typeCount: Record<PlaceType, number> = {} as Record<PlaceType, number>;
    const maxPerType = Math.max(2, Math.floor(maxPlaces / 6)); // Ensure variety
    
    for (const place of sorted) {
      if (selected.length >= maxPlaces) break;
      
      const placeType = place.place_type || 'other';
      const currentCount = typeCount[placeType] || 0;
      
      // Always include high-scoring places or if we need more variety
      if (place.finalScore > 0.8 || currentCount < maxPerType || selected.length < maxPlaces * 0.7) {
        selected.push(place);
        typeCount[placeType] = currentCount + 1;
      }
    }
    
    // If we don't have enough places, add more from remaining
    while (selected.length < Math.min(maxPlaces, sorted.length)) {
      const remaining = sorted.filter(p => !selected.includes(p));
      if (remaining.length === 0) break;
      
      selected.push(remaining[0]);
    }
    
    return selected;
  }

  // Get maximum places for travel style
  private static getMaxPlacesForTravelStyle(travelStyle: string): number {
    switch (travelStyle) {
      case 'relaxed': return 20;
      case 'moderate': return 30;
      case 'fast-paced': return 40;
      default: return 25;
    }
  }

  // Calculate overall diversity score
  private static calculateOverallDiversityScore(places: EnhancedPlace[]): number {
    if (places.length === 0) return 0;
    
    const typeCount: Record<PlaceType, number> = {} as Record<PlaceType, number>;
    
    for (const place of places) {
      const placeType = place.place_type || 'other';
      typeCount[placeType] = (typeCount[placeType] || 0) + 1;
    }
    
    const uniqueTypes = Object.keys(typeCount).length;
    const totalTypes = Object.keys(this.calculateIdealPlaceTypeDistribution([])).length;
    
    // Diversity score based on type variety and distribution evenness
    const varietyScore = uniqueTypes / totalTypes;
    
    // Calculate evenness (how evenly distributed the types are)
    const counts = Object.values(typeCount);
    const mean = counts.reduce((sum, count) => sum + count, 0) / counts.length;
    const variance = counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / counts.length;
    const evenness = 1 / (1 + variance); // Higher variance = lower evenness
    
    return (varietyScore * 0.7 + evenness * 0.3);
  }
}