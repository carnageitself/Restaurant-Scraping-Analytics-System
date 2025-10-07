import asyncio
import json
import logging
from datetime import datetime
from typing import List, Dict, Optional
from fastapi import WebSocket
import time

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_metadata: Dict[WebSocket, Dict] = {}
        self.last_ping_time = {}
        self.message_queue = []
        self.max_queue_size = 100
    
    async def connect(self, websocket: WebSocket):
        """Accept a WebSocket connection and initialize metadata"""
        try:
            await websocket.accept()
            self.active_connections.append(websocket)
            
            # Store connection metadata
            self.connection_metadata[websocket] = {
                'connected_at': datetime.now().isoformat(),
                'last_message_time': datetime.now().isoformat(),
                'messages_sent': 0,
                'client_info': websocket.headers.get('user-agent', 'Unknown')
            }
            
            self.last_ping_time[websocket] = time.time()
            
            logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
            
            # Send welcome message with connection info
            welcome_message = {
                'type': 'connection_established',
                'message': 'Connected to Real-Time Restaurant Scraping API',
                'connection_id': id(websocket),
                'server_time': datetime.now().isoformat(),
                'total_connections': len(self.active_connections)
            }
            
            await self.send_personal_message(json.dumps(welcome_message), websocket)
            
            # Send recent message history if available
            await self._send_recent_messages(websocket)
            
        except Exception as e:
            logger.error(f"Error establishing WebSocket connection: {e}")
            await self.disconnect(websocket)
    
    async def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection and cleanup metadata"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        # Cleanup metadata
        if websocket in self.connection_metadata:
            connection_info = self.connection_metadata[websocket]
            connection_duration = (datetime.now() - datetime.fromisoformat(connection_info['connected_at'])).total_seconds()
            
            logger.info(f"WebSocket disconnected after {connection_duration:.1f}s. "
                       f"Messages sent: {connection_info['messages_sent']}. "
                       f"Remaining connections: {len(self.active_connections)}")
            
            del self.connection_metadata[websocket]
        
        if websocket in self.last_ping_time:
            del self.last_ping_time[websocket]
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific WebSocket connection"""
        try:
            await websocket.send_text(message)
            
            # Update metadata
            if websocket in self.connection_metadata:
                self.connection_metadata[websocket]['messages_sent'] += 1
                self.connection_metadata[websocket]['last_message_time'] = datetime.now().isoformat()
                
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            await self.disconnect(websocket)
    
    async def broadcast(self, message: str, exclude: Optional[WebSocket] = None):
        """Broadcast a message to all active connections"""
        if not self.active_connections:
            # Store message for later connections if queue isn't full
            await self._queue_message(message)
            return
        
        # Create list of connections to avoid modification during iteration
        connections_copy = self.active_connections.copy()
        failed_connections = []
        successful_sends = 0
        
        for connection in connections_copy:
            if exclude and connection == exclude:
                continue
                
            try:
                await connection.send_text(message)
                successful_sends += 1
                
                # Update metadata
                if connection in self.connection_metadata:
                    self.connection_metadata[connection]['messages_sent'] += 1
                    self.connection_metadata[connection]['last_message_time'] = datetime.now().isoformat()
                    
            except Exception as e:
                logger.warning(f"Failed to send message to connection: {e}")
                failed_connections.append(connection)
        
        # Remove failed connections
        for connection in failed_connections:
            await self.disconnect(connection)
        
        if successful_sends > 0:
            logger.debug(f"Broadcast sent to {successful_sends} connections")
        
        # Store message for message history
        await self._queue_message(message)
    
    async def broadcast_to_subscribers(self, message: str, subscription_type: str):
        """Broadcast to connections subscribed to specific types"""
        # For now, broadcast to all - can be enhanced later for subscription filtering
        await self.broadcast(message)
    
    async def _queue_message(self, message: str):
        """Queue message for new connections"""
        try:
            parsed_message = json.loads(message)
            # Only queue important message types
            important_types = ['restaurant_update', 'system_status', 'scraping_cycle_complete']
            
            if parsed_message.get('type') in important_types:
                self.message_queue.append({
                    'message': parsed_message,
                    'timestamp': datetime.now().isoformat()
                })
                
                # Keep queue size manageable
                if len(self.message_queue) > self.max_queue_size:
                    self.message_queue.pop(0)  # Remove oldest message
                    
        except json.JSONDecodeError:
            pass  # Skip non-JSON messages
    
    async def _send_recent_messages(self, websocket: WebSocket):
        """Send recent message history to newly connected client"""
        if not self.message_queue:
            return
        
        try:
            # Send last 10 messages
            recent_messages = self.message_queue[-10:]
            
            for queued_msg in recent_messages:
                history_message = {
                    'type': 'message_history',
                    'original_message': queued_msg['message'],
                    'original_timestamp': queued_msg['timestamp'],
                    'sent_at': datetime.now().isoformat()
                }
                
                await self.send_personal_message(json.dumps(history_message), websocket)
                await asyncio.sleep(0.1)  # Small delay between messages
                
        except Exception as e:
            logger.error(f"Error sending message history: {e}")
    
    async def send_ping_to_all(self):
        """Send ping to all connections to keep them alive"""
        if not self.active_connections:
            return
        
        current_time = time.time()
        ping_message = {
            "type": "ping",
            "server_time": datetime.now().isoformat(),
            "active_connections": len(self.active_connections)
        }
        
        failed_connections = []
        
        for connection in self.active_connections.copy():
            try:
                # Check if connection needs ping (every 30 seconds)
                last_ping = self.last_ping_time.get(connection, 0)
                if current_time - last_ping >= 30:
                    await connection.send_text(json.dumps(ping_message))
                    self.last_ping_time[connection] = current_time
                    
            except Exception as e:
                logger.warning(f"Ping failed for connection: {e}")
                failed_connections.append(connection)
        
        # Remove failed connections
        for connection in failed_connections:
            await self.disconnect(connection)
    
    def get_connection_stats(self) -> Dict:
        """Get detailed connection statistics"""
        total_connections = len(self.active_connections)
        
        if total_connections == 0:
            return {
                'total_connections': 0,
                'message_queue_size': len(self.message_queue),
                'uptime_stats': {}
            }
        
        # Calculate connection statistics
        now = datetime.now()
        connection_durations = []
        total_messages_sent = 0
        
        for connection, metadata in self.connection_metadata.items():
            connected_at = datetime.fromisoformat(metadata['connected_at'])
            duration = (now - connected_at).total_seconds()
            connection_durations.append(duration)
            total_messages_sent += metadata['messages_sent']
        
        avg_duration = sum(connection_durations) / len(connection_durations) if connection_durations else 0
        
        return {
            'total_connections': total_connections,
            'message_queue_size': len(self.message_queue),
            'total_messages_sent': total_messages_sent,
            'avg_messages_per_connection': round(total_messages_sent / total_connections, 1) if total_connections > 0 else 0,
            'avg_connection_duration_seconds': round(avg_duration, 1),
            'longest_connection_duration_seconds': round(max(connection_durations), 1) if connection_durations else 0,
            'shortest_connection_duration_seconds': round(min(connection_durations), 1) if connection_durations else 0
        }
    
    async def send_system_status(self, status_data: Dict):
        """Send system status update to all connections"""
        status_message = {
            'type': 'system_status_update',
            'data': status_data,
            'timestamp': datetime.now().isoformat(),
            'connection_stats': self.get_connection_stats()
        }
        
        await self.broadcast(json.dumps(status_message))
    
    async def send_restaurant_update(self, restaurant_name: str, update_type: str, data: Dict):
        """Send restaurant-specific update to all connections"""
        update_message = {
            'type': 'restaurant_update',
            'restaurant': restaurant_name,
            'update_type': update_type,
            'data': data,
            'timestamp': datetime.now().isoformat()
        }
        
        await self.broadcast(json.dumps(update_message))
    
    async def send_scraping_progress(self, progress_data: Dict):
        """Send scraping progress update"""
        progress_message = {
            'type': 'scraping_progress',
            'data': progress_data,
            'timestamp': datetime.now().isoformat()
        }
        
        await self.broadcast(json.dumps(progress_message))
    
    async def cleanup_stale_connections(self):
        """Remove connections that haven't received pings recently"""
        current_time = time.time()
        stale_connections = []
        
        for connection in self.active_connections.copy():
            last_ping = self.last_ping_time.get(connection, current_time)
            if current_time - last_ping > 90:  # 90 seconds without ping
                stale_connections.append(connection)
        
        for connection in stale_connections:
            logger.info("Removing stale connection")
            await self.disconnect(connection)
        
        if stale_connections:
            logger.info(f"Cleaned up {len(stale_connections)} stale connections")
    
    async def start_maintenance_task(self):
        """Start background maintenance tasks"""
        while True:
            try:
                await self.send_ping_to_all()
                await self.cleanup_stale_connections()
                await asyncio.sleep(30)  # Run every 30 seconds
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in maintenance task: {e}")
                await asyncio.sleep(30)