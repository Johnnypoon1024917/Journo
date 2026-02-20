/**
 * Seed data for country recommendations
 * 
 * This file contains curated travel destination data from trusted sources:
 * - Frequent Miler (travel rewards and destination guides)
 * - Zicasso (luxury travel recommendations)
 * - TripShare (community travel insights)
 * 
 * Each country includes:
 * - country_name: Full country name
 * - best_months: Array of optimal travel months (1-12)
 * - temp_range: Temperature range or description
 * - avoid_months: Months to avoid for travel
 * - region: Geographic classification
 * - description: Brief destination overview (200-300 characters)
 */

export interface CountrySeedData {
  country_name: string;
  best_months: number[];
  temp_range: string;
  avoid_months: number[];
  region: 'Asia' | 'Europe' | 'Americas' | 'Africa' | 'Oceania' | 'Middle East';
  description: string;
}

export const seedCountries: CountrySeedData[] = [
  // Asia
  {
    country_name: 'Japan',
    best_months: [3, 4, 5, 10, 11],
    temp_range: '10-25°C',
    avoid_months: [7, 8],
    region: 'Asia',
    description: 'Experience cherry blossoms in spring or vibrant autumn foliage. Avoid humid summer months. Perfect blend of ancient traditions and modern innovation.'
  },
  {
    country_name: 'Thailand',
    best_months: [11, 12, 1, 2],
    temp_range: 'Warm (25-32°C)',
    avoid_months: [5, 6, 7, 8, 9],
    region: 'Asia',
    description: 'Cool, dry season offers ideal beach weather and cultural exploration. Avoid monsoon season. Stunning temples, tropical islands, and vibrant street food culture.'
  },
  {
    country_name: 'Vietnam',
    best_months: [2, 3, 4, 11, 12],
    temp_range: 'Warm (20-30°C)',
    avoid_months: [6, 7, 8],
    region: 'Asia',
    description: 'Pleasant weather for exploring Hanoi, Halong Bay, and Ho Chi Minh City. Avoid summer heat and typhoons. Rich history and breathtaking natural landscapes.'
  },
  {
    country_name: 'South Korea',
    best_months: [4, 5, 9, 10, 11],
    temp_range: '15-25°C',
    avoid_months: [7, 8, 12, 1],
    region: 'Asia',
    description: 'Spring cherry blossoms and autumn colors are spectacular. Avoid humid summer and cold winter. Dynamic cities and serene countryside.'
  },
  {
    country_name: 'Indonesia',
    best_months: [5, 6, 7, 8, 9],
    temp_range: 'Warm (26-32°C)',
    avoid_months: [12, 1, 2],
    region: 'Asia',
    description: 'Dry season perfect for Bali, Java, and island hopping. Avoid wet season. Diverse cultures, volcanic landscapes, and pristine beaches.'
  },
  {
    country_name: 'Singapore',
    best_months: [2, 3, 4, 7, 8],
    temp_range: 'Warm (26-32°C)',
    avoid_months: [11, 12],
    region: 'Asia',
    description: 'Year-round destination with less rain in these months. Modern city-state with world-class dining, shopping, and attractions.'
  },
  {
    country_name: 'India',
    best_months: [10, 11, 12, 1, 2, 3],
    temp_range: '15-30°C',
    avoid_months: [5, 6, 7, 8],
    region: 'Asia',
    description: 'Cool, dry winter season ideal for exploring diverse regions. Avoid monsoon and extreme summer heat. Ancient heritage and vibrant culture.'
  },
  {
    country_name: 'Nepal',
    best_months: [10, 11, 3, 4],
    temp_range: '10-25°C',
    avoid_months: [6, 7, 8],
    region: 'Asia',
    description: 'Perfect trekking weather with clear mountain views. Avoid monsoon season. Home to Mount Everest and rich Buddhist culture.'
  },
  {
    country_name: 'Sri Lanka',
    best_months: [12, 1, 2, 3],
    temp_range: 'Warm (25-30°C)',
    avoid_months: [5, 6, 10, 11],
    region: 'Asia',
    description: 'Dry season on west and south coasts. Ancient temples, tea plantations, and beautiful beaches. Diverse wildlife and warm hospitality.'
  },
  {
    country_name: 'Malaysia',
    best_months: [12, 1, 2, 6, 7],
    temp_range: 'Warm (25-32°C)',
    avoid_months: [10, 11],
    region: 'Asia',
    description: 'Varies by region; generally drier in these months. Multicultural cities, rainforests, and tropical islands.'
  },
  {
    country_name: 'Cambodia',
    best_months: [11, 12, 1, 2],
    temp_range: 'Warm (25-30°C)',
    avoid_months: [5, 6, 7, 8, 9],
    region: 'Asia',
    description: 'Cool, dry season perfect for Angkor Wat exploration. Avoid monsoon. Ancient temples and emerging travel destination.'
  },
  {
    country_name: 'Philippines',
    best_months: [12, 1, 2, 3, 4],
    temp_range: 'Warm (25-32°C)',
    avoid_months: [6, 7, 8, 9],
    region: 'Asia',
    description: 'Dry season ideal for island hopping and diving. Avoid typhoon season. Over 7,000 islands with stunning beaches and friendly locals.'
  },
  {
    country_name: 'Maldives',
    best_months: [11, 12, 1, 2, 3, 4],
    temp_range: 'Warm (26-30°C)',
    avoid_months: [5, 6, 7, 8, 9, 10],
    region: 'Asia',
    description: 'Dry season with calm seas perfect for diving and snorkeling. Luxury overwater resorts and pristine coral reefs.'
  },
  // Europe
  {
    country_name: 'France',
    best_months: [4, 5, 6, 9, 10],
    temp_range: '15-25°C',
    avoid_months: [7, 8],
    region: 'Europe',
    description: 'Spring and fall offer pleasant weather and fewer crowds. Avoid peak summer tourism. World-class art, cuisine, and romantic destinations.'
  },
  {
    country_name: 'Italy',
    best_months: [4, 5, 6, 9, 10],
    temp_range: '18-28°C',
    avoid_months: [7, 8],
    region: 'Europe',
    description: 'Ideal weather for exploring cities and countryside. Avoid summer heat and crowds. Ancient ruins, Renaissance art, and incredible food.'
  },
  {
    country_name: 'Spain',
    best_months: [4, 5, 6, 9, 10],
    temp_range: '18-28°C',
    avoid_months: [7, 8],
    region: 'Europe',
    description: 'Comfortable temperatures for sightseeing. Avoid extreme summer heat. Vibrant culture, stunning architecture, and beautiful beaches.'
  },
  {
    country_name: 'Greece',
    best_months: [4, 5, 6, 9, 10],
    temp_range: 'Warm (20-30°C)',
    avoid_months: [7, 8],
    region: 'Europe',
    description: 'Perfect for island hopping and ancient site exploration. Avoid peak heat. Ancient history, stunning islands, and Mediterranean cuisine.'
  },
  {
    country_name: 'Portugal',
    best_months: [4, 5, 6, 9, 10],
    temp_range: '18-26°C',
    avoid_months: [7, 8],
    region: 'Europe',
    description: 'Mild weather ideal for coastal and city exploration. Beautiful coastline, historic cities, and excellent wine regions.'
  },
  {
    country_name: 'Iceland',
    best_months: [6, 7, 8],
    temp_range: 'Cold (8-15°C)',
    avoid_months: [12, 1, 2],
    region: 'Europe',
    description: 'Midnight sun and accessible highlands in summer. Winter brings extreme cold and limited daylight. Dramatic landscapes and natural wonders.'
  },
  {
    country_name: 'Norway',
    best_months: [5, 6, 7, 8],
    temp_range: 'Cold (10-20°C)',
    avoid_months: [11, 12, 1, 2],
    region: 'Europe',
    description: 'Long days perfect for fjord exploration. Winter for Northern Lights. Stunning fjords, midnight sun, and Viking heritage.'
  },
  {
    country_name: 'Sweden',
    best_months: [6, 7, 8],
    temp_range: 'Cold (15-22°C)',
    avoid_months: [11, 12, 1, 2],
    region: 'Europe',
    description: 'Warm summer with long daylight hours. Winter for snow activities. Modern design, historic cities, and beautiful archipelagos.'
  },
  {
    country_name: 'Switzerland',
    best_months: [6, 7, 8, 9, 12, 1, 2],
    temp_range: '10-25°C',
    avoid_months: [11],
    region: 'Europe',
    description: 'Summer for hiking, winter for skiing. Shoulder seasons can be rainy. Alpine beauty, chocolate, and precision engineering.'
  },
  {
    country_name: 'Austria',
    best_months: [5, 6, 9, 12, 1, 2],
    temp_range: '10-25°C',
    avoid_months: [11],
    region: 'Europe',
    description: 'Pleasant summer and excellent winter skiing. Imperial palaces, classical music, and Alpine scenery.'
  },
  {
    country_name: 'Germany',
    best_months: [5, 6, 7, 8, 9],
    temp_range: '15-25°C',
    avoid_months: [12, 1, 2],
    region: 'Europe',
    description: 'Warm summer months ideal for festivals and outdoor activities. Historic cities, castles, and beer gardens.'
  },
  {
    country_name: 'Netherlands',
    best_months: [4, 5, 6, 9],
    temp_range: '12-22°C',
    avoid_months: [11, 12, 1],
    region: 'Europe',
    description: 'Spring tulips and mild summer weather. Avoid cold, rainy winter. Canals, windmills, and world-class museums.'
  },
  {
    country_name: 'Belgium',
    best_months: [5, 6, 7, 8, 9],
    temp_range: '15-23°C',
    avoid_months: [11, 12, 1],
    region: 'Europe',
    description: 'Comfortable summer weather for city exploration. Medieval towns, chocolate, and exceptional beer culture.'
  },
  {
    country_name: 'Czech Republic',
    best_months: [5, 6, 9, 10],
    temp_range: '15-25°C',
    avoid_months: [12, 1, 2],
    region: 'Europe',
    description: 'Pleasant weather for Prague and countryside. Avoid cold winter. Fairy-tale castles, historic cities, and excellent beer.'
  },
  {
    country_name: 'Poland',
    best_months: [5, 6, 7, 8, 9],
    temp_range: '15-25°C',
    avoid_months: [12, 1, 2],
    region: 'Europe',
    description: 'Warm summer months best for sightseeing. Rich history, medieval architecture, and hearty cuisine.'
  },
  {
    country_name: 'Croatia',
    best_months: [5, 6, 9, 10],
    temp_range: 'Warm (20-28°C)',
    avoid_months: [7, 8],
    region: 'Europe',
    description: 'Shoulder seasons offer great weather without peak crowds. Stunning Adriatic coast, historic cities, and island hopping.'
  },
  {
    country_name: 'Ireland',
    best_months: [5, 6, 7, 8, 9],
    temp_range: 'Cold (12-18°C)',
    avoid_months: [11, 12, 1],
    region: 'Europe',
    description: 'Mild summer with long days. Rain possible year-round. Emerald landscapes, friendly pubs, and Celtic heritage.'
  },
  {
    country_name: 'Scotland',
    best_months: [5, 6, 7, 8, 9],
    temp_range: 'Cold (12-18°C)',
    avoid_months: [11, 12, 1, 2],
    region: 'Europe',
    description: 'Summer offers best weather for Highlands exploration. Dramatic landscapes, historic castles, and whisky distilleries.'
  },
  {
    country_name: 'Denmark',
    best_months: [6, 7, 8],
    temp_range: 'Cold (15-22°C)',
    avoid_months: [11, 12, 1, 2],
    region: 'Europe',
    description: 'Short but pleasant summer season. Hygge culture, Viking history, and modern design.'
  },
  {
    country_name: 'Finland',
    best_months: [6, 7, 8, 12, 1, 2],
    temp_range: 'Cold (5-20°C)',
    avoid_months: [11],
    region: 'Europe',
    description: 'Summer for midnight sun, winter for Northern Lights and snow activities. Pristine nature and sauna culture.'
  },
  {
    country_name: 'Hungary',
    best_months: [4, 5, 6, 9, 10],
    temp_range: '15-26°C',
    avoid_months: [7, 8, 12, 1],
    region: 'Europe',
    description: 'Pleasant spring and fall weather. Avoid summer heat and winter cold. Thermal baths, historic Budapest, and wine regions.'
  },
  {
    country_name: 'Turkey',
    best_months: [4, 5, 6, 9, 10],
    temp_range: 'Warm (18-28°C)',
    avoid_months: [7, 8],
    region: 'Europe',
    description: 'Ideal for exploring Istanbul and coastal regions. Avoid peak summer heat. Bridge between East and West with rich history.'
  },

  // Americas
  {
    country_name: 'United States',
    best_months: [4, 5, 6, 9, 10],
    temp_range: '15-28°C',
    avoid_months: [7, 8],
    region: 'Americas',
    description: 'Varies by region; spring and fall generally pleasant nationwide. Diverse landscapes from coast to coast.'
  },
  {
    country_name: 'Canada',
    best_months: [6, 7, 8, 9],
    temp_range: 'Cold (15-25°C)',
    avoid_months: [12, 1, 2],
    region: 'Americas',
    description: 'Summer offers warmest weather for outdoor activities. Winter for skiing. Vast wilderness and multicultural cities.'
  },
  {
    country_name: 'Mexico',
    best_months: [11, 12, 1, 2, 3, 4],
    temp_range: 'Warm (20-30°C)',
    avoid_months: [6, 7, 8, 9],
    region: 'Americas',
    description: 'Dry season perfect for beaches and cultural sites. Avoid hurricane season. Ancient ruins, vibrant culture, and beautiful coasts.'
  },
  {
    country_name: 'Costa Rica',
    best_months: [12, 1, 2, 3, 4],
    temp_range: 'Warm (22-30°C)',
    avoid_months: [5, 6, 9, 10],
    region: 'Americas',
    description: 'Dry season ideal for wildlife and adventure activities. Biodiversity hotspot with rainforests and beaches.'
  },
  {
    country_name: 'Peru',
    best_months: [5, 6, 7, 8, 9],
    temp_range: '10-20°C',
    avoid_months: [1, 2, 3],
    region: 'Americas',
    description: 'Dry season perfect for Machu Picchu and Andes trekking. Ancient Incan heritage and diverse ecosystems.'
  },
  {
    country_name: 'Argentina',
    best_months: [10, 11, 12, 1, 2, 3],
    temp_range: '15-28°C',
    avoid_months: [6, 7, 8],
    region: 'Americas',
    description: 'Summer in Southern Hemisphere. Great for Patagonia and wine regions. Tango, steaks, and dramatic landscapes.'
  },
  {
    country_name: 'Chile',
    best_months: [10, 11, 12, 1, 2, 3],
    temp_range: '15-28°C',
    avoid_months: [6, 7, 8],
    region: 'Americas',
    description: 'Summer season ideal for diverse regions from desert to glaciers. Long, narrow country with incredible variety.'
  },
  {
    country_name: 'Brazil',
    best_months: [5, 6, 7, 8, 9],
    temp_range: 'Warm (20-28°C)',
    avoid_months: [12, 1, 2],
    region: 'Americas',
    description: 'Dry season for Amazon and Pantanal. Avoid summer heat and rain. Carnival, beaches, and rainforest adventures.'
  },
  {
    country_name: 'Colombia',
    best_months: [12, 1, 2, 3, 7, 8],
    temp_range: 'Warm (18-28°C)',
    avoid_months: [4, 5, 10, 11],
    region: 'Americas',
    description: 'Dry seasons vary by region. Coffee culture, colonial cities, and Caribbean coast.'
  },
  {
    country_name: 'Ecuador',
    best_months: [6, 7, 8, 9],
    temp_range: '15-25°C',
    avoid_months: [1, 2, 3, 4],
    region: 'Americas',
    description: 'Dry season in highlands and Amazon. Galapagos year-round. Biodiversity and indigenous culture.'
  },
  {
    country_name: 'Cuba',
    best_months: [11, 12, 1, 2, 3, 4],
    temp_range: 'Warm (22-28°C)',
    avoid_months: [6, 7, 8, 9, 10],
    region: 'Americas',
    description: 'Dry season avoids hurricanes. Classic cars, salsa music, and colonial architecture.'
  },
  {
    country_name: 'Jamaica',
    best_months: [12, 1, 2, 3, 4],
    temp_range: 'Warm (24-30°C)',
    avoid_months: [6, 7, 8, 9, 10],
    region: 'Americas',
    description: 'Dry season perfect for beaches. Avoid hurricane season. Reggae culture, jerk cuisine, and tropical paradise.'
  },
  {
    country_name: 'Belize',
    best_months: [11, 12, 1, 2, 3, 4],
    temp_range: 'Warm (24-30°C)',
    avoid_months: [6, 7, 8, 9],
    region: 'Americas',
    description: 'Dry season ideal for diving and Mayan ruins. Barrier reef and jungle adventures.'
  },

  // Africa
  {
    country_name: 'Morocco',
    best_months: [3, 4, 5, 9, 10, 11],
    temp_range: 'Warm (20-30°C)',
    avoid_months: [7, 8],
    region: 'Africa',
    description: 'Pleasant spring and fall weather. Summer heat can be extreme, especially inland. Souks, deserts, and coastal cities.'
  },
  {
    country_name: 'Egypt',
    best_months: [10, 11, 12, 1, 2, 3],
    temp_range: 'Warm (15-25°C)',
    avoid_months: [6, 7, 8],
    region: 'Africa',
    description: 'Cooler months ideal for pyramids and Nile cruises. Avoid extreme summer heat. Ancient wonders and Red Sea diving.'
  },
  {
    country_name: 'South Africa',
    best_months: [3, 4, 5, 9, 10, 11],
    temp_range: '15-25°C',
    avoid_months: [6, 7, 8],
    region: 'Africa',
    description: 'Autumn and spring offer great weather. Winter for safari (better wildlife viewing). Diverse landscapes and wildlife.'
  },
  {
    country_name: 'Kenya',
    best_months: [1, 2, 6, 7, 8, 9, 10],
    temp_range: 'Warm (20-28°C)',
    avoid_months: [4, 5, 11],
    region: 'Africa',
    description: 'Dry seasons best for safari and Great Migration. Incredible wildlife and Maasai culture.'
  },
  {
    country_name: 'Tanzania',
    best_months: [6, 7, 8, 9, 10, 1, 2],
    temp_range: 'Warm (20-30°C)',
    avoid_months: [3, 4, 5],
    region: 'Africa',
    description: 'Dry season perfect for Serengeti and Kilimanjaro. Safari paradise and pristine beaches.'
  },
  {
    country_name: 'Botswana',
    best_months: [5, 6, 7, 8, 9, 10],
    temp_range: '15-28°C',
    avoid_months: [12, 1, 2],
    region: 'Africa',
    description: 'Dry winter months best for Okavango Delta safari. Luxury safari experiences and abundant wildlife.'
  },
  {
    country_name: 'Namibia',
    best_months: [5, 6, 7, 8, 9, 10],
    temp_range: '15-28°C',
    avoid_months: [12, 1, 2],
    region: 'Africa',
    description: 'Cooler dry season ideal for desert landscapes and wildlife. Dramatic dunes and starry skies.'
  },
  {
    country_name: 'Madagascar',
    best_months: [4, 5, 6, 7, 8, 9, 10],
    temp_range: 'Warm (20-28°C)',
    avoid_months: [1, 2, 3],
    region: 'Africa',
    description: 'Dry season best for unique wildlife and beaches. Avoid cyclone season. Lemurs and biodiversity hotspot.'
  },
  {
    country_name: 'Seychelles',
    best_months: [4, 5, 10, 11],
    temp_range: 'Warm (26-30°C)',
    avoid_months: [12, 1],
    region: 'Africa',
    description: 'Shoulder seasons offer calm seas and good weather. Pristine beaches and luxury island resorts.'
  },
  {
    country_name: 'Mauritius',
    best_months: [5, 6, 7, 8, 9, 10, 11],
    temp_range: 'Warm (22-28°C)',
    avoid_months: [1, 2, 3],
    region: 'Africa',
    description: 'Dry winter season ideal for beaches and water sports. Tropical paradise with multicultural influences.'
  },
  {
    country_name: 'Tunisia',
    best_months: [3, 4, 5, 9, 10, 11],
    temp_range: 'Warm (18-28°C)',
    avoid_months: [7, 8],
    region: 'Africa',
    description: 'Spring and fall perfect for ancient ruins and Sahara. Mediterranean beaches and Roman heritage.'
  },
  // Oceania
  {
    country_name: 'Australia',
    best_months: [3, 4, 5, 9, 10, 11],
    temp_range: '18-28°C',
    avoid_months: [12, 1, 2],
    region: 'Oceania',
    description: 'Autumn and spring offer comfortable weather nationwide. Avoid summer heat. Diverse landscapes from reef to outback.'
  },
  {
    country_name: 'New Zealand',
    best_months: [11, 12, 1, 2, 3],
    temp_range: '15-25°C',
    avoid_months: [6, 7, 8],
    region: 'Oceania',
    description: 'Summer perfect for outdoor adventures. Winter for skiing. Stunning scenery and adventure activities.'
  },
  {
    country_name: 'Fiji',
    best_months: [5, 6, 7, 8, 9, 10],
    temp_range: 'Warm (23-28°C)',
    avoid_months: [12, 1, 2, 3],
    region: 'Oceania',
    description: 'Dry season ideal for island hopping and diving. Avoid cyclone season. Tropical paradise with friendly locals.'
  },
  {
    country_name: 'French Polynesia',
    best_months: [5, 6, 7, 8, 9, 10],
    temp_range: 'Warm (24-29°C)',
    avoid_months: [12, 1, 2],
    region: 'Oceania',
    description: 'Dry season perfect for Tahiti and Bora Bora. Overwater bungalows and turquoise lagoons.'
  },
  {
    country_name: 'Cook Islands',
    best_months: [4, 5, 6, 7, 8, 9, 10],
    temp_range: 'Warm (23-28°C)',
    avoid_months: [12, 1, 2],
    region: 'Oceania',
    description: 'Dry season offers best weather for beaches. Avoid wet season. Unspoiled Pacific paradise.'
  },

  // Middle East
  {
    country_name: 'United Arab Emirates',
    best_months: [11, 12, 1, 2, 3],
    temp_range: 'Warm (20-30°C)',
    avoid_months: [6, 7, 8],
    region: 'Middle East',
    description: 'Cooler months ideal for Dubai and Abu Dhabi. Avoid extreme summer heat. Modern luxury and desert adventures.'
  },
  {
    country_name: 'Jordan',
    best_months: [3, 4, 5, 9, 10, 11],
    temp_range: 'Warm (18-28°C)',
    avoid_months: [6, 7, 8],
    region: 'Middle East',
    description: 'Spring and fall perfect for Petra and Wadi Rum. Ancient wonders and desert landscapes.'
  },
  {
    country_name: 'Oman',
    best_months: [10, 11, 12, 1, 2, 3],
    temp_range: 'Warm (20-30°C)',
    avoid_months: [5, 6, 7, 8],
    region: 'Middle East',
    description: 'Cooler months ideal for exploring deserts and coasts. Avoid summer heat. Traditional culture and dramatic landscapes.'
  },
  {
    country_name: 'Israel',
    best_months: [3, 4, 5, 9, 10, 11],
    temp_range: 'Warm (18-28°C)',
    avoid_months: [7, 8],
    region: 'Middle East',
    description: 'Spring and fall offer pleasant weather. Avoid peak summer heat. Ancient history and diverse landscapes.'
  },

  // Additional Asia
  {
    country_name: 'Bhutan',
    best_months: [3, 4, 5, 9, 10, 11],
    temp_range: '10-20°C',
    avoid_months: [6, 7, 8],
    region: 'Asia',
    description: 'Clear skies perfect for Himalayan views and festivals. Avoid monsoon. Happiness kingdom with pristine nature.'
  },
  {
    country_name: 'Laos',
    best_months: [11, 12, 1, 2],
    temp_range: 'Warm (20-30°C)',
    avoid_months: [5, 6, 7, 8, 9],
    region: 'Asia',
    description: 'Cool, dry season ideal for temples and Mekong River. Avoid monsoon. Laid-back culture and natural beauty.'
  },
  {
    country_name: 'Myanmar',
    best_months: [11, 12, 1, 2],
    temp_range: 'Warm (20-30°C)',
    avoid_months: [5, 6, 7, 8, 9],
    region: 'Asia',
    description: 'Cool season perfect for Bagan and Inle Lake. Avoid hot and rainy seasons. Golden pagodas and emerging destination.'
  },
  {
    country_name: 'Mongolia',
    best_months: [6, 7, 8, 9],
    temp_range: 'Cold (10-25°C)',
    avoid_months: [11, 12, 1, 2],
    region: 'Asia',
    description: 'Summer offers warmest weather for nomadic culture and Gobi Desert. Avoid harsh winter. Vast steppes and traditional lifestyle.'
  },

  // Additional Europe
  {
    country_name: 'Romania',
    best_months: [5, 6, 9, 10],
    temp_range: '15-25°C',
    avoid_months: [12, 1, 2],
    region: 'Europe',
    description: 'Pleasant weather for Transylvania and countryside. Medieval castles, Dracula legends, and Carpathian Mountains.'
  },
  {
    country_name: 'Bulgaria',
    best_months: [5, 6, 9, 10],
    temp_range: '18-28°C',
    avoid_months: [12, 1, 2],
    region: 'Europe',
    description: 'Warm summer and pleasant fall. Black Sea coast and mountain monasteries. Affordable and authentic.'
  },
  {
    country_name: 'Slovenia',
    best_months: [5, 6, 9, 10],
    temp_range: '15-25°C',
    avoid_months: [12, 1, 2],
    region: 'Europe',
    description: 'Ideal for Lake Bled and Ljubljana. Alpine beauty and charming capital.'
  },
  {
    country_name: 'Estonia',
    best_months: [6, 7, 8],
    temp_range: 'Cold (15-22°C)',
    avoid_months: [11, 12, 1, 2],
    region: 'Europe',
    description: 'Short summer season with long days. Medieval Tallinn and digital innovation.'
  },
  {
    country_name: 'Malta',
    best_months: [4, 5, 6, 9, 10],
    temp_range: 'Warm (20-28°C)',
    avoid_months: [7, 8],
    region: 'Europe',
    description: 'Pleasant weather for historic sites and beaches. Avoid peak summer heat. Ancient temples and Mediterranean charm.'
  },

  // Additional Americas
  {
    country_name: 'Panama',
    best_months: [12, 1, 2, 3],
    temp_range: 'Warm (24-32°C)',
    avoid_months: [5, 6, 9, 10],
    region: 'Americas',
    description: 'Dry season perfect for canal and beaches. Avoid rainy season. Biodiversity and modern capital.'
  },
  {
    country_name: 'Guatemala',
    best_months: [11, 12, 1, 2, 3, 4],
    temp_range: 'Warm (18-28°C)',
    avoid_months: [6, 7, 8, 9],
    region: 'Americas',
    description: 'Dry season ideal for Mayan ruins and Lake Atitlan. Colonial cities and indigenous culture.'
  },
  {
    country_name: 'Bolivia',
    best_months: [5, 6, 7, 8, 9],
    temp_range: '10-20°C',
    avoid_months: [12, 1, 2],
    region: 'Americas',
    description: 'Dry season perfect for Uyuni Salt Flats and La Paz. Avoid rainy season. High-altitude adventures.'
  },
  {
    country_name: 'Uruguay',
    best_months: [11, 12, 1, 2, 3],
    temp_range: '20-28°C',
    avoid_months: [6, 7, 8],
    region: 'Americas',
    description: 'Summer season ideal for beaches and Montevideo. Relaxed culture and wine regions.'
  },
  // Additional Africa
  {
    country_name: 'Rwanda',
    best_months: [6, 7, 8, 9, 12, 1, 2],
    temp_range: '15-27°C',
    avoid_months: [3, 4, 5],
    region: 'Africa',
    description: 'Dry seasons best for gorilla trekking. Avoid long rainy season. Mountain gorillas and remarkable recovery.'
  },
  {
    country_name: 'Uganda',
    best_months: [6, 7, 8, 9, 12, 1, 2],
    temp_range: '20-28°C',
    avoid_months: [3, 4, 5],
    region: 'Africa',
    description: 'Dry seasons ideal for wildlife and gorilla tracking. Pearl of Africa with diverse ecosystems.'
  },
  {
    country_name: 'Zambia',
    best_months: [5, 6, 7, 8, 9, 10],
    temp_range: '15-28°C',
    avoid_months: [12, 1, 2, 3],
    region: 'Africa',
    description: 'Dry season perfect for Victoria Falls and safari. Avoid rainy season. Walking safaris and natural wonders.'
  },
  {
    country_name: 'Zimbabwe',
    best_months: [5, 6, 7, 8, 9, 10],
    temp_range: '15-28°C',
    avoid_months: [12, 1, 2],
    region: 'Africa',
    description: 'Dry winter months best for Victoria Falls and wildlife. Ancient ruins and dramatic landscapes.'
  },

  // Additional Middle East
  {
    country_name: 'Qatar',
    best_months: [11, 12, 1, 2, 3],
    temp_range: 'Warm (20-28°C)',
    avoid_months: [6, 7, 8],
    region: 'Middle East',
    description: 'Cooler months ideal for Doha exploration. Avoid extreme summer heat. Modern architecture and desert culture.'
  },

  // Additional Oceania
  {
    country_name: 'Vanuatu',
    best_months: [5, 6, 7, 8, 9, 10],
    temp_range: 'Warm (23-28°C)',
    avoid_months: [12, 1, 2, 3],
    region: 'Oceania',
    description: 'Dry season perfect for island adventures. Avoid cyclone season. Active volcanoes and pristine beaches.'
  },
  {
    country_name: 'Samoa',
    best_months: [5, 6, 7, 8, 9, 10],
    temp_range: 'Warm (24-29°C)',
    avoid_months: [12, 1, 2],
    region: 'Oceania',
    description: 'Dry season ideal for beaches and culture. Traditional Polynesian lifestyle and natural beauty.'
  }
];

/**
 * Validates a single country record
 */
export function validateCountryData(country: CountrySeedData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate country_name
  if (!country.country_name || country.country_name.trim().length === 0) {
    errors.push('country_name is required and cannot be empty');
  }

  // Validate best_months
  if (!Array.isArray(country.best_months) || country.best_months.length === 0) {
    errors.push('best_months must be a non-empty array');
  } else {
    const invalidMonths = country.best_months.filter(m => m < 1 || m > 12);
    if (invalidMonths.length > 0) {
      errors.push(`best_months contains invalid values: ${invalidMonths.join(', ')} (must be 1-12)`);
    }
  }

  // Validate temp_range
  if (!country.temp_range || country.temp_range.trim().length === 0) {
    errors.push('temp_range is required and cannot be empty');
  }

  // Validate avoid_months
  if (!Array.isArray(country.avoid_months)) {
    errors.push('avoid_months must be an array (can be empty)');
  } else {
    const invalidMonths = country.avoid_months.filter(m => m < 1 || m > 12);
    if (invalidMonths.length > 0) {
      errors.push(`avoid_months contains invalid values: ${invalidMonths.join(', ')} (must be 1-12)`);
    }
  }

  // Validate region
  const validRegions = ['Asia', 'Europe', 'Americas', 'Africa', 'Oceania', 'Middle East'];
  if (!validRegions.includes(country.region)) {
    errors.push(`region must be one of: ${validRegions.join(', ')}`);
  }

  // Validate description
  if (!country.description || country.description.trim().length === 0) {
    errors.push('description is required and cannot be empty');
  } else if (country.description.length < 50) {
    errors.push('description should be at least 50 characters');
  }

  // Check for overlap between best_months and avoid_months
  const overlap = country.best_months.filter(m => country.avoid_months.includes(m));
  if (overlap.length > 0) {
    errors.push(`best_months and avoid_months should not overlap. Found: ${overlap.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates all seed data
 */
export function validateAllCountries(): { valid: boolean; totalErrors: number; details: Array<{ country: string; errors: string[] }> } {
  const details: Array<{ country: string; errors: string[] }> = [];
  let totalErrors = 0;

  seedCountries.forEach(country => {
    const result = validateCountryData(country);
    if (!result.valid) {
      details.push({
        country: country.country_name,
        errors: result.errors
      });
      totalErrors += result.errors.length;
    }
  });

  return {
    valid: totalErrors === 0,
    totalErrors,
    details
  };
}

/**
 * Get summary statistics about the seed data
 */
export function getSeedDataStats() {
  const regionCounts: Record<string, number> = {};
  let totalBestMonths = 0;
  let totalAvoidMonths = 0;

  seedCountries.forEach(country => {
    regionCounts[country.region] = (regionCounts[country.region] || 0) + 1;
    totalBestMonths += country.best_months.length;
    totalAvoidMonths += country.avoid_months.length;
  });

  return {
    totalCountries: seedCountries.length,
    regionCounts,
    avgBestMonths: (totalBestMonths / seedCountries.length).toFixed(1),
    avgAvoidMonths: (totalAvoidMonths / seedCountries.length).toFixed(1)
  };
}

/**
 * Main execution function for seeding the database
 * This function is called when the script is run directly
 */
import { pool } from '../config/database.js';

export async function seedDatabase(): Promise<void> {
  console.log('🌍 Starting country recommendations database seeding...\n');

  // Validate all data before attempting to insert
  console.log('📋 Validating seed data...');
  const validation = validateAllCountries();
  
  if (!validation.valid) {
    console.error('❌ Validation failed with', validation.totalErrors, 'errors:');
    validation.details.forEach(({ country, errors }) => {
      console.error(`  ${country}:`);
      errors.forEach(error => console.error(`    - ${error}`));
    });
    throw new Error('Seed data validation failed');
  }
  
  console.log('✅ All seed data validated successfully\n');

  // Display statistics
  const stats = getSeedDataStats();
  console.log('📊 Seed data statistics:');
  console.log(`  Total countries: ${stats.totalCountries}`);
  console.log(`  Average best months per country: ${stats.avgBestMonths}`);
  console.log(`  Average avoid months per country: ${stats.avgAvoidMonths}`);
  console.log('  Countries by region:');
  Object.entries(stats.regionCounts).forEach(([region, count]) => {
    console.log(`    ${region}: ${count}`);
  });
  console.log('');

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const errors: Array<{ country: string; error: string }> = [];

  try {
    // Process each country
    for (const country of seedCountries) {
      try {
        // Check if country already exists
        const existingResult = await pool.query(
          'SELECT id FROM countries WHERE country_name = $1',
          [country.country_name]
        );

        if (existingResult.rows.length > 0) {
          // Update existing record
          await pool.query(
            `UPDATE countries 
             SET best_months = $1, 
                 temp_range = $2, 
                 avoid_months = $3, 
                 region = $4, 
                 description = $5,
                 updated_at = CURRENT_TIMESTAMP
             WHERE country_name = $6`,
            [
              country.best_months,
              country.temp_range,
              country.avoid_months,
              country.region,
              country.description,
              country.country_name
            ]
          );
          updated++;
          console.log(`  ✏️  Updated: ${country.country_name}`);
        } else {
          // Insert new record
          await pool.query(
            `INSERT INTO countries (country_name, best_months, temp_range, avoid_months, region, description)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              country.country_name,
              country.best_months,
              country.temp_range,
              country.avoid_months,
              country.region,
              country.description
            ]
          );
          inserted++;
          console.log(`  ➕ Inserted: ${country.country_name}`);
        }
      } catch (error) {
        // Log error but continue with other countries
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ country: country.country_name, error: errorMessage });
        skipped++;
        console.error(`  ❌ Error processing ${country.country_name}: ${errorMessage}`);
      }
    }

    // Display summary
    console.log('\n📈 Seeding Summary:');
    console.log(`  ✅ Inserted: ${inserted}`);
    console.log(`  ✏️  Updated: ${updated}`);
    if (skipped > 0) {
      console.log(`  ⚠️  Skipped (errors): ${skipped}`);
    }
    console.log(`  📊 Total processed: ${inserted + updated + skipped}`);

    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errors.forEach(({ country, error }) => {
        console.log(`  ${country}: ${error}`);
      });
    }

    if (skipped === 0) {
      console.log('\n🎉 Database seeding completed successfully!');
    } else {
      console.log('\n⚠️  Database seeding completed with some errors.');
    }

  } catch (error) {
    console.error('\n❌ Fatal error during seeding:', error);
    throw error;
  }
}

// Run the seeding if this script is executed directly
// This check is wrapped in a function to avoid issues with import.meta in tests
export function runSeedingIfMain() {
  // Check if this is the main module being executed
  const isMain = process.argv[1] && process.argv[1].endsWith('seedCountries.ts');
  
  if (isMain) {
    seedDatabase()
      .then(() => {
        console.log('\n✅ Seeding process finished');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n❌ Seeding process failed:', error);
        process.exit(1);
      });
  }
}

// Execute if this is the main module
runSeedingIfMain();
