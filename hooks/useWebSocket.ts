import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export interface WebSocketMessage {
  type: string;
  restaurant?: string;
  data?: any;
  message?: string;
  progress?: number;
  timestamp: string;
  update_type?: string;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  enableHeartbeat?: boolean;
  heartbeatInterval?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: WebSocketMessage | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;
  reconnect: () => void;
  sendMessage: (message: any) => void;
  disconnect: () => void;
}

export const useWebSocket = (
  url?: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn => {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
    enableHeartbeat = true,
    heartbeatInterval = 30000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeat = useRef<number>(Date.now());

  const wsUrl = url || (
    process.env.NODE_ENV === 'production' 
      ? `wss://${window.location.host}/ws`
      : 'ws://localhost:8000/ws'
  );

  const clearTimers = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    if (!enableHeartbeat) return;

    clearInterval(heartbeatTimer.current!);
    heartbeatTimer.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        const now = Date.now();
        
        // Check if we received a recent heartbeat response
        if (now - lastHeartbeat.current > heartbeatInterval * 2) {
          console.warn('WebSocket heartbeat timeout - connection may be stale');
          setConnectionStatus('error');
          ws.current?.close();
          return;
        }

        // Send ping
        try {
          ws.current.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
        } catch (error) {
          console.error('Error sending heartbeat:', error);
        }
      }
    }, heartbeatInterval);
  }, [enableHeartbeat, heartbeatInterval]);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN || isConnecting) {
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('connecting');
    setError(null);

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionStatus('connected');
        setError(null);
        reconnectAttempts.current = 0;
        lastHeartbeat.current = Date.now();
        
        startHeartbeat();
        onConnect?.();
        
        toast.success('Connected to live updates', { 
          icon: '🔗',
          duration: 3000,
        });
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Update heartbeat on any message
          lastHeartbeat.current = Date.now();
          
          // Handle ping/pong
          if (message.type === 'ping') {
            return; // Just update heartbeat timestamp
          }
          
          setLastMessage(message);
          onMessage?.(message);

          // Handle specific message types with enhanced notifications
          switch (message.type) {
            case 'connection_established':
              console.log('WebSocket connection established');
              break;
              
            case 'restaurant_update':
              if (message.data?.status === 'completed') {
                toast.success(`${message.restaurant} data updated`, {
                  icon: '📊',
                  duration: 4000,
                });
              } else if (message.data?.status === 'error') {
                toast.error(`Failed to update ${message.restaurant}`, {
                  icon: '⚠️',
                  duration: 5000,
                });
              }
              break;
              
            case 'scraping_start':
              toast.loading(`Updating ${message.restaurant}...`, {
                icon: '🔄',
                duration: 2000,
              });
              break;
              
            case 'scraping_cycle_complete':
              toast.success('All restaurants updated successfully', {
                icon: '✅',
                duration: 4000,
              });
              break;
              
            case 'system_status':
              const isRunning = message.data?.is_running;
              if (isRunning !== undefined) {
                toast.success(
                  isRunning ? 'Monitoring started' : 'Monitoring stopped',
                  { icon: isRunning ? '▶️' : '⏸️', duration: 3000 }
                );
              }
              break;
              
            case 'error':
              toast.error(`System error: ${message.message}`, {
                icon: '🚨',
                duration: 6000,
              });
              break;
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          setError('Invalid message format received');
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        clearTimers();
        
        if (event.code === 1000) {
          // Normal closure
          setConnectionStatus('disconnected');
          onDisconnect?.();
        } else {
          // Unexpected closure - attempt reconnect
          setConnectionStatus('error');
          setError(`Connection lost (${event.code}): ${event.reason || 'Unknown error'}`);
          
          if (reconnectAttempts.current < maxReconnectAttempts) {
            const delay = Math.min(reconnectInterval * Math.pow(1.5, reconnectAttempts.current), 30000);
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
            
            reconnectTimer.current = setTimeout(() => {
              reconnectAttempts.current++;
              connect();
            }, delay);
            
            toast.error(
              `Connection lost. Reconnecting in ${Math.ceil(delay / 1000)}s...`,
              { icon: '📡', duration: delay }
            );
          } else {
            toast.error('Max reconnection attempts reached. Please refresh the page.', {
              icon: '🚨',
              duration: 10000,
            });
          }
        }
      };

      ws.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setConnectionStatus('error');
        onError?.(event);
        
        toast.error('Connection error occurred', {
          icon: '⚠️',
          duration: 4000,
        });
      };

    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError('Failed to establish connection');
      setIsConnecting(false);
      setConnectionStatus('error');
    }
  }, [wsUrl, isConnecting, onConnect, onMessage, onDisconnect, onError, reconnectInterval, maxReconnectAttempts, startHeartbeat]);

  const disconnect = useCallback(() => {
    clearTimers();
    if (ws.current) {
      ws.current.close(1000, 'Manual disconnect');
      ws.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionStatus('disconnected');
    setError(null);
    reconnectAttempts.current = 0;
  }, [clearTimers]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 100); // Small delay to ensure cleanup
  }, [disconnect, connect]);

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify(message));
      } catch (err) {
        console.error('Error sending message:', err);
        setError('Failed to send message');
      }
    } else {
      console.warn('WebSocket is not connected');
      setError('Not connected - message not sent');
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      clearTimers();
      disconnect();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      if (ws.current) {
        ws.current.close(1000, 'Component unmounting');
      }
    };
  }, [clearTimers]);

  return {
    isConnected,
    isConnecting,
    lastMessage,
    connectionStatus,
    error,
    reconnect,
    sendMessage,
    disconnect,
  };
};