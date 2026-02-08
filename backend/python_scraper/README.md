# Python Selenium Scraper for Journo

This Python scraper uses Selenium WebDriver to collect high-quality travel destination data from multiple sources including TripAdvisor, Google Maps, and Yelp. It's designed to run weekly to maintain fresh, comprehensive place data.

## Features

- **Multi-source scraping**: TripAdvisor, Google Maps, Yelp
- **High reliability**: Selenium WebDriver with proper error handling
- **Weekly scheduling**: Automated data collection every Sunday
- **Database integration**: Direct PostgreSQL storage
- **Comprehensive data**: Names, ratings, reviews, addresses, categories
- **Duplicate handling**: Smart deduplication across sources
- **Rate limiting**: Respectful scraping with delays

## Setup

### Prerequisites

- Python 3.8+
- Chrome browser
- PostgreSQL database
- pip package manager

### Installation

1. **Run the setup script:**
   ```bash
   cd backend/python_scraper
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Test the installation:**
   ```bash
   source venv/bin/activate
   python3 scraper.py 'Tokyo,Japan'
   ```

## Usage

### Manual Scraping

```bash
# Activate virtual environment
source venv/bin/activate

# Scrape a specific destination
python3 scraper.py 'Paris,France'

# Run scraping for all destinations once
python3 scraper.py run-once

# Start weekly scheduled scraping
python3 scraper.py schedule
```

### API Integration

The scraper integrates with the Node.js backend through:

- **Database**: Direct PostgreSQL storage in `place_database` table
- **Job management**: `scraping_jobs` table for tracking
- **Scheduling**: `scraping_schedule` table for weekly runs
- **REST API**: `/api/python-scraper/` endpoints

### API Endpoints

```bash
# Get scraping statistics
GET /api/python-scraper/statistics

# Get recent jobs
GET /api/python-scraper/jobs

# Start immediate scraping
POST /api/python-scraper/scrape-now
{
  "destination": "Tokyo, Japan",
  "category": "restaurants"
}

# Schedule weekly scraping
POST /api/python-scraper/schedule-weekly

# Cancel a running job
POST /api/python-scraper/cancel/:jobId
```

## Data Quality

### Sources and Coverage

- **TripAdvisor**: Attractions, restaurants, hotels (up to 20 per category)
- **Google Maps**: All categories with ratings and reviews (up to 15 per category)  
- **Yelp**: Local businesses and attractions (up to 10 per category)

### Data Fields

Each scraped place includes:
- Name and description
- Address and location (city, country)
- Rating and review count
- Place type and category
- Source information
- Popularity score (calculated)
- Last updated timestamp

### Quality Assurance

- **Duplicate removal**: Cross-source deduplication by name and location
- **Data validation**: Required fields validation before storage
- **Error handling**: Graceful failure with detailed logging
- **Rate limiting**: 2-3 second delays between requests
- **Retry logic**: Automatic retry on temporary failures

## Scheduling

### Weekly Schedule

The scraper runs automatically every Sunday at 2:00 AM for:

**Destinations:**
- Tokyo, Japan
- Paris, France
- London, United Kingdom
- New York, United States
- Bangkok, Thailand
- Seoul, South Korea
- Singapore, Singapore
- Barcelona, Spain
- Rome, Italy
- Amsterdam, Netherlands

**Categories per destination:**
- Attractions
- Restaurants
- Museums
- Parks
- Shopping
- Nightlife

### Monitoring

Check scraping status through:

```bash
# View logs
tail -f scraper.log

# Check database
SELECT * FROM scraping_jobs ORDER BY created_at DESC LIMIT 10;

# API statistics
curl http://localhost:5000/api/python-scraper/statistics
```

## Performance

### Expected Results

- **Places per destination**: 200-400 unique places
- **Scraping time**: 5-10 minutes per destination
- **Success rate**: 85-95% depending on source availability
- **Data freshness**: Weekly updates ensure current information

### Resource Usage

- **Memory**: ~200MB during scraping
- **CPU**: Moderate during active scraping
- **Network**: Respectful rate limiting
- **Storage**: ~1MB per 1000 places

## Troubleshooting

### Common Issues

1. **Chrome WebDriver not found**
   ```bash
   # Reinstall webdriver-manager
   pip install --upgrade webdriver-manager
   ```

2. **Database connection failed**
   ```bash
   # Check .env file
   cat .env
   # Test connection
   python3 -c "import psycopg2; print('OK')"
   ```

3. **Scraping failures**
   ```bash
   # Check logs
   tail -f scraper.log
   # Run with debug
   python3 scraper.py 'Tokyo,Japan' --debug
   ```

### Logs

- **scraper.log**: Detailed scraping logs
- **Database logs**: Check `scraping_jobs` table for errors
- **API logs**: Backend console for integration issues

## Development

### Adding New Sources

1. Create new scraping method in `scraper.py`
2. Add to source list in `scrape_destination()`
3. Update data extraction logic
4. Test with sample destination

### Customizing Destinations

Edit the `destinations` list in `scraper.py`:

```python
self.destinations = [
    ('Your City', 'Your Country'),
    # Add more destinations
]
```

### Modifying Categories

Edit the `categories` list:

```python
self.categories = [
    'your_category',
    # Add more categories
]
```

## Integration with Quick Plan

The scraped data is automatically used by the Quick Plan feature:

1. **Database-first approach**: Quick Plan queries `place_database` first
2. **Fallback handling**: Static data if no scraped data available
3. **Real-time updates**: Weekly scraping keeps data fresh
4. **High success rate**: Pre-scraped data eliminates real-time scraping failures

This ensures the Quick Plan feature has reliable, high-quality data with minimal latency and maximum success rates.