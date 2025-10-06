import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export interface WebSocketMessage {
  type: 'connection_established' | 'restaurant_update' | 'system_status' | 'scraping_progress' | 'error' | 'ping';
  restaurant?: string;
  update_type?: 'menu' | 'reviews' | 'status';
  data?: any;
  message?: string;
  error?: string;
  timestamp: string;
}

interface UseWebSocketOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  lastMessage: WebSocketMessage | null;
  reconnectCount: number;
  error: string | null;
}

export const useWebSocket = (
  url?: string,
  options: UseWebSocketOptions = {}
) => {
  const {
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
    onMessage,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);
  const mountedRef = useRef(true);
  
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    lastMessage: null,
    reconnectCount: 0,
    error: null
  });

  const wsUrl = url || `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws`;

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    if (mountedRef.current) {
      setState({
        connected: false,
        connecting: false,
        lastMessage: null,
        reconnectCount: 0,
        error: null
      });
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        
        reconnectCountRef.current = 0;
        setState(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          reconnectCount: 0,
          error: null
        }));
        
        onConnect?.();
        console.log('WebSocket connected');
        toast.success('Connected to real-time updates');
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          setState(prev => ({
            ...prev,
            lastMessage: message
          }));

          // Handle different message types
          switch (message.type) {
            case 'restaurant_update':
              if (message.update_type === 'reviews') {
                toast.success(`New reviews for ${message.restaurant}`);
              }
              break;
            case 'error':
              toast.error(`Error: ${message.error}`);
              break;
            case 'scraping_progress':
              // Handle progress updates silently
              break;
            case 'ping':
              // Handle ping silently
              break;
          }

          onMessage?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        if (!mountedRef.current) return;
        
        console.error('WebSocket error:', error);
        setState(prev => ({ ...prev, error: 'WebSocket connection error' }));
        onError?.(error);
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        
        console.log('WebSocket closed:', event.code, event.reason);
        
        setState(prev => ({
          ...prev,
          connected: false,
          connecting: false
        }));

        onDisconnect?.();

        // Attempt to reconnect if not manually closed and under max attempts
        if (event.code !== 1000 && reconnectCountRef.current < maxReconnectAttempts) {
          reconnectCountRef.current += 1;
          
          setState(prev => ({ 
            ...prev, 
            reconnectCount: reconnectCountRef.current 
          }));
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              console.log(`Attempting to reconnect... (${reconnectCountRef.current}/${maxReconnectAttempts})`);
              connect();
            }
          }, reconnectInterval);
        } else if (reconnectCountRef.current >= maxReconnectAttempts) {
          setState(prev => ({ 
            ...prev, 
            error: 'Max reconnection attempts reached',
            reconnectCount: reconnectCountRef.current
          }));
          toast.error('Lost connection to real-time updates');
        }
      };

    } catch (error) {
      if (!mountedRef.current) return;
      
      console.error('Error creating WebSocket connection:', error);
      setState(prev => ({
        ...prev,
        connecting: false,
        error: 'Failed to create WebSocket connection'
      }));
    }
  }, [wsUrl, onConnect, onDisconnect, onError, onMessage, maxReconnectAttempts, reconnectInterval]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    isConnected: state.connected,
    isConnecting: state.connecting
  };
};