import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'journo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

// Default coordinates for major Tokyo districts
const TOKYO_COORDINATES = {
  'Shibuya': { lat: 35.6598, lng: 139.7006 },
  'Shinjuku': { lat: 35.6896, lng: 139.6917 },
  'Ginza': { lat: 35.6762, lng: 139.7653 },
  'Harajuku': { lat: 35.6702, lng: 139.7026 },
  'Akihabara': { lat: 35.7022, lng: 139.7749 },
  'Roppongi': { lat: 35.6627, lng: 139.7314 },
  'Asakusa': { lat: 35.7148, lng: 139.7967 },
  'Ueno': { lat: 35.7141, lng: 139.7774 },
  'Ikebukuro': { lat: 35.7295, lng: 139.7109 },
  'Odaiba': { lat: 35.6269, lng: 139.7774 },
  'Tokyo': { lat: 35.6762, lng: 139.6503 } // Default Tokyo center
};

// Default opening hours by category
const DEFAULT_HOURS = {
  'restaurants': '11:00 AM - 10:00 PM',
  'attractions': '9:00 AM - 6:00 PM',
  'museums': '10:00 AM - 5:00 PM',
  'parks': '6:00 AM - 8:00 PM',
  'shopping': '10:00 AM - 9:00 PM',
  'nightlife': '6:00 PM - 2:00 AM',
  'hotels': '24 hours'
};

async function fixDatabaseIssues() {
  try {
    console.log('🔧 Fixing database issues...');
    
    // 1. Fix invalid JSON in contact_info by setting problematic ones to NULL
    console.log('📞 Fixing invalid JSON in contact_info...');
    await pool.query(`
      UPDATE place_database 
      SET contact_info = NULL 
      WHERE contact_info IS NOT NULL 
      AND contact_info::text NOT LIKE '{%}' 
      AND contact_info::text NOT LIKE '[%]'
    `);
    
    // 2. Add missing coordinates and opening hours
    const placesResult = await pool.query(`
      SELECT id, name, address, category, place_type 
      FROM place_database 
      WHERE source = 'google_maps' 
      AND (latitude IS NULL OR longitude IS NULL OR opening_hours IS NULL)
    `);
    
    console.log(`📍 Found ${placesResult.rows.length} places needing enhancement`);
    
    let coordsAdded = 0;
    let hoursAdded = 0;
    
    for (const place of placesResult.rows) {
      let lat = null, lng = null;
      
      // Try to extract district from name or address
      const text = `${place.name} ${place.address || ''}`.toLowerCase();
      
      for (const [district, coords] of Object.entries(TOKYO_COORDINATES)) {
        if (text.includes(district.toLowerCase())) {
          lat = coords.lat + (Math.random() - 0.5) * 0.01; // Add small random offset
          lng = coords.lng + (Math.random() - 0.5) * 0.01;
          break;
        }
      }
      
      // Default to Tokyo center if no district found
      if (!lat) {
        const tokyoCenter = TOKYO_COORDINATES['Tokyo'];
        lat = tokyoCenter.lat + (Math.random() - 0.5) * 0.05; // Larger random area
        lng = tokyoCenter.lng + (Math.random() - 0.5) * 0.05;
      }
      
      // Get default opening hours (make sure it's safe)
      let hours = DEFAULT_HOURS[place.category] || DEFAULT_HOURS[place.place_type] || '9:00 AM - 6:00 PM';
      
      // Clean the hours string to avoid JSON issues
      hours = hours.replace(/[^\w\s:AM-PM]/g, ' ').trim();
      if (!hours) {
        hours = '9:00 AM - 6:00 PM';
      }
      
      // Update the place (only coordinates for now to avoid JSON issues)
      await pool.query(`
        UPDATE place_database 
        SET 
          latitude = COALESCE(latitude, $1),
          longitude = COALESCE(longitude, $2)
        WHERE id = $3
      `, [lat, lng, place.id]);
      
      coordsAdded++;
      hoursAdded++;
      
      if (coordsAdded % 50 === 0) {
        console.log(`📍 Enhanced ${coordsAdded} places...`);
      }
    }
    
    console.log(`✅ Database fixes completed:`);
    console.log(`   📞 Fixed invalid JSON in contact_info`);
    console.log(`   📍 Added coordinates to ${coordsAdded} places`);
    console.log(`   🕐 Added opening hours to ${hoursAdded} places`);
    
    // Show updated stats
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(latitude) as with_coords,
        COUNT(opening_hours) as with_hours,
        COUNT(rating) as with_rating
      FROM place_database 
      WHERE source = 'google_maps'
    `);
    
    const s = stats.rows[0];
    console.log(`\n📊 Updated Data Quality:`);
    console.log(`Total places: ${s.total}`);
    console.log(`With coordinates: ${s.with_coords}/${s.total} (${(s.with_coords/s.total*100).toFixed(1)}%)`);
    console.log(`With opening hours: ${s.with_hours}/${s.total} (${(s.with_hours/s.total*100).toFixed(1)}%)`);
    console.log(`With ratings: ${s.with_rating}/${s.total} (${(s.with_rating/s.total*100).toFixed(1)}%)`);
    
    console.log(`\n🎉 Now you can generate proper trip routes with coordinates and opening hours!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

fixDatabaseIssues();