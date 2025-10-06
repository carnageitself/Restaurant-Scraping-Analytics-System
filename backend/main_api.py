from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import uvicorn
from pydantic import BaseModel
import logging
from contextlib import asynccontextmanager

from scraper_service import RestaurantScraperService
from database_manager import DatabaseManager
from websocket_manager import ConnectionManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global services
scraper_service = None
db_manager = None
connection_manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global scraper_service, db_manager
    db_manager = DatabaseManager()
    scraper_service = RestaurantScraperService(db_manager)
    
    # Start background tasks
    asyncio.create_task(scraper_service.start_periodic_scraping())
    
    yield
    
    # Shutdown
    if scraper_service:
        await scraper_service.cleanup()

app = FastAPI(
    title="Restaurant Scraping API",
    description="Real-time restaurant data scraping and analysis API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class RestaurantData(BaseModel):
    restaurant_name: str
    url: str
    menu_items: List[Dict]
    reviews_data: Dict
    price_stats: Dict
    scraped_at: str

class ScrapingStatus(BaseModel):
    is_running: bool
    last_scrape_time: Optional[str]
    total_restaurants: int
    successful_scrapes: int
    errors: List[Dict]

# API Endpoints

@app.get("/")
async def root():
    return {"message": "Restaurant Scraping API is running"}

@app.get("/api/status")
async def get_scraping_status() -> ScrapingStatus:
    """Get current scraping status"""
    global scraper_service
    if not scraper_service:
        raise HTTPException(status_code=500, detail="Scraper service not initialized")
    
    status = await scraper_service.get_status()
    return ScrapingStatus(**status)

@app.get("/api/restaurants")
async def get_all_restaurants() -> List[Dict]:
    """Get all restaurant data"""
    global db_manager
    if not db_manager:
        raise HTTPException(status_code=500, detail="Database manager not initialized")
    
    restaurants = await db_manager.get_all_restaurants()
    return restaurants

@app.get("/api/restaurants/{restaurant_name}")
async def get_restaurant(restaurant_name: str) -> Dict:
    """Get specific restaurant data"""
    global db_manager
    if not db_manager:
        raise HTTPException(status_code=500, detail="Database manager not initialized")
    
    restaurant = await db_manager.get_restaurant(restaurant_name)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    return restaurant

@app.get("/api/restaurants/{restaurant_name}/reviews")
async def get_restaurant_reviews(restaurant_name: str) -> Dict:
    """Get latest reviews for a specific restaurant"""
    global db_manager
    if not db_manager:
        raise HTTPException(status_code=500, detail="Database manager not initialized")
    
    reviews = await db_manager.get_restaurant_reviews(restaurant_name)
    if not reviews:
        raise HTTPException(status_code=404, detail="Reviews not found")
    
    return reviews

@app.post("/api/scrape/start")
async def start_scraping(background_tasks: BackgroundTasks):
    """Start the scraping process"""
    global scraper_service
    if not scraper_service:
        raise HTTPException(status_code=500, detail="Scraper service not initialized")
    
    background_tasks.add_task(scraper_service.start_periodic_scraping)
    return {"message": "Scraping started"}

@app.post("/api/scrape/stop")
async def stop_scraping():
    """Stop the scraping process"""
    global scraper_service
    if not scraper_service:
        raise HTTPException(status_code=500, detail="Scraper service not initialized")
    
    await scraper_service.stop_scraping()
    return {"message": "Scraping stopped"}

@app.post("/api/scrape/restaurant/{restaurant_name}")
async def scrape_single_restaurant(restaurant_name: str, background_tasks: BackgroundTasks):
    """Trigger scraping for a single restaurant"""
    global scraper_service
    if not scraper_service:
        raise HTTPException(status_code=500, detail="Scraper service not initialized")
    
    background_tasks.add_task(scraper_service.scrape_single_restaurant, restaurant_name)
    return {"message": f"Scraping triggered for {restaurant_name}"}

@app.get("/api/analytics/summary")
async def get_analytics_summary() -> Dict:
    """Get analytics summary across all restaurants"""
    global db_manager
    if not db_manager:
        raise HTTPException(status_code=500, detail="Database manager not initialized")
    
    summary = await db_manager.get_analytics_summary()
    return summary

@app.get("/api/analytics/trends")
async def get_trends_data() -> Dict:
    """Get trending data for visualization"""
    global db_manager
    if not db_manager:
        raise HTTPException(status_code=500, detail="Database manager not initialized")
    
    trends = await db_manager.get_trends_data()
    return trends

# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await connection_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await asyncio.sleep(10)
            await websocket.send_text(json.dumps({"type": "ping", "timestamp": datetime.now().isoformat()}))
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    uvicorn.run(
        "main_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )