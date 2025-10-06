import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json
import aiohttp
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import re
from collections import defaultdict
import numpy as np

from database_manager import DatabaseManager
from review_scraper import ReviewScraper

logger = logging.getLogger(__name__)

class RestaurantScraperService:
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
        self.review_scraper = ReviewScraper()
        self.is_running = False
        self.scraping_tasks = {}
        self.last_scrape_times = {}
        self.error_counts = defaultdict(int)
        
        # Configuration
        self.MENU_SCRAPE_INTERVAL = 7 * 24 * 60 * 60  # 7 days in seconds
        self.REVIEW_SCRAPE_INTERVAL = 5 * 60  # 5 minutes in seconds (NOT every second!)
        
        # Restaurant configuration
        self.restaurants_config = {
            'India Quality': {
                'url': 'https://indiaquality.com/food-menu',
                'review_sources': ['google', 'yelp'],
                'scrape_menu': True,
                'scrape_reviews': True
            },
            'Mela Modern Indian': {
                'url': 'https://melainboston.com/food-menu',
                'review_sources': ['google', 'yelp'],
                'scrape_menu': True,
                'scrape_reviews': True
            },
            'Halal Indian Cuisine': {
                'url': 'https://www.halalindiancuisineboston.com/pypczrdx/restaurant/menu?menu=All+Day+Menu',
                'review_sources': ['google'],
                'scrape_menu': True,
                'scrape_reviews': True
            },
            # Add all your restaurants here...
        }
        
        self.driver_pool = []
        self.max_drivers = 3
        
    async def initialize_drivers(self):
        """Initialize WebDriver pool for concurrent scraping"""
        for i in range(self.max_drivers):
            driver = await self._create_driver()
            if driver:
                self.driver_pool.append(driver)
        
        logger.info(f"Initialized {len(self.driver_pool)} WebDriver instances")
    
    async def _create_driver(self) -> Optional[webdriver.Chrome]:
        """Create a new WebDriver instance"""
        try:
            options = Options()
            options.add_argument("--headless")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-gpu")
            options.add_argument("--disable-extensions")
            options.add_argument("--disable-logging")
            options.add_argument("--window-size=1920,1080")
            
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)
            driver.implicitly_wait(10)
            
            return driver
        except Exception as e:
            logger.error(f"Failed to create WebDriver: {e}")
            return None
    
    async def get_available_driver(self) -> Optional[webdriver.Chrome]:
        """Get an available driver from the pool"""
        if self.driver_pool:
            return self.driver_pool.pop()
        else:
            return await self._create_driver()
    
    def return_driver(self, driver: webdriver.Chrome):
        """Return driver to the pool"""
        if len(self.driver_pool) < self.max_drivers:
            self.driver_pool.append(driver)
        else:
            try:
                driver.quit()
            except:
                pass
    
    async def start_periodic_scraping(self):
        """Start the periodic scraping process"""
        if self.is_running:
            logger.warning("Scraping is already running")
            return
        
        self.is_running = True
        await self.initialize_drivers()
        
        logger.info("Starting periodic scraping service")
        
        # Create tasks for each restaurant
        for restaurant_name in self.restaurants_config.keys():
            # Menu scraping task (weekly)
            menu_task = asyncio.create_task(
                self._periodic_menu_scraping(restaurant_name)
            )
            
            # Review scraping task (every 5 minutes)
            review_task = asyncio.create_task(
                self._periodic_review_scraping(restaurant_name)
            )
            
            self.scraping_tasks[f"{restaurant_name}_menu"] = menu_task
            self.scraping_tasks[f"{restaurant_name}_reviews"] = review_task
        
        logger.info(f"Started {len(self.scraping_tasks)} scraping tasks")
    
    async def _periodic_menu_scraping(self, restaurant_name: str):
        """Periodic menu scraping for a restaurant"""
        while self.is_running:
            try:
                # Check if menu scraping is needed
                last_scrape = await self.db_manager.get_last_menu_scrape_time(restaurant_name)
                
                if (not last_scrape or 
                    (datetime.now() - last_scrape).total_seconds() > self.MENU_SCRAPE_INTERVAL):
                    
                    logger.info(f"Starting menu scraping for {restaurant_name}")
                    await self._scrape_restaurant_menu(restaurant_name)
                
                # Wait for next check (check every hour for menu updates)
                await asyncio.sleep(3600)
                
            except Exception as e:
                logger.error(f"Error in periodic menu scraping for {restaurant_name}: {e}")
                await asyncio.sleep(3600)  # Wait before retrying
    
    async def _periodic_review_scraping(self, restaurant_name: str):
        """Periodic review scraping for a restaurant"""
        while self.is_running:
            try:
                logger.info(f"Starting review scraping for {restaurant_name}")
                await self._scrape_restaurant_reviews(restaurant_name)
                
                # Wait for the review scrape interval (5 minutes)
                await asyncio.sleep(self.REVIEW_SCRAPE_INTERVAL)
                
            except Exception as e:
                logger.error(f"Error in periodic review scraping for {restaurant_name}: {e}")
                self.error_counts[restaurant_name] += 1
                
                # Exponential backoff for errors
                wait_time = min(300 * (2 ** self.error_counts[restaurant_name]), 3600)
                await asyncio.sleep(wait_time)
    
    async def _scrape_restaurant_menu(self, restaurant_name: str):
        """Scrape menu data for a specific restaurant"""
        config = self.restaurants_config.get(restaurant_name)
        if not config or not config.get('scrape_menu', False):
            return
        
        driver = await self.get_available_driver()
        if not driver:
            logger.error(f"No available driver for menu scraping: {restaurant_name}")
            return
        
        try:
            url = config['url']
            logger.info(f"Scraping menu from {url}")
            
            # Navigate to page
            driver.get(url)
            await asyncio.sleep(3)
            
            # Extract menu data
            menu_data = await self._extract_menu_data(driver, restaurant_name)
            
            if menu_data:
                # Save to database
                await self.db_manager.save_menu_data(restaurant_name, menu_data)
                
                # Update last scrape time
                await self.db_manager.update_last_menu_scrape_time(restaurant_name)
                
                logger.info(f"Successfully scraped {len(menu_data.get('menu_items', []))} menu items for {restaurant_name}")
                
                # Reset error count on success
                self.error_counts[restaurant_name] = 0
            
        except Exception as e:
            logger.error(f"Error scraping menu for {restaurant_name}: {e}")
            self.error_counts[restaurant_name] += 1
        
        finally:
            self.return_driver(driver)
    
    async def _scrape_restaurant_reviews(self, restaurant_name: str):
        """Scrape review data for a specific restaurant"""
        config = self.restaurants_config.get(restaurant_name)
        if not config or not config.get('scrape_reviews', False):
            return
        
        try:
            # Get reviews from configured sources
            all_reviews = {}
            
            for source in config.get('review_sources', []):
                reviews = await self.review_scraper.scrape_reviews(restaurant_name, source)
                if reviews:
                    all_reviews[source] = reviews
            
            if all_reviews:
                # Process and analyze reviews
                processed_reviews = await self._process_reviews(all_reviews)
                
                # Save to database
                await self.db_manager.save_reviews_data(restaurant_name, processed_reviews)
                
                logger.info(f"Successfully scraped reviews for {restaurant_name} from {len(all_reviews)} sources")
                
                # Broadcast update via WebSocket
                await self._broadcast_review_update(restaurant_name, processed_reviews)
                
                # Reset error count on success
                self.error_counts[restaurant_name] = 0
            
        except Exception as e:
            logger.error(f"Error scraping reviews for {restaurant_name}: {e}")
            self.error_counts[restaurant_name] += 1
    
    async def _extract_menu_data(self, driver: webdriver.Chrome, restaurant_name: str) -> Dict:
        """Extract menu data from the page"""
        try:
            page_source = driver.page_source
            soup = BeautifulSoup(page_source, 'html.parser')
            
            # Extract menu items using various selectors
            menu_items = []
            
            # Try different selectors based on common patterns
            selectors = [
                ".menu-item", ".food-item", ".dish-item", ".product-item",
                "h1", "h2", "h3", "h4", "h5", "h6"
            ]
            
            for selector in selectors:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                for element in elements:
                    item_data = self._parse_menu_element(element)
                    if item_data:
                        menu_items.append(item_data)
            
            # Remove duplicates
            menu_items = self._deduplicate_items(menu_items)
            
            # Extract price statistics
            prices = [item['price'] for item in menu_items if item.get('price', 0) > 0]
            price_stats = self._calculate_price_stats(prices)
            
            # Categorize items
            categorized_items = self._categorize_menu_items(menu_items)
            
            return {
                'restaurant_name': restaurant_name,
                'menu_items': menu_items,
                'categorized_items': categorized_items,
                'price_stats': price_stats,
                'total_items': len(menu_items),
                'categories': len(categorized_items),
                'scraped_at': datetime.now().isoformat(),
                'url': driver.current_url
            }
            
        except Exception as e:
            logger.error(f"Error extracting menu data: {e}")
            return {}
    
    def _parse_menu_element(self, element) -> Optional[Dict]:
        """Parse a single menu element"""
        try:
            text = element.text.strip()
            if len(text) < 3:
                return None
            
            lines = text.split('\n') if '\n' in text else [text]
            name = lines[0].strip()
            
            # Extract price
            price_match = re.search(r'\$(\d+\.?\d*)', text)
            price = float(price_match.group(1)) if price_match else 0
            
            # Check if it looks like a food item
            food_keywords = [
                'chicken', 'lamb', 'beef', 'fish', 'curry', 'masala',
                'tikka', 'tandoori', 'biryani', 'rice', 'naan', 'bread'
            ]
            
            if (name and len(name) > 2 and 
                (price > 0 or any(keyword.lower() in name.lower() for keyword in food_keywords))):
                return {
                    'name': name,
                    'price': price,
                    'description': ' '.join(lines[1:]) if len(lines) > 1 else '',
                    'category': self._guess_category(text)
                }
        except Exception:
            pass
        
        return None
    
    def _guess_category(self, text: str) -> str:
        """Guess the category of a menu item"""
        text_lower = text.lower()
        
        categories = {
            'appetizers': ['appetizer', 'starter', 'samosa', 'pakora'],
            'breads': ['naan', 'roti', 'bread', 'paratha'],
            'rice': ['biryani', 'rice', 'pulao'],
            'vegetarian': ['vegetarian', 'veg', 'paneer', 'dal'],
            'chicken': ['chicken', 'murgh'],
            'lamb': ['lamb', 'goat', 'mutton'],
            'seafood': ['fish', 'shrimp', 'prawn'],
            'desserts': ['dessert', 'sweet', 'kulfi']
        }
        
        for category, keywords in categories.items():
            if any(keyword in text_lower for keyword in keywords):
                return category.title()
        
        return 'Other'
    
    def _deduplicate_items(self, items: List[Dict]) -> List[Dict]:
        """Remove duplicate menu items"""
        seen = set()
        unique_items = []
        
        for item in items:
            key = re.sub(r'[^\w\s]', '', item['name'].lower().strip())
            if key not in seen and len(key) > 2:
                seen.add(key)
                unique_items.append(item)
        
        return unique_items
    
    def _calculate_price_stats(self, prices: List[float]) -> Dict:
        """Calculate price statistics"""
        if not prices:
            return {'min': 0, 'max': 0, 'mean': 0, 'median': 0, 'count': 0}
        
        return {
            'min': min(prices),
            'max': max(prices),
            'mean': np.mean(prices),
            'median': np.median(prices),
            'count': len(prices)
        }
    
    def _categorize_menu_items(self, menu_items: List[Dict]) -> Dict:
        """Categorize all menu items"""
        categorized = defaultdict(list)
        for item in menu_items:
            category = item.get('category', 'Other')
            categorized[category].append(item)
        return dict(categorized)
    
    async def _process_reviews(self, reviews_data: Dict) -> Dict:
        """Process and analyze review data"""
        processed = {
            'sources': reviews_data,
            'summary': {},
            'sentiment_analysis': {},
            'recent_reviews': [],
            'processed_at': datetime.now().isoformat()
        }
        
        # Combine all reviews for analysis
        all_reviews = []
        for source, reviews in reviews_data.items():
            all_reviews.extend(reviews.get('reviews', []))
        
        if all_reviews:
            # Calculate sentiment analysis
            processed['sentiment_analysis'] = await self._analyze_sentiment(all_reviews)
            
            # Get recent reviews (last 24 hours)
            recent_cutoff = datetime.now() - timedelta(days=1)
            processed['recent_reviews'] = [
                review for review in all_reviews 
                if datetime.fromisoformat(review.get('date', '')) > recent_cutoff
            ]
            
            # Summary statistics
            processed['summary'] = {
                'total_reviews': len(all_reviews),
                'recent_reviews_count': len(processed['recent_reviews']),
                'avg_rating': np.mean([r.get('rating', 0) for r in all_reviews if r.get('rating')]),
                'sources_count': len(reviews_data)
            }
        
        return processed
    
    async def _analyze_sentiment(self, reviews: List[Dict]) -> Dict:
        """Analyze sentiment of reviews"""
        # Simple sentiment analysis based on rating and keywords
        positive_keywords = ['good', 'great', 'excellent', 'amazing', 'delicious', 'fantastic']
        negative_keywords = ['bad', 'terrible', 'awful', 'horrible', 'disgusting', 'worst']
        
        sentiment_scores = []
        positive_count = 0
        negative_count = 0
        neutral_count = 0
        
        for review in reviews:
            text = review.get('text', '').lower()
            rating = review.get('rating', 3)
            
            # Base sentiment from rating
            if rating >= 4:
                sentiment = 1
                positive_count += 1
            elif rating <= 2:
                sentiment = -1
                negative_count += 1
            else:
                sentiment = 0
                neutral_count += 1
            
            # Adjust based on keywords
            pos_words = sum(1 for word in positive_keywords if word in text)
            neg_words = sum(1 for word in negative_keywords if word in text)
            
            if pos_words > neg_words:
                sentiment = max(sentiment, 0.5)
            elif neg_words > pos_words:
                sentiment = min(sentiment, -0.5)
            
            sentiment_scores.append(sentiment)
        
        return {
            'avg_sentiment': np.mean(sentiment_scores) if sentiment_scores else 0,
            'positive_reviews': positive_count,
            'negative_reviews': negative_count,
            'neutral_reviews': neutral_count,
            'sentiment_distribution': {
                'positive': positive_count / len(reviews) if reviews else 0,
                'negative': negative_count / len(reviews) if reviews else 0,
                'neutral': neutral_count / len(reviews) if reviews else 0
            }
        }
    
    async def _broadcast_review_update(self, restaurant_name: str, reviews_data: Dict):
        """Broadcast review update via WebSocket"""
        from main_api import connection_manager
        
        update_message = {
            'type': 'review_update',
            'restaurant': restaurant_name,
            'data': {
                'timestamp': reviews_data['processed_at'],
                'summary': reviews_data['summary'],
                'sentiment': reviews_data['sentiment_analysis']
            }
        }
        
        await connection_manager.broadcast(json.dumps(update_message))
    
    async def scrape_single_restaurant(self, restaurant_name: str):
        """Scrape a single restaurant on demand"""
        logger.info(f"Manual scraping triggered for {restaurant_name}")
        
        # Scrape both menu and reviews
        await self._scrape_restaurant_menu(restaurant_name)
        await self._scrape_restaurant_reviews(restaurant_name)
    
    async def stop_scraping(self):
        """Stop all scraping tasks"""
        self.is_running = False
        
        # Cancel all tasks
        for task_name, task in self.scraping_tasks.items():
            task.cancel()
            logger.info(f"Cancelled task: {task_name}")
        
        # Clean up drivers
        await self.cleanup()
        
        logger.info("Scraping service stopped")
    
    async def get_status(self) -> Dict:
        """Get current scraping status"""
        return {
            'is_running': self.is_running,
            'total_restaurants': len(self.restaurants_config),
            'active_tasks': len(self.scraping_tasks),
            'error_counts': dict(self.error_counts),
            'last_scrape_times': self.last_scrape_times,
            'driver_pool_size': len(self.driver_pool)
        }
    
    async def cleanup(self):
        """Clean up resources"""
        # Quit all drivers
        for driver in self.driver_pool:
            try:
                driver.quit()
            except:
                pass
        
        self.driver_pool.clear()
        logger.info("Cleaned up WebDriver resources")