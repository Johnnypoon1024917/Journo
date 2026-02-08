import { Builder, By, WebDriver, until, WebElement } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { pool } from '../config/database.js';
import { RedisService } from '../config/redis.js';

export interface SeleniumScrapedPlace {
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
  popularity_score?: number;
}

export class SeleniumScrapingService {
  private static driver: WebDriver | null = null;
  private static SCRAPING_DELAY = 2000; // 2 seconds between requests
  private static MAX_RESULTS_PER_SOURCE = 50;
  private static CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds

  // Initialize Selenium WebDriver
  private static async getDriver(): Promise<WebDriver> {
    if (!this.driver) {
      const options = new chrome.Options();
      options.addArguments('--headless'); // Run in headless mode
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
      options.addArguments('--disable-gpu');
      options.addArguments('--window-size=1920,1080');
      options.addArguments('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
    }
    return this.driver;
  }

  // Close the driver
  static async closeDriver(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }

  // Main scraping function with comprehensive data collection
  static async scrapeDestinationPlaces(
    destination: string,
    category?: string
  ): Promise<SeleniumScrapedPlace[]> {
    const cacheKey = `selenium_scrape_${destination.toLowerCase()}_${category || 'all'}`;
    
    // Check cache first
    const cached = await RedisService.getJSON<SeleniumScrapedPlace[]>(cacheKey);
    if (cached) {
      console.log(`Cache hit for Selenium scraping: ${destination}`);
      return cached;
    }

    console.log(`🤖 Starting comprehensive Selenium scraping for: ${destination}`);
    
    const allPlaces: SeleniumScrapedPlace[] = [];
    
    try {
      // Scrape from multiple sources in parallel for better data volume
      const scrapingPromises = [
        this.scrapeTripAdvisorSelenium(destination, category),
        this.scrapeGoogleMapsSelenium(destination, category),
        this.scrapeBookingSelenium(destination, category),
        this.scrapeExpediaSelenium(destination, category),
        this.scrapeYelpSelenium(destination, category)
      ];

      const results = await Promise.allSettled(scrapingPromises);
      
      results.forEach((result, index) => {
        const sources = ['TripAdvisor', 'Google Maps', 'Booking.com', 'Expedia', 'Yelp'];
        if (result.status === 'fulfilled') {
          allPlaces.push(...result.value);
          console.log(`✅ ${sources[index]} Selenium scraping: ${result.value.length} places`);
        } else {
          console.log(`❌ ${sources[index]} Selenium scraping failed:`, result.reason?.message);
        }
      });

      // Remove duplicates based on name and location
      const uniquePlaces = this.removeDuplicates(allPlaces);
      
      // Store in database
      await this.storePlacesInDatabase(uniquePlaces);
      
      // Cache results
      await RedisService.setJSON(cacheKey, uniquePlaces, this.CACHE_DURATION);
      
      console.log(`🎉 Selenium scraping completed: ${uniquePlaces.length} unique places found`);
      return uniquePlaces;
      
    } catch (error) {
      console.error('Error in Selenium scraping:', error);
      return [];
    }
  }

  // Scrape TripAdvisor with Selenium for comprehensive data
  private static async scrapeTripAdvisorSelenium(
    destination: string,
    category?: string
  ): Promise<SeleniumScrapedPlace[]> {
    const places: SeleniumScrapedPlace[] = [];
    
    try {
      const driver = await this.getDriver();
      
      // Build search URL based on category
      let searchUrl = `https://www.tripadvisor.com/Attractions-g${this.getLocationId(destination)}-Activities-${destination.replace(/\s+/g, '_')}.html`;
      
      if (category) {
        const categoryMap: { [key: string]: string } = {
          'food': 'Restaurants',
          'culture': 'Museums',
          'nature': 'Nature_Parks',
          'shopping': 'Shopping',
          'nightlife': 'Nightlife'
        };
        
        if (categoryMap[category]) {
          searchUrl = `https://www.tripadvisor.com/${categoryMap[category]}-g${this.getLocationId(destination)}-${destination.replace(/\s+/g, '_')}.html`;
        }
      }
      
      await driver.get(searchUrl);
      await driver.sleep(this.SCRAPING_DELAY);
      
      // Wait for content to load
      await driver.wait(until.elementLocated(By.css('[data-automation="attractionShelfCard"], .listing, .result')), 10000);
      
      // Scroll to load more content
      await this.scrollToLoadMore(driver);
      
      // Extract place data
      const placeElements = await driver.findElements(By.css('[data-automation="attractionShelfCard"], .listing, .result'));
      
      for (let i = 0; i < Math.min(placeElements.length, this.MAX_RESULTS_PER_SOURCE); i++) {
        try {
          const element = placeElements[i];
          
          const name = await this.getTextSafely(element, 'h3, .listing-title, [data-automation="attractionTitle"]');
          if (!name) continue;
          
          const rating = await this.getRatingSafely(element);
          const reviewCount = await this.getReviewCountSafely(element);
          const description = await this.getTextSafely(element, '.description, .snippet, [data-automation="attractionDescription"]');
          const address = await this.getTextSafely(element, '.address, .location');
          const priceLevel = await this.getPriceLevelSafely(element);
          
          // Get more details by clicking on the place (if possible)
          const detailsUrl = await this.getLinkSafely(element);
          
          places.push({
            name,
            description: description || undefined,
            address: address || undefined,
            city: this.extractCityFromDestination(destination),
            country: this.extractCountryFromDestination(destination),
            rating: rating || undefined,
            review_count: reviewCount || undefined,
            price_level: priceLevel || undefined,
            source: 'tripadvisor',
            source_url: detailsUrl || undefined,
            popularity_score: this.calculatePopularityScore(rating, reviewCount),
            place_type: this.inferPlaceType(name, description),
            category: category || this.inferCategory(name, description)
          });
          
        } catch (error) {
          console.warn('Error extracting TripAdvisor place data:', error);
        }
      }
      
    } catch (error) {
      console.error('Error scraping TripAdvisor with Selenium:', error);
    }
    
    return places;
  }

  // Scrape Google Maps with Selenium
  private static async scrapeGoogleMapsSelenium(
    destination: string,
    category?: string
  ): Promise<SeleniumScrapedPlace[]> {
    const places: SeleniumScrapedPlace[] = [];
    
    try {
      const driver = await this.getDriver();
      
      // Build search query
      let searchQuery = `things to do in ${destination}`;
      if (category) {
        searchQuery = `${category} in ${destination}`;
      }
      
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
      
      await driver.get(searchUrl);
      await driver.sleep(this.SCRAPING_DELAY);
      
      // Wait for results to load
      await driver.wait(until.elementLocated(By.css('[role="article"], .section-result')), 10000);
      
      // Scroll to load more results
      await this.scrollToLoadMore(driver);
      
      // Extract place data
      const placeElements = await driver.findElements(By.css('[role="article"], .section-result'));
      
      for (let i = 0; i < Math.min(placeElements.length, this.MAX_RESULTS_PER_SOURCE); i++) {
        try {
          const element = placeElements[i];
          
          const name = await this.getTextSafely(element, 'h3, .section-result-title');
          if (!name) continue;
          
          const rating = await this.getRatingSafely(element);
          const reviewCount = await this.getReviewCountSafely(element);
          const address = await this.getTextSafely(element, '.section-result-location, [data-value="Address"]');
          const category = await this.getTextSafely(element, '.section-result-details, [data-value="Category"]');
          
          places.push({
            name,
            address: address || undefined,
            city: this.extractCityFromDestination(destination),
            country: this.extractCountryFromDestination(destination),
            rating: rating || undefined,
            review_count: reviewCount || undefined,
            source: 'google_maps',
            popularity_score: this.calculatePopularityScore(rating, reviewCount),
            place_type: this.inferPlaceType(name, category),
            category: category || this.inferCategory(name, category)
          });
          
        } catch (error) {
          console.warn('Error extracting Google Maps place data:', error);
        }
      }
      
    } catch (error) {
      console.error('Error scraping Google Maps with Selenium:', error);
    }
    
    return places;
  }

  // Scrape Booking.com for accommodations and attractions
  private static async scrapeBookingSelenium(
    destination: string,
    category?: string
  ): Promise<SeleniumScrapedPlace[]> {
    const places: SeleniumScrapedPlace[] = [];
    
    try {
      const driver = await this.getDriver();
      
      // Focus on attractions if not accommodation category
      const searchUrl = category === 'accommodation' 
        ? `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}`
        : `https://www.booking.com/attractions/searchresults.html?ss=${encodeURIComponent(destination)}`;
      
      await driver.get(searchUrl);
      await driver.sleep(this.SCRAPING_DELAY);
      
      // Wait for results
      await driver.wait(until.elementLocated(By.css('[data-testid="property-card"], .attraction-card, .sr_item')), 10000);
      
      const placeElements = await driver.findElements(By.css('[data-testid="property-card"], .attraction-card, .sr_item'));
      
      for (let i = 0; i < Math.min(placeElements.length, this.MAX_RESULTS_PER_SOURCE); i++) {
        try {
          const element = placeElements[i];
          
          const name = await this.getTextSafely(element, 'h3, .sr-hotel__name, [data-testid="title"]');
          if (!name) continue;
          
          const rating = await this.getRatingSafely(element);
          const reviewCount = await this.getReviewCountSafely(element);
          const description = await this.getTextSafely(element, '.property-description, .attraction-description');
          const address = await this.getTextSafely(element, '.address, [data-testid="address"]');
          
          places.push({
            name,
            description: description || undefined,
            address: address || undefined,
            city: this.extractCityFromDestination(destination),
            country: this.extractCountryFromDestination(destination),
            rating: rating || undefined,
            review_count: reviewCount || undefined,
            source: 'booking',
            popularity_score: this.calculatePopularityScore(rating, reviewCount),
            place_type: category === 'accommodation' ? 'hotel' : this.inferPlaceType(name, description),
            category: category || this.inferCategory(name, description)
          });
          
        } catch (error) {
          console.warn('Error extracting Booking.com place data:', error);
        }
      }
      
    } catch (error) {
      console.error('Error scraping Booking.com with Selenium:', error);
    }
    
    return places;
  }

  // Scrape Expedia for comprehensive travel data
  private static async scrapeExpediaSelenium(
    destination: string,
    category?: string
  ): Promise<SeleniumScrapedPlace[]> {
    const places: SeleniumScrapedPlace[] = [];
    
    try {
      const driver = await this.getDriver();
      
      const searchUrl = `https://www.expedia.com/things-to-do/search?location=${encodeURIComponent(destination)}`;
      
      await driver.get(searchUrl);
      await driver.sleep(this.SCRAPING_DELAY);
      
      // Wait for results
      await driver.wait(until.elementLocated(By.css('.activity-card, .uitk-card, .result-item')), 10000);
      
      const placeElements = await driver.findElements(By.css('.activity-card, .uitk-card, .result-item'));
      
      for (let i = 0; i < Math.min(placeElements.length, this.MAX_RESULTS_PER_SOURCE); i++) {
        try {
          const element = placeElements[i];
          
          const name = await this.getTextSafely(element, 'h3, .activity-title, .uitk-heading');
          if (!name) continue;
          
          const rating = await this.getRatingSafely(element);
          const reviewCount = await this.getReviewCountSafely(element);
          const description = await this.getTextSafely(element, '.description, .activity-description');
          const priceLevel = await this.getPriceLevelSafely(element);
          
          places.push({
            name,
            description: description || undefined,
            city: this.extractCityFromDestination(destination),
            country: this.extractCountryFromDestination(destination),
            rating: rating || undefined,
            review_count: reviewCount || undefined,
            price_level: priceLevel || undefined,
            source: 'expedia',
            popularity_score: this.calculatePopularityScore(rating, reviewCount),
            place_type: this.inferPlaceType(name, description),
            category: category || this.inferCategory(name, description)
          });
          
        } catch (error) {
          console.warn('Error extracting Expedia place data:', error);
        }
      }
      
    } catch (error) {
      console.error('Error scraping Expedia with Selenium:', error);
    }
    
    return places;
  }

  // Scrape Yelp for local businesses and attractions
  private static async scrapeYelpSelenium(
    destination: string,
    category?: string
  ): Promise<SeleniumScrapedPlace[]> {
    const places: SeleniumScrapedPlace[] = [];
    
    try {
      const driver = await this.getDriver();
      
      let searchTerm = 'attractions';
      if (category) {
        const categoryMap: { [key: string]: string } = {
          'food': 'restaurants',
          'culture': 'museums',
          'nature': 'parks',
          'shopping': 'shopping',
          'nightlife': 'nightlife'
        };
        searchTerm = categoryMap[category] || 'attractions';
      }
      
      const searchUrl = `https://www.yelp.com/search?find_desc=${encodeURIComponent(searchTerm)}&find_loc=${encodeURIComponent(destination)}`;
      
      await driver.get(searchUrl);
      await driver.sleep(this.SCRAPING_DELAY);
      
      // Wait for results
      await driver.wait(until.elementLocated(By.css('[data-testid="serp-ia-card"], .businessName, .result')), 10000);
      
      const placeElements = await driver.findElements(By.css('[data-testid="serp-ia-card"], .result, .search-result'));
      
      for (let i = 0; i < Math.min(placeElements.length, this.MAX_RESULTS_PER_SOURCE); i++) {
        try {
          const element = placeElements[i];
          
          const name = await this.getTextSafely(element, 'h3, .businessName, [data-testid="business-name"]');
          if (!name) continue;
          
          const rating = await this.getRatingSafely(element);
          const reviewCount = await this.getReviewCountSafely(element);
          const address = await this.getTextSafely(element, '.address, [data-testid="business-address"]');
          const category = await this.getTextSafely(element, '.category, [data-testid="business-categories"]');
          const priceLevel = await this.getPriceLevelSafely(element);
          
          places.push({
            name,
            address: address || undefined,
            city: this.extractCityFromDestination(destination),
            country: this.extractCountryFromDestination(destination),
            rating: rating || undefined,
            review_count: reviewCount || undefined,
            price_level: priceLevel || undefined,
            source: 'yelp',
            popularity_score: this.calculatePopularityScore(rating, reviewCount),
            place_type: this.inferPlaceType(name, category),
            category: category || this.inferCategory(name, category)
          });
          
        } catch (error) {
          console.warn('Error extracting Yelp place data:', error);
        }
      }
      
    } catch (error) {
      console.error('Error scraping Yelp with Selenium:', error);
    }
    
    return places;
  }

  // Helper methods
  private static async scrollToLoadMore(driver: WebDriver): Promise<void> {
    try {
      // Scroll down multiple times to load more content
      for (let i = 0; i < 3; i++) {
        await driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
        await driver.sleep(1000);
      }
    } catch (error) {
      console.warn('Error scrolling to load more content:', error);
    }
  }

  private static async getTextSafely(element: WebElement, selector: string): Promise<string | null> {
    try {
      const subElement = await element.findElement(By.css(selector));
      return await subElement.getText();
    } catch (error) {
      return null;
    }
  }

  private static async getRatingSafely(element: WebElement): Promise<number | null> {
    try {
      const ratingSelectors = [
        '[aria-label*="rating"]',
        '.rating',
        '[class*="rating"]',
        '[data-testid*="rating"]',
        '.stars'
      ];
      
      for (const selector of ratingSelectors) {
        try {
          const ratingElement = await element.findElement(By.css(selector));
          const ratingText = await ratingElement.getAttribute('aria-label') || await ratingElement.getText();
          const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
          if (ratingMatch) {
            return parseFloat(ratingMatch[1]);
          }
        } catch (e) {
          continue;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private static async getReviewCountSafely(element: WebElement): Promise<number | null> {
    try {
      const reviewSelectors = [
        '[class*="review"]',
        '[data-testid*="review"]',
        '.review-count',
        '[aria-label*="review"]'
      ];
      
      for (const selector of reviewSelectors) {
        try {
          const reviewElement = await element.findElement(By.css(selector));
          const reviewText = await reviewElement.getText();
          const reviewMatch = reviewText.match(/(\d+(?:,\d+)*)/);
          if (reviewMatch) {
            return parseInt(reviewMatch[1].replace(/,/g, ''));
          }
        } catch (e) {
          continue;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private static async getPriceLevelSafely(element: WebElement): Promise<number | null> {
    try {
      const priceSelectors = [
        '.price',
        '[class*="price"]',
        '[data-testid*="price"]',
        '.cost'
      ];
      
      for (const selector of priceSelectors) {
        try {
          const priceElement = await element.findElement(By.css(selector));
          const priceText = await priceElement.getText();
          
          // Count dollar signs or other price indicators
          const dollarSigns = (priceText.match(/\$/g) || []).length;
          if (dollarSigns > 0) {
            return Math.min(dollarSigns, 4);
          }
          
          // Look for price ranges
          const priceMatch = priceText.match(/\$(\d+)/);
          if (priceMatch) {
            const price = parseInt(priceMatch[1]);
            if (price < 20) return 1;
            if (price < 50) return 2;
            if (price < 100) return 3;
            return 4;
          }
        } catch (e) {
          continue;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private static async getLinkSafely(element: WebElement): Promise<string | null> {
    try {
      const linkElement = await element.findElement(By.css('a'));
      return await linkElement.getAttribute('href');
    } catch (error) {
      return null;
    }
  }

  // Utility methods
  private static getLocationId(destination: string): string {
    // This would normally be a lookup table or API call
    // For now, return a generic ID
    return '123456';
  }

  private static extractCityFromDestination(destination: string): string {
    // Simple extraction - in production, use a proper location parser
    return destination.split(',')[0].trim();
  }

  private static extractCountryFromDestination(destination: string): string {
    // Simple extraction - in production, use a proper location parser
    const parts = destination.split(',');
    return parts.length > 1 ? parts[parts.length - 1].trim() : 'Unknown';
  }

  private static calculatePopularityScore(rating?: number | null, reviewCount?: number | null): number {
    if (!rating && !reviewCount) return 0;
    
    const ratingScore = rating ? (rating / 5) * 50 : 0;
    const reviewScore = reviewCount ? Math.min(Math.log10(reviewCount) * 10, 50) : 0;
    
    return Math.round(ratingScore + reviewScore);
  }

  private static inferPlaceType(name: string, description?: string | null): string {
    const text = `${name} ${description || ''}`.toLowerCase();
    
    if (text.includes('restaurant') || text.includes('cafe') || text.includes('food')) return 'restaurant';
    if (text.includes('museum') || text.includes('gallery')) return 'museum';
    if (text.includes('park') || text.includes('garden')) return 'park';
    if (text.includes('hotel') || text.includes('accommodation')) return 'hotel';
    if (text.includes('shop') || text.includes('market')) return 'shopping';
    if (text.includes('bar') || text.includes('club') || text.includes('nightlife')) return 'nightlife';
    if (text.includes('temple') || text.includes('church') || text.includes('shrine')) return 'religious';
    if (text.includes('beach') || text.includes('lake') || text.includes('mountain')) return 'nature';
    
    return 'attraction';
  }

  private static inferCategory(name: string, description?: string | null): string {
    const text = `${name} ${description || ''}`.toLowerCase();
    
    if (text.includes('food') || text.includes('restaurant') || text.includes('cafe')) return 'food';
    if (text.includes('culture') || text.includes('museum') || text.includes('art')) return 'culture';
    if (text.includes('nature') || text.includes('park') || text.includes('outdoor')) return 'nature';
    if (text.includes('shopping') || text.includes('market') || text.includes('store')) return 'shopping';
    if (text.includes('nightlife') || text.includes('bar') || text.includes('entertainment')) return 'nightlife';
    if (text.includes('adventure') || text.includes('sport') || text.includes('activity')) return 'adventure';
    
    return 'general';
  }

  private static removeDuplicates(places: SeleniumScrapedPlace[]): SeleniumScrapedPlace[] {
    const seen = new Set<string>();
    const unique: SeleniumScrapedPlace[] = [];
    
    for (const place of places) {
      const key = `${place.name.toLowerCase()}_${place.city.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(place);
      }
    }
    
    return unique;
  }

  private static async storePlacesInDatabase(places: SeleniumScrapedPlace[]): Promise<void> {
    try {
      for (const place of places) {
        const query = `
          INSERT INTO place_database (
            name, description, address, city, country, latitude, longitude,
            place_type, category, rating, review_count, price_level,
            source, source_url, popularity_score, last_updated
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
          ON CONFLICT (source, source_id) 
          DO UPDATE SET 
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            address = EXCLUDED.address,
            rating = EXCLUDED.rating,
            review_count = EXCLUDED.review_count,
            price_level = EXCLUDED.price_level,
            popularity_score = EXCLUDED.popularity_score,
            last_updated = NOW()
        `;
        
        const values = [
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
          place.source,
          place.source_url,
          place.popularity_score
        ];
        
        await pool.query(query, values);
      }
      
      console.log(`✅ Stored ${places.length} places in database`);
    } catch (error) {
      console.error('Error storing places in database:', error);
    }
  }

  // Scheduled scraping for popular destinations
  static async scheduleScrapingForPopularDestinations(): Promise<void> {
    const popularDestinations = [
      'Tokyo, Japan',
      'Paris, France',
      'London, UK',
      'New York, USA',
      'Bangkok, Thailand',
      'Seoul, South Korea',
      'Singapore',
      'Barcelona, Spain',
      'Rome, Italy',
      'Amsterdam, Netherlands'
    ];
    
    console.log('🕐 Starting scheduled scraping for popular destinations...');
    
    for (const destination of popularDestinations) {
      try {
        console.log(`Scraping ${destination}...`);
        await this.scrapeDestinationPlaces(destination);
        
        // Add delay between destinations to be respectful
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error(`Error scraping ${destination}:`, error);
      }
    }
    
    console.log('✅ Scheduled scraping completed');
  }

  // Get scraping statistics
  static async getScrapingStatistics(): Promise<any> {
    try {
      const query = `
        SELECT 
          source,
          COUNT(*) as total_places,
          AVG(rating) as avg_rating,
          AVG(review_count) as avg_reviews,
          AVG(popularity_score) as avg_popularity,
          COUNT(CASE WHEN last_updated > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_updates
        FROM place_database
        GROUP BY source
        ORDER BY total_places DESC
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting scraping statistics:', error);
      return [];
    }
  }
}