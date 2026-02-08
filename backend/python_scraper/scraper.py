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
import random
from datetime import datetime, timedelta
from typing import List, Dict, Optional
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
from selenium_stealth import stealth  # Added for better anti-detection
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
        self.use_frontend = use_frontend

        # Progress counters
        self.total_destinations = 0
        self.current_destination = 0
        self.total_categories = 0
        self.current_category = 0
        self.places_found = 0
        self.total_places_scraped = 0

        # Destinations
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

        self.categories = [
            'attractions'
        ]
        

    def log_progress(self, message, level="INFO"):
        if self.total_destinations > 0:
            dest_progress = f"[{self.current_destination}/{self.total_destinations}]"
        else:
            dest_progress = ""
        if self.total_categories > 0:
            cat_progress = f"[{self.current_category}/{self.total_categories}]"
        else:
            cat_progress = ""
        full_message = f"{dest_progress}{cat_progress} {message}"
        if level == "INFO":
            logger.info(full_message)
        elif level == "WARNING":
            logger.warning(full_message)
        elif level == "ERROR":
            logger.error(full_message)
        if self.use_frontend:
            self.update_frontend_progress(message, level)

    def update_frontend_progress(self, message, level):
        try:
            conn = self.get_db_connection()
            if conn:
                cursor = conn.cursor()
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
        self.total_destinations = destinations_count
        self.total_categories = categories_count
        self.current_destination = 0
        self.current_category = 0
        self.places_found = 0
        self.total_places_scraped = 0
        self.log_progress(f"🚀 Starting scraping session: {destinations_count} destinations × {categories_count} categories")

    def update_destination_progress(self, destination_name):
        self.current_destination += 1
        self.current_category = 0
        self.log_progress(f"🌍 Starting destination {self.current_destination}/{self.total_destinations}: {destination_name}")

    def update_category_progress(self, category_name, destination_name):
        self.current_category += 1
        self.log_progress(f"📂 Scraping category {self.current_category}/{self.total_categories}: {category_name} in {destination_name}")

    def update_places_found(self, count, source, category, destination):
        self.places_found += count
        if count > 0:
            self.log_progress(f"✅ Found {count} places from {source} for {category} in {destination} (Total: {self.places_found})")
        else:
            self.log_progress(f"⚠️ No places found from {source} for {category} in {destination}", "WARNING")

    def update_places_stored(self, count):
        self.total_places_scraped += count
        self.log_progress(f"💾 Stored {count} places in database (Total stored: {self.total_places_scraped})")

    def log_completion_summary(self):
        self.log_progress(f"🎉 Scraping completed! Total places scraped: {self.total_places_scraped}")
        if self.use_frontend:
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

    def setup_temp_driver(self):
        """
        Lightweight temporary driver for geocoding fallback only.
        Isolated from main driver to prevent session crashes from affecting scraping.
        """
        try:
            from selenium.webdriver.chrome.options import Options
            from selenium.webdriver.chrome.service import Service
            from webdriver_manager.chrome import ChromeDriverManager
            from selenium import webdriver
            import random

            chrome_options = Options()
            chrome_options.add_argument('--headless=new')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')
            chrome_options.add_argument('--disable-extensions')
            chrome_options.add_argument('--disable-images')  # Faster + less detection
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)

            # Random realistic user agent
            user_agents = [
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            ]
            chrome_options.add_argument(f"--user-agent={random.choice(user_agents)}")

            # Prefer undetected-chromedriver if installed
            try:
                import undetected_chromedriver as uc
                driver = uc.Chrome(options=chrome_options, use_subprocess=True)
                logger.info("Temp geocoding driver: using undetected-chromedriver")
            except ImportError:
                # Fallback to regular Chrome with stealth
                service = Service(ChromeDriverManager().install())
                driver = webdriver.Chrome(service=service, options=chrome_options)
                stealth(driver,
                        languages=["en-US", "en"],
                        vendor="Google Inc.",
                        platform="Win64",
                        webgl_vendor="Intel Inc.",
                        renderer="Intel Iris OpenGL Engine",
                        fix_hairline=True)
                logger.info("Temp geocoding driver: using regular Chrome + stealth")

            driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            return driver

        except Exception as e:
            logger.error(f"Failed to create temp driver for geocoding: {e}")
            return None

    def setup_driver(self):
        try:
            chrome_options = Options()
            chrome_options.add_argument('--headless')  # Comment this out for testing
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)

            # Try system chromedriver first
            try:
                import shutil
                system_chromedriver = shutil.which('chromedriver')
                if system_chromedriver:
                    service = Service(system_chromedriver)
                else:
                    raise Exception("System chromedriver not found")
            except Exception:
                driver_path = ChromeDriverManager().install()
                service = Service(driver_path)

            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            
            # Apply stealth settings
            stealth(self.driver,
                    languages=["en-US", "en"],
                    vendor="Google Inc.",
                    platform="Win64",
                    webgl_vendor="Intel Inc.",
                    renderer="Intel Iris OpenGL Engine",
                    fix_hairline=True)

            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            self.wait = WebDriverWait(self.driver, 20)
            logger.info("Chrome WebDriver initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize WebDriver: {e}")
            return False

    def close_driver(self):
        if self.driver:
            self.driver.quit()
            self.driver = None
            self.wait = None

    def get_db_connection(self):
        try:
            conn = psycopg2.connect(**self.db_config)
            return conn
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            return None

    def generate_focused_search_queries(self, city: str, country: str, category: str) -> List[str]:
        base_location = f"{city}, {country}"
        query_templates = {
            'attractions': ["tourist attractions", "things to do", "landmarks", "sightseeing", "famous places"],
            'restaurants': ["restaurants", "best restaurants", "dining", "food"],
            'museums': ["museums", "art galleries", "cultural sites"],
            'parks': ["parks", "gardens", "green spaces"],
            'shopping': ["shopping", "shopping malls", "stores"],
            'nightlife': ["bars", "nightlife", "entertainment"],
            'hotels': ["hotels", "accommodation"]
        }
        base_queries = [f"{q} {base_location}" for q in query_templates.get(category, [category])]
        districts = self.get_top_districts(city)
        expanded = base_queries.copy()
        for district in districts[:3]:
            for q in base_queries[:2]:
                expanded.append(q.replace(base_location, f"{district}, {city}"))
        return expanded[:15]

    def get_top_districts(self, city: str) -> List[str]:
        district_map = {
            'Tokyo': ['Shibuya', 'Shinjuku', 'Ginza'],
            'Paris': ['Champs-Élysées', 'Montmartre', 'Le Marais'],
            'London': ['Westminster', 'Camden', 'Covent Garden'],
            'New York': ['Manhattan', 'Brooklyn', 'Times Square'],
            'Bangkok': ['Sukhumvit', 'Silom', 'Siam'],
            'Seoul': ['Gangnam', 'Hongdae', 'Myeongdong']
        }
        return district_map.get(city, [])

    def scroll_sidebar_aggressively(self):
        try:
            sidebar_selectors = [
                'div.m6QErb.DxyBCb.kA9KIf.dS8AEf.XiKgde.ecceSd[role="feed"]',
                '[role="main"]', 'div.m6QErb[role="feed"]',
                'div.section-layout.section-scrollbox'
            ]
            sidebar = None
            for sel in sidebar_selectors:
                try:
                    sidebar = self.driver.find_element(By.CSS_SELECTOR, sel)
                    break
                except:
                    continue
            if sidebar:
                prev_height = 0
                attempts = 0
                max_attempts = 20
                while attempts < max_attempts:
                    self.driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight", sidebar)
                    time.sleep(random.uniform(1.5, 3.0))
                    curr_height = self.driver.execute_script("return arguments[0].scrollHeight", sidebar)
                    if curr_height == prev_height:
                        break
                    prev_height = curr_height
                    attempts += 1
            else:
                for _ in range(10):
                    self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    time.sleep(2)
        except Exception as e:
            self.log_progress(f"Scrolling error: {e}", "WARNING")

    def scrape_google_maps(self, city: str, country: str, category: str) -> List[Dict]:
        all_places = []
        target_places = 200
        queries = self.generate_focused_search_queries(city, country, category)
        self.log_progress(f"🎯 Target: up to {target_places} places using {len(queries)} queries")

        for i, query in enumerate(queries):
            if len(all_places) >= target_places:
                break
            self.log_progress(f"🔍 Query {i+1}/{len(queries)}: {query}")
            url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}"
            self.driver.get(url)
            time.sleep(random.uniform(4, 8))

            # Handle consent popup
            try:
                consent = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(.,'Accept all') or contains(.,'I agree')]"))
                )
                consent.click()
                time.sleep(2)
            except:
                pass

            try:
                self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'a.hfpxzc')))
            except TimeoutException:
                self.log_progress(f"❌ No initial results for: {query}", "WARNING")
                continue

            self.scroll_sidebar_aggressively()

            place_selectors = [
                'a.hfpxzc',
                'div.Nv2PK.THOPZb.CpccDe',
                'div[role="feed"] div.Nv2PK',
                'div.m6QErb div[jsaction]'
            ]

            place_elements = []
            for sel in place_selectors:
                els = self.driver.find_elements(By.CSS_SELECTOR, sel)
                if els:
                    if 'hfpxzc' in sel:
                        place_elements = []
                        for el in els:
                            if el.is_displayed():
                                try:
                                    parent = el.find_element(By.XPATH, "./ancestor::div[contains(@class,'Nv2PK')]")
                                    place_elements.append(parent)
                                except:
                                    place_elements.append(el)
                    else:
                        place_elements = [el for el in els if el.is_displayed()]
                    self.log_progress(f"📍 Found {len(place_elements)} places with selector: {sel}")
                    break

            query_places = []
            for element in place_elements[:100]:
                place_data = self.extract_google_maps_place_data(element, city, country, category)
                if place_data:
                    query_places.append(place_data)

            all_places.extend(query_places)
            self.log_progress(f"✅ Added {len(query_places)} new places (Total: {len(all_places)})")
            time.sleep(random.uniform(2, 5))

        unique_places = self.remove_duplicates_comprehensive(all_places)
        enhanced = self.enhance_places_with_geocoding(unique_places)
        self.log_progress(f"🎯 Final: {len(enhanced)} unique places for {category} in {city}, {country}")
        self.update_places_found(len(enhanced), "Google Maps", category, f"{city}, {country}")
        return enhanced

    def extract_google_maps_place_data(self, element, city: str, country: str, category: str) -> Optional[Dict]:
        try:
            name = None
            name_selectors = ['a.hfpxzc', 'div.qBF1Pd.fontHeadlineSmall', 'div.fontHeadlineSmall']
            for sel in name_selectors:
                try:
                    name_el = element.find_element(By.CSS_SELECTOR, sel)
                    name = name_el.text.strip() or name_el.get_attribute('aria-label')
                    if name and len(name) > 2:
                        break
                except:
                    continue
            
            if not name:
                self.log_progress("⚠️ Skipped invalid place (no name)", "WARNING")
                return None

            self.log_progress(f"📍 Processing place: {name}")

            rating = None
            rating_selectors = [
                'span[role="img"][aria-label*="星"]',     # Chinese: "4.4 顆星"
                'span[role="img"][aria-label*="stars"]',  # English: "4.4 stars"
                'span[aria-label*="rating"]',             # Fallback
                'span[aria-hidden="true"]'                # Visible text "4.4" as last resort
            ]
            raw_texts = []

            for sel in rating_selectors:
                try:
                    els = element.find_elements(By.CSS_SELECTOR, sel)
                    for el in els:
                        aria = el.get_attribute("aria-label") or ""
                        text = el.text.strip()
                        if aria or text:
                            raw_texts.append(aria or text)
                except:
                    continue

            # Combine all collected text for parsing
            combined = " ".join(raw_texts)

            # Extract rating: look for a number like 4.9, 4,9, or 5.0
            rating_match = re.search(r'(\d+[.,]\d+|\d+)', combined.replace(',', '.'))
            if rating_match:
                rating_str = rating_match.group(1).replace(',', '.')
                try:
                    rating = float(rating_str)
                    if 0 <= rating <= 5:  # Valid Google rating range
                        self.log_progress(f"📊 Rating: {rating} for {name}")
                    else:
                        rating = None  # Invalid, ignore
                except ValueError:
                    rating = None

            if not rating:
                self.log_progress(f"⚠️ No rating found for {name}", "WARNING")

            review_count = None
            review_selectors = [
                'span[role="img"][aria-label*="評論"]',   # Chinese: "3,871 則評論"
                'span[role="img"][aria-label*="review"]',# English
                'span:has(> span[aria-hidden="true"]):contains("(")'  # Fallback visible "(3,871)"
            ]
            review_texts = []
            for sel in rating_selectors:  # Reuse the same selectors you use for rating
                try:
                    els = element.find_elements(By.CSS_SELECTOR, sel)
                    for el in els:
                        aria = el.get_attribute("aria-label") or ""
                        text = el.text.strip()
                        if aria or text:
                            review_texts.append(aria or text)
                except:
                    continue

            combined_review_text = " ".join(review_texts)

            # First: Look for number inside parentheses – most reliable visible count
            paren_match = re.search(r'[\(（](\d{1,6}(?:,\d{3})*)[）\)]', combined_review_text)
            if paren_match:
                review_count = int(paren_match.group(1).replace(',', ''))
                self.log_progress(f"📊 Reviews from parentheses: {review_count} for {name}")

            # Second fallback: Number after review-related keywords (avoid rating)
            if not review_count:
                keyword_match = re.search(
                    r'(?:評論|則評論|reviews?|star|·)\s*[\(（]?(\d{1,6}(?:,\d{3})*)[）\)]?',
                    combined_review_text,
                    re.IGNORECASE
                )
                if keyword_match:
                    review_count = int(keyword_match.group(1).replace(',', ''))
                    self.log_progress(f"📊 Reviews from keyword context: {review_count} for {name}")

            # Final safety: If still none, warn
            if review_count is None:
                self.log_progress(f"⚠️ No review count found for {name}", "WARNING")

            address = type_text = description = None
            raw_lines = []

            info_selectors = [
                'div.W4Efsd', 'span.W4Efsd', 'div.fontBodyMedium',
                'div.Io6YTe', 'div[role="region"] div.fontBodyMedium',
                'div.m6QErb div.fontBodyMedium'
            ]

            for sel in info_selectors:
                try:
                    infos = element.find_elements(By.CSS_SELECTOR, sel)
                    for info in infos:
                        text = info.text.strip()
                        if not text or len(text) < 4:
                            continue
                        if any(k in text.lower() for k in ['open', 'closed', 'hours', '打烊', '營業時間', 'star', '評論', 'review', '(']):
                            continue
                        raw_lines.append(text)
                except:
                    continue

            # Flatten and split any line with newlines
            flattened_lines = []
            for line in raw_lines:
                flattened_lines.extend([l.strip() for l in line.split('\n') if l.strip()])

            # Deduplicate
            unique_lines = []
            seen = set()
            for line in flattened_lines:
                if line not in seen:
                    unique_lines.append(line)
                    seen.add(line)

            #self.log_progress(f"Raw info lines (flattened): {unique_lines} for {name}")

            category_line = None
            # Find category line with "·"
            for line in unique_lines:
                if '·' in line:
                    category_line = line
                    parts = [p.strip() for p in line.split('·')]
                    type_text = parts[0] if parts else None
                    # Address is usually the last part after "·"
                    if len(parts) > 1:
                        potential_addr = parts[-1]
                        if any(char.isdigit() or char in '-−,' for char in potential_addr):
                            address = potential_addr
                    break

            # Description: longest line without "·" and not containing hours keywords
            desc_candidates = [
                line for line in unique_lines
                if '·' not in line and
                not any(k in line for k in ['小時', '營業', 'Open', 'Closed'])
            ]
            if desc_candidates:
                description = max(desc_candidates, key=len)

            # Fallbacks
            if not address:
                address = f"{city}, {country}"
            if not type_text:
                type_text = category
            if not description:
                description = f"Popular {category} in {city}"

            # Clean Chinese comma 、 → /
            if address:
                address = address.replace('、', '/')
            if type_text:
                type_text = type_text.replace('、', '/')
            if description:
                description = description.replace('、', '/').strip()

            self.log_progress(f"📍 Address: {address} | Type: {type_text} | Desc: {description} for {name}")

            coords = self.extract_coordinates_from_element(element)
            url = self.extract_place_url_from_element(element)
            img = self.extract_image_from_element(element)

            return {
                'name': name,
                'description': description or type_text or f"Popular {category} in {city}",
                'address': address or f"{city}, {country}",
                'city': city,
                'country': country,
                'latitude': coords.get('latitude') if coords else None,
                'longitude': coords.get('longitude') if coords else None,
                'place_type': self.infer_place_type(name, type_text or description, category),
                'category': category,
                'rating': rating,
                'review_count': review_count or 0,
                'source_url': url,
                'source': 'google_maps',
                'popularity_score': self.calculate_popularity_score(rating, review_count),
                'last_updated': datetime.now()
            }
        except Exception as e:
            self.log_progress(f"⚠️ Extraction error for place: {e}", "WARNING")
            return None

    def extract_coordinates_from_element(self, element) -> Optional[Dict]:
        try:
            for sel in ['a.hfpxzc', 'a[href*="@"]']:
                try:
                    link = element.find_element(By.CSS_SELECTOR, sel)
                    href = link.get_attribute('href')
                    if href and '@' in href:
                        match = re.search(r'@(-?\d+\.?\d*),(-?\d+\.?\d*)', href)
                        if match:
                            return {'latitude': float(match.group(1)), 'longitude': float(match.group(2))}
                except:
                    continue
        except:
            pass
        return None

    def extract_image_from_element(self, element) -> Optional[str]:
        try:
            for sel in ['img[src*="googleusercontent"]', 'img[src*="lh3.googleusercontent"]']:
                try:
                    img = element.find_element(By.CSS_SELECTOR, sel)
                    src = img.get_attribute('src') or img.get_attribute('data-src')
                    if src and 'googleusercontent' in src and 'w' in src and 'h' in src:
                        return src
                except:
                    continue
        except:
            pass
        return None

    def extract_place_url_from_element(self, element) -> Optional[str]:
        try:
            for sel in ['a[href*="place"]', 'a[href*="maps"]']:
                try:
                    link = element.find_element(By.CSS_SELECTOR, sel)
                    href = link.get_attribute('href')
                    if href:
                        return href
                except:
                    continue
        except:
            pass
        return None

    def enhance_places_with_geocoding(self, places: List[Dict]) -> List[Dict]:
        enhanced = []
        for place in places:
            if not place.get('latitude') or not place.get('longitude'):
                coords = self.geocode_address(place.get('name'), place.get('address'), place.get('city'), place.get('country'))
                if coords:
                    place['latitude'] = coords['latitude']
                    place['longitude'] = coords['longitude']
                    self.log_progress(f"📍 Added coordinates for {place['name']}")
            if not place.get('opening_hours'):
                place['opening_hours'] = self.get_default_opening_hours(place.get('place_type'), place.get('category'))
            enhanced.append(place)
        return enhanced

    def geocode_address(self, name: str, address: str, city: str, country: str) -> Optional[Dict]:
        temp_driver = None
        try:
            temp_driver = self.setup_temp_driver()
            if not temp_driver:
                return None

            query = ", ".join(filter(None, [name, address, city, country]))
            url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}"

            temp_driver.get(url)
            time.sleep(random.uniform(6, 10))  # Longer wait to avoid detection

            # Handle consent if appears
            try:
                consent = WebDriverWait(temp_driver, 8).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(.,'Accept all') or contains(.,'I agree')]"))
                )
                consent.click()
                time.sleep(2)
            except:
                pass

            current_url = temp_driver.current_url
            match = re.search(r'@(-?\d+\.?\d*),(-?\d+\.?\d*)', current_url)
            if match:
                return {
                    'latitude': float(match.group(1)),
                    'longitude': float(match.group(2))
                }

        except Exception as e:
            self.log_progress(f"Geocoding failed: {e}", "WARNING")
        finally:
            if temp_driver:
                try:
                    temp_driver.quit()
                except:
                    pass
        return None

    def get_default_opening_hours(self, place_type: str, category: str) -> str:
        defaults = {
            'restaurant': '11:00 AM - 10:00 PM',
            'attraction': '9:00 AM - 6:00 PM',
            'museum': '10:00 AM - 5:00 PM',
            'park': '6:00 AM - 8:00 PM',
            'shopping': '10:00 AM - 9:00 PM',
            'nightlife': '6:00 PM - 2:00 AM',
            'hotel': '24 hours'
        }
        return defaults.get(place_type) or defaults.get(category, '9:00 AM - 6:00 PM')

    def calculate_popularity_score(self, rating: Optional[float], review_count: Optional[int]) -> int:
        if not rating and not review_count:
            return 0
        rating_score = (rating or 0) / 5 * 50
        review_score = min(math.log10((review_count or 1) + 1) * 10, 50)
        return int(rating_score + review_score)

    def infer_place_type(self, name: str, description: Optional[str], category: str) -> str:
        text = f"{name} {description or ''}".lower()
        if 'restaurant' in text or 'cafe' in text or category == 'restaurants':
            return 'restaurant'
        if 'museum' in text or 'gallery' in text or category == 'museums':
            return 'museum'
        if 'park' in text or 'garden' in text or category == 'parks':
            return 'park'
        if 'hotel' in text or category == 'hotels':
            return 'hotel'
        if 'shop' in text or 'mall' in text or category == 'shopping':
            return 'shopping'
        if 'bar' in text or 'club' in text or category == 'nightlife':
            return 'nightlife'
        return 'attraction'

    def remove_duplicates_comprehensive(self, places: List[Dict]) -> List[Dict]:
        """Enhanced deduplication prioritizing geographic location"""
        seen_coords = set()
        seen_names = set()
        unique_places = []

        for place in places:
            # Primary: coordinates
            if place.get('latitude') and place.get('longitude'):
                lat = round(float(place['latitude']), 6)
                lng = round(float(place['longitude']), 6)
                coord_key = f"{lat},{lng}"
                if coord_key in seen_coords:
                    continue
                seen_coords.add(coord_key)
            # Secondary: name + city
            else:
                name_clean = re.sub(r'\W+', '', place['name'].lower())
                city_clean = place['city'].lower()
                name_key = f"{name_clean}_{city_clean}"
                if name_key in seen_names:
                    continue
                seen_names.add(name_key)

            unique_places.append(place)

        removed = len(places) - len(unique_places)
        if removed > 0:
            self.log_progress(f"🗑️ Removed {removed} duplicates based on location/name")
        return unique_places

    def store_places_in_database(self, places: List[Dict]):
        if not places:
            self.log_progress("⚠️ No places to store", "WARNING")
            return
        self.log_progress(f"💾 Storing {len(places)} places...")
        stored_count = 0
        for i, place in enumerate(places):
            conn = self.get_db_connection()
            if not conn:
                continue
            try:
                cursor = conn.cursor()
                place_data = {
                    'name': place.get('name', 'Unknown'),
                    'description': place.get('description', f"Place in {place.get('city')}"),
                    'address': place.get('address', f"{place.get('city')}, {place.get('country')}"),
                    'city': place.get('city', 'Unknown'),
                    'country': place.get('country', 'Unknown'),
                    'latitude': place.get('latitude'),
                    'longitude': place.get('longitude'),
                    'place_type': place.get('place_type', 'attraction'),
                    'category': place.get('category', 'general'),
                    'rating': place.get('rating'),
                    'review_count': place.get('review_count', 0),
                    'opening_hours': place.get('opening_hours'),
                    'source_url': place.get('source_url'),
                    'source': place.get('source', 'google_maps'),
                    'source_id': f"{place.get('name')}_{place.get('city')}".replace(' ', '_').lower(),
                    'popularity_score': place.get('popularity_score', 0),
                    'last_updated': datetime.now()
                }
                query = """
                    INSERT INTO place_database (
                        name, description, address, city, country,
                        latitude, longitude, place_type, category,
                        rating, review_count, opening_hours, source_url, source, source_id,
                        popularity_score, last_updated
                    ) VALUES (
                        %(name)s, %(description)s, %(address)s, %(city)s, %(country)s,
                        %(latitude)s, %(longitude)s, %(place_type)s, %(category)s,
                        %(rating)s, %(review_count)s, %(opening_hours)s, %(source_url)s, %(source)s, %(source_id)s,
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
                        opening_hours = EXCLUDED.opening_hours,
                        popularity_score = EXCLUDED.popularity_score,
                        last_updated = EXCLUDED.last_updated
                """
                cursor.execute(query, place_data)
                conn.commit()
                stored_count += 1
                if (i + 1) % 25 == 0:
                    self.log_progress(f"💾 Stored {i + 1}/{len(places)} places...")
            except Exception as e:
                self.log_progress(f"⚠️ Failed to store '{place.get('name')}': {e}", "WARNING")
            finally:
                cursor.close()
                conn.close()
        self.log_progress(f"✅ Stored {stored_count}/{len(places)} places")

    def scrape_destination(self, city: str, country: str):
        dest_name = f"{city}, {country}"
        self.update_destination_progress(dest_name)
        total = 0
        try:
            for cat in self.categories:
                self.update_category_progress(cat, dest_name)
                if not self.setup_driver():
                    continue
                try:
                    places = self.scrape_google_maps(city, country, cat)
                    if places:
                        self.store_places_in_database(places)
                        self.update_places_stored(len(places))
                        total += len(places)
                    self.close_driver()
                    time.sleep(3)
                except Exception as e:
                    self.log_progress(f"Error in {cat}: {e}", "ERROR")
                    self.close_driver()
            self.log_progress(f"✅ Completed {dest_name}. Total: {total}")
        except Exception as e:
            self.log_progress(f"Error scraping {dest_name}: {e}", "ERROR")
        finally:
            self.close_driver()

    def run_weekly_scraping(self):
        self.log_progress("🚀 Starting weekly scraping")
        self.initialize_progress_tracking(len(self.destinations), len(self.categories))
        for city, country in self.destinations:
            try:
                self.scrape_destination(city, country)
                time.sleep(10)
            except Exception as e:
                self.log_progress(f"Error scraping {city}, {country}: {e}", "ERROR")
        self.log_completion_summary()

def main():
    use_frontend = '--frontend' in sys.argv or '-f' in sys.argv
    if use_frontend:
        sys.argv = [arg for arg in sys.argv if arg not in ['--frontend', '-f']]
    scraper = PlaceScraper(use_frontend=use_frontend)
    if use_frontend:
        scraper.log_progress("🎯 Frontend mode enabled")
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if arg == 'run-once':
            scraper.run_weekly_scraping()
        elif arg == 'schedule':
            schedule.every().sunday.at("02:00").do(scraper.run_weekly_scraping)
            scraper.log_progress("📅 Scheduled weekly run")
            while True:
                schedule.run_pending()
                time.sleep(3600)
        else:
            parts = arg.split(',')
            if len(parts) == 2:
                city, country = parts[0].strip(), parts[1].strip()
                scraper.initialize_progress_tracking(1, len(scraper.categories))
                scraper.scrape_destination(city, country)
    else:
        print("Usage:")
        print(" python scraper.py run-once")
        print(" python scraper.py schedule")
        print(" python scraper.py 'Tokyo,Japan'")
        print(" python scraper.py --frontend run-once")

if __name__ == "__main__":
    main()