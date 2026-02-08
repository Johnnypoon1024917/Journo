#!/usr/bin/env python3
"""
Test script to verify enhanced scraper extracts coordinates and opening hours
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scraper import PlaceScraper

def test_enhanced_extraction():
    """Test the enhanced scraper with a small sample"""
    print("🧪 Testing Enhanced Scraper")
    print("=" * 50)
    
    scraper = PlaceScraper(use_frontend=True)
    
    if not scraper.setup_driver():
        print("❌ Failed to setup driver")
        return
    
    try:
        # Test with a single focused query
        print("🔍 Testing with 'attractions Tokyo, Japan'...")
        places = scraper.scrape_google_maps('Tokyo', 'Japan', 'attractions')
        
        print(f"\n📊 Results Summary:")
        print(f"Total places found: {len(places)}")
        
        # Analyze data quality
        with_coords = sum(1 for p in places if p.get('latitude') and p.get('longitude'))
        with_hours = sum(1 for p in places if p.get('opening_hours'))
        with_rating = sum(1 for p in places if p.get('rating'))
        
        print(f"Places with coordinates: {with_coords}/{len(places)} ({with_coords/len(places)*100:.1f}%)")
        print(f"Places with opening hours: {with_hours}/{len(places)} ({with_hours/len(places)*100:.1f}%)")
        print(f"Places with ratings: {with_rating}/{len(places)} ({with_rating/len(places)*100:.1f}%)")
        
        # Show sample places
        print(f"\n📋 Sample Places:")
        for i, place in enumerate(places[:5]):
            print(f"\n{i+1}. {place['name']}")
            print(f"   📍 Coordinates: {place.get('latitude', 'N/A')}, {place.get('longitude', 'N/A')}")
            print(f"   🕐 Hours: {place.get('opening_hours', 'N/A')}")
            print(f"   ⭐ Rating: {place.get('rating', 'N/A')} ({place.get('review_count', 0)} reviews)")
            print(f"   📍 Address: {place.get('address', 'N/A')}")
        
        # Store in database to test
        if places:
            print(f"\n💾 Testing database storage...")
            scraper.store_places_in_database(places)
            print("✅ Database storage test completed")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
    finally:
        scraper.close_driver()
    
    print("\n🎉 Test completed!")

if __name__ == "__main__":
    test_enhanced_extraction()