import asyncio
import aiohttp
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json
import re
from bs4 import BeautifulSoup
import random

logger = logging.getLogger(__name__)

class ReviewScraper:
    def __init__(self):
        self.session = None
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Rate limiting
        self.last_request_time = {}
        self.min_request_interval = 5  # 5 seconds between requests
        
        # Restaurant search terms mapping
        self.restaurant_search_terms = {
            'India Quality': ['India Quality Restaurant Boston', 'India Quality Cambridge'],
            'Mela Modern Indian': ['Mela Indian Restaurant Boston', 'Mela Modern Indian Boston'],
            'Halal Indian Cuisine': ['Halal Indian Cuisine Boston', 'Halal Indian Boston'],
            'Ssaanjh Modern Indian': ['Ssaanjh Modern Indian', 'Ssaanjh Restaurant Boston'],
            'Wow Tikka': ['Wow Tikka Boston', 'Wow Tikka Restaurant'],
            'Nachlo Cuisine': ['Nachlo Cuisine Roxbury', 'Nachlo Indian Restaurant'],
            'Mumbai Spice': ['Mumbai Spice Boston', 'Mumbai Spice Restaurant'],
            'Sarva Indian Cuisine': ['Sarva Indian Cuisine', 'Sarva Restaurant Boston'],
            'Dont Tell Aunty': ['Dont Tell Aunty Boston', 'Don\'t Tell Aunty Restaurant'],
            'Namastay Boston': ['Namastay Boston', 'Namastay Indian Restaurant'],
            'Mirchi Nation': ['Mirchi Nation Brookline', 'Mirchi Nation Restaurant'],
            'Vaishakhi Boston': ['Vaishakhi Boston', 'Vaishakhi Indian Restaurant'],
            'Madras Dosa': ['Madras Dosa Boston', 'Madras Dosa Company'],
            'Singhs Dhaba': ['Singhs Dhaba Boston', 'Singh\'s Dhaba Restaurant'],
            'Momo Masala': ['Momo Masala Boston', 'Momo Masala Restaurant'],
            'Shan A Punjab': ['Shan A Punjab Boston', 'Shan-A-Punjab Restaurant'],
            'Desi Dhaba': ['Desi Dhaba Cambridge', 'Desi Dhaba Restaurant'],
            'Depth N Green': ['Depth N Green Cambridge', 'Depth and Green Restaurant']
        }
    
    async def initialize(self):
        """Initialize aiohttp session"""
        if not self.session:
            timeout = aiohttp.ClientTimeout(total=30)
            self.session = aiohttp.ClientSession(
                timeout=timeout,
                headers=self.headers
            )
    
    async def cleanup(self):
        """Cleanup aiohttp session"""
        if self.session:
            await self.session.close()
            self.session = None
    
    async def _rate_limit(self, source: str):
        """Implement rate limiting"""
        current_time = datetime.now()
        last_request = self.last_request_time.get(source)
        
        if last_request:
            time_diff = (current_time - last_request).total_seconds()
            if time_diff < self.min_request_interval:
                wait_time = self.min_request_interval - time_diff
                logger.info(f"Rate limiting: waiting {wait_time:.1f}s for {source}")
                await asyncio.sleep(wait_time)
        
        self.last_request_time[source] = current_time
    
    async def scrape_reviews(self, restaurant_name: str, source: str) -> Optional[Dict]:
        """Main method to scrape reviews from various sources"""
        await self.initialize()
        
        try:
            if source == 'google':
                return await self._scrape_google_reviews(restaurant_name)
            elif source == 'yelp':
                return await self._scrape_yelp_reviews(restaurant_name)
            elif source == 'tripadvisor':
                return await self._scrape_tripadvisor_reviews(restaurant_name)
            else:
                logger.warning(f"Unknown review source: {source}")
                return None
                
        except Exception as e:
            logger.error(f"Error scraping {source} reviews for {restaurant_name}: {e}")
            return None
    
    async def _scrape_google_reviews(self, restaurant_name: str) -> Optional[Dict]:
        """Scrape Google reviews (simplified approach)"""
        await self._rate_limit('google')
        
        search_terms = self.restaurant_search_terms.get(restaurant_name, [restaurant_name])
        
        try:
            # Use Google My Business API alternative or Google Search results
            # Note: This is a simplified implementation
            # In production, you'd use Google Places API or similar
            
            search_url = "https://www.google.com/search"
            params = {
                'q': f"{search_terms[0]} reviews",
                'tbm': 'nws'  # News search to avoid being blocked
            }
            
            async with self.session.get(search_url, params=params) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Extract basic review information
                    reviews = self._parse_google_search_results(soup, restaurant_name)
                    
                    return {
                        'source': 'google',
                        'restaurant_name': restaurant_name,
                        'reviews': reviews,
                        'scraped_at': datetime.now().isoformat(),
                        'total_reviews': len(reviews)
                    }
                else:
                    logger.warning(f"Google search returned status {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error scraping Google reviews for {restaurant_name}: {e}")
            return None
    
    async def _scrape_yelp_reviews(self, restaurant_name: str) -> Optional[Dict]:
        """Scrape Yelp reviews"""
        await self._rate_limit('yelp')
        
        search_terms = self.restaurant_search_terms.get(restaurant_name, [restaurant_name])
        
        try:
            # Search for restaurant on Yelp
            search_url = "https://www.yelp.com/search"
            params = {
                'find_desc': search_terms[0],
                'find_loc': 'Boston, MA'
            }
            
            async with self.session.get(search_url, params=params) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Find restaurant link
                    restaurant_link = self._find_yelp_restaurant_link(soup, restaurant_name)
                    
                    if restaurant_link:
                        # Scrape individual restaurant page
                        reviews = await self._scrape_yelp_restaurant_page(restaurant_link)
                        
                        return {
                            'source': 'yelp',
                            'restaurant_name': restaurant_name,
                            'reviews': reviews,
                            'scraped_at': datetime.now().isoformat(),
                            'total_reviews': len(reviews)
                        }
                    else:
                        logger.warning(f"Could not find Yelp page for {restaurant_name}")
                        return None
                else:
                    logger.warning(f"Yelp search returned status {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error scraping Yelp reviews for {restaurant_name}: {e}")
            return None
    
    async def _scrape_tripadvisor_reviews(self, restaurant_name: str) -> Optional[Dict]:
        """Scrape TripAdvisor reviews"""
        await self._rate_limit('tripadvisor')
        
        # Similar implementation to Yelp
        # This is a placeholder for TripAdvisor scraping
        return {
            'source': 'tripadvisor',
            'restaurant_name': restaurant_name,
            'reviews': [],  # Placeholder
            'scraped_at': datetime.now().isoformat(),
            'total_reviews': 0
        }
    
    def _parse_google_search_results(self, soup: BeautifulSoup, restaurant_name: str) -> List[Dict]:
        """Parse Google search results for review mentions"""
        reviews = []
        
        try:
            # Look for review snippets in search results
            result_divs = soup.find_all('div', class_='g')
            
            for div in result_divs:
                title_elem = div.find('h3')
                snippet_elem = div.find('span', class_='aCOpRe')
                
                if title_elem and snippet_elem:
                    title = title_elem.get_text()
                    snippet = snippet_elem.get_text()
                    
                    # Check if this looks like a review
                    if any(word in snippet.lower() for word in ['review', 'rating', 'star', 'good', 'bad', 'excellent']):
                        # Extract rating if possible
                        rating_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:star|/5)', snippet, re.IGNORECASE)
                        rating = float(rating_match.group(1)) if rating_match else None
                        
                        reviews.append({
                            'title': title,
                            'text': snippet,
                            'rating': rating,
                            'source': 'google_search',
                            'date': datetime.now().isoformat(),
                            'author': 'Anonymous'
                        })
                        
                        if len(reviews) >= 10:  # Limit to 10 reviews from search
                            break
            
        except Exception as e:
            logger.error(f"Error parsing Google search results: {e}")
        
        return reviews
    
    def _find_yelp_restaurant_link(self, soup: BeautifulSoup, restaurant_name: str) -> Optional[str]:
        """Find the Yelp restaurant page link from search results"""
        try:
            # Look for business listings
            business_links = soup.find_all('a', href=re.compile(r'/biz/'))
            
            for link in business_links:
                link_text = link.get_text().lower()
                if any(term.lower() in link_text for term in restaurant_name.split()):
                    return 'https://www.yelp.com' + link.get('href')
            
        except Exception as e:
            logger.error(f"Error finding Yelp restaurant link: {e}")
        
        return None
    
    async def _scrape_yelp_restaurant_page(self, restaurant_url: str) -> List[Dict]:
        """Scrape reviews from Yelp restaurant page"""
        reviews = []
        
        try:
            await self._rate_limit('yelp_restaurant')
            
            async with self.session.get(restaurant_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Find review elements
                    review_elements = soup.find_all('div', class_=re.compile(r'review.*'))
                    
                    for review_elem in review_elements[:20]:  # Limit to 20 reviews
                        try:
                            # Extract review data
                            author_elem = review_elem.find('a', class_=re.compile(r'user.*'))
                            author = author_elem.get_text().strip() if author_elem else 'Anonymous'
                            
                            # Extract rating
                            rating_elem = review_elem.find('div', class_=re.compile(r'rating.*'))
                            rating = self._extract_yelp_rating(rating_elem) if rating_elem else None
                            
                            # Extract review text
                            text_elem = review_elem.find('p', class_=re.compile(r'comment.*'))
                            text = text_elem.get_text().strip() if text_elem else ''
                            
                            # Extract date
                            date_elem = review_elem.find('span', class_=re.compile(r'date.*'))
                            date_str = date_elem.get_text().strip() if date_elem else ''
                            
                            if text and len(text) > 10:  # Only include substantial reviews
                                reviews.append({
                                    'author': author,
                                    'rating': rating,
                                    'text': text,
                                    'date': self._parse_yelp_date(date_str),
                                    'source': 'yelp',
                                    'url': restaurant_url
                                })
                                
                        except Exception as e:
                            logger.warning(f"Error parsing individual Yelp review: {e}")
                            continue
                
        except Exception as e:
            logger.error(f"Error scraping Yelp restaurant page: {e}")
        
        return reviews
    
    def _extract_yelp_rating(self, rating_elem) -> Optional[float]:
        """Extract rating from Yelp rating element"""
        try:
            # Look for aria-label with rating
            aria_label = rating_elem.get('aria-label', '')
            rating_match = re.search(r'(\d+(?:\.\d+)?)\s*star', aria_label, re.IGNORECASE)
            if rating_match:
                return float(rating_match.group(1))
            
            # Look for class names with rating
            class_name = rating_elem.get('class', [])
            for cls in class_name:
                if 'stars_' in cls:
                    rating_match = re.search(r'stars_(\d+(?:_5)?)', cls)
                    if rating_match:
                        rating_str = rating_match.group(1).replace('_5', '.5')
                        return float(rating_str)
                        
        except Exception as e:
            logger.warning(f"Error extracting Yelp rating: {e}")
        
        return None
    
    def _parse_yelp_date(self, date_str: str) -> str:
        """Parse Yelp date string to ISO format"""
        try:
            if not date_str:
                return datetime.now().isoformat()
            
            # Handle various Yelp date formats
            date_str = date_str.strip()
            
            # Try to parse common formats
            for fmt in ['%m/%d/%Y', '%B %d, %Y', '%b %d, %Y']:
                try:
                    parsed_date = datetime.strptime(date_str, fmt)
                    return parsed_date.isoformat()
                except ValueError:
                    continue
            
            # If all else fails, return current time
            return datetime.now().isoformat()
            
        except Exception:
            return datetime.now().isoformat()
    
    async def scrape_multiple_sources(self, restaurant_name: str, sources: List[str]) -> Dict:
        """Scrape reviews from multiple sources concurrently"""
        tasks = []
        
        for source in sources:
            task = asyncio.create_task(self.scrape_reviews(restaurant_name, source))
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        combined_results = {
            'restaurant_name': restaurant_name,
            'sources': {},
            'total_reviews': 0,
            'scraped_at': datetime.now().isoformat()
        }
        
        for i, result in enumerate(results):
            source = sources[i]
            
            if isinstance(result, Exception):
                logger.error(f"Error scraping {source} for {restaurant_name}: {result}")
                continue
            
            if result and isinstance(result, dict):
                combined_results['sources'][source] = result
                combined_results['total_reviews'] += result.get('total_reviews', 0)
        
        return combined_results
    
    def generate_mock_reviews(self, restaurant_name: str, source: str) -> Dict:
        """Generate mock review data for testing purposes"""
        mock_reviews = [
            {
                'author': 'John D.',
                'rating': 4.5,
                'text': 'Great food and excellent service. The curry was amazing!',
                'date': (datetime.now() - timedelta(hours=random.randint(1, 48))).isoformat(),
                'source': source
            },
            {
                'author': 'Sarah M.',
                'rating': 3.5,
                'text': 'Good food but a bit expensive. Service was slow.',
                'date': (datetime.now() - timedelta(hours=random.randint(1, 72))).isoformat(),
                'source': source
            },
            {
                'author': 'Mike R.',
                'rating': 5.0,
                'text': 'Absolutely fantastic! Best Indian food in Boston.',
                'date': (datetime.now() - timedelta(hours=random.randint(1, 24))).isoformat(),
                'source': source
            },
            {
                'author': 'Lisa K.',
                'rating': 4.0,
                'text': 'Delicious food, nice atmosphere. Will come back!',
                'date': (datetime.now() - timedelta(hours=random.randint(1, 96))).isoformat(),
                'source': source
            }
        ]
        
        # Randomly select 2-4 reviews
        selected_reviews = random.sample(mock_reviews, random.randint(2, 4))
        
        return {
            'source': source,
            'restaurant_name': restaurant_name,
            'reviews': selected_reviews,
            'scraped_at': datetime.now().isoformat(),
            'total_reviews': len(selected_reviews)
        }