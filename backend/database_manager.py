import asyncio
import aiosqlite
import json
import logging
from datetime import datetime, timedelta
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
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            await db.execute("""
                CREATE TABLE IF NOT EXISTS menu_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    restaurant_name TEXT NOT NULL,
                    menu_items TEXT,
                    total_items INTEGER,
                    categories INTEGER,
                    price_stats TEXT,
                    scraped_at TIMESTAMP,
                    FOREIGN KEY (restaurant_name) REFERENCES restaurants (name)
                )
            """)
            
            await db.execute("""
                CREATE TABLE IF NOT EXISTS reviews_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    restaurant_name TEXT NOT NULL,
                    source TEXT NOT NULL,
                    reviews_json TEXT,
                    sentiment_analysis TEXT,
                    scraped_at TIMESTAMP,
                    FOREIGN KEY (restaurant_name) REFERENCES restaurants (name)
                )
            """)
            
            await db.execute("""
                CREATE TABLE IF NOT EXISTS scraping_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    restaurant_name TEXT NOT NULL,
                    scrape_type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    error_message TEXT,
                    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            await db.commit()
            
        logger.info("Database initialized successfully")
    
    async def insert_or_update_restaurant(self, name: str, url: str):
        """Insert or update restaurant information"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT OR REPLACE INTO restaurants (name, url, updated_at)
                VALUES (?, ?, ?)
            """, (name, url, datetime.now().isoformat()))
            await db.commit()
    
    async def save_menu_data(self, restaurant_name: str, menu_data: Dict):
        """Save scraped menu data"""
        async with aiosqlite.connect(self.db_path) as db:
            menu_items_json = json.dumps(menu_data.get('menu_items', []))
            price_stats_json = json.dumps(menu_data.get('price_stats', {}))
            
            await db.execute("""
                INSERT INTO menu_data 
                (restaurant_name, menu_items, total_items, categories, price_stats, scraped_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                restaurant_name,
                menu_items_json,
                menu_data.get('total_items', 0),
                menu_data.get('categories', 0),
                price_stats_json,
                datetime.now().isoformat()
            ))
            await db.commit()
            logger.info(f"Saved menu data for {restaurant_name}")
    
    async def save_reviews_data(self, restaurant_name: str, source: str, reviews_data: Dict):
        """Save scraped reviews data"""
        async with aiosqlite.connect(self.db_path) as db:
            reviews_json = json.dumps(reviews_data.get('reviews', []))
            sentiment_json = json.dumps(reviews_data.get('sentiment_analysis', {}))
            
            await db.execute("""
                INSERT INTO reviews_data 
                (restaurant_name, source, reviews_json, sentiment_analysis, scraped_at)
                VALUES (?, ?, ?, ?, ?)
            """, (
                restaurant_name,
                source,
                reviews_json,
                sentiment_json,
                datetime.now().isoformat()
            ))
            await db.commit()
            logger.info(f"Saved {source} reviews for {restaurant_name}")
    
    async def log_scraping_activity(self, restaurant_name: str, scrape_type: str, status: str, error_message: str = None):
        """Log scraping activities"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO scraping_logs (restaurant_name, scrape_type, status, error_message)
                VALUES (?, ?, ?, ?)
            """, (restaurant_name, scrape_type, status, error_message))
            await db.commit()
    
    async def get_all_restaurants(self) -> List[Dict]:
        """Get all restaurants with their latest data"""
        async with aiosqlite.connect(self.db_path) as db:
            # Get restaurant basic info
            cursor = await db.execute("""
                SELECT name, url, updated_at FROM restaurants ORDER BY updated_at DESC
            """)
            restaurants = []
            
            async for row in cursor:
                name, url, updated_at = row
                
                # Get latest menu data
                menu_cursor = await db.execute("""
                    SELECT total_items, categories, scraped_at 
                    FROM menu_data 
                    WHERE restaurant_name = ? 
                    ORDER BY scraped_at DESC LIMIT 1
                """, (name,))
                menu_row = await menu_cursor.fetchone()
                
                # Get reviews count
                reviews_cursor = await db.execute("""
                    SELECT COUNT(DISTINCT source), MAX(scraped_at)
                    FROM reviews_data 
                    WHERE restaurant_name = ?
                """, (name,))
                reviews_row = await reviews_cursor.fetchone()
                
                restaurant_data = {
                    'name': name,
                    'url': url,
                    'updated_at': updated_at,
                    'menu_items_count': menu_row[0] if menu_row else 0,
                    'categories_count': menu_row[1] if menu_row else 0,
                    'menu_last_scraped': menu_row[2] if menu_row else None,
                    'review_sources_count': reviews_row[0] if reviews_row else 0,
                    'reviews_last_scraped': reviews_row[1] if reviews_row else None
                }
                restaurants.append(restaurant_data)
            
            return restaurants
    
    async def get_restaurant_details(self, restaurant_name: str) -> Dict:
        """Get detailed data for a specific restaurant"""
        async with aiosqlite.connect(self.db_path) as db:
            # Get basic restaurant info
            cursor = await db.execute("""
                SELECT name, url, updated_at FROM restaurants WHERE name = ?
            """, (restaurant_name,))
            restaurant_row = await cursor.fetchone()
            
            if not restaurant_row:
                return None
            
            name, url, updated_at = restaurant_row
            
            # Get latest menu data
            menu_cursor = await db.execute("""
                SELECT menu_items, total_items, categories, price_stats, scraped_at
                FROM menu_data 
                WHERE restaurant_name = ? 
                ORDER BY scraped_at DESC LIMIT 1
            """, (restaurant_name,))
            menu_row = await menu_cursor.fetchone()
            
            # Get all reviews data
            reviews_cursor = await db.execute("""
                SELECT source, reviews_json, sentiment_analysis, scraped_at
                FROM reviews_data 
                WHERE restaurant_name = ? 
                ORDER BY scraped_at DESC
            """, (restaurant_name,))
            reviews_rows = await reviews_cursor.fetchall()
            
            # Construct response
            result = {
                'name': name,
                'url': url,
                'last_updated': updated_at,
                'menu_data': {
                    'menu_items': [],
                    'total_items': 0,
                    'categories': 0,
                    'price_stats': {},
                    'scraped_at': None
                },
                'reviews_data': {
                    'sources': {},
                    'summary': {
                        'total_reviews': 0,
                        'sources_count': 0,
                        'avg_rating': 0
                    },
                    'sentiment_analysis': {},
                    'last_scraped': None
                }
            }
            
            # Add menu data if available
            if menu_row:
                menu_items_str, total_items, categories, price_stats_str, menu_scraped_at = menu_row
                result['menu_data'] = {
                    'menu_items': json.loads(menu_items_str) if menu_items_str else [],
                    'total_items': total_items,
                    'categories': categories,
                    'price_stats': json.loads(price_stats_str) if price_stats_str else {},
                    'scraped_at': menu_scraped_at
                }
            
            # Add reviews data
            if reviews_rows:
                total_reviews = 0
                total_rating = 0
                rating_count = 0
                latest_scrape = None
                
                for source, reviews_json, sentiment_json, scraped_at in reviews_rows:
                    reviews = json.loads(reviews_json) if reviews_json else []
                    sentiment = json.loads(sentiment_json) if sentiment_json else {}
                    
                    result['reviews_data']['sources'][source] = {
                        'reviews': reviews,
                        'sentiment_analysis': sentiment,
                        'scraped_at': scraped_at
                    }
                    
                    total_reviews += len(reviews)
                    
                    # Calculate average rating
                    for review in reviews:
                        if review.get('rating'):
                            total_rating += review['rating']
                            rating_count += 1
                    
                    if not latest_scrape or scraped_at > latest_scrape:
                        latest_scrape = scraped_at
                
                result['reviews_data']['summary'] = {
                    'total_reviews': total_reviews,
                    'sources_count': len(result['reviews_data']['sources']),
                    'avg_rating': round(total_rating / rating_count, 1) if rating_count > 0 else 0
                }
                result['reviews_data']['last_scraped'] = latest_scrape
            
            return result
    
    async def get_analytics_summary(self) -> Dict:
        """Get analytics summary across all restaurants"""
        async with aiosqlite.connect(self.db_path) as db:
            # Count restaurants
            restaurant_count = await db.execute("SELECT COUNT(*) FROM restaurants")
            total_restaurants = (await restaurant_count.fetchone())[0]
            
            # Count scrapes in last 24 hours
            yesterday = (datetime.now() - timedelta(hours=24)).isoformat()
            
            recent_menu_scrapes = await db.execute("""
                SELECT COUNT(*) FROM menu_data WHERE scraped_at > ?
            """, (yesterday,))
            menu_scrapes_24h = (await recent_menu_scrapes.fetchone())[0]
            
            recent_review_scrapes = await db.execute("""
                SELECT COUNT(*) FROM reviews_data WHERE scraped_at > ?
            """, (yesterday,))
            review_scrapes_24h = (await recent_review_scrapes.fetchone())[0]
            
            # Get total menu items and average
            menu_stats = await db.execute("""
                SELECT SUM(total_items), AVG(total_items) 
                FROM (SELECT restaurant_name, MAX(total_items) as total_items 
                      FROM menu_data GROUP BY restaurant_name)
            """)
            menu_stats_row = await menu_stats.fetchone()
            total_menu_items = menu_stats_row[0] or 0
            avg_menu_items = round(menu_stats_row[1] or 0, 1)
            
            # Get active restaurants (scraped in last 24h)
            active_restaurants = await db.execute("""
                SELECT COUNT(DISTINCT restaurant_name) 
                FROM scraping_logs 
                WHERE scraped_at > ? AND status = 'success'
            """, (yesterday,))
            active_count = (await active_restaurants.fetchone())[0]
            
            return {
                'total_restaurants': total_restaurants,
                'total_menu_scrapes': menu_scrapes_24h,
                'total_review_scrapes': review_scrapes_24h,
                'avg_menu_items': avg_menu_items,
                'total_menu_items': total_menu_items,
                'active_restaurants_24h': active_count,
                'recent_scrapes_24h': menu_scrapes_24h + review_scrapes_24h,
                'generated_at': datetime.now().isoformat()
            }
    
    async def get_trends_data(self) -> Dict:
        """Get trending data for the last 7 days"""
        async with aiosqlite.connect(self.db_path) as db:
            # Get activity trends for last 7 days
            seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
            
            activity_cursor = await db.execute("""
                SELECT DATE(scraped_at) as date,
                       SUM(CASE WHEN scrape_type = 'menu' THEN 1 ELSE 0 END) as menu_scrapes,
                       SUM(CASE WHEN scrape_type = 'reviews' THEN 1 ELSE 0 END) as review_scrapes
                FROM scraping_logs 
                WHERE scraped_at > ? AND status = 'success'
                GROUP BY DATE(scraped_at)
                ORDER BY date DESC
            """, (seven_days_ago,))
            
            activity_trends = []
            async for row in activity_cursor:
                date, menu_scrapes, review_scrapes = row
                activity_trends.append({
                    'date': date,
                    'menu_scrapes': menu_scrapes,
                    'reviews': review_scrapes
                })
            
            return {
                'activity_trends': activity_trends,
                'generated_at': datetime.now().isoformat()
            }
    
    async def cleanup_old_data(self, days_to_keep: int = 30):
        """Clean up old data to maintain performance"""
        cutoff_date = (datetime.now() - timedelta(days=days_to_keep)).isoformat()
        
        async with aiosqlite.connect(self.db_path) as db:
            # Keep only the latest menu data for each restaurant
            await db.execute("""
                DELETE FROM menu_data 
                WHERE scraped_at < ? 
                AND id NOT IN (
                    SELECT MAX(id) 
                    FROM menu_data 
                    GROUP BY restaurant_name
                )
            """, (cutoff_date,))
            
            # Clean old scraping logs
            await db.execute("""
                DELETE FROM scraping_logs WHERE scraped_at < ?
            """, (cutoff_date,))
            
            await db.commit()
            logger.info(f"Cleaned up data older than {days_to_keep} days")