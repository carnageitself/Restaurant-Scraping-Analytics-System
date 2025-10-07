import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from textblob import TextBlob
import statistics

logger = logging.getLogger(__name__)

class RestaurantScraperService:
    def __init__(self, db_manager, menu_scraper, review_scraper):
        self.db_manager = db_manager
        self.menu_scraper = menu_scraper
        self.review_scraper = review_scraper
        self.is_running = False
        self.scraping_tasks = {}
        self.error_counts = {}
        self.success_counts = {}
        
    async def start_periodic_scraping(self, restaurant_data: List[Tuple[str, str]]):
        """Start the real-time periodic scraping process"""
        if self.is_running:
            logger.warning("Scraping is already running")
            return
        
        self.is_running = True
        logger.info(f"Starting real-time scraping service for {len(restaurant_data)} restaurants")
        
        # Initialize success/error counters
        for name, _ in restaurant_data:
            self.error_counts[name] = 0
            self.success_counts[name] = 0
        
        # Start the main scraping loop
        await self._continuous_scraping_loop(restaurant_data)
    
    async def _continuous_scraping_loop(self, restaurant_data: List[Tuple[str, str]]):
        """Main continuous scraping loop"""
        cycle_count = 0
        
        while self.is_running:
            try:
                cycle_count += 1
                logger.info(f"Starting scraping cycle #{cycle_count}")
                
                # Scrape all restaurants
                cycle_results = await self._scrape_all_restaurants(restaurant_data)
                
                # Log cycle results
                successful = sum(1 for result in cycle_results.values() if result.get('success'))
                failed = len(cycle_results) - successful
                
                logger.info(f"Cycle #{cycle_count} complete: {successful} successful, {failed} failed")
                
                # Wait before next cycle (30 minutes)
                if self.is_running:
                    logger.info("Waiting 30 minutes before next scraping cycle...")
                    await asyncio.sleep(1800)  # 30 minutes
                
            except asyncio.CancelledError:
                logger.info("Scraping loop cancelled")
                break
            except Exception as e:
                logger.error(f"Error in scraping cycle #{cycle_count}: {e}")
                # Wait 5 minutes on error before retrying
                await asyncio.sleep(300)
    
    async def _scrape_all_restaurants(self, restaurant_data: List[Tuple[str, str]]) -> Dict[str, Dict]:
        """Scrape all restaurants in batches to avoid overwhelming servers"""
        results = {}
        batch_size = 5  # Process 5 restaurants at a time
        
        for i in range(0, len(restaurant_data), batch_size):
            batch = restaurant_data[i:i + batch_size]
            batch_results = await self._scrape_batch(batch)
            results.update(batch_results)
            
            # Small delay between batches
            if i + batch_size < len(restaurant_data):
                await asyncio.sleep(10)  # 10 seconds between batches
        
        return results
    
    async def _scrape_batch(self, batch: List[Tuple[str, str]]) -> Dict[str, Dict]:
        """Scrape a batch of restaurants concurrently"""
        tasks = []
        
        for name, url in batch:
            task = asyncio.create_task(self._scrape_single_restaurant_complete(name, url))
            tasks.append((name, task))
        
        results = {}
        for name, task in tasks:
            try:
                result = await task
                results[name] = result
            except Exception as e:
                logger.error(f"Failed to scrape {name}: {e}")
                results[name] = {'success': False, 'error': str(e)}
        
        return results
    
    async def _scrape_single_restaurant_complete(self, name: str, url: str) -> Dict:
        """Complete scraping process for a single restaurant"""
        result = {
            'name': name,
            'url': url,
            'success': False,
            'menu_success': False,
            'reviews_success': False,
            'timestamp': datetime.now().isoformat()
        }
        
        try:
            # Step 1: Scrape menu data
            logger.info(f"Scraping menu for {name}")
            menu_data = await self.menu_scraper.scrape_menu(name, url)
            
            if menu_data and menu_data.get('menu_items'):
                # Enhance menu data with additional analysis
                enhanced_menu_data = await self._enhance_menu_data(menu_data)
                
                # Save to database
                await self.db_manager.save_menu_data(name, enhanced_menu_data)
                await self.db_manager.log_scraping_activity(name, 'menu', 'success')
                
                result['menu_success'] = True
                result['menu_items_count'] = enhanced_menu_data.get('total_items', 0)
                result['categories_count'] = enhanced_menu_data.get('categories', 0)
                
                logger.info(f"Successfully scraped {enhanced_menu_data.get('total_items', 0)} menu items for {name}")
            else:
                await self.db_manager.log_scraping_activity(name, 'menu', 'failed', 'No menu data found')
                logger.warning(f"No menu data found for {name}")
            
            # Step 2: Scrape reviews from multiple sources
            review_sources = ['google', 'yelp']
            reviews_scraped = 0
            
            for source in review_sources:
                try:
                    logger.info(f"Scraping {source} reviews for {name}")
                    reviews_data = await self.review_scraper.scrape_reviews(name, source)
                    
                    if reviews_data and reviews_data.get('reviews'):
                        # Enhance reviews with sentiment analysis
                        enhanced_reviews = await self._enhance_reviews_data(reviews_data)
                        
                        # Save to database
                        await self.db_manager.save_reviews_data(name, source, enhanced_reviews)
                        await self.db_manager.log_scraping_activity(name, 'reviews', 'success')
                        
                        reviews_scraped += len(enhanced_reviews.get('reviews', []))
                        logger.info(f"Scraped {len(enhanced_reviews.get('reviews', []))} {source} reviews for {name}")
                    else:
                        await self.db_manager.log_scraping_activity(name, 'reviews', 'failed', f'No {source} reviews found')
                
                except Exception as e:
                    logger.error(f"Error scraping {source} reviews for {name}: {e}")
                    await self.db_manager.log_scraping_activity(name, 'reviews', 'error', str(e))
            
            if reviews_scraped > 0:
                result['reviews_success'] = True
                result['reviews_count'] = reviews_scraped
            
            # Overall success if either menu or reviews succeeded
            if result['menu_success'] or result['reviews_success']:
                result['success'] = True
                self.success_counts[name] = self.success_counts.get(name, 0) + 1
            else:
                self.error_counts[name] = self.error_counts.get(name, 0) + 1
            
        except Exception as e:
            logger.error(f"Complete scraping failed for {name}: {e}")
            await self.db_manager.log_scraping_activity(name, 'complete', 'error', str(e))
            self.error_counts[name] = self.error_counts.get(name, 0) + 1
            result['error'] = str(e)
        
        return result
    
    async def _enhance_menu_data(self, menu_data: Dict) -> Dict:
        """Enhance menu data with additional analysis"""
        enhanced_data = menu_data.copy()
        
        try:
            menu_items = enhanced_data.get('menu_items', [])
            
            if menu_items:
                # Categorize items automatically if not categorized
                enhanced_data['categorized_items'] = self._auto_categorize_items(menu_items)
                
                # Calculate detailed price statistics
                enhanced_data['price_stats'] = self._calculate_detailed_price_stats(menu_items)
                
                # Analyze menu composition
                enhanced_data['menu_analysis'] = self._analyze_menu_composition(menu_items)
                
                # Extract dietary information
                enhanced_data['dietary_info'] = self._extract_dietary_info(menu_items)
        
        except Exception as e:
            logger.warning(f"Error enhancing menu data: {e}")
        
        return enhanced_data
    
    def _auto_categorize_items(self, items: List[Dict]) -> Dict[str, List[Dict]]:
        """Automatically categorize menu items based on keywords"""
        category_keywords = {
            'Appetizers': ['appetizer', 'starter', 'samosa', 'pakora', 'chaat', 'kebab'],
            'Chicken': ['chicken', 'tikka', 'tandoori chicken', 'butter chicken'],
            'Lamb': ['lamb', 'goat', 'mutton'],
            'Seafood': ['fish', 'shrimp', 'salmon', 'seafood'],
            'Vegetarian': ['paneer', 'dal', 'vegetable', 'aloo', 'palak', 'chana'],
            'Rice & Biryani': ['biryani', 'rice', 'pulao'],
            'Breads': ['naan', 'roti', 'chapati', 'bread', 'kulcha'],
            'Desserts': ['dessert', 'kulfi', 'gulab jamun', 'kheer', 'sweet'],
            'Beverages': ['tea', 'coffee', 'lassi', 'juice', 'drink', 'chai']
        }
        
        categorized = {}
        
        for item in items:
            item_name = item.get('name', '').lower()
            item_desc = item.get('description', '').lower()
            current_category = item.get('category', 'Uncategorized')
            
            # If item already has a meaningful category, use it
            if current_category and current_category != 'Uncategorized':
                category = current_category
            else:
                # Auto-categorize based on keywords
                category = 'Uncategorized'
                for cat, keywords in category_keywords.items():
                    if any(keyword in item_name or keyword in item_desc for keyword in keywords):
                        category = cat
                        break
            
            if category not in categorized:
                categorized[category] = []
            
            # Update item with determined category
            item_copy = item.copy()
            item_copy['category'] = category
            categorized[category].append(item_copy)
        
        return categorized
    
    def _calculate_detailed_price_stats(self, items: List[Dict]) -> Dict:
        """Calculate detailed price statistics"""
        prices = [item['price'] for item in items if item.get('price') is not None]
        
        if not prices:
            return {'min': 0, 'max': 0, 'mean': 0, 'median': 0, 'count': 0}
        
        stats = {
            'min': min(prices),
            'max': max(prices),
            'mean': round(statistics.mean(prices), 2),
            'median': round(statistics.median(prices), 2),
            'count': len(prices),
            'std_dev': round(statistics.stdev(prices), 2) if len(prices) > 1 else 0
        }
        
        # Add price ranges
        if prices:
            stats['price_ranges'] = {
                'budget': len([p for p in prices if p < 10]),
                'moderate': len([p for p in prices if 10 <= p <= 20]),
                'premium': len([p for p in prices if p > 20])
            }
        
        return stats
    
    def _analyze_menu_composition(self, items: List[Dict]) -> Dict:
        """Analyze menu composition and patterns"""
        analysis = {
            'total_items': len(items),
            'items_with_prices': len([item for item in items if item.get('price') is not None]),
            'items_with_descriptions': len([item for item in items if item.get('description')]),
            'avg_name_length': 0,
            'avg_desc_length': 0
        }
        
        if items:
            # Calculate average lengths
            names = [item.get('name', '') for item in items if item.get('name')]
            descriptions = [item.get('description', '') for item in items if item.get('description')]
            
            if names:
                analysis['avg_name_length'] = round(sum(len(name) for name in names) / len(names), 1)
            
            if descriptions:
                analysis['avg_desc_length'] = round(sum(len(desc) for desc in descriptions) / len(descriptions), 1)
        
        return analysis
    
    def _extract_dietary_info(self, items: List[Dict]) -> Dict:
        """Extract dietary information from menu items"""
        dietary_keywords = {
            'vegetarian': ['vegetarian', 'veg', 'paneer', 'dal', 'vegetable'],
            'vegan': ['vegan'],
            'gluten_free': ['gluten free', 'gluten-free'],
            'spicy': ['spicy', 'hot', 'chili', 'pepper'],
            'mild': ['mild', 'light']
        }
        
        dietary_info = {}
        
        for dietary_type, keywords in dietary_keywords.items():
            count = 0
            for item in items:
                item_text = f"{item.get('name', '')} {item.get('description', '')}".lower()
                if any(keyword in item_text for keyword in keywords):
                    count += 1
            dietary_info[dietary_type] = count
        
        return dietary_info
    
    async def _enhance_reviews_data(self, reviews_data: Dict) -> Dict:
        """Enhance reviews data with sentiment analysis"""
        enhanced_data = reviews_data.copy()
        
        try:
            reviews = enhanced_data.get('reviews', [])
            
            if reviews:
                # Perform sentiment analysis
                sentiment_scores = []
                positive_reviews = 0
                negative_reviews = 0
                neutral_reviews = 0
                
                for review in reviews:
                    text = review.get('text', '')
                    if text and len(text) > 10:  # Only analyze substantial text
                        try:
                            blob = TextBlob(text)
                            sentiment_score = blob.sentiment.polarity
                            sentiment_scores.append(sentiment_score)
                            
                            # Categorize sentiment
                            if sentiment_score > 0.1:
                                positive_reviews += 1
                                review['sentiment'] = 'positive'
                            elif sentiment_score < -0.1:
                                negative_reviews += 1
                                review['sentiment'] = 'negative'
                            else:
                                neutral_reviews += 1
                                review['sentiment'] = 'neutral'
                            
                            review['sentiment_score'] = round(sentiment_score, 3)
                            
                        except Exception as e:
                            logger.warning(f"Error analyzing sentiment for review: {e}")
                            review['sentiment'] = 'unknown'
                
                # Calculate overall sentiment statistics
                if sentiment_scores:
                    enhanced_data['sentiment_analysis'] = {
                        'avg_sentiment': round(statistics.mean(sentiment_scores), 3),
                        'positive_reviews': positive_reviews,
                        'negative_reviews': negative_reviews,
                        'neutral_reviews': neutral_reviews,
                        'total_analyzed': len(sentiment_scores),
                        'sentiment_distribution': {
                            'positive': round(positive_reviews / len(sentiment_scores), 3) if sentiment_scores else 0,
                            'negative': round(negative_reviews / len(sentiment_scores), 3) if sentiment_scores else 0,
                            'neutral': round(neutral_reviews / len(sentiment_scores), 3) if sentiment_scores else 0
                        }
                    }
                
                # Extract common themes
                enhanced_data['review_themes'] = self._extract_review_themes(reviews)
        
        except Exception as e:
            logger.warning(f"Error enhancing reviews data: {e}")
        
        return enhanced_data
    
    def _extract_review_themes(self, reviews: List[Dict]) -> Dict:
        """Extract common themes and keywords from reviews"""
        positive_keywords = ['excellent', 'amazing', 'great', 'delicious', 'fantastic', 'love', 'perfect', 'fresh']
        negative_keywords = ['bad', 'terrible', 'awful', 'disgusting', 'slow', 'cold', 'rude', 'expensive']
        food_keywords = ['food', 'taste', 'flavor', 'spicy', 'authentic', 'portion']
        service_keywords = ['service', 'staff', 'waiter', 'server', 'friendly', 'fast', 'slow']
        
        themes = {
            'positive_mentions': 0,
            'negative_mentions': 0,
            'food_mentions': 0,
            'service_mentions': 0,
            'most_mentioned_words': {}
        }
        
        word_counts = {}
        
        for review in reviews:
            text = review.get('text', '').lower()
            words = text.split()
            
            for word in words:
                word_counts[word] = word_counts.get(word, 0) + 1
            
            # Count theme mentions
            if any(keyword in text for keyword in positive_keywords):
                themes['positive_mentions'] += 1
            if any(keyword in text for keyword in negative_keywords):
                themes['negative_mentions'] += 1
            if any(keyword in text for keyword in food_keywords):
                themes['food_mentions'] += 1
            if any(keyword in text for keyword in service_keywords):
                themes['service_mentions'] += 1
        
        # Get top mentioned words (excluding common words)
        common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'}
        
        filtered_words = {word: count for word, count in word_counts.items() 
                         if len(word) > 3 and word not in common_words and count > 1}
        
        # Get top 10 most mentioned words
        sorted_words = sorted(filtered_words.items(), key=lambda x: x[1], reverse=True)[:10]
        themes['most_mentioned_words'] = dict(sorted_words)
        
        return themes
    
    async def stop_scraping(self):
        """Stop all scraping tasks"""
        self.is_running = False
        
        # Cancel any running tasks
        for task in list(self.scraping_tasks.values()):
            if not task.done():
                task.cancel()
        
        self.scraping_tasks.clear()
        logger.info("Real-time scraping service stopped")
    
    async def get_status(self) -> Dict:
        """Get current scraping status with real metrics"""
        total_errors = sum(self.error_counts.values())
        total_successes = sum(self.success_counts.values())
        
        return {
            'is_running': self.is_running,
            'total_restaurants': len(self.error_counts),
            'active_tasks': len([task for task in self.scraping_tasks.values() if not task.done()]),
            'error_counts': self.error_counts.copy(),
            'success_counts': self.success_counts.copy(),
            'total_errors': total_errors,
            'total_successes': total_successes,
            'success_rate': round(total_successes / (total_successes + total_errors), 3) if (total_successes + total_errors) > 0 else 0,
            'last_status_check': datetime.now().isoformat()
        }
    
    async def scrape_single_restaurant(self, restaurant_name: str, restaurant_url: str):
        """Scrape a single restaurant on demand"""
        logger.info(f"Manual scraping triggered for {restaurant_name}")
        
        # Create a task for this single restaurant
        task = asyncio.create_task(self._scrape_single_restaurant_complete(restaurant_name, restaurant_url))
        self.scraping_tasks[restaurant_name] = task
        
        try:
            result = await task
            logger.info(f"Manual scraping completed for {restaurant_name}: {result.get('success', False)}")
            return result
        except Exception as e:
            logger.error(f"Manual scraping failed for {restaurant_name}: {e}")
            return {'success': False, 'error': str(e)}
        finally:
            # Clean up task
            if restaurant_name in self.scraping_tasks:
                del self.scraping_tasks[restaurant_name]
    
    async def cleanup(self):
        """Clean up resources"""
        await self.stop_scraping()
        
        # Cleanup scrapers
        if hasattr(self.menu_scraper, 'cleanup'):
            await self.menu_scraper.cleanup()
        if hasattr(self.review_scraper, 'cleanup'):
            await self.review_scraper.cleanup()
        
        logger.info("Scraper service cleaned up")