import asyncio
import json
import logging
from datetime import datetime
from typing import List, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_data: Dict[WebSocket, Dict] = {}
    
    async def connect(self, websocket: WebSocket):
        """Accept a WebSocket connection"""
        await websocket.accept()
        self.active_connections.append(websocket)
        
        # Store connection metadata
        self.connection_data[websocket] = {
            'connected_at': datetime.now().isoformat(),
            'last_ping': datetime.now().isoformat()
        }
        
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
        
        # Send welcome message
        welcome_message = {
            'type': 'connection_established',
            'message': 'Connected to Restaurant Scraping API',
            'timestamp': datetime.now().isoformat()
        }
        
        await self.send_personal_message(json.dumps(welcome_message), websocket)
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if websocket in self.connection_data:
            del self.connection_data[websocket]
        
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific WebSocket connection"""
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            self.disconnect(websocket)
    
    async def broadcast(self, message: str):
        """Broadcast a message to all active connections"""
        if not self.active_connections:
            return
        
        # Create list of connections to avoid modification during iteration
        connections_copy = self.active_connections.copy()
        
        for connection in connections_copy:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to connection: {e}")
                self.disconnect(connection)
    
    async def broadcast_restaurant_update(self, restaurant_name: str, update_type: str, data: Dict):
        """Broadcast restaurant-specific updates"""
        message = {
            'type': 'restaurant_update',
            'restaurant': restaurant_name,
            'update_type': update_type,  # 'menu', 'reviews', 'status'
            'data': data,
            'timestamp': datetime.now().isoformat()
        }
        
        await self.broadcast(json.dumps(message))
        logger.info(f"Broadcasted {update_type} update for {restaurant_name}")
    
    async def broadcast_system_status(self, status: Dict):
        """Broadcast system status updates"""
        message = {
            'type': 'system_status',
            'data': status,
            'timestamp': datetime.now().isoformat()
        }
        
        await self.broadcast(json.dumps(message))
    
    async def broadcast_scraping_progress(self, progress_data: Dict):
        """Broadcast scraping progress updates"""
        message = {
            'type': 'scraping_progress',
            'data': progress_data,
            'timestamp': datetime.now().isoformat()
        }
        
        await self.broadcast(json.dumps(message))
    
    async def send_error_notification(self, restaurant_name: str, error_message: str):
        """Send error notifications"""
        message = {
            'type': 'error',
            'restaurant': restaurant_name,
            'error': error_message,
            'timestamp': datetime.now().isoformat()
        }
        
        await self.broadcast(json.dumps(message))
    
    def get_connection_stats(self) -> Dict:
        """Get connection statistics"""
        return {
            'total_connections': len(self.active_connections),
            'connections_data': {
                i: data for i, data in enumerate(self.connection_data.values())
            }
        }