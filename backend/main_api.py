from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Restaurant Scraping API",
    description="Real-time restaurant data scraping and analysis API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
is_scraping = False
active_connections: List[WebSocket] = []

# Mock data
MOCK_RESTAURANTS = [
    {
        'name': 'India Quality',
        'url': 'https://indiaquality.com/food-menu',
        'updated_at': '2024-01-15T10:30:00Z',
        'menu_items_count': 85,
        'categories_count': 12,
        'menu_last_scraped': '2024-01-15T08:00:00Z',
        'review_sources_count': 2,
        'reviews_last_scraped': '2024-01-15T10:15:00Z'
    },
    {
        'name': 'Mela Modern Indian',
        'url': 'https://melainboston.com/food-menu',
        'updated_at': '2024-01-15T09:45:00Z',
        'menu_items_count': 67,
        'categories_count': 10,
        'menu_last_scraped': '2024-01-14T20:30:00Z',
        'review_sources_count': 3,
        'reviews_last_scraped': '2024-01-15T09:30:00Z'
    },
    {
        'name': 'Halal Indian Cuisine',
        'url': 'https://www.halalindiancuisineboston.com/menu',
        'updated_at': '2024-01-15T11:00:00Z',
        'menu_items_count': 92,
        'categories_count': 14,
        'menu_last_scraped': '2024-01-15T07:45:00Z',
        'review_sources_count': 1,
        'reviews_last_scraped': '2024-01-15T10:45:00Z'
    },
    {
        'name': 'Ssaanjh Modern Indian',
        'url': 'https://www.ssaanjh.com/menu/',
        'updated_at': '2024-01-15T08:20:00Z',
        'menu_items_count': 78,
        'categories_count': 11,
        'menu_last_scraped': '2024-01-14T19:15:00Z',
        'review_sources_count': 2,
        'reviews_last_scraped': '2024-01-15T08:00:00Z'
    },
    {
        'name': 'Wow Tikka',
        'url': 'https://www.wowtikka.com/menu/',
        'updated_at': '2024-01-15T12:10:00Z',
        'menu_items_count': 56,
        'categories_count': 8,
        'menu_last_scraped': '2024-01-15T06:30:00Z',
        'review_sources_count': 2,
        'reviews_last_scraped': '2024-01-15T11:50:00Z'
    }
]

MOCK_DETAILED_RESTAURANTS = {
    'India Quality': {
        'menu_data': {
            'menu_items': [
                {'name': 'Chicken Tikka Masala', 'price': 16.99, 'category': 'Chicken', 'description': 'Tender chicken in creamy tomato sauce'},
                {'name': 'Vegetable Biryani', 'price': 14.99, 'category': 'Rice', 'description': 'Fragrant basmati rice with mixed vegetables'},
                {'name': 'Garlic Naan', 'price': 3.99, 'category': 'Breads', 'description': 'Fresh baked bread with garlic'},
                {'name': 'Lamb Curry', 'price': 18.99, 'category': 'Lamb', 'description': 'Spiced lamb in traditional curry sauce'},
                {'name': 'Samosa (2pcs)', 'price': 5.99, 'category': 'Appetizers', 'description': 'Crispy pastry with spiced filling'}
            ],
            'categorized_items': {
                'Chicken': [
                    {'name': 'Chicken Tikka Masala', 'price': 16.99, 'description': 'Tender chicken in creamy tomato sauce'},
                    {'name': 'Butter Chicken', 'price': 17.99, 'description': 'Rich and creamy chicken curry'}
                ],
                'Rice': [
                    {'name': 'Vegetable Biryani', 'price': 14.99, 'description': 'Fragrant basmati rice with mixed vegetables'},
                    {'name': 'Chicken Biryani', 'price': 16.99, 'description': 'Aromatic rice with spiced chicken'}
                ],
                'Breads': [
                    {'name': 'Garlic Naan', 'price': 3.99, 'description': 'Fresh baked bread with garlic'},
                    {'name': 'Plain Naan', 'price': 2.99, 'description': 'Traditional Indian bread'}
                ]
            },
            'price_stats': {
                'min': 2.99,
                'max': 18.99,
                'mean': 12.45,
                'median': 14.99,
                'count': 15
            },
            'total_items': 85,
            'categories': 12,
            'scraped_at': '2024-01-15T08:00:00Z'
        },
        'reviews_data': {
            'sources': {
                'google': {
                    'reviews': [
                        {'author': 'John D.', 'rating': 5, 'text': 'Amazing food and great service!', 'date': '2024-01-14T18:00:00Z'},
                        {'author': 'Sarah M.', 'rating': 4, 'text': 'Delicious curry, will come back', 'date': '2024-01-13T19:30:00Z'}
                    ]
                },
                'yelp': {
                    'reviews': [
                        {'author': 'Mike R.', 'rating': 5, 'text': 'Best Indian food in Boston!', 'date': '2024-01-12T20:15:00Z'}
                    ]
                }
            },
            'sentiment_analysis': {
                'avg_sentiment': 0.8,
                'positive_reviews': 18,
                'negative_reviews': 2,
                'neutral_reviews': 5,
                'sentiment_distribution': {
                    'positive': 0.72,
                    'negative': 0.08,
                    'neutral': 0.20
                }
            },
            'summary': {
                'total_reviews': 25,
                'recent_reviews_count': 8,
                'avg_rating': 4.4,
                'sources_count': 2
            },
            'last_scraped': '2024-01-15T10:15:00Z'
        },
        'last_updated': '2024-01-15T10:30:00Z'
    }
}

# WebSocket connection manager
async def connect_websocket(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    logger.info(f"WebSocket connected. Total connections: {len(active_connections)}")
    
    # Send welcome message
    welcome_message = {
        'type': 'connection_established',
        'message': 'Connected to Restaurant Scraping API',
        'timestamp': datetime.now().isoformat()
    }
    await websocket.send_text(json.dumps(welcome_message))

def disconnect_websocket(websocket: WebSocket):
    if websocket in active_connections:
        active_connections.remove(websocket)
    logger.info(f"WebSocket disconnected. Total connections: {len(active_connections)}")

async def broadcast_message(message: dict):
    if active_connections:
        message_str = json.dumps(message)
        disconnected = []
        
        for connection in active_connections:
            try:
                await connection.send_text(message_str)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")
                disconnected.append(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            disconnect_websocket(connection)

# API Routes

@app.get("/")
async def root():
    return {"message": "Restaurant Scraping API is running", "timestamp": datetime.now().isoformat()}

@app.get("/api/restaurants")
async def get_all_restaurants():
    """Get all restaurant data"""
    logger.info("Fetching all restaurants")
    return MOCK_RESTAURANTS

@app.get("/api/restaurants/{restaurant_name}")
async def get_restaurant(restaurant_name: str):
    """Get specific restaurant data"""
    logger.info(f"Fetching restaurant: {restaurant_name}")
    
    # First check if restaurant exists in basic data
    restaurant_found = None
    for restaurant in MOCK_RESTAURANTS:
        if restaurant['name'] == restaurant_name:
            restaurant_found = restaurant
            break
    
    if not restaurant_found:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Return detailed data if available, otherwise construct from basic data
    if restaurant_name in MOCK_DETAILED_RESTAURANTS:
        return {
            "name": restaurant_name,
            "url": restaurant_found['url'],
            **MOCK_DETAILED_RESTAURANTS[restaurant_name]
        }
    else:
        # Construct basic response
        return {
            "name": restaurant_name,
            "url": restaurant_found['url'],
            "menu_data": {
                "total_items": restaurant_found['menu_items_count'],
                "categories": restaurant_found['categories_count'],
                "scraped_at": restaurant_found['menu_last_scraped'],
                "menu_items": [],
                "categorized_items": {},
                "price_stats": {"min": 0, "max": 0, "mean": 0, "median": 0, "count": 0}
            },
            "reviews_data": {
                "summary": {
                    "total_reviews": 15,
                    "recent_reviews_count": 3,
                    "avg_rating": 4.2,
                    "sources_count": restaurant_found['review_sources_count']
                },
                "sentiment_analysis": {
                    "avg_sentiment": 0.6,
                    "positive_reviews": 10,
                    "negative_reviews": 2,
                    "neutral_reviews": 3
                },
                "last_scraped": restaurant_found['reviews_last_scraped']
            },
            "last_updated": restaurant_found['updated_at']
        }

@app.get("/api/restaurants/{restaurant_name}/reviews")
async def get_restaurant_reviews(restaurant_name: str):
    """Get latest reviews for a specific restaurant"""
    logger.info(f"Fetching reviews for: {restaurant_name}")
    
    # Check if restaurant exists
    restaurant_exists = any(r['name'] == restaurant_name for r in MOCK_RESTAURANTS)
    if not restaurant_exists:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    return {
        "restaurant_name": restaurant_name,
        "sources": {
            "google": {
                "reviews": [
                    {"author": "John D.", "rating": 5, "text": "Great food!", "date": "2024-01-14T18:00:00Z"},
                    {"author": "Jane S.", "rating": 4, "text": "Good service", "date": "2024-01-13T19:00:00Z"}
                ]
            }
        },
        "combined_sentiment": {
            "avg_sentiment": 0.7,
            "positive_reviews": 8,
            "negative_reviews": 1,
            "neutral_reviews": 2
        },
        "total_sources": 1,
        "scraped_at": datetime.now().isoformat()
    }

@app.get("/api/analytics/summary")
async def get_analytics_summary():
    """Get analytics summary across all restaurants"""
    logger.info("Fetching analytics summary")
    
    total_items = sum(r['menu_items_count'] for r in MOCK_RESTAURANTS)
    avg_items = total_items / len(MOCK_RESTAURANTS) if MOCK_RESTAURANTS else 0
    
    return {
        'total_restaurants': len(MOCK_RESTAURANTS),
        'total_menu_scrapes': 45,
        'total_review_scrapes': 128,
        'avg_menu_items': round(avg_items, 1),
        'total_menu_items': total_items,
        'active_restaurants_24h': len(MOCK_RESTAURANTS),
        'recent_scrapes_24h': 23,
        'top_categories': [
            ['Chicken', 45],
            ['Vegetarian', 38],
            ['Rice & Biryani', 32],
            ['Breads', 28],
            ['Appetizers', 25],
            ['Lamb', 22],
            ['Seafood', 18],
            ['Desserts', 15],
            ['Beverages', 12],
            ['Tandoori', 19]
        ],
        'generated_at': datetime.now().isoformat()
    }

@app.get("/api/analytics/trends")
async def get_trends_data():
    """Get trending data for visualization"""
    logger.info("Fetching trends data")
    
    return {
        'activity_trends': [
            {'date': '2024-01-10', 'reviews': 5, 'menu_scrapes': 2},
            {'date': '2024-01-11', 'reviews': 8, 'menu_scrapes': 1},
            {'date': '2024-01-12', 'reviews': 6, 'menu_scrapes': 3},
            {'date': '2024-01-13', 'reviews': 9, 'menu_scrapes': 2},
            {'date': '2024-01-14', 'reviews': 7, 'menu_scrapes': 1},
            {'date': '2024-01-15', 'reviews': 12, 'menu_scrapes': 2},
            {'date': '2024-01-16', 'reviews': 10, 'menu_scrapes': 3}
        ],
        'sentiment_trends': [
            {'restaurant': 'India Quality', 'sentiment': 0.8, 'date': '2024-01-15T10:00:00Z'},
            {'restaurant': 'Mela Modern Indian', 'sentiment': 0.6, 'date': '2024-01-15T09:00:00Z'},
            {'restaurant': 'Halal Indian Cuisine', 'sentiment': 0.4, 'date': '2024-01-15T08:00:00Z'},
            {'restaurant': 'Ssaanjh Modern Indian', 'sentiment': 0.7, 'date': '2024-01-15T07:00:00Z'},
            {'restaurant': 'Wow Tikka', 'sentiment': 0.5, 'date': '2024-01-15T06:00:00Z'}
        ],
        'generated_at': datetime.now().isoformat()
    }

@app.get("/api/status")
async def get_scraping_status():
    """Get current scraping status"""
    logger.info("Fetching scraping status")
    
    return {
        "is_running": is_scraping,
        "last_scrape_time": datetime.now().isoformat() if is_scraping else None,
        "total_restaurants": len(MOCK_RESTAURANTS),
        "successful_scrapes": len(MOCK_RESTAURANTS),
        "errors": []
    }

@app.post("/api/scrape/start")
async def start_scraping():
    """Start the scraping process"""
    global is_scraping
    is_scraping = True
    logger.info("Scraping started")
    
    # Broadcast status update
    await broadcast_message({
        'type': 'system_status',
        'data': {'is_running': True},
        'timestamp': datetime.now().isoformat()
    })
    
    return {"message": "Scraping started"}

@app.post("/api/scrape/stop")
async def stop_scraping():
    """Stop the scraping process"""
    global is_scraping
    is_scraping = False
    logger.info("Scraping stopped")
    
    # Broadcast status update
    await broadcast_message({
        'type': 'system_status',
        'data': {'is_running': False},
        'timestamp': datetime.now().isoformat()
    })
    
    return {"message": "Scraping stopped"}

@app.post("/api/scrape/restaurant/{restaurant_name}")
async def scrape_single_restaurant(restaurant_name: str):
    """Trigger scraping for a single restaurant"""
    logger.info(f"Manual scraping triggered for {restaurant_name}")
    
    # Check if restaurant exists
    restaurant_exists = any(r['name'] == restaurant_name for r in MOCK_RESTAURANTS)
    if not restaurant_exists:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Simulate scraping delay
    await asyncio.sleep(2)
    
    # Broadcast update
    await broadcast_message({
        'type': 'restaurant_update',
        'restaurant': restaurant_name,
        'update_type': 'reviews',
        'data': {'status': 'completed'},
        'timestamp': datetime.now().isoformat()
    })
    
    return {"message": f"Scraping completed for {restaurant_name}"}

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await connect_websocket(websocket)
    try:
        while True:
            # Keep connection alive with periodic pings
            await asyncio.sleep(30)
            ping_message = {
                "type": "ping", 
                "timestamp": datetime.now().isoformat()
            }
            await websocket.send_text(json.dumps(ping_message))
    except WebSocketDisconnect:
        disconnect_websocket(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        disconnect_websocket(websocket)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "active_connections": len(active_connections),
        "scraping_status": is_scraping
    }

# Run the application
if __name__ == "__main__":
    print("🚀 Starting Restaurant Scraping API...")
    print("📡 API available at: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🔄 WebSocket endpoint: ws://localhost:8000/ws")
    print("-" * 50)
    
    uvicorn.run(
        "main_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )