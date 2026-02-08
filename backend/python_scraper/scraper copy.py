#!/usr/bin/env python3
"""
Comprehensive Place Scraper using Selenium
Scrapes travel destinations from multiple sources with high reliability
"""

import os
import sys
import time
import json
import logging
import schedule
import re
import math
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import psycopg2
from psycopg2.extras import RealDictCursor
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class PlaceScraper:
    def __init__(self, use_frontend=False):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'journo'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'postgres')
        }
        self.driver = None
        self.wait = None
        self.use_frontend = use_frontend  # Flag to enable frontend mode
        
        # Progressive logging counters
        self.total_destinations = 0
        self.current_destination = 0
        self.total_categories = 0
        self.current_category = 0
        self.places_found = 0
        self.total_places_scraped = 0
        
        # Popular destinations to scrape
        self.destinations = [
            ('Tokyo', 'Japan'),
            ('Paris', 'France'),
            ('London', 'United Kingdom'),
            ('New York', 'United States'),
            ('Bangkok', 'Thailand'),
            ('Seoul', 'South Korea'),
            ('Singapore', 'Singapore'),
            ('Barcelona', 'Spain'),
            ('Rome', 'Italy'),
            ('Amsterdam', 'Netherlands'),
            ('Berlin', 'Germany'),
            ('Sydney', 'Australia'),
            ('Dubai', 'United Arab Emirates'),
            ('Istanbul', 'Turkey'),
            ('Mumbai', 'India'),
            ('Hong Kong', 'Hong Kong'),
            ('Los Angeles', 'United States'),
            ('Prague', 'Czech Republic'),
            ('Vienna', 'Austria'),
            ('Zurich', 'Switzerland')
        ]
        
        # Categories to scrape for each destination
        self.categories = [
            'attractions',
            'restaurants', 
            'museums',
            'parks',
            'shopping',
            'nightlife',
            'hotels'
        ]

    def log_progress(self, message, level="INFO"):
        """Enhanced logging with progress information"""
        if self.total_destinations > 0:
            dest_progress = f"[{self.current_destination}/{self.total_destinations}]"
        else:
            dest_progress = ""
            
        if self.total_categories > 0:
            cat_progress = f"[{self.current_category}/{self.total_categories}]"
        else:
            cat_progress = ""
            
        progress_info = f"{dest_progress}{cat_progress} "
        full_message = f"{progress_info}{message}"
        
        if level == "INFO":
            logger.info(full_message)
        elif level == "WARNING":
            logger.warning(full_message)
        elif level == "ERROR":
            logger.error(full_message)
        else:
            logger.info(full_message)
            
        # If frontend mode, also update database with progress
        if self.use_frontend:
            self.update_frontend_progress(message, level)
    
    def update_frontend_progress(self, message, level):
        """Update progress in database for frontend to display"""
        try:
            conn = self.get_db_connection()
            if conn:
                cursor = conn.cursor()
                
                # Update or insert progress record
                progress_data = {
                    'current_destination': self.current_destination,
                    'total_destinations': self.total_destinations,
                    'current_category': self.current_category,
                    'total_categories': self.total_categories,
                    'places_found': self.places_found,
                    'total_places_scraped': self.total_places_scraped,
                    'current_message': message,
                    'level': level
                }
                
                query = """
                    INSERT INTO scraping_progress (
                        session_id, current_destination, total_destinations,
                        current_category, total_categories, places_found,
                        total_places_scraped, current_message, level, updated_at
                    ) VALUES (
                        'current_session', %s, %s, %s, %s, %s, %s, %s, %s, NOW()
                    )
                    ON CONFLICT (session_id) DO UPDATE SET
                        current_destination = EXCLUDED.current_destination,
                        total_destinations = EXCLUDED.total_destinations,
                        current_category = EXCLUDED.current_category,
                        total_categories = EXCLUDED.total_categories,
                        places_found = EXCLUDED.places_found,
                        total_places_scraped = EXCLUDED.total_places_scraped,
                        current_message = EXCLUDED.current_message,
                        level = EXCLUDED.level,
                        updated_at = NOW()
                """
                
                cursor.execute(query, (
                    self.current_destination, self.total_destinations,
                    self.current_category, self.total_categories,
                    self.places_found, self.total_places_scraped,
                    message, level
                ))
                
                conn.commit()
                cursor.close()
                conn.close()
        except Exception as e:
            logger.warning(f"Failed to update frontend progress: {e}")

    def initialize_progress_tracking(self, destinations_count, categories_count):
        """Initialize progress tracking counters"""
        self.total_destinations = destinations_count
        self.total_categories = categories_count
        self.current_destination = 0
        self.current_category = 0
        self.places_found = 0
        self.total_places_scraped = 0
        
        self.log_progress(f"🚀 Starting scraping session: {destinations_count} destinations × {categories_count} categories = {destinations_count * categories_count} total jobs")

    def update_destination_progress(self, destination_name):
        """Update progress when starting a new destination"""
        self.current_destination += 1
        self.current_category = 0
        self.log_progress(f"🌍 Starting destination {self.current_destination}/{self.total_destinations}: {destination_name}")

    def update_category_progress(self, category_name, destination_name):
        """Update progress when starting a new category"""
        self.current_category += 1
        self.log_progress(f"📂 Scraping category {self.current_category}/{self.total_categories}: {category_name} in {destination_name}")

    def update_places_found(self, count, source, category, destination):
        """Update progress when places are found"""
        self.places_found += count
        if count > 0:
            self.log_progress(f"✅ Found {count} places from {source} for {category} in {destination} (Total: {self.places_found})")
        else:
            self.log_progress(f"⚠️  No places found from {source} for {category} in {destination}", "WARNING")

    def update_places_stored(self, count):
        """Update progress when places are stored in database"""
        self.total_places_scraped += count
        self.log_progress(f"💾 Stored {count} places in database (Total stored: {self.total_places_scraped})")

    def log_completion_summary(self):
        """Log final completion summary"""
        self.log_progress(f"🎉 Scraping completed! Total places scraped: {self.total_places_scraped}")
        
        if self.use_frontend:
            # Mark session as completed
            try:
                conn = self.get_db_connection()
                if conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        UPDATE scraping_progress 
                        SET status = 'completed', completed_at = NOW()
                        WHERE session_id = 'current_session'
                    """)
                    conn.commit()
                    cursor.close()
                    conn.close()
            except Exception as e:
                logger.warning(f"Failed to mark session as completed: {e}")

    def setup_driver(self):
        """Initialize Chrome WebDriver with optimal settings"""
        try:
            chrome_options = Options()
            chrome_options.add_argument('--headless')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)
            
            # Try system chromedriver first (installed via brew)
            try:
                import shutil
                system_chromedriver = shutil.which('chromedriver')
                if system_chromedriver:
                    logger.info(f"Using system chromedriver: {system_chromedriver}")
                    service = Service(system_chromedriver)
                else:
                    raise Exception("System chromedriver not found")
            except Exception as e:
                logger.warning(f"System chromedriver failed: {e}, trying ChromeDriverManager")
                # Fallback to ChromeDriverManager
                try:
                    driver_path = ChromeDriverManager().install()
                    logger.info(f"ChromeDriver path: {driver_path}")
                    
                    # Fix for macOS - find the actual chromedriver executable
                    import os
                    if os.path.isdir(driver_path):
                        # Look for chromedriver executable in the directory
                        for root, dirs, files in os.walk(driver_path):
                            for file in files:
                                if file == 'chromedriver' and os.access(os.path.join(root, file), os.X_OK):
                                    driver_path = os.path.join(root, file)
                                    break
                            if not os.path.isdir(driver_path):
                                break
                    
                    service = Service(driver_path)
                except Exception as e2:
                    logger.error(f"ChromeDriverManager also failed: {e2}")
                    raise e2
            
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            self.wait = WebDriverWait(self.driver, 15)  # Increased timeout
            
            logger.info("Chrome WebDriver initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize WebDriver: {e}")
            return False

    def close_driver(self):
        """Close the WebDriver"""
        if self.driver:
            self.driver.quit()
            self.driver = None
            self.wait = None

    def get_db_connection(self):
        """Get database connection"""
        try:
            conn = psycopg2.connect(**self.db_config)
            return conn
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            return None

    def scrape_tripadvisor(self, city: str, country: str, category: str) -> List[Dict]:
        """Scrape TripAdvisor for places with updated selectors"""
        places = []
        
        try:
            self.log_progress(f"🔍 Starting TripAdvisor scraping for {category} in {city}, {country}")
            
            # Build search URL based on category
            category_map = {
                'attractions': 'Attractions',
                'restaurants': 'Restaurants', 
                'museums': 'Museums',
                'parks': 'Nature_Parks',
                'shopping': 'Shopping',
                'nightlife': 'Nightlife',
                'hotels': 'Hotels'
            }
            
            category_path = category_map.get(category, 'Attractions')
            search_query = f"{city} {country}"
            
            # Use TripAdvisor search with updated URL structure
            url = f"https://www.tripadvisor.com/Search?q={search_query.replace(' ', '%20')}&searchSessionId=000"
            
            self.log_progress(f"📡 Loading TripAdvisor page: {url}")
            self.driver.get(url)
            time.sleep(5)  # Increased wait time
            
            # Wait for results to load with updated selectors
            try:
                self.log_progress("⏳ Waiting for TripAdvisor results to load...")
                # Updated selectors for 2024 TripAdvisor
                result_selectors = [
                    '[data-automation="hotel-card"]',
                    '[data-automation="attraction-card"]', 
                    '[data-automation="restaurant-card"]',
                    'div[class*="result"]',
                    'div[class*="listing"]',
                    'div[class*="card"]'
                ]
                
                results_found = False
                for selector in result_selectors:
                    try:
                        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
                        results_found = True
                        self.log_progress(f"✅ Found TripAdvisor results with selector: {selector}")
                        break
                    except TimeoutException:
                        continue
                
                if not results_found:
                    self.log_progress(f"❌ No results found for {city}, {country} on TripAdvisor", "WARNING")
                    return places
                
            except TimeoutException:
                self.log_progress(f"❌ Timeout waiting for TripAdvisor results for {city}, {country}", "WARNING")
                return places
            
            # Scroll to load more content
            self.log_progress("📜 Scrolling to load more TripAdvisor content...")
            self.scroll_to_load_more()
            
            # Extract place data with updated selectors
            self.log_progress("🔍 Extracting place data from TripAdvisor...")
            place_selectors = [
                '[data-automation="hotel-card"]',
                '[data-automation="attraction-card"]', 
                '[data-automation="restaurant-card"]',
                'div[class*="result"]',
                'div[class*="listing"]',
                'div[class*="card"]',
                'div[class*="property"]'
            ]
            
            place_elements = []
            for selector in place_selectors:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    place_elements.extend(elements)
                    self.log_progress(f"📍 Found {len(elements)} elements with selector: {selector}")
                    break
            
            self.log_progress(f"🔄 Processing {min(len(place_elements), 20)} TripAdvisor places...")
            for i, element in enumerate(place_elements[:20]):  # Limit to 20 results per category
                try:
                    if i % 5 == 0:  # Log every 5th place
                        self.log_progress(f"📍 Processing TripAdvisor place {i+1}/{min(len(place_elements), 20)}")
                    
                    place_data = self.extract_tripadvisor_place_data(element, city, country, category)
                    if place_data:
                        places.append(place_data)
                except Exception as e:
                    logger.warning(f"Error extracting TripAdvisor place data: {e}")
                    continue
            
            self.update_places_found(len(places), "TripAdvisor", category, f"{city}, {country}")
            
        except Exception as e:
            self.log_progress(f"❌ Error scraping TripAdvisor for {city}, {category}: {e}", "ERROR")
        
        return places

    def extract_tripadvisor_place_data(self, element, city: str, country: str, category: str) -> Optional[Dict]:
        """Extract place data from TripAdvisor element with updated selectors"""
        try:
            # Updated selectors for 2024 TripAdvisor
            name_selectors = [
                'a[class*="title"]',
                'div[class*="title"]',
                'h3',
                'h2', 
                'span[class*="title"]',
                '[data-automation="name"]',
                'a[class*="property_title"]'
            ]
            
            name = None
            for selector in name_selectors:
                try:
                    name_element = element.find_element(By.CSS_SELECTOR, selector)
                    name = name_element.text.strip()
                    if name and len(name) > 2:
                        break
                except:
                    continue
            
            if not name or len(name) < 3:
                return None
            
            # Extract rating with updated selectors
            rating = None
            rating_selectors = [
                'svg[class*="rating"]',
                'span[class*="rating"]',
                'div[class*="rating"]',
                '[class*="bubble"]',
                '[aria-label*="rating"]',
                '[aria-label*="stars"]'
            ]
            
            for selector in rating_selectors:
                try:
                    rating_element = element.find_element(By.CSS_SELECTOR, selector)
                    rating_text = rating_element.get_attribute('aria-label') or rating_element.text
                    if rating_text:
                        rating_match = re.search(r'(\d+\.?\d*)', rating_text)
                        if rating_match:
                            rating = float(rating_match.group(1))
                            if rating > 5:  # Sometimes it's out of 10, convert to 5
                                rating = rating / 2
                            break
                except:
                    continue
            
            # Extract review count with updated selectors
            review_count = None
            review_selectors = [
                'span[class*="review"]',
                'div[class*="review"]', 
                'a[class*="review"]',
                '[class*="reviewCount"]',
                'span[class*="count"]'
            ]
            
            for selector in review_selectors:
                try:
                    review_element = element.find_element(By.CSS_SELECTOR, selector)
                    review_text = review_element.text
                    if review_text:
                        review_match = re.search(r'(\d+(?:,\d+)*)', review_text)
                        if review_match:
                            review_count = int(review_match.group(1).replace(',', ''))
                            break
                except:
                    continue
            
            # Extract description with updated selectors
            description = None
            desc_selectors = [
                'div[class*="description"]',
                'span[class*="description"]',
                'div[class*="snippet"]',
                'p[class*="description"]'
            ]
            
            for selector in desc_selectors:
                try:
                    desc_element = element.find_element(By.CSS_SELECTOR, selector)
                    description = desc_element.text.strip()
                    if description and len(description) > 10:
                        break
                except:
                    continue
            
            # Extract address with updated selectors
            address = None
            addr_selectors = [
                'span[class*="address"]',
                'div[class*="address"]',
                'span[class*="location"]',
                'div[class*="location"]'
            ]
            
            for selector in addr_selectors:
                try:
                    addr_element = element.find_element(By.CSS_SELECTOR, selector)
                    address = addr_element.text.strip()
                    if address and len(address) > 5:
                        break
                except:
                    continue
            
            # Calculate popularity score
            popularity_score = self.calculate_popularity_score(rating, review_count)
            
            return {
                'name': name,
                'description': description or f"Popular {category} in {city}",
                'address': address or f"{city}, {country}",
                'city': city,
                'country': country,
                'place_type': self.infer_place_type(name, description, category),
                'category': category,
                'rating': rating,
                'review_count': review_count or 0,
                'source': 'tripadvisor',
                'popularity_score': popularity_score,
                'last_updated': datetime.now()
            }
            
        except Exception as e:
            logger.warning(f"Error extracting TripAdvisor place data: {e}")
            return None

    def scrape_google_maps(self, city: str, country: str, category: str) -> List[Dict]:
        """Scrape Google Maps for places with optimized strategy for maximum results"""
        all_places = []
        target_places = 100  # Reduced target per category for reliability
        
        # Generate focused search queries (fewer but more effective)
        search_queries = self.generate_focused_search_queries(city, country, category)
        self.log_progress(f"🎯 Target: {target_places} places using {len(search_queries)} focused queries")
        
        for i, search_query in enumerate(search_queries):
            try:
                # Stop if we've reached our target
                if len(all_places) >= target_places:
                    self.log_progress(f"🎉 Reached target of {target_places} places! Stopping search.")
                    break
                
                self.log_progress(f"🔍 Query {i+1}/{len(search_queries)}: {search_query}")
                
                url = f"https://www.google.com/maps/search/{search_query.replace(' ', '+')}"
                
                self.driver.get(url)
                time.sleep(3)  # Reduced wait time
                
                # Wait for results
                try:
                    result_selectors = ['div[role="article"]']
                    
                    results_found = False
                    for selector in result_selectors:
                        try:
                            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
                            results_found = True
                            break
                        except TimeoutException:
                            continue
                    
                    if not results_found:
                        self.log_progress(f"❌ No results for: {search_query}", "WARNING")
                        continue
                        
                except TimeoutException:
                    self.log_progress(f"❌ Timeout for: {search_query}", "WARNING")
                    continue
                
                # Moderate scrolling to avoid crashes
                self.log_progress("📜 Loading more results...")
                self.scroll_moderately()
                
                # Extract all available places
                place_elements = self.driver.find_elements(By.CSS_SELECTOR, 'div[role="article"]')
                self.log_progress(f"� Founsd {len(place_elements)} places")
                
                # Process places from this query
                query_places = []
                for j, element in enumerate(place_elements):
                    try:
                        place_data = self.extract_google_maps_place_data(element, city, country, category)
                        if place_data:
                            query_places.append(place_data)
                            
                        # Limit per query to maintain performance
                        if len(query_places) >= 30:  # Max 30 per query
                            break
                            
                    except Exception as e:
                        continue
                
                all_places.extend(query_places)
                self.log_progress(f"✅ Added {len(query_places)} places (Total: {len(all_places)}/{target_places})")
                
                # Short delay between queries
                if i < len(search_queries) - 1:
                    time.sleep(2)
                    
            except Exception as e:
                self.log_progress(f"❌ Error with query '{search_query}': {e}", "ERROR")
                continue
        
        # Remove duplicates
        self.log_progress(f"🔄 Removing duplicates from {len(all_places)} places...")
        unique_places = self.remove_duplicates_comprehensive(all_places)
        
        # Enhance places with missing coordinates and opening hours
        self.log_progress(f"📍 Enhancing places with coordinates and opening hours...")
        enhanced_places = self.enhance_places_with_geocoding(unique_places)
        
        self.log_progress(f"🎯 Final result: {len(enhanced_places)} unique places")
        self.update_places_found(len(enhanced_places), "Google Maps", category, f"{city}, {country}")
        
        return enhanced_places

    def generate_focused_search_queries(self, city: str, country: str, category: str) -> List[str]:
        """Generate focused search queries for better results with fewer queries"""
        base_location = f"{city}, {country}"
        
        # Focused query templates (fewer but more effective)
        query_templates = {
            'attractions': [
                f"tourist attractions {base_location}",
                f"things to do {base_location}",
                f"landmarks {base_location}",
                f"sightseeing {base_location}",
                f"famous places {base_location}"
            ],
            'restaurants': [
                f"restaurants {base_location}",
                f"best restaurants {base_location}",
                f"dining {base_location}",
                f"food {base_location}",
                f"japanese restaurants {base_location}"
            ],
            'museums': [
                f"museums {base_location}",
                f"art galleries {base_location}",
                f"cultural sites {base_location}"
            ],
            'parks': [
                f"parks {base_location}",
                f"gardens {base_location}",
                f"green spaces {base_location}"
            ],
            'shopping': [
                f"shopping {base_location}",
                f"shopping malls {base_location}",
                f"stores {base_location}"
            ],
            'nightlife': [
                f"bars {base_location}",
                f"nightlife {base_location}",
                f"entertainment {base_location}"
            ],
            'hotels': [
                f"hotels {base_location}",
                f"accommodation {base_location}"
            ]
        }
        
        # Add top 3 districts for major cities
        districts = self.get_top_districts(city)
        base_queries = query_templates.get(category, [f"{category} {base_location}"])
        
        # Expand with district searches (limited)
        expanded_queries = base_queries.copy()
        for district in districts[:3]:  # Only top 3 districts
            for base_query in base_queries[:2]:  # Only top 2 base queries
                district_query = base_query.replace(base_location, f"{district}, {city}")
                expanded_queries.append(district_query)
        
        return expanded_queries[:15]  # Limit to 15 total queries

    def get_top_districts(self, city: str) -> List[str]:
        """Get top 3 districts for a city"""
        district_map = {
            'Tokyo': ['Shibuya', 'Shinjuku', 'Ginza'],
            'Paris': ['Champs-Élysées', 'Montmartre', 'Le Marais'],
            'London': ['Westminster', 'Camden', 'Covent Garden'],
            'New York': ['Manhattan', 'Brooklyn', 'Times Square'],
            'Bangkok': ['Sukhumvit', 'Silom', 'Siam'],
            'Seoul': ['Gangnam', 'Hongdae', 'Myeongdong']
        }
        
        return district_map.get(city, [])

    def scroll_moderately(self):
        """Moderate scrolling to avoid session crashes"""
        try:
            sidebar = None
            sidebar_selectors = ['[role="main"]', 'div[class*="scrollable"]']
            
            for selector in sidebar_selectors:
                try:
                    sidebar = self.driver.find_element(By.CSS_SELECTOR, selector)
                    break
                except:
                    continue
            
            if sidebar:
                # Moderate scrolling (reduced from aggressive)
                for i in range(3):  # Only 3 scrolls
                    self.driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight", sidebar)
                    time.sleep(1)
            else:
                # Fallback scrolling
                for i in range(2):
                    self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    time.sleep(1)
                    
        except Exception as e:
            self.log_progress(f"⚠️  Error during scrolling: {e}", "WARNING")

    def scroll_for_maximum_results(self):
        """Scroll aggressively to load maximum number of results"""
        try:
            sidebar_selectors = [
                '[role="main"]',
                'div[class*="section-scrollbox"]',
                'div[class*="scrollable"]'
            ]
            
            sidebar = None
            for selector in sidebar_selectors:
                try:
                    sidebar = self.driver.find_element(By.CSS_SELECTOR, selector)
                    break
                except:
                    continue
            
            if sidebar:
                # Very aggressive scrolling for maximum results
                previous_height = 0
                scroll_attempts = 0
                max_scrolls = 20  # Increased for more results
                
                while scroll_attempts < max_scrolls:
                    # Scroll to bottom
                    self.driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight", sidebar)
                    time.sleep(1.5)  # Wait for content to load
                    
                    # Check if we've reached the end
                    current_height = self.driver.execute_script("return arguments[0].scrollHeight", sidebar)
                    if current_height == previous_height:
                        self.log_progress(f"📜 Reached end after {scroll_attempts + 1} scrolls")
                        break
                    
                    previous_height = current_height
                    scroll_attempts += 1
                    
                    if (scroll_attempts + 1) % 5 == 0:
                        self.log_progress(f"📜 Scroll {scroll_attempts + 1}/{max_scrolls}...")
                
                self.log_progress("📜 Maximum scrolling completed")
            else:
                # Fallback scrolling
                for i in range(10):
                    self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    time.sleep(1.5)
                    
        except Exception as e:
            self.log_progress(f"⚠️  Error during maximum scrolling: {e}", "WARNING")

    def remove_duplicates_comprehensive(self, places: List[Dict]) -> List[Dict]:
        """Remove duplicates with comprehensive matching"""
        seen = set()
        unique_places = []
        
        for place in places:
            # Create a more comprehensive key for duplicate detection
            name_clean = place['name'].lower().strip()
            address_clean = (place.get('address', '') or '').lower().strip()
            
            # Multiple keys to catch different types of duplicates
            keys = [
                f"{name_clean}_{place['city'].lower()}",
                f"{name_clean}_{address_clean}" if address_clean else None,
            ]
            
            # Add coordinate-based key if available
            if place.get('latitude') and place.get('longitude'):
                lat_rounded = round(float(place['latitude']), 4)
                lng_rounded = round(float(place['longitude']), 4)
                keys.append(f"coord_{lat_rounded}_{lng_rounded}")
            
            # Check if any key has been seen
            is_duplicate = False
            for key in keys:
                if key and key in seen:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                # Add all keys to seen set
                for key in keys:
                    if key:
                        seen.add(key)
                unique_places.append(place)
        
        return unique_places

    def generate_search_queries(self, city: str, country: str, category: str) -> List[str]:
        """Generate many search queries for comprehensive coverage (500+ places)"""
        base_location = f"{city}, {country}"
        
        # Comprehensive query templates for maximum coverage
        query_templates = {
            'attractions': [
                f"tourist attractions {base_location}",
                f"things to do {base_location}",
                f"sightseeing {base_location}",
                f"landmarks {base_location}",
                f"popular places {base_location}",
                f"must visit {base_location}",
                f"famous places {base_location}",
                f"monuments {base_location}",
                f"temples {base_location}",
                f"shrines {base_location}",
                f"observation decks {base_location}",
                f"viewpoints {base_location}",
                f"cultural sites {base_location}",
                f"historical places {base_location}",
                f"scenic spots {base_location}"
            ],
            'restaurants': [
                f"restaurants {base_location}",
                f"best food {base_location}",
                f"dining {base_location}",
                f"local cuisine {base_location}",
                f"popular restaurants {base_location}",
                f"sushi {base_location}",
                f"ramen {base_location}",
                f"japanese food {base_location}",
                f"cafes {base_location}",
                f"fine dining {base_location}",
                f"street food {base_location}",
                f"izakaya {base_location}",
                f"yakitori {base_location}",
                f"tempura {base_location}",
                f"udon {base_location}",
                f"soba {base_location}",
                f"tonkatsu {base_location}",
                f"yakiniku {base_location}",
                f"kaiseki {base_location}",
                f"bento {base_location}"
            ],
            'museums': [
                f"museums {base_location}",
                f"art galleries {base_location}",
                f"cultural sites {base_location}",
                f"exhibitions {base_location}",
                f"art museums {base_location}",
                f"history museums {base_location}",
                f"science museums {base_location}",
                f"contemporary art {base_location}",
                f"traditional art {base_location}",
                f"cultural centers {base_location}"
            ],
            'parks': [
                f"parks {base_location}",
                f"gardens {base_location}",
                f"green spaces {base_location}",
                f"outdoor areas {base_location}",
                f"public parks {base_location}",
                f"botanical gardens {base_location}",
                f"cherry blossoms {base_location}",
                f"nature parks {base_location}",
                f"recreational areas {base_location}",
                f"walking trails {base_location}"
            ],
            'shopping': [
                f"shopping {base_location}",
                f"shopping malls {base_location}",
                f"markets {base_location}",
                f"stores {base_location}",
                f"department stores {base_location}",
                f"boutiques {base_location}",
                f"electronics {base_location}",
                f"fashion {base_location}",
                f"souvenirs {base_location}",
                f"traditional crafts {base_location}",
                f"vintage shops {base_location}",
                f"bookstores {base_location}"
            ],
            'nightlife': [
                f"bars {base_location}",
                f"nightlife {base_location}",
                f"clubs {base_location}",
                f"entertainment {base_location}",
                f"pubs {base_location}",
                f"cocktail bars {base_location}",
                f"karaoke {base_location}",
                f"live music {base_location}",
                f"rooftop bars {base_location}",
                f"sake bars {base_location}"
            ],
            'hotels': [
                f"hotels {base_location}",
                f"accommodation {base_location}",
                f"places to stay {base_location}",
                f"luxury hotels {base_location}",
                f"budget hotels {base_location}",
                f"ryokan {base_location}",
                f"hostels {base_location}",
                f"business hotels {base_location}"
            ]
        }
        
        # Add district-specific searches for major cities
        districts = self.get_city_districts(city)
        base_queries = query_templates.get(category, [f"{category} {base_location}"])
        
        # Expand with district searches
        expanded_queries = base_queries.copy()
        for district in districts:
            for base_query in base_queries[:5]:  # Use top 5 base queries
                district_query = base_query.replace(base_location, f"{district}, {city}")
                expanded_queries.append(district_query)
        
        return expanded_queries

    def get_city_districts(self, city: str) -> List[str]:
        """Get major districts/areas for a city to expand search coverage"""
        district_map = {
            'Tokyo': ['Shibuya', 'Shinjuku', 'Ginza', 'Harajuku', 'Akihabara', 'Roppongi', 
                     'Asakusa', 'Ueno', 'Ikebukuro', 'Odaiba', 'Tsukiji', 'Akasaka'],
            'Paris': ['Champs-Élysées', 'Montmartre', 'Le Marais', 'Saint-Germain', 'Louvre', 'Bastille'],
            'London': ['Westminster', 'Camden', 'Shoreditch', 'Covent Garden', 'Soho', 'Kensington'],
            'New York': ['Manhattan', 'Brooklyn', 'Times Square', 'SoHo', 'Greenwich Village', 'Chelsea'],
            'Bangkok': ['Sukhumvit', 'Silom', 'Khao San', 'Chatuchak', 'Siam', 'Thonglor'],
            'Seoul': ['Gangnam', 'Hongdae', 'Myeongdong', 'Itaewon', 'Insadong', 'Dongdaemun']
        }
        
        return district_map.get(city, [])

    def scroll_sidebar_moderate(self):
        """Moderate scrolling to load more results without being too aggressive"""
        try:
            sidebar_selectors = [
                '[role="main"]',
                'div[class*="section-scrollbox"]',
                'div[class*="scrollable"]'
            ]
            
            sidebar = None
            for selector in sidebar_selectors:
                try:
                    sidebar = self.driver.find_element(By.CSS_SELECTOR, selector)
                    break
                except:
                    continue
            
            if sidebar:
                # Moderate scrolling
                for i in range(5):
                    self.driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight", sidebar)
                    time.sleep(1.5)
                self.log_progress("📜 Completed moderate scrolling")
            else:
                # Fallback scrolling
                for i in range(3):
                    self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    time.sleep(1)
                    
        except Exception as e:
            self.log_progress(f"⚠️  Error during scrolling: {e}", "WARNING")

    def extract_google_maps_place_data(self, element, city: str, country: str, category: str) -> Optional[Dict]:
        """Extract comprehensive place data from Google Maps element with enhanced extraction"""
        try:
            # Extract name with multiple selectors
            name = None
            name_selectors = [
                'div[class*="fontHeadlineSmall"]',
                'div[class*="fontHeadlineLarge"]', 
                'a[class*="hfpxzc"]',
                'h3',
                'div[class*="qBF1Pd"]',
                'span[class*="fontHeadlineSmall"]',
                'div[data-value="Title"]',
                'a[data-value="Title"]'
            ]
            
            for selector in name_selectors:
                try:
                    name_element = element.find_element(By.CSS_SELECTOR, selector)
                    name = name_element.text.strip()
                    if name and len(name) > 2:
                        break
                except:
                    continue
            
            if not name or len(name) < 3:
                return None
            
            # Extract coordinates and URL for detailed info
            coordinates = self.extract_coordinates_from_element(element)
            place_url = self.extract_place_url_from_element(element)
            
            # Extract rating with enhanced selectors
            rating = None
            rating_selectors = [
                'span[class*="MW4etd"]',
                'span[class*="fontBodyMedium"]',
                'div[class*="F7nice"]',
                'span[aria-label*="stars"]',
                'span[class*="rating"]',
                'div[class*="fontBodySmall"] span',
                'span[role="img"][aria-label*="stars"]'
            ]
            
            for selector in rating_selectors:
                try:
                    rating_element = element.find_element(By.CSS_SELECTOR, selector)
                    rating_text = rating_element.get_attribute('aria-label') or rating_element.text
                    if rating_text:
                        # Look for rating patterns like "4.5", "4,5", "Rated 4.5"
                        rating_match = re.search(r'(\d+[.,]?\d*)', rating_text.replace(',', '.'))
                        if rating_match:
                            rating = float(rating_match.group(1))
                            if 0 <= rating <= 5:  # Valid rating range
                                break
                except:
                    continue
            
            # Extract review count with enhanced patterns
            review_count = None
            review_selectors = [
                'span[class*="UY7F9"]',
                'button[class*="HHrUdb"]',
                'span[aria-label*="reviews"]',
                'span[class*="fontBodyMedium"]',
                'div[class*="fontBodySmall"]'
            ]
            
            for selector in review_selectors:
                try:
                    review_element = element.find_element(By.CSS_SELECTOR, selector)
                    review_text = review_element.text or review_element.get_attribute('aria-label')
                    if review_text:
                        # Look for patterns like "(1,234)", "(1.234)", "1,234 reviews"
                        review_match = re.search(r'[\(（]?(\d+(?:[.,]\d+)*)[）\)]?', review_text)
                        if review_match:
                            review_count = int(review_match.group(1).replace(',', '').replace('.', ''))
                            break
                except:
                    continue
            
            # Extract address with better detection
            address = None
            addr_selectors = [
                'div[class*="W4Efsd"]',
                'span[class*="W4Efsd"]',
                'div[class*="fontBodyMedium"]',
                'span[class*="fontBodyMedium"]',
                'div[data-value="Address"]'
            ]
            
            for selector in addr_selectors:
                try:
                    addr_elements = element.find_elements(By.CSS_SELECTOR, selector)
                    for addr_element in addr_elements:
                        addr_text = addr_element.text.strip()
                        # Better address detection
                        if (addr_text and len(addr_text) > 5 and 
                            (any(char.isdigit() for char in addr_text) or 
                             any(word in addr_text.lower() for word in ['street', 'st', 'avenue', 'ave', 'road', 'rd', 'district', 'chome', '丁目', '区']))):
                            address = addr_text
                            break
                    if address:
                        break
                except:
                    continue
            
            # Extract place type/category with better logic
            place_type_text = None
            description = None
            type_selectors = [
                'div[class*="fontBodyMedium"]',
                'span[class*="fontBodyMedium"]',
                'div[class*="W4Efsd"]',
                'div[class*="fontBodySmall"]'
            ]
            
            for selector in type_selectors:
                try:
                    type_elements = element.find_elements(By.CSS_SELECTOR, selector)
                    for type_element in type_elements:
                        type_text = type_element.text.strip()
                        # Skip if it's an address, rating, or review count
                        if (type_text and len(type_text) > 3 and len(type_text) < 100 and
                            not re.match(r'^\d+[.,]\d+$', type_text) and  # Not a rating
                            not re.match(r'^\(?\d+[.,]?\d*\)?$', type_text) and  # Not review count
                            not any(char.isdigit() for char in type_text[:5]) and  # Not starting with numbers (address)
                            type_text != name):  # Not the same as name
                            if not place_type_text:
                                place_type_text = type_text
                            elif not description and type_text != place_type_text:
                                description = type_text
                            break
                except:
                    continue
            
            # Extract price level ($ symbols) with better detection
            price_level = None
            try:
                # Look for price indicators
                price_selectors = [
                    'span[aria-label*="Price"]',
                    'span[aria-label*="price"]',
                    'div[class*="fontBodyMedium"]'
                ]
                
                for selector in price_selectors:
                    price_elements = element.find_elements(By.CSS_SELECTOR, selector)
                    for price_element in price_elements:
                        price_text = price_element.get_attribute('aria-label') or price_element.text
                        if price_text and '$' in price_text:
                            price_level = price_text.count('$')
                            break
                    if price_level:
                        break
            except:
                pass
            
            # Extract opening hours with enhanced detection
            opening_hours = self.extract_opening_hours_from_element(element)
            
            # Extract image URL
            image_url = self.extract_image_from_element(element)
            
            # Calculate popularity score
            popularity_score = self.calculate_popularity_score(rating, review_count)
            
            # Build comprehensive place data
            place_data = {
                'name': name,
                'description': description or place_type_text or f"Popular {category} in {city}",
                'address': address or f"{city}, {country}",
                'city': city,
                'country': country,
                'latitude': coordinates.get('latitude') if coordinates else None,
                'longitude': coordinates.get('longitude') if coordinates else None,
                'place_type': self.infer_place_type(name, place_type_text, category),
                'category': category,
                'rating': rating,
                'review_count': review_count or 0,
                'price_level': price_level,
                'opening_hours': opening_hours,
                'image_url': image_url,
                'source_url': place_url,
                'source': 'google_maps',
                'popularity_score': popularity_score,
                'last_updated': datetime.now()
            }
            
            return place_data
            
        except Exception as e:
            logger.warning(f"Error extracting Google Maps place data: {e}")
            return None

    def extract_coordinates_from_element(self, element) -> Optional[Dict]:
        """Extract coordinates from Google Maps element"""
        try:
            # Try to find a link with coordinates in href
            link_selectors = [
                'a[class*="hfpxzc"]',
                'a[href*="@"]',
                'div[class*="fontHeadlineSmall"] a'
            ]
            
            for selector in link_selectors:
                try:
                    link_element = element.find_element(By.CSS_SELECTOR, selector)
                    href = link_element.get_attribute('href')
                    if href and '@' in href:
                        # Extract coordinates from URL like: /@35.6762,139.6503,17z
                        coord_match = re.search(r'@(-?\d+\.?\d*),(-?\d+\.?\d*)', href)
                        if coord_match:
                            return {
                                'latitude': float(coord_match.group(1)),
                                'longitude': float(coord_match.group(2))
                            }
                except:
                    continue
            
            # Try to extract from data attributes
            try:
                data_coords = element.get_attribute('data-coords') or element.get_attribute('data-lat')
                if data_coords:
                    coord_match = re.search(r'(-?\d+\.?\d*),(-?\d+\.?\d*)', data_coords)
                    if coord_match:
                        return {
                            'latitude': float(coord_match.group(1)),
                            'longitude': float(coord_match.group(2))
                        }
            except:
                pass
                
        except Exception as e:
            logger.warning(f"Error extracting coordinates: {e}")
        
        return None

    def extract_opening_hours_from_element(self, element) -> Optional[str]:
        """Extract opening hours from Google Maps element"""
        try:
            # Look for opening hours in various formats
            hours_selectors = [
                'div[class*="opening"]',
                'span[class*="hours"]',
                'div[aria-label*="Hours"]',
                'span[aria-label*="Open"]',
                'div[class*="fontBodyMedium"]'
            ]
            
            for selector in hours_selectors:
                try:
                    hours_elements = element.find_elements(By.CSS_SELECTOR, selector)
                    for hours_element in hours_elements:
                        hours_text = hours_element.text.strip()
                        # Check if it looks like opening hours
                        if hours_text and any(keyword in hours_text.lower() for keyword in 
                                            ['open', 'closed', 'hours', 'am', 'pm', '24', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']):
                            return hours_text
                except:
                    continue
            
            # Look for status indicators
            status_selectors = [
                'span[class*="open"]',
                'span[class*="closed"]',
                'div[class*="status"]'
            ]
            
            for selector in status_selectors:
                try:
                    status_element = element.find_element(By.CSS_SELECTOR, selector)
                    status_text = status_element.text.strip()
                    if status_text and any(keyword in status_text.lower() for keyword in ['open', 'closed', 'opens', 'closes']):
                        return status_text
                except:
                    continue
                    
        except Exception as e:
            logger.warning(f"Error extracting opening hours: {e}")
        
        return None

    def extract_image_from_element(self, element) -> Optional[str]:
        """Extract image URL from Google Maps place element"""
        try:
            # Look for images in various selectors
            image_selectors = [
                'img[src*="googleusercontent"]',
                'img[src*="maps.gstatic.com"]',
                'img[src*="lh3.googleusercontent"]',
                'img[class*="photo"]',
                'img[data-src]',
                'img'
            ]
            
            for selector in image_selectors:
                try:
                    img_element = element.find_element(By.CSS_SELECTOR, selector)
                    img_src = img_element.get_attribute('src') or img_element.get_attribute('data-src')
                    
                    # Filter out placeholder images and icons
                    if (img_src and 
                        'googleusercontent' in img_src and 
                        'w' in img_src and 'h' in img_src and  # Has width/height params
                        not any(skip in img_src for skip in ['icon', 'marker', 'pin', 'logo'])):
                        return img_src
                except:
                    continue
                    
        except Exception as e:
            logger.warning(f"Error extracting image: {e}")
        
        return None

    def extract_place_url_from_element(self, element) -> Optional[str]:
        """Extract the Google Maps URL for the place"""
        try:
            # Look for clickable links
            link_selectors = [
                'a[href*="maps"]',
                'a[data-value="directions"]',
                'a[href*="place"]'
            ]
            
            for selector in link_selectors:
                try:
                    link_element = element.find_element(By.CSS_SELECTOR, selector)
                    href = link_element.get_attribute('href')
                    if href and ('maps' in href or 'place' in href):
                        return href
                except:
                    continue
                    
        except Exception as e:
            logger.warning(f"Error extracting place URL: {e}")
        
        return None

    def enhance_places_with_geocoding(self, places: List[Dict]) -> List[Dict]:
        """Enhance places with coordinates using geocoding for missing location data"""
        enhanced_places = []
        
        for place in places:
            # If coordinates are missing, try to geocode the address
            if not place.get('latitude') or not place.get('longitude'):
                coordinates = self.geocode_address(place.get('name'), place.get('address'), place.get('city'), place.get('country'))
                if coordinates:
                    place['latitude'] = coordinates['latitude']
                    place['longitude'] = coordinates['longitude']
                    self.log_progress(f"📍 Added coordinates for {place['name']}")
            
            # Add default opening hours if missing (for trip planning)
            if not place.get('opening_hours'):
                place['opening_hours'] = self.get_default_opening_hours(place.get('place_type'), place.get('category'))
            
            enhanced_places.append(place)
        
        return enhanced_places

    def geocode_address(self, name: str, address: str, city: str, country: str) -> Optional[Dict]:
        """Geocode an address to get coordinates"""
        try:
            # Build search query for geocoding
            query_parts = []
            if name:
                query_parts.append(name)
            if address and address != f"{city}, {country}":
                query_parts.append(address)
            else:
                query_parts.extend([city, country])
            
            query = ", ".join(query_parts)
            
            # Use a simple geocoding approach with Google Maps search
            # This is a fallback when direct coordinate extraction fails
            url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}"
            
            self.driver.get(url)
            time.sleep(2)
            
            # Try to extract coordinates from the URL after search
            current_url = self.driver.current_url
            coord_match = re.search(r'@(-?\d+\.?\d*),(-?\d+\.?\d*)', current_url)
            if coord_match:
                return {
                    'latitude': float(coord_match.group(1)),
                    'longitude': float(coord_match.group(2))
                }
                
        except Exception as e:
            logger.warning(f"Error geocoding {name}: {e}")
        
        return None

    def get_default_opening_hours(self, place_type: str, category: str) -> str:
        """Get default opening hours based on place type for trip planning"""
        # Default opening hours by category/type for trip planning
        default_hours = {
            'restaurant': '11:00 AM - 10:00 PM',
            'attraction': '9:00 AM - 6:00 PM', 
            'museum': '10:00 AM - 5:00 PM',
            'park': '6:00 AM - 8:00 PM',
            'shopping': '10:00 AM - 9:00 PM',
            'nightlife': '6:00 PM - 2:00 AM',
            'hotel': '24 hours',
            'cafe': '7:00 AM - 8:00 PM'
        }
        
        # Try place_type first, then category
        hours = default_hours.get(place_type) or default_hours.get(category)
        
        if not hours:
            # General default based on category
            if category in ['restaurants', 'food']:
                hours = '11:00 AM - 10:00 PM'
            elif category in ['attractions', 'sightseeing']:
                hours = '9:00 AM - 6:00 PM'
            elif category in ['museums', 'cultural']:
                hours = '10:00 AM - 5:00 PM'
            elif category in ['parks', 'nature']:
                hours = '6:00 AM - 8:00 PM'
            elif category in ['shopping', 'stores']:
                hours = '10:00 AM - 9:00 PM'
            elif category in ['nightlife', 'bars']:
                hours = '6:00 PM - 2:00 AM'
            else:
                hours = '9:00 AM - 6:00 PM'  # General default
        
        return hours

    def get_detailed_place_info(self, element, place_name: str) -> Dict:
        """Try to get detailed information by clicking on the place"""
        detailed_info = {}
        
        try:
            # Skip detailed extraction for now to avoid session crashes
            # Focus on getting basic data reliably first
            return detailed_info
            
            # Try to click on the place to get more details
            clickable_selectors = [
                'a[class*="hfpxzc"]',
                'div[class*="fontHeadlineSmall"]',
                'h3'
            ]
            
            clicked = False
            for selector in clickable_selectors:
                try:
                    clickable_element = element.find_element(By.CSS_SELECTOR, selector)
                    self.driver.execute_script("arguments[0].click();", clickable_element)
                    clicked = True
                    break
                except:
                    continue
            
            if clicked:
                # Wait for details panel to load
                time.sleep(2)
                
                # Extract coordinates from URL
                current_url = self.driver.current_url
                coord_match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', current_url)
                if coord_match:
                    detailed_info['latitude'] = float(coord_match.group(1))
                    detailed_info['longitude'] = float(coord_match.group(2))
                
                # Extract opening hours
                try:
                    hours_selectors = [
                        'div[class*="opening-hours"]',
                        'div[data-value*="Open"]',
                        'div[aria-label*="Hours"]',
                        'table[class*="opening_hours"]'
                    ]
                    
                    for selector in hours_selectors:
                        try:
                            hours_element = self.driver.find_element(By.CSS_SELECTOR, selector)
                            hours_text = hours_element.text.strip()
                            if hours_text and ('open' in hours_text.lower() or 'closed' in hours_text.lower()):
                                detailed_info['opening_hours'] = hours_text
                                break
                        except:
                            continue
                except:
                    pass
                
                # Extract phone number
                try:
                    phone_selectors = [
                        'button[data-value*="+"]',
                        'span[class*="phone"]',
                        'div[class*="phone"]'
                    ]
                    
                    for selector in phone_selectors:
                        try:
                            phone_element = self.driver.find_element(By.CSS_SELECTOR, selector)
                            phone_text = phone_element.get_attribute('data-value') or phone_element.text
                            if phone_text and ('+' in phone_text or phone_text.replace('-', '').replace(' ', '').isdigit()):
                                detailed_info['contact_info'] = {'phone': phone_text.strip()}
                                break
                        except:
                            continue
                except:
                    pass
                
                # Extract website
                try:
                    website_selectors = [
                        'a[data-value*="http"]',
                        'a[href*="http"]'
                    ]
                    
                    for selector in website_selectors:
                        try:
                            website_element = self.driver.find_element(By.CSS_SELECTOR, selector)
                            website_url = website_element.get_attribute('data-value') or website_element.get_attribute('href')
                            if website_url and website_url.startswith('http'):
                                if 'contact_info' not in detailed_info:
                                    detailed_info['contact_info'] = {}
                                detailed_info['contact_info']['website'] = website_url
                                break
                        except:
                            continue
                except:
                    pass
                
                # Go back to the list
                self.driver.back()
                time.sleep(1)
        
        except Exception as e:
            logger.warning(f"Error getting detailed info for {place_name}: {e}")
        
        return detailed_info

    def scrape_yelp(self, city: str, country: str, category: str) -> List[Dict]:
        """Scrape Yelp for places with updated selectors"""
        places = []
        
        try:
            self.log_progress(f"🔍 Starting Yelp scraping for {category} in {city}, {country}")
            
            # Map categories to Yelp terms
            yelp_categories = {
                'restaurants': 'restaurants',
                'attractions': 'attractions',
                'museums': 'museums',
                'parks': 'parks',
                'shopping': 'shopping',
                'nightlife': 'nightlife',
                'hotels': 'hotels'
            }
            
            yelp_term = yelp_categories.get(category, 'attractions')
            location = f"{city}, {country}"
            
            url = f"https://www.yelp.com/search?find_desc={yelp_term}&find_loc={location.replace(' ', '+')}"
            
            self.log_progress(f"📡 Loading Yelp page: {url}")
            self.driver.get(url)
            time.sleep(5)  # Increased wait time
            
            # Wait for results with updated selectors
            try:
                self.log_progress("⏳ Waiting for Yelp results to load...")
                # Updated selectors for 2024 Yelp
                result_selectors = [
                    'div[role="feed"] div.Nv2PK',                  # Main card container
                    'div.Nv2PK.THOPZb.CpccDe',                     # Common card wrapper
                    'a.hfpxzc',                                    # Clickable place link (very reliable)
                    'div[role="article"]',                         # Your old one as fallback
                    'div[class*="result"]',                        # Partial class match
                    'div[data-result-index]'                       # Sometimes indexed
                ]
                
                results_found = False
                for selector in result_selectors:
                    try:
                        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
                        results_found = True
                        self.log_progress(f"✅ Found Yelp results with selector: {selector}")
                        break
                    except TimeoutException:
                        continue
                
                if not results_found:
                    self.log_progress(f"❌ No Yelp results for {city}, {country}", "WARNING")
                    return places
                
            except TimeoutException:
                self.log_progress(f"❌ Timeout waiting for Yelp results for {city}, {country}", "WARNING")
                return places
            
            # Extract places with updated selectors
            self.log_progress("🔍 Extracting place data from Yelp...")
            place_selectors = [
                'div[class*="businessName"]',
                'div[class*="container"]',
                'div[data-testid*="serp"]',
                'div[class*="result"]'
            ]
            
            place_elements = []
            for selector in result_selectors:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    if 'a.hfpxzc' in selector:
                        # For links, get parent card
                        place_elements = [el.find_element(By.XPATH, "./ancestor::div[contains(@class, 'Nv2PK')]") for el in elements]
                    else:
                        place_elements = elements
                    self.log_progress(f"Found {len(place_elements)} places with selector: {selector}")
                    break
            
            self.log_progress(f"🔄 Processing {min(len(place_elements), 10)} Yelp places...")
            for i, element in enumerate(place_elements[:10]):  # Limit to 10 results
                try:
                    if i % 3 == 0:  # Log every 3rd place
                        self.log_progress(f"📍 Processing Yelp place {i+1}/{min(len(place_elements), 10)}")
                    
                    place_data = self.extract_yelp_place_data(element, city, country, category)
                    if place_data:
                        places.append(place_data)
                except Exception as e:
                    logger.warning(f"Error extracting Yelp place data: {e}")
                    continue
            
            self.update_places_found(len(places), "Yelp", category, f"{city}, {country}")
            
        except Exception as e:
            self.log_progress(f"❌ Error scraping Yelp for {city}, {category}: {e}", "ERROR")
        
        return places

    def extract_yelp_place_data(self, element, city: str, country: str, category: str) -> Optional[Dict]:
        """Extract place data from Yelp element with updated selectors"""
        try:
            # Updated selectors for 2024 Yelp
            name_selectors = [
                'a[class*="businessName"]',
                'h3[class*="businessName"]',
                'span[class*="businessName"]',
                'a[data-testid*="business-name"]',
                'h4',
                'h3'
            ]
            
            name = None
            for selector in name_selectors:
                try:
                    name_element = element.find_element(By.CSS_SELECTOR, selector)
                    name = name_element.text.strip()
                    if name and len(name) > 2:
                        break
                except:
                    continue
            
            if not name or len(name) < 3:
                return None
            
            # Extract rating with updated selectors
            rating = None
            rating_selectors = [
                'div[class*="rating"]',
                'span[class*="rating"]',
                'div[aria-label*="star"]',
                'span[aria-label*="star"]',
                'div[class*="stars"]'
            ]
            
            for selector in rating_selectors:
                try:
                    rating_element = element.find_element(By.CSS_SELECTOR, selector)
                    rating_text = rating_element.get_attribute('aria-label') or rating_element.text
                    if rating_text:
                        rating_match = re.search(r'(\d+\.?\d*)', rating_text)
                        if rating_match:
                            rating = float(rating_match.group(1))
                            break
                except:
                    continue
            
            # Extract review count with updated selectors
            review_count = None
            review_selectors = [
                'span[class*="reviewCount"]',
                'a[class*="reviewCount"]',
                'span[class*="review"]',
                'a[href*="reviews"]'
            ]
            
            for selector in review_selectors:
                try:
                    review_element = element.find_element(By.CSS_SELECTOR, selector)
                    review_text = review_element.text
                    if review_text:
                        review_match = re.search(r'(\d+(?:,\d+)*)', review_text)
                        if review_match:
                            review_count = int(review_match.group(1).replace(',', ''))
                            break
                except:
                    continue
            
            # Extract address with updated selectors
            address = None
            addr_selectors = [
                'p[class*="address"]',
                'span[class*="address"]',
                'div[class*="address"]',
                'p[class*="rawAddress"]'
            ]
            
            for selector in addr_selectors:
                try:
                    addr_element = element.find_element(By.CSS_SELECTOR, selector)
                    address = addr_element.text.strip()
                    if address and len(address) > 5:
                        break
                except:
                    continue
            
            # Extract categories with updated selectors
            categories_text = None
            cat_selectors = [
                'span[class*="category"]',
                'a[class*="category"]',
                'div[class*="category"]',
                'span[class*="priceCategory"]'
            ]
            
            for selector in cat_selectors:
                try:
                    cat_elements = element.find_elements(By.CSS_SELECTOR, selector)
                    if cat_elements:
                        categories_text = ', '.join([el.text.strip() for el in cat_elements if el.text.strip()])
                        if categories_text:
                            break
                except:
                    continue
            
            popularity_score = self.calculate_popularity_score(rating, review_count)
            
            return {
                'name': name,
                'description': categories_text or f"Popular {category} in {city}",
                'address': address or f"{city}, {country}",
                'city': city,
                'country': country,
                'place_type': self.infer_place_type(name, categories_text, category),
                'category': category,
                'rating': rating,
                'review_count': review_count or 0,
                'source': 'yelp',
                'popularity_score': popularity_score,
                'last_updated': datetime.now()
            }
            
        except Exception as e:
            logger.warning(f"Error extracting Yelp place data: {e}")
            return None

    def scroll_to_load_more(self):
        """Scroll down to load more content"""
        try:
            for i in range(3):
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(1)
        except Exception as e:
            logger.warning(f"Error scrolling: {e}")

    def scroll_sidebar_aggressively(self):
        """Aggressively scroll sidebar in Google Maps to load many more results"""
        try:
            # Try multiple sidebar selectors
            sidebar_selectors = [
            'div.m6QErb.DxyBCb.kA9KIf.dS8AEf.XiKgde.ecceSd[role="feed"]',  # Most reliable container
            '[role="main"]',
            'div.m6QErb[role="feed"]',
            'div.section-layout.section-scrollbox'
            ]
            
            sidebar = None
            for selector in sidebar_selectors:
                try:
                    sidebar = self.driver.find_element(By.CSS_SELECTOR, selector)
                    self.log_progress(f"📜 Found sidebar with selector: {selector}")
                    break
                except:
                    continue
            if sidebar:
                previous_height = 0
                scroll_attempts = 0
                max_scrolls = 20  # Increased for more results

                while scroll_attempts < max_scrolls:
                    self.driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight", sidebar)
                    time.sleep(random.uniform(1.5, 3.0))  # Human-like delay
                    current_height = self.driver.execute_script("return arguments[0].scrollHeight", sidebar)
                    if current_height == previous_height:
                        self.log_progress(f"📜 Reached end of results after {scroll_attempts + 1} scrolls")
                        break
                    previous_height = current_height
                    scroll_attempts += 1

                    if (scroll_attempts % 5 == 0):
                        self.log_progress(f"📜 Scroll attempt {scroll_attempts}/{max_scrolls}...")

                self.log_progress("📜 Maximum scrolling completed")
            else:
                self.log_progress("⚠️ Sidebar not found, falling back to page scroll", "WARNING")
                for _ in range(10):
                    self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    time.sleep(2)

        except Exception as e:
            self.log_progress(f"⚠️ Error during aggressive scrolling: {e}", "WARNING")
'''
            if sidebar:
                # Very aggressive scrolling to load many results
                self.log_progress("📜 Starting aggressive scrolling...")
                previous_height = 0
                for i in range(15):  # Much more scrolling
                    # Scroll to bottom
                    self.driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight", sidebar)
                    time.sleep(2)  # Wait for content to load
                    
                    # Check if we've reached the end
                    current_height = self.driver.execute_script("return arguments[0].scrollHeight", sidebar)
                    if i > 0 and current_height == previous_height:
                        self.log_progress(f"📜 Reached end of results after {i+1} scrolls")
                        break
                    previous_height = current_height
                    
                    if (i + 1) % 5 == 0:
                        self.log_progress(f"📜 Completed {i+1}/15 scroll cycles...")
                
                self.log_progress("📜 Aggressive scrolling completed")
            else:
                # Fallback to page scrolling
                self.log_progress("📜 Using fallback page scrolling...")
                for i in range(10):
                    self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    time.sleep(2)
                    
        except Exception as e:
            self.log_progress(f"⚠️  Error during aggressive scrolling: {e}", "WARNING")
'''
    def scroll_sidebar(self):
        """Scroll sidebar in Google Maps to load more results"""
        try:
            # Try multiple sidebar selectors
            sidebar_selectors = [
                '[role="main"]',
                'div[class*="section-scrollbox"]',
                'div[class*="scrollable"]',
                'div[class*="results"]'
            ]
            
            sidebar = None
            for selector in sidebar_selectors:
                try:
                    sidebar = self.driver.find_element(By.CSS_SELECTOR, selector)
                    break
                except:
                    continue
            
            if sidebar:
                # Scroll multiple times to load more results
                for i in range(5):  # Increased scrolling
                    self.driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight", sidebar)
                    time.sleep(1.5)  # Longer wait between scrolls
                self.log_progress("📜 Scrolled Google Maps sidebar to load more results")
            else:
                # Fallback to page scrolling
                for i in range(3):
                    self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    time.sleep(1)
                self.log_progress("📜 Used fallback page scrolling")
                
        except Exception as e:
            self.log_progress(f"⚠️  Error scrolling sidebar: {e}", "WARNING")

    def calculate_popularity_score(self, rating: Optional[float], review_count: Optional[int]) -> int:
        """Calculate popularity score based on rating and review count"""
        if not rating and not review_count:
            return 0
        
        rating_score = (rating or 0) / 5 * 50
        review_score = min(math.log10((review_count or 1) + 1) * 10, 50)
        
        return int(rating_score + review_score)

    def infer_place_type(self, name: str, description: Optional[str], category: str) -> str:
        """Infer place type from name, description, and category"""
        text = f"{name} {description or ''}".lower()
        
        if category == 'restaurants' or 'restaurant' in text or 'cafe' in text:
            return 'restaurant'
        elif category == 'museums' or 'museum' in text or 'gallery' in text:
            return 'museum'
        elif category == 'parks' or 'park' in text or 'garden' in text:
            return 'park'
        elif category == 'hotels' or 'hotel' in text or 'accommodation' in text:
            return 'hotel'
        elif category == 'shopping' or 'shop' in text or 'market' in text:
            return 'shopping'
        elif category == 'nightlife' or 'bar' in text or 'club' in text:
            return 'nightlife'
        else:
            return 'attraction'

    def store_places_in_database(self, places: List[Dict]):
        """Store scraped places in database with individual transactions"""
        if not places:
            self.log_progress("⚠️  No places to store in database", "WARNING")
            return
        
        self.log_progress(f"💾 Storing {len(places)} places in database...")
        
        stored_count = 0
        
        for i, place in enumerate(places):
            # Use individual connection for each place to avoid transaction issues
            conn = self.get_db_connection()
            if not conn:
                self.log_progress("❌ Could not connect to database", "ERROR")
                continue
            
            try:
                cursor = conn.cursor()
                
                # Ensure all required fields are present with defaults
                place_data = {
                    'name': place.get('name', 'Unknown Place'),
                    'description': place.get('description', f"Place in {place.get('city', 'Unknown City')}"),
                    'address': place.get('address', f"{place.get('city', 'Unknown')}, {place.get('country', 'Unknown')}"),
                    'city': place.get('city', 'Unknown'),
                    'country': place.get('country', 'Unknown'),
                    'latitude': place.get('latitude'),
                    'longitude': place.get('longitude'),
                    'place_type': place.get('place_type', 'attraction'),
                    'category': place.get('category', 'general'),
                    'rating': place.get('rating'),
                    'review_count': place.get('review_count', 0),
                    'price_level': place.get('price_level'),
                    'opening_hours': place.get('opening_hours'),
                    'contact_info': place.get('contact_info'),
                    'photos': [place.get('image_url')] if place.get('image_url') else [],
                    'source_url': place.get('source_url'),
                    'source': place.get('source', 'unknown'),
                    'source_id': place.get('source_id', place.get('name', 'unknown')),
                    'popularity_score': place.get('popularity_score', 0),
                    'last_updated': place.get('last_updated', datetime.now())
                }
                
                # Convert contact_info dict to JSON if present
                if place_data['contact_info']:
                    if isinstance(place_data['contact_info'], dict):
                        import json
                        place_data['contact_info'] = json.dumps(place_data['contact_info'])
                    elif isinstance(place_data['contact_info'], str):
                        # If it's already a string, make sure it's valid JSON
                        try:
                            import json
                            json.loads(place_data['contact_info'])  # Test if valid JSON
                        except:
                            # If not valid JSON, wrap it as a simple object
                            place_data['contact_info'] = json.dumps({"info": place_data['contact_info']})
                    else:
                        # Convert other types to string and wrap in JSON
                        import json
                        place_data['contact_info'] = json.dumps({"info": str(place_data['contact_info'])})
                else:
                    place_data['contact_info'] = None
                
                # Insert or update place
                query = """
                    INSERT INTO place_database (
                        name, description, address, city, country, 
                        latitude, longitude, place_type, category, 
                        rating, review_count, price_level, opening_hours, 
                        contact_info, photos, source_url, source, source_id, 
                        popularity_score, last_updated
                    ) VALUES (
                        %(name)s, %(description)s, %(address)s, %(city)s, %(country)s,
                        %(latitude)s, %(longitude)s, %(place_type)s, %(category)s,
                        %(rating)s, %(review_count)s, %(price_level)s, %(opening_hours)s,
                        %(contact_info)s, %(photos)s, %(source_url)s, %(source)s, %(source_id)s,
                        %(popularity_score)s, %(last_updated)s
                    )
                    ON CONFLICT (source, source_id, city, country) 
                    DO UPDATE SET 
                        name = EXCLUDED.name,
                        description = EXCLUDED.description,
                        address = EXCLUDED.address,
                        latitude = EXCLUDED.latitude,
                        longitude = EXCLUDED.longitude,
                        rating = EXCLUDED.rating,
                        review_count = EXCLUDED.review_count,
                        price_level = EXCLUDED.price_level,
                        opening_hours = EXCLUDED.opening_hours,
                        contact_info = EXCLUDED.contact_info,
                        popularity_score = EXCLUDED.popularity_score,
                        last_updated = EXCLUDED.last_updated
                """
                
                # Add source_id for conflict resolution
                place_data['source_id'] = f"{place_data['name']}_{place_data['city']}".replace(' ', '_').lower()
                
                cursor.execute(query, place_data)
                conn.commit()
                stored_count += 1
                
                # Log progress every 25 places
                if (i + 1) % 25 == 0:
                    self.log_progress(f"💾 Stored {i + 1}/{len(places)} places...")
                    
            except Exception as e:
                self.log_progress(f"⚠️  Failed to store place '{place.get('name', 'Unknown')}': {e}", "WARNING")
                try:
                    conn.rollback()
                except:
                    pass
            finally:
                try:
                    cursor.close()
                    conn.close()
                except:
                    pass
        
        self.log_progress(f"✅ Successfully stored {stored_count}/{len(places)} places in database")

    def scrape_destination(self, city: str, country: str):
        """Scrape all categories for a destination with session recovery"""
        destination_name = f"{city}, {country}"
        self.update_destination_progress(destination_name)
        
        total_places = 0
        
        try:
            for idx, category in enumerate(self.categories, 1):
                self.update_category_progress(category, destination_name)
                
                # Setup driver for each category to avoid session issues
                if not self.setup_driver():
                    self.log_progress("❌ Failed to setup driver", "ERROR")
                    continue
                
                try:
                    # Scrape from Google Maps only
                    self.log_progress(f"🌐 Scraping Google Maps for {category}...")
                    places = self.scrape_google_maps(city, country, category)
                    
                    # Store in database
                    if places:
                        self.store_places_in_database(places)
                        self.update_places_stored(len(places))
                        total_places += len(places)
                    
                    # Close driver after each category to prevent session issues
                    self.close_driver()
                    
                    # Delay between categories
                    time.sleep(3)
                    
                except Exception as e:
                    self.log_progress(f"❌ Error scraping {category}: {e}", "ERROR")
                    self.close_driver()
                    continue
            
            self.log_progress(f"✅ Completed scraping for {destination_name}. Total places: {total_places}")
            
        except Exception as e:
            self.log_progress(f"❌ Error scraping {destination_name}: {e}", "ERROR")
        finally:
            self.close_driver()

    def remove_duplicates(self, places: List[Dict]) -> List[Dict]:
        """Remove duplicate places based on name and location"""
        seen = set()
        unique_places = []
        
        for place in places:
            key = f"{place['name'].lower()}_{place['city'].lower()}"
            if key not in seen:
                seen.add(key)
                unique_places.append(place)
        
        return unique_places

    def update_scraping_schedule(self):
        """Update the scraping schedule in database"""
        conn = self.get_db_connection()
        if not conn:
            return
        
        try:
            cursor = conn.cursor()
            
            for city, country in self.destinations:
                for category in self.categories:
                    # Insert or update schedule
                    query = """
                        INSERT INTO scraping_schedule (destination, category, next_run)
                        VALUES (%(destination)s, %(category)s, %(next_run)s)
                        ON CONFLICT (destination, category)
                        DO UPDATE SET 
                            last_run = NOW(),
                            next_run = NOW() + INTERVAL '7 days'
                    """
                    
                    cursor.execute(query, {
                        'destination': f"{city}, {country}",
                        'category': category,
                        'next_run': datetime.now() + timedelta(days=7)
                    })
            
            conn.commit()
            logger.info("Updated scraping schedule")
            
        except Exception as e:
            logger.error(f"Error updating scraping schedule: {e}")
        finally:
            cursor.close()
            conn.close()

    def run_weekly_scraping(self):
        """Run weekly scraping for all destinations"""
        self.log_progress("🚀 Starting weekly scraping job")
        
        # Initialize progress tracking
        self.initialize_progress_tracking(len(self.destinations), len(self.categories))
        
        for city, country in self.destinations:
            try:
                self.scrape_destination(city, country)
                time.sleep(10)  # Delay between destinations
            except Exception as e:
                self.log_progress(f"❌ Error scraping {city}, {country}: {e}", "ERROR")
                continue
        
        # Update schedule
        self.update_scraping_schedule()
        
        # Log completion summary
        self.log_completion_summary()

def main():
    """Main function to run the scraper"""
    import re
    import math
    
    # Check for frontend flag
    use_frontend = '--frontend' in sys.argv or '-f' in sys.argv
    if use_frontend:
        # Remove frontend flags from argv to avoid issues with other parsing
        sys.argv = [arg for arg in sys.argv if arg not in ['--frontend', '-f']]
    
    scraper = PlaceScraper(use_frontend=use_frontend)
    
    if use_frontend:
        scraper.log_progress("🎯 Frontend mode enabled - progress will be stored in database")
    
    # Check command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == 'run-once':
            # Run scraping once for all destinations
            scraper.run_weekly_scraping()
        elif sys.argv[1] == 'schedule':
            # Schedule weekly scraping
            schedule.every().sunday.at("02:00").do(scraper.run_weekly_scraping)
            
            scraper.log_progress("📅 Scraper scheduled to run every Sunday at 2:00 AM")
            
            while True:
                schedule.run_pending()
                time.sleep(3600)  # Check every hour
        else:
            # Scrape specific destination
            parts = sys.argv[1].split(',')
            if len(parts) == 2:
                city, country = parts[0].strip(), parts[1].strip()
                # Initialize progress for single destination
                scraper.initialize_progress_tracking(1, len(scraper.categories))
                scraper.scrape_destination(city, country)
    else:
        print("Usage:")
        print("  python scraper.py run-once                    # Run scraping once for all destinations")
        print("  python scraper.py schedule                    # Schedule weekly scraping")
        print("  python scraper.py 'Tokyo,Japan'               # Scrape specific destination")
        print("  python scraper.py --frontend 'Tokyo,Japan'    # Scrape with frontend progress tracking")
        print("  python scraper.py -f run-once                 # Run all destinations with frontend tracking")

if __name__ == "__main__":
    main()