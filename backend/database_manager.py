import asyncio
import aiosqlite
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import os

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self, db_path: str = "restaurant_data.db"):
        self.db_path = db_path
        self.init_lock = asyncio.Lock()
        
    async def initialize(self):
        """Initialize database and create tables"""
        async with self.init_lock:
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
                        menu_items TEXT,  -- JSON data
                        categorized_items TEXT,  -- JSON data
                        price_stats TEXT,  -- JSON data
                        total_items INTEGER,
                        categories INTEGER,
                        scraped_at TIMESTAMP,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (restaurant_name) REFERENCES restaurants (name)
                    )
                """)
                
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS reviews_data (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        restaurant_name TEXT NOT NULL,
                        source TEXT,  -- google, yelp, etc.
                        reviews_json TEXT,  -- Raw review data
                        sentiment_analysis TEXT,  -- JSON data
                        summary_stats TEXT,  -- JSON data
                        scraped_at TIMESTAMP,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (restaurant_name) REFERENCES restaurants (name)
                    )
                """)
                
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS scraping_status (
                        restaurant_name TEXT PRIMARY KEY,
                        last_menu_scrape TIMESTAMP,
                        last_reviews_scrape TIMESTAMP,
                        menu_scrape_count INTEGER DEFAULT 0,
                        reviews_scrape_count INTEGER DEFAULT 0,
                        last_error TEXT,
                        error_count INTEGER DEFAULT 0,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (restaurant_name) REFERENCES restaurants (name)
                    )
                """)
                
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS analytics_cache (
                        cache_key TEXT PRIMARY KEY,
                        data TEXT,  -- JSON data
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        expires_at TIMESTAMP
                    )
                """)
                
                # Create indexes for better performance
                await db.execute("CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_date ON reviews_data (restaurant_name, scraped_at)")
                await db.execute("CREATE INDEX IF NOT EXISTS idx_menu_restaurant_date ON menu_data (restaurant_name, scraped_at)")
                await db.execute("CREATE INDEX IF NOT EXISTS idx_analytics_expires ON analytics_cache (expires_at)")
                
                await db.commit()
                
        logger.info("Database initialized successfully")
    
    async def add_restaurant(self, name: str, url: str = None):
        """Add a new restaurant"""
        async with aiosqlite.connect(self.db_path) as db:
            try:
                await db.execute(
                    "INSERT OR IGNORE INTO restaurants (name, url) VALUES (?, ?)",
                    (name, url)
                )
                
                # Initialize scraping status
                await db.execute(
                    "INSERT OR IGNORE INTO scraping_status (restaurant_name) VALUES (?)",
                    (name,)
                )
                
                await db.commit()
                logger.info(f"Added restaurant: {name}")
            except Exception as e:
                logger.error(f"Error adding restaurant {name}: {e}")
    
    async def save_menu_data(self, restaurant_name: str, menu_data: Dict):
        """Save menu data to database"""
        await self.add_restaurant(restaurant_name, menu_data.get('url'))
        
        async with aiosqlite.connect(self.db_path) as db:
            try:
                await db.execute("""
                    INSERT INTO menu_data 
                    (restaurant_name, menu_items, categorized_items, price_stats, 
                     total_items, categories, scraped_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    restaurant_name,
                    json.dumps(menu_data.get('menu_items', [])),
                    json.dumps(menu_data.get('categorized_items', {})),
                    json.dumps(menu_data.get('price_stats', {})),
                    menu_data.get('total_items', 0),
                    menu_data.get('categories', 0),
                    menu_data.get('scraped_at')
                ))
                
                await db.commit()
                logger.info(f"Saved menu data for {restaurant_name}")
                
                # Invalidate relevant cache
                await self._invalidate_cache_pattern(f"restaurant_{restaurant_name}%")
                await self._invalidate_cache_pattern("analytics%")
                
            except Exception as e:
                logger.error(f"Error saving menu data for {restaurant_name}: {e}")
    
    async def save_reviews_data(self, restaurant_name: str, reviews_data: Dict):
        """Save reviews data to database"""
        await self.add_restaurant(restaurant_name)
        
        async with aiosqlite.connect(self.db_path) as db:
            try:
                # Save reviews for each source
                for source, source_data in reviews_data.get('sources', {}).items():
                    await db.execute("""
                        INSERT INTO reviews_data 
                        (restaurant_name, source, reviews_json, sentiment_analysis, 
                         summary_stats, scraped_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        restaurant_name,
                        source,
                        json.dumps(source_data),
                        json.dumps(reviews_data.get('sentiment_analysis', {})),
                        json.dumps(reviews_data.get('summary', {})),
                        reviews_data.get('processed_at')
                    ))
                
                # Update scraping status
                await db.execute("""
                    UPDATE scraping_status 
                    SET last_reviews_scrape = CURRENT_TIMESTAMP,
                        reviews_scrape_count = reviews_scrape_count + 1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE restaurant_name = ?
                """, (restaurant_name,))
                
                await db.commit()
                logger.info(f"Saved reviews data for {restaurant_name}")
                
                # Invalidate relevant cache
                await self._invalidate_cache_pattern(f"reviews_{restaurant_name}%")
                await self._invalidate_cache_pattern("analytics%")
                
            except Exception as e:
                logger.error(f"Error saving reviews data for {restaurant_name}: {e}")
    
    async def get_restaurant(self, restaurant_name: str) -> Optional[Dict]:
        """Get restaurant data with latest menu and reviews"""
        cache_key = f"restaurant_{restaurant_name}"
        cached = await self._get_cached_data(cache_key)
        if cached:
            return cached
        
        async with aiosqlite.connect(self.db_path) as db:
            try:
                # Get restaurant info
                async with db.execute(
                    "SELECT * FROM restaurants WHERE name = ?", 
                    (restaurant_name,)
                ) as cursor:
                    restaurant = await cursor.fetchone()
                    if not restaurant:
                        return None
                
                # Get latest menu data
                async with db.execute("""
                    SELECT * FROM menu_data 
                    WHERE restaurant_name = ? 
                    ORDER BY scraped_at DESC LIMIT 1
                """, (restaurant_name,)) as cursor:
                    menu_row = await cursor.fetchone()
                
                # Get latest reviews data
                async with db.execute("""
                    SELECT source, reviews_json, sentiment_analysis, summary_stats, scraped_at
                    FROM reviews_data 
                    WHERE restaurant_name = ? 
                    AND scraped_at >= datetime('now', '-24 hours')
                    ORDER BY scraped_at DESC
                """, (restaurant_name,)) as cursor:
                    reviews_rows = await cursor.fetchall()
                
                # Combine data
                result = {
                    'name': restaurant_name,
                    'url': restaurant[2],  # url column
                    'menu_data': {},
                    'reviews_data': {},
                    'last_updated': datetime.now().isoformat()
                }
                
                if menu_row:
                    result['menu_data'] = {
                        'menu_items': json.loads(menu_row[2]) if menu_row[2] else [],
                        'categorized_items': json.loads(menu_row[3]) if menu_row[3] else {},
                        'price_stats': json.loads(menu_row[4]) if menu_row[4] else {},
                        'total_items': menu_row[5],
                        'categories': menu_row[6],
                        'scraped_at': menu_row[7]
                    }
                
                if reviews_rows:
                    sources_data = {}
                    combined_sentiment = {}
                    combined_summary = {}
                    
                    for review_row in reviews_rows:
                        source = review_row[0]
                        sources_data[source] = json.loads(review_row[1]) if review_row[1] else {}
                        
                        if review_row[2]:  # sentiment_analysis
                            sentiment = json.loads(review_row[2])
                            combined_sentiment.update(sentiment)
                        
                        if review_row[3]:  # summary_stats
                            summary = json.loads(review_row[3])
                            combined_summary.update(summary)
                    
                    result['reviews_data'] = {
                        'sources': sources_data,
                        'sentiment_analysis': combined_sentiment,
                        'summary': combined_summary,
                        'last_scraped': reviews_rows[0][4] if reviews_rows else None
                    }
                
                # Cache the result for 5 minutes
                await self._cache_data(cache_key, result, expires_minutes=5)
                
                return result
                
            except Exception as e:
                logger.error(f"Error getting restaurant {restaurant_name}: {e}")
                return None
    
    async def get_all_restaurants(self) -> List[Dict]:
        """Get all restaurants with summary data"""
        cache_key = "all_restaurants"
        cached = await self._get_cached_data(cache_key)
        if cached:
            return cached
        
        async with aiosqlite.connect(self.db_path) as db:
            try:
                async with db.execute("""
                    SELECT r.name, r.url, r.updated_at,
                           m.total_items, m.categories, m.scraped_at as menu_scraped_at,
                           COUNT(rd.id) as review_sources,
                           MAX(rd.scraped_at) as last_review_scrape
                    FROM restaurants r
                    LEFT JOIN (
                        SELECT restaurant_name, total_items, categories, scraped_at,
                               ROW_NUMBER() OVER (PARTITION BY restaurant_name ORDER BY scraped_at DESC) as rn
                        FROM menu_data
                    ) m ON r.name = m.restaurant_name AND m.rn = 1
                    LEFT JOIN reviews_data rd ON r.name = rd.restaurant_name 
                        AND rd.scraped_at >= datetime('now', '-24 hours')
                    GROUP BY r.name, r.url, r.updated_at, m.total_items, m.categories, m.scraped_at
                    ORDER BY r.name
                """) as cursor:
                    rows = await cursor.fetchall()
                
                restaurants = []
                for row in rows:
                    restaurants.append({
                        'name': row[0],
                        'url': row[1],
                        'updated_at': row[2],
                        'menu_items_count': row[3] or 0,
                        'categories_count': row[4] or 0,
                        'menu_last_scraped': row[5],
                        'review_sources_count': row[6] or 0,
                        'reviews_last_scraped': row[7]
                    })
                
                # Cache for 2 minutes
                await self._cache_data(cache_key, restaurants, expires_minutes=2)
                
                return restaurants
                
            except Exception as e:
                logger.error(f"Error getting all restaurants: {e}")
                return []
    
    async def get_restaurant_reviews(self, restaurant_name: str, hours_back: int = 24) -> Dict:
        """Get recent reviews for a restaurant"""
        cache_key = f"reviews_{restaurant_name}_{hours_back}h"
        cached = await self._get_cached_data(cache_key)
        if cached:
            return cached
        
        async with aiosqlite.connect(self.db_path) as db:
            try:
                async with db.execute("""
                    SELECT source, reviews_json, sentiment_analysis, summary_stats, scraped_at
                    FROM reviews_data 
                    WHERE restaurant_name = ? 
                    AND scraped_at >= datetime('now', '-{} hours')
                    ORDER BY scraped_at DESC
                """.format(hours_back), (restaurant_name,)) as cursor:
                    rows = await cursor.fetchall()
                
                if not rows:
                    return None
                
                result = {
                    'restaurant_name': restaurant_name,
                    'sources': {},
                    'combined_sentiment': {},
                    'combined_summary': {},
                    'total_sources': len(rows),
                    'scraped_at': rows[0][4]  # Most recent scrape time
                }
                
                for row in rows:
                    source = row[0]
                    result['sources'][source] = {
                        'reviews': json.loads(row[1]) if row[1] else [],
                        'sentiment': json.loads(row[2]) if row[2] else {},
                        'summary': json.loads(row[3]) if row[3] else {},
                        'scraped_at': row[4]
                    }
                
                # Cache for 3 minutes
                await self._cache_data(cache_key, result, expires_minutes=3)
                
                return result
                
            except Exception as e:
                logger.error(f"Error getting reviews for {restaurant_name}: {e}")
                return None
    
    async def get_analytics_summary(self) -> Dict:
        """Get analytics summary across all restaurants"""
        cache_key = "analytics_summary"
        cached = await self._get_cached_data(cache_key)
        if cached:
            return cached
        
        async with aiosqlite.connect(self.db_path) as db:
            try:
                # Get overall statistics
                async with db.execute("""
                    SELECT 
                        COUNT(DISTINCT r.name) as total_restaurants,
                        COUNT(DISTINCT m.id) as total_menu_scrapes,
                        COUNT(DISTINCT rd.id) as total_review_scrapes,
                        AVG(m.total_items) as avg_menu_items,
                        SUM(m.total_items) as total_menu_items
                    FROM restaurants r
                    LEFT JOIN menu_data m ON r.name = m.restaurant_name
                    LEFT JOIN reviews_data rd ON r.name = rd.restaurant_name
                """) as cursor:
                    stats_row = await cursor.fetchone()
                
                # Get recent activity (last 24 hours)
                async with db.execute("""
                    SELECT 
                        COUNT(DISTINCT restaurant_name) as active_restaurants,
                        COUNT(*) as recent_scrapes
                    FROM reviews_data
                    WHERE scraped_at >= datetime('now', '-24 hours')
                """) as cursor:
                    activity_row = await cursor.fetchone()
                
                # Get top categories
                async with db.execute("""
                    SELECT 
                        JSON_EXTRACT(categorized_items, '$') as categories,
                        restaurant_name
                    FROM menu_data m1
                    WHERE m1.scraped_at = (
                        SELECT MAX(m2.scraped_at) 
                        FROM menu_data m2 
                        WHERE m2.restaurant_name = m1.restaurant_name
                    )
                """) as cursor:
                    category_rows = await cursor.fetchall()
                
                # Process categories
                all_categories = {}
                for row in category_rows:
                    if row[0]:
                        try:
                            categories = json.loads(row[0])
                            for category, items in categories.items():
                                all_categories[category] = all_categories.get(category, 0) + len(items)
                        except:
                            continue
                
                top_categories = sorted(all_categories.items(), key=lambda x: x[1], reverse=True)[:10]
                
                result = {
                    'total_restaurants': stats_row[0] or 0,
                    'total_menu_scrapes': stats_row[1] or 0,
                    'total_review_scrapes': stats_row[2] or 0,
                    'avg_menu_items': round(stats_row[3] or 0, 1),
                    'total_menu_items': stats_row[4] or 0,
                    'active_restaurants_24h': activity_row[0] or 0,
                    'recent_scrapes_24h': activity_row[1] or 0,
                    'top_categories': top_categories,
                    'generated_at': datetime.now().isoformat()
                }
                
                # Cache for 5 minutes
                await self._cache_data(cache_key, result, expires_minutes=5)
                
                return result
                
            except Exception as e:
                logger.error(f"Error getting analytics summary: {e}")
                return {}
    
    async def get_trends_data(self) -> Dict:
        """Get trending data for visualization"""
        cache_key = "trends_data"
        cached = await self._get_cached_data(cache_key)
        if cached:
            return cached
        
        async with aiosqlite.connect(self.db_path) as db:
            try:
                # Get scraping activity over time
                async with db.execute("""
                    SELECT 
                        DATE(scraped_at) as date,
                        COUNT(*) as scrapes,
                        'reviews' as type
                    FROM reviews_data
                    WHERE scraped_at >= datetime('now', '-7 days')
                    GROUP BY DATE(scraped_at)
                    
                    UNION ALL
                    
                    SELECT 
                        DATE(scraped_at) as date,
                        COUNT(*) as scrapes,
                        'menu' as type
                    FROM menu_data
                    WHERE scraped_at >= datetime('now', '-7 days')
                    GROUP BY DATE(scraped_at)
                    
                    ORDER BY date DESC
                """) as cursor:
                    activity_data = await cursor.fetchall()
                
                # Process activity data
                activity_by_date = {}
                for row in activity_data:
                    date = row[0]
                    if date not in activity_by_date:
                        activity_by_date[date] = {'reviews': 0, 'menu': 0}
                    activity_by_date[date][row[2]] = row[1]
                
                # Get sentiment trends
                async with db.execute("""
                    SELECT 
                        restaurant_name,
                        JSON_EXTRACT(sentiment_analysis, '$.avg_sentiment') as sentiment,
                        scraped_at
                    FROM reviews_data
                    WHERE scraped_at >= datetime('now', '-7 days')
                    AND JSON_EXTRACT(sentiment_analysis, '$.avg_sentiment') IS NOT NULL
                    ORDER BY scraped_at DESC
                """) as cursor:
                    sentiment_data = await cursor.fetchall()
                
                result = {
                    'activity_trends': [
                        {
                            'date': date,
                            'reviews': data['reviews'],
                            'menu_scrapes': data['menu']
                        }
                        for date, data in sorted(activity_by_date.items())
                    ],
                    'sentiment_trends': [
                        {
                            'restaurant': row[0],
                            'sentiment': float(row[1]) if row[1] else 0,
                            'date': row[2]
                        }
                        for row in sentiment_data
                    ],
                    'generated_at': datetime.now().isoformat()
                }
                
                # Cache for 10 minutes
                await self._cache_data(cache_key, result, expires_minutes=10)
                
                return result
                
            except Exception as e:
                logger.error(f"Error getting trends data: {e}")
                return {}
    
    async def update_last_menu_scrape_time(self, restaurant_name: str):
        """Update the last menu scrape time"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                UPDATE scraping_status 
                SET last_menu_scrape = CURRENT_TIMESTAMP,
                    menu_scrape_count = menu_scrape_count + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE restaurant_name = ?
            """, (restaurant_name,))
            await db.commit()
    
    async def get_last_menu_scrape_time(self, restaurant_name: str) -> Optional[datetime]:
        """Get the last menu scrape time for a restaurant"""
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute(
                "SELECT last_menu_scrape FROM scraping_status WHERE restaurant_name = ?",
                (restaurant_name,)
            ) as cursor:
                row = await cursor.fetchone()
                if row and row[0]:
                    return datetime.fromisoformat(row[0])
                return None
    
    async def _cache_data(self, key: str, data: Any, expires_minutes: int = 5):
        """Cache data with expiration"""
        expires_at = datetime.now() + timedelta(minutes=expires_minutes)
        
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT OR REPLACE INTO analytics_cache (cache_key, data, expires_at)
                VALUES (?, ?, ?)
            """, (key, json.dumps(data), expires_at.isoformat()))
            await db.commit()
    
    async def _get_cached_data(self, key: str) -> Optional[Any]:
        """Get cached data if not expired"""
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute("""
                SELECT data FROM analytics_cache 
                WHERE cache_key = ? AND expires_at > CURRENT_TIMESTAMP
            """, (key,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    try:
                        return json.loads(row[0])
                    except:
                        pass
        return None
    
    async def _invalidate_cache_pattern(self, pattern: str):
        """Invalidate cache entries matching pattern"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "DELETE FROM analytics_cache WHERE cache_key LIKE ?",
                (pattern,)
            )
            await db.commit()
    
    async def cleanup_expired_cache(self):
        """Clean up expired cache entries"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("DELETE FROM analytics_cache WHERE expires_at < CURRENT_TIMESTAMP")
            await db.commit()