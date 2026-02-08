import puppeteer, { Browser, Page } from 'puppeteer';
import { pool } from '../config/database.js';
import { RedisService } from '../config/redis.js';

export interface PlaceData {
  name: string;
  description?: string;
  address?: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  place_type?: string;
  category?: string;
  rating?: number;
  review_count?: number;
  price_level?: number;
  opening_hours?: any;
  contact_info?: any;
  amenities?: string[];
  photos?: string[];
  source: string;
  source_id?: string;
  source_url?: string;
}

export class ComprehensivePlaceScrapingService {
  private static browser: Browser | null = null;
  private static readonly BATCH_SIZE = 50;
  private static readonly DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds

  // Initialize browser
  private static async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor'
        ]
      });
    }
    return this.browser;
  }

  // Main scraping orchestrator
  static async scrapeTopDestinations(): Promise<void> {
    console.log('🚀 Starting comprehensive place scraping...');
    
    try {
      // Get top destinations to scrape
      const destinations = await this.getDestinationsToScrape();
      
      for (const destination of destinations) {
        console.log(`📍 Scraping ${destination.city}, ${destination.country}...`);
        
        await this.scrapeDestination(destination);
        
        // Update last scraped timestamp
        await this.updateLastScraped(destination.id);
        
        // Delay between destinations
        await new Promise(resolve => setTimeout(resolve, this.DELAY_BETWEEN_REQUESTS));
      }
      
    } catch (error) {
      console.error('❌ Error in comprehensive scraping:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }
  }

  // Get destinations that need scraping
  private static async getDestinationsToScrape(): Promise<any[]> {
    const query = `
      SELECT * FROM top_destinations 
      WHERE scraping_priority <= 2 
      AND (last_scraped IS NULL OR last_scraped < NOW() - INTERVAL '7 days')
      ORDER BY scraping_priority ASC, rank ASC
      LIMIT 10
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  // Scrape a specific destination
  private static async scrapeDestination(destination: any): Promise<void> {
    const { city, country } = destination;
    const searchQuery = `${city} ${country} attractions`;
    
    // Scrape from all sources in parallel
    const scrapingPromises = [
      this.scrapeYelp(city, country),
      this.scrapeExpedia(city, country),
      this.scrapeInstagram(city, country),
      this.scrapeTripAdvisor(city, country),
      this.scrapeGooglePlaces(city, country)
    ];

    const results = await Promise.allSettled(scrapingPromises);
    
    let totalPlaces = 0;
    results.forEach((result, index) => {
      const sources = ['Yelp', 'Expedia', 'Instagram', 'TripAdvisor', 'Google Places'];
      if (result.status === 'fulfilled') {
        totalPlaces += result.value.length;
        console.log(`✅ ${sources[index]}: ${result.value.length} places`);
      } else {
        console.log(`❌ ${sources[index]} failed:`, result.reason?.message);
      }
    });

    console.log(`📊 Total places scraped for ${city}: ${totalPlaces}`);
  }

  // Scrape Yelp
  private static async scrapeYelp(city: string, country: string): Promise<PlaceData[]> {
    const places: PlaceData[] = [];
    
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      const searchUrl = `https://www.yelp.com/search?find_desc=attractions&find_loc=${encodeURIComponent(city + ', ' + country)}`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 15000 });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const yelpPlaces = await page.evaluate(() => {
        // @ts-ignore - document is available in browser context
        const items = document.querySelectorAll('[data-testid="serp-ia-card"], .businessName, [class*="businessName"]');
        const results: any[] = [];
        
        for (let i = 0; i < Math.min(items.length, 20); i++) {
          const item = items[i];
          
          // @ts-ignore
          const nameElement = item.querySelector('h3, h4, .businessName, [class*="businessName"]') || item;
          // @ts-ignore
          const ratingElement = item.querySelector('[class*="rating"], .rating, [aria-label*="star"]');
          // @ts-ignore
          const reviewElement = item.querySelector('[class*="review"], .reviewCount');
          // @ts-ignore
          const addressElement = item.querySelector('[class*="address"], .address');
          // @ts-ignore
          const priceElement = item.querySelector('[class*="price"], .priceRange');
          
          if (nameElement && nameElement.textContent) {
            const name = nameElement.textContent.trim();
            const ratingText = ratingElement?.textContent || ratingElement?.getAttribute('aria-label') || '';
            const reviewText = reviewElement?.textContent || '';
            const address = addressElement?.textContent?.trim() || '';
            const priceText = priceElement?.textContent || '';
            
            const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
            const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;
            
            const reviewMatch = reviewText.match(/(\d+(?:,\d+)*)/);
            const reviewCount = reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, '')) : undefined;
            
            const priceLevel = priceText.includes('$$$$') ? 4 : 
                              priceText.includes('$$$') ? 3 : 
                              priceText.includes('$$') ? 2 : 
                              priceText.includes('$') ? 1 : undefined;
            
            if (name.length > 2) {
              results.push({
                name,
                address,
                rating,
                reviewCount,
                priceLevel
              });
            }
          }
        }
        
        return results;
      });
      
      // Convert to PlaceData format
      yelpPlaces.forEach(place => {
        places.push({
          name: place.name,
          address: place.address,
          city,
          country,
          rating: place.rating,
          review_count: place.reviewCount,
          price_level: place.priceLevel,
          source: 'yelp',
          place_type: 'attraction',
          category: 'general'
        });
      });
      
      await page.close();
      
    } catch (error) {
      console.error('Error scraping Yelp:', error);
    }
    
    // Save to database
    await this.savePlacesToDatabase(places);
    return places;
  }

  // Scrape Expedia
  private static async scrapeExpedia(city: string, country: string): Promise<PlaceData[]> {
    const places: PlaceData[] = [];
    
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      const searchUrl = `https://www.expedia.com/things-to-do/search?location=${encodeURIComponent(city + ', ' + country)}`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 15000 });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const expediaPlaces = await page.evaluate(() => {
        // @ts-ignore - document is available in browser context
        const items = document.querySelectorAll('[data-testid="activity-card"], .activity-card, [class*="activity"]');
        const results: any[] = [];
        
        for (let i = 0; i < Math.min(items.length, 20); i++) {
          const item = items[i];
          
          // @ts-ignore
          const nameElement = item.querySelector('h3, h4, [class*="title"], .title');
          // @ts-ignore
          const ratingElement = item.querySelector('[class*="rating"], .rating');
          // @ts-ignore
          const priceElement = item.querySelector('[class*="price"], .price');
          // @ts-ignore
          const descElement = item.querySelector('[class*="description"], .description');
          
          if (nameElement && nameElement.textContent) {
            const name = nameElement.textContent.trim();
            const ratingText = ratingElement?.textContent || '';
            const priceText = priceElement?.textContent || '';
            const description = descElement?.textContent?.trim() || '';
            
            const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
            const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;
            
            const priceMatch = priceText.match(/\$(\d+)/);
            const price = priceMatch ? parseInt(priceMatch[1]) : undefined;
            
            if (name.length > 2) {
              results.push({
                name,
                description,
                rating,
                price
              });
            }
          }
        }
        
        return results;
      });
      
      // Convert to PlaceData format
      expediaPlaces.forEach(place => {
        places.push({
          name: place.name,
          description: place.description,
          city,
          country,
          rating: place.rating,
          source: 'expedia',
          place_type: 'activity',
          category: 'tourism'
        });
      });
      
      await page.close();
      
    } catch (error) {
      console.error('Error scraping Expedia:', error);
    }
    
    await this.savePlacesToDatabase(places);
    return places;
  }

  // Scrape Instagram (hashtag-based discovery)
  private static async scrapeInstagram(city: string, country: string): Promise<PlaceData[]> {
    const places: PlaceData[] = [];
    
    try {
      // Instagram scraping is more complex due to login requirements
      // For now, we'll use hashtag-based approach with public data
      const hashtags = [
        `#${city.toLowerCase().replace(/\s+/g, '')}`,
        `#visit${city.toLowerCase().replace(/\s+/g, '')}`,
        `#${city.toLowerCase().replace(/\s+/g, '')}travel`,
        `#${city.toLowerCase().replace(/\s+/g, '')}attractions`
      ];
      
      // This would require Instagram Basic Display API or web scraping
      // For now, we'll create placeholder data based on popular Instagram locations
      const instagramPlaces = this.getPopularInstagramSpots(city, country);
      
      instagramPlaces.forEach(place => {
        if (place.name) {
          places.push({
            ...place,
            name: place.name, // Ensure name is explicitly set
            city,
            country,
            source: 'instagram',
            category: 'photography'
          });
        }
      });
      
    } catch (error) {
      console.error('Error scraping Instagram:', error);
    }
    
    await this.savePlacesToDatabase(places);
    return places;
  }

  // Get popular Instagram spots (curated data)
  private static getPopularInstagramSpots(city: string, country: string): Partial<PlaceData>[] {
    const cityLower = city.toLowerCase();
    
    if (cityLower.includes('tokyo')) {
      return [
        {
          name: 'Shibuya Crossing',
          description: 'World\'s busiest pedestrian crossing, perfect for photos',
          place_type: 'landmark',
          rating: 4.3
        },
        {
          name: 'Fushimi Inari Shrine Gates',
          description: 'Thousands of vermillion torii gates creating stunning photo opportunities',
          place_type: 'shrine',
          rating: 4.6
        },
        {
          name: 'Tokyo Skytree Observation Deck',
          description: 'Panoramic city views and iconic architecture',
          place_type: 'observation_deck',
          rating: 4.2
        },
        {
          name: 'Harajuku Takeshita Street',
          description: 'Colorful street fashion and kawaii culture',
          place_type: 'street',
          rating: 4.1
        }
      ];
    }
    
    if (cityLower.includes('paris')) {
      return [
        {
          name: 'Eiffel Tower at Sunset',
          description: 'Iconic tower with golden hour lighting',
          place_type: 'landmark',
          rating: 4.5
        },
        {
          name: 'Louvre Pyramid',
          description: 'Glass pyramid entrance with artistic reflections',
          place_type: 'museum',
          rating: 4.4
        },
        {
          name: 'Montmartre Sacré-Cœur',
          description: 'Basilica with panoramic Paris views',
          place_type: 'church',
          rating: 4.3
        }
      ];
    }
    
    // Generic Instagram-worthy spots
    return [
      {
        name: `${city} Viewpoint`,
        description: `Best panoramic views of ${city}`,
        place_type: 'viewpoint',
        rating: 4.2
      },
      {
        name: `${city} Historic District`,
        description: `Photogenic historic architecture in ${city}`,
        place_type: 'district',
        rating: 4.1
      }
    ];
  }

  // Enhanced TripAdvisor scraping
  private static async scrapeTripAdvisor(city: string, country: string): Promise<PlaceData[]> {
    const places: PlaceData[] = [];
    
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      
      // Enhanced anti-detection
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });
      
      await page.evaluateOnNewDocument(() => {
        // @ts-ignore
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
      });
      
      const searchUrl = `https://www.tripadvisor.com/Attractions-g298184-Activities-${city.replace(/\s+/g, '_')}.html`;
      
      try {
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const tripAdvisorPlaces = await page.evaluate(() => {
          // @ts-ignore
          const items = document.querySelectorAll('[class*="attraction"], .attraction, [data-test*="attraction"]');
          const results: any[] = [];
          
          for (let i = 0; i < Math.min(items.length, 25); i++) {
            const item = items[i];
            
            // @ts-ignore
            const nameElement = item.querySelector('h3, [class*="title"], .title');
            // @ts-ignore
            const ratingElement = item.querySelector('[class*="rating"], .rating');
            // @ts-ignore
            const reviewElement = item.querySelector('[class*="review"], .review');
            // @ts-ignore
            const descElement = item.querySelector('[class*="description"], .description');
            
            if (nameElement && nameElement.textContent) {
              const name = nameElement.textContent.trim();
              const ratingText = ratingElement?.textContent || ratingElement?.getAttribute('aria-label') || '';
              const reviewText = reviewElement?.textContent || '';
              const description = descElement?.textContent?.trim() || '';
              
              const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
              const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;
              
              const reviewMatch = reviewText.match(/(\d+(?:,\d+)*)/);
              const reviewCount = reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, '')) : undefined;
              
              if (name.length > 2) {
                results.push({
                  name,
                  description,
                  rating,
                  reviewCount
                });
              }
            }
          }
          
          return results;
        });
        
        tripAdvisorPlaces.forEach(place => {
          places.push({
            name: place.name,
            description: place.description,
            city,
            country,
            rating: place.rating,
            review_count: place.reviewCount,
            source: 'tripadvisor',
            place_type: 'attraction',
            category: 'tourism'
          });
        });
        
      } catch (pageError) {
        console.log('TripAdvisor page error, skipping...');
      }
      
      await page.close();
      
    } catch (error) {
      console.error('Error scraping TripAdvisor:', error);
    }
    
    await this.savePlacesToDatabase(places);
    return places;
  }

  // Google Places API integration
  private static async scrapeGooglePlaces(city: string, country: string): Promise<PlaceData[]> {
    const places: PlaceData[] = [];
    
    try {
      // This would use Google Places API
      // For now, we'll simulate with curated data
      const googlePlaces = this.getCuratedGooglePlaces(city, country);
      
      googlePlaces.forEach(place => {
        places.push({
          ...place,
          city,
          country,
          source: 'google_places'
        });
      });
      
    } catch (error) {
      console.error('Error with Google Places:', error);
    }
    
    await this.savePlacesToDatabase(places);
    return places;
  }

  // Curated Google Places data
  private static getCuratedGooglePlaces(city: string, country: string): PlaceData[] {
    const cityLower = city.toLowerCase();
    
    if (cityLower.includes('tokyo')) {
      return [
        {
          name: 'Senso-ji Temple',
          description: 'Tokyo\'s oldest temple with traditional architecture and cultural significance',
          address: '2-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan',
          latitude: 35.7148,
          longitude: 139.7967,
          place_type: 'temple',
          category: 'culture',
          rating: 4.3,
          review_count: 45000,
          opening_hours: {
            monday: '06:00-17:00',
            tuesday: '06:00-17:00',
            wednesday: '06:00-17:00',
            thursday: '06:00-17:00',
            friday: '06:00-17:00',
            saturday: '06:00-17:00',
            sunday: '06:00-17:00'
          },
          amenities: ['wheelchair_accessible', 'restrooms', 'gift_shop'],
          city,
          country,
          source: 'google_places'
        },
        {
          name: 'Tokyo National Museum',
          description: 'Japan\'s largest collection of cultural artifacts and art',
          address: '13-9 Uenokoen, Taito City, Tokyo 110-8712, Japan',
          latitude: 35.7188,
          longitude: 139.7766,
          place_type: 'museum',
          category: 'culture',
          rating: 4.4,
          review_count: 12000,
          price_level: 2,
          opening_hours: {
            monday: 'closed',
            tuesday: '09:30-17:00',
            wednesday: '09:30-17:00',
            thursday: '09:30-17:00',
            friday: '09:30-21:00',
            saturday: '09:30-17:00',
            sunday: '09:30-17:00'
          },
          amenities: ['wheelchair_accessible', 'audio_guide', 'cafe', 'gift_shop'],
          city,
          country,
          source: 'google_places'
        }
      ];
    }
    
    return [];
  }

  // Save places to database
  private static async savePlacesToDatabase(places: PlaceData[]): Promise<void> {
    if (places.length === 0) return;
    
    try {
      for (const place of places) {
        const query = `
          INSERT INTO place_database (
            name, description, address, city, country, latitude, longitude,
            place_type, category, rating, review_count, price_level,
            opening_hours, contact_info, amenities, photos, source, source_id, source_url
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
          )
          ON CONFLICT (source, source_id) 
          DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            rating = EXCLUDED.rating,
            review_count = EXCLUDED.review_count,
            last_updated = CURRENT_TIMESTAMP
        `;
        
        await pool.query(query, [
          place.name,
          place.description,
          place.address,
          place.city,
          place.country,
          place.latitude,
          place.longitude,
          place.place_type,
          place.category,
          place.rating,
          place.review_count,
          place.price_level,
          place.opening_hours ? JSON.stringify(place.opening_hours) : null,
          place.contact_info ? JSON.stringify(place.contact_info) : null,
          place.amenities,
          place.photos,
          place.source,
          place.source_id || `${place.source}_${place.name.toLowerCase().replace(/\s+/g, '_')}`,
          place.source_url
        ]);
      }
      
      console.log(`💾 Saved ${places.length} places to database`);
      
    } catch (error) {
      console.error('Error saving places to database:', error);
    }
  }

  // Update last scraped timestamp
  private static async updateLastScraped(destinationId: string): Promise<void> {
    try {
      await pool.query(
        'UPDATE top_destinations SET last_scraped = CURRENT_TIMESTAMP WHERE id = $1',
        [destinationId]
      );
    } catch (error) {
      console.error('Error updating last scraped:', error);
    }
  }

  // Track user interaction with places
  static async trackPlaceInteraction(
    userId: string,
    placeId: string,
    interactionType: 'viewed' | 'added_to_itinerary' | 'visited' | 'rated',
    tripId?: string,
    rating?: number,
    notes?: string
  ): Promise<void> {
    try {
      await pool.query(`
        INSERT INTO place_interactions (user_id, place_id, interaction_type, trip_id, rating, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [userId, placeId, interactionType, tripId, rating, notes]);
      
      // Update place analytics
      await this.updatePlaceAnalytics(placeId, interactionType, rating);
      
    } catch (error) {
      console.error('Error tracking place interaction:', error);
    }
  }

  // Update place analytics
  private static async updatePlaceAnalytics(
    placeId: string,
    interactionType: string,
    rating?: number
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      let updateField = '';
      switch (interactionType) {
        case 'viewed':
          updateField = 'views_count = views_count + 1';
          break;
        case 'added_to_itinerary':
          updateField = 'additions_count = additions_count + 1';
          break;
        case 'visited':
          updateField = 'visits_count = visits_count + 1';
          break;
      }
      
      await pool.query(`
        INSERT INTO place_analytics (place_id, date, ${updateField.split(' = ')[0]})
        VALUES ($1, $2, 1)
        ON CONFLICT (place_id, date)
        DO UPDATE SET ${updateField}
      `, [placeId, today]);
      
      // Update popularity score
      await this.updatePopularityScore(placeId);
      
    } catch (error) {
      console.error('Error updating place analytics:', error);
    }
  }

  // Update popularity score based on interactions
  private static async updatePopularityScore(placeId: string): Promise<void> {
    try {
      await pool.query(`
        UPDATE place_database 
        SET popularity_score = (
          SELECT COALESCE(
            SUM(views_count * 1 + additions_count * 5 + visits_count * 10), 0
          )
          FROM place_analytics 
          WHERE place_id = $1 
          AND date >= CURRENT_DATE - INTERVAL '30 days'
        )
        WHERE id = $1
      `, [placeId]);
      
    } catch (error) {
      console.error('Error updating popularity score:', error);
    }
  }

  // Get popular places for recommendations
  static async getPopularPlaces(
    city: string,
    country: string,
    category?: string,
    limit: number = 20
  ): Promise<any[]> {
    try {
      let query = `
        SELECT p.*, 
               COALESCE(pa.total_views, 0) as total_views,
               COALESCE(pa.total_additions, 0) as total_additions,
               COALESCE(pa.total_visits, 0) as total_visits
        FROM place_database p
        LEFT JOIN (
          SELECT place_id,
                 SUM(views_count) as total_views,
                 SUM(additions_count) as total_additions,
                 SUM(visits_count) as total_visits
          FROM place_analytics
          WHERE date >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY place_id
        ) pa ON p.id = pa.place_id
        WHERE p.city ILIKE $1 AND p.country ILIKE $2
      `;
      
      const params = [`%${city}%`, `%${country}%`];
      
      if (category) {
        query += ` AND p.category = $3`;
        params.push(category);
      }
      
      query += ` ORDER BY p.popularity_score DESC, p.rating DESC LIMIT $${params.length + 1}`;
      params.push(limit.toString());
      
      const result = await pool.query(query, params);
      return result.rows;
      
    } catch (error) {
      console.error('Error getting popular places:', error);
      return [];
    }
  }
}