import asyncio
import json
import logging
from datetime import datetime
from typing import List, Dict
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """Accept a WebSocket connection"""
        await websocket.accept()
        self.active_connections.append(websocket)
        
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
    
    def get_connection_stats(self) -> Dict:
        """Get connection statistics"""
        return {
            'total_connections': len(self.active_connections)
        }