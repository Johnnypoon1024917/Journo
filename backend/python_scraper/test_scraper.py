#!/usr/bin/env python3
"""
Simple test scraper to verify database connection and basic functionality
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

def test_database_connection():
    """Test database connection"""
    try:
        db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'journo_db'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'postgres')
        }
        
        print(f"🔗 Connecting to database: {db_config['database']} at {db_config['host']}:{db_config['port']}")
        
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Test query
        cursor.execute("SELECT COUNT(*) as count FROM place_database")
        result = cursor.fetchone()
        
        print(f"✅ Database connection successful!")
        print(f"📊 Current places in database: {result['count']}")
        
        
        insert_query = """
            INSERT INTO place_database (
                name, description, city, country, place_type, category,
                rating, review_count, source, popularity_score, last_updated
            ) VALUES (
                %(name)s, %(description)s, %(city)s, %(country)s, %(place_type)s,
                %(category)s, %(rating)s, %(review_count)s, %(source)s,
                %(popularity_score)s, %(last_updated)s
            )
            ON CONFLICT (source, source_id, city, country) DO NOTHING
            RETURNING id
        """
        
        # Add source_id for conflict resolution
        test_place['source_id'] = f"{test_place['name']}_{test_place['city']}".replace(' ', '_').lower()
        
        cursor.execute(insert_query, test_place)
        result = cursor.fetchone()
        
        if result:
            print(f"✅ Test place inserted with ID: {result['id']}")
        else:
            print("ℹ️  Test place already exists (conflict avoided)")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def add_sample_places():
    """Add some sample places to test the system"""
    try:
        db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'journo_db'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'postgres')
        }
        
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        sample_places = [
            {
                'name': 'Senso-ji Temple',
                'description': 'Ancient Buddhist temple in Asakusa district',
                'city': 'Tokyo',
                'country': 'Japan',
                'place_type': 'temple',
                'category': 'culture',
                'rating': 4.3,
                'review_count': 15420,
                'source': 'sample_data',
                'source_id': 'sensoji_temple_tokyo',
                'popularity_score': 92
            },
            {
                'name': 'Tokyo Skytree',
                'description': 'Tallest structure in Japan with panoramic city views',
                'city': 'Tokyo',
                'country': 'Japan',
                'place_type': 'observation_deck',
                'category': 'attractions',
                'rating': 4.1,
                'review_count': 8930,
                'source': 'sample_data',
                'source_id': 'tokyo_skytree_tokyo',
                'popularity_score': 88
            },
            {
                'name': 'Tsukiji Outer Market',
                'description': 'Famous fish market with fresh sushi and street food',
                'city': 'Tokyo',
                'country': 'Japan',
                'place_type': 'market',
                'category': 'food',
                'rating': 4.2,
                'review_count': 5670,
                'source': 'sample_data',
                'source_id': 'tsukiji_market_tokyo',
                'popularity_score': 85
            },
            {
                'name': 'Meiji Shrine',
                'description': 'Peaceful Shinto shrine surrounded by forest',
                'city': 'Tokyo',
                'country': 'Japan',
                'place_type': 'shrine',
                'category': 'culture',
                'rating': 4.4,
                'review_count': 12340,
                'source': 'sample_data',
                'source_id': 'meiji_shrine_tokyo',
                'popularity_score': 90
            },
            {
                'name': 'Shibuya Crossing',
                'description': 'World\'s busiest pedestrian crossing',
                'city': 'Tokyo',
                'country': 'Japan',
                'place_type': 'landmark',
                'category': 'attractions',
                'rating': 4.0,
                'review_count': 7890,
                'source': 'sample_data',
                'source_id': 'shibuya_crossing_tokyo',
                'popularity_score': 87
            }
        ]
        
        for place in sample_places:
            insert_query = """
                INSERT INTO place_database (
                    name, description, city, country, place_type, category,
                    rating, review_count, source, source_id, popularity_score, last_updated
                ) VALUES (
                    %(name)s, %(description)s, %(city)s, %(country)s, %(place_type)s,
                    %(category)s, %(rating)s, %(review_count)s, %(source)s,
                    %(source_id)s, %(popularity_score)s, NOW()
                )
                ON CONFLICT (source, source_id, city, country) DO UPDATE SET
                    rating = EXCLUDED.rating,
                    review_count = EXCLUDED.review_count,
                    popularity_score = EXCLUDED.popularity_score,
                    last_updated = NOW()
            """
            
            cursor.execute(insert_query, place)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Added {len(sample_places)} sample places to database")
        return True
        
    except Exception as e:
        print(f"❌ Error adding sample places: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing Python Scraper Database Connection")
    print("=" * 50)
    
    # Test database connection
    if test_database_connection():
        print("\n🎯 Adding sample places...")
        add_sample_places()
        
        print("\n✅ Test completed successfully!")
        print("\nYou can now test the Quick Plan feature with Tokyo, Japan")
        print("The sample places should appear in the results.")
    else:
        print("\n❌ Test failed. Please check your database configuration.")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())