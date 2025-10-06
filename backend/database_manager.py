import asyncio
import aiosqlite
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self, db_path: str = "restaurant_data.db"):
        self.db_path = db_path
        
    async def initialize(self):
        """Initialize database and create tables"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS restaurants (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            await db.execute("""
                CREATE TABLE IF NOT EXISTS menu_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    restaurant_name TEXT NOT NULL,
                    menu_items TEXT,
                    total_items INTEGER,
                    categories INTEGER,
                    scraped_at TIMESTAMP,
                    FOREIGN KEY (restaurant_name) REFERENCES restaurants (name)
                )
            """)
            
            await db.execute("""
                CREATE TABLE IF NOT EXISTS reviews_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    restaurant_name TEXT NOT NULL,
                    reviews_json TEXT,
                    sentiment_analysis TEXT,
                    scraped_at TIMESTAMP,
                    FOREIGN KEY (restaurant_name) REFERENCES restaurants (name)
                )
            """)
            
            await db.commit()
            
        logger.info("Database initialized successfully")
    
    async def get_all_restaurants(self) -> List[Dict]:
        """Get all restaurants with summary data"""
        # Mock data for testing
        mock_restaurants = [
            {
                'name': 'India Quality',
                'url': 'https://indiaquality.com/food-menu',
                'updated_at': '2024-01-15T10:30:00Z',
                'menu_items_count': 45,
                'categories_count': 8,
                'menu_last_scraped': '2024-01-15T08:00:00Z',
                'review_sources_count': 2,
                'reviews_last_scraped': '2024-01-15T10:15:00Z'
            },
            {
                'name': 'Mela Modern Indian',
                'url': 'https://melainboston.com/food-menu',
                'updated_at': '2024-01-15T09:45:00Z',
                'menu_items_count': 38,
                'categories_count': 7,
                'menu_last_scraped': '2024-01-14T20:30:00Z',
                'review_sources_count': 2,
                'reviews_last_scraped': '2024-01-15T09:30:00Z'
            }
        ]
        
        return mock_restaurants
    
    async def get_analytics_summary(self) -> Dict:
        """Get analytics summary across all restaurants"""
        mock_summary = {
            'total_restaurants': 2,
            'total_menu_scrapes': 24,
            'total_review_scrapes': 48,
            'avg_menu_items': 41.5,
            'total_menu_items': 83,
            'active_restaurants_24h': 2,
            'recent_scrapes_24h': 12,
            'top_categories': [
                ['Chicken', 15],
                ['Vegetarian', 12],
                ['Rice', 10],
                ['Breads', 8],
                ['Appetizers', 7],
            ],
            'generated_at': datetime.now().isoformat()
        }
        
        return mock_summary
    
    async def get_trends_data(self) -> Dict:
        """Get trending data for visualization"""
        mock_trends = {
            'activity_trends': [
                {'date': '2024-01-10', 'reviews': 5, 'menu_scrapes': 2},
                {'date': '2024-01-11', 'reviews': 8, 'menu_scrapes': 1},
                {'date': '2024-01-12', 'reviews': 6, 'menu_scrapes': 3},
                {'date': '2024-01-13', 'reviews': 9, 'menu_scrapes': 2},
                {'date': '2024-01-14', 'reviews': 7, 'menu_scrapes': 1},
                {'date': '2024-01-15', 'reviews': 12, 'menu_scrapes': 2},
            ],
            'sentiment_trends': [
                {'restaurant': 'India Quality', 'sentiment': 0.4, 'date': '2024-01-15T10:00:00Z'},
                {'restaurant': 'Mela Modern Indian', 'sentiment': 0.6, 'date': '2024-01-15T09:00:00Z'},
            ],
            'generated_at': datetime.now().isoformat()
        }
        
        return mock_trends