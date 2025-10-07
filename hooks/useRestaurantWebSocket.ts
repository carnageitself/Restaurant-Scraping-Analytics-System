import { useState, useEffect, useRef, useCallback } from 'react';

// Types matching your store structure
interface Restaurant {
  id: string;
  name: string;
  url: string;
  address: string;
  phone: string;
  updated_at: string;
  menu_items_count: number;
  categories_count: number;
  menu_last_scraped: string | null;
  review_sources_count: number;
  reviews_last_scraped: string | null;
  status: 'active' | 'pending' | 'error';
}

interface WebSocketMessage {
  type: string;
  timestamp: string;
  data?: any;
  restaurant?: string;
  [key: string]: any;
}

interface ScrapingProgress {
  cycle?: number;
  restaurant?: string;
  progress?: string;
  successful_restaurants?: number;
  total_restaurants?: number;
}

interface ConnectionStats {
  isConnected: boolean;
  reconnectAttempts: number;
  lastMessageTime: string | null;
  messagesReceived: number;
}

interface AnalyticsSummary {
  total_restaurants: number;
  restaurants_with_menus: number;
  restaurants_with_reviews: number;
  total_menu_items: number;
  avg_menu_items: number;
  total_reviews: number;
  avg_rating: number;
  recent_activity_24h: {
    menu_scrapes: number;
    review_scrapes: number;
    total_scrapes: number;
    errors: number;
  };
  success_rate: number;
  generated_at: string;
}

interface TrendsData {
  activity_trends: Array<{
    date: string;
    menu_scrapes: number;
    reviews: number;
    errors: number;
    total: number;
  }>;
  generated_at: string;
}

// Custom hook that integrates with your existing store pattern
export const useRestaurantWebSocket = (
  wsUrl: string = 'ws://localhost:8000/ws',
  options?: {
    onMessage?: (message: WebSocketMessage) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: string) => void;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
  }
) => {
  // State - keep minimal to avoid re-render loops
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState<WebSocketMessage[]>([]);

  // Refs for stable values
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const pingTimer = useRef<NodeJS.Timeout | null>(null);
  const isConnecting = useRef(false);
  const reconnectAttempts = useRef(0);
  const messagesReceived = useRef(0);
  const lastMessageTime = useRef<string | null>(null);
  const messagesBuffer = useRef<WebSocketMessage[]>([]);

  // Constants
  const MAX_RECONNECT_ATTEMPTS = options?.maxReconnectAttempts || 10;
  const RECONNECT_DELAY = options?.reconnectInterval || 5000;
  const PING_INTERVAL = 30000;
  const MAX_REALTIME_UPDATES = 100;

  // Stable functions that don't change - no dependencies to avoid loops
  const addRealtimeUpdate = (message: WebSocketMessage) => {
    messagesBuffer.current.push(message);
    
    if (messagesBuffer.current.length > MAX_REALTIME_UPDATES) {
      messagesBuffer.current = messagesBuffer.current.slice(-MAX_REALTIME_UPDATES);
    }
    
    setRealtimeUpdates([...messagesBuffer.current]);
    setLastMessage(message);
  };

  const clearRealtimeUpdates = useCallback(() => {
    messagesBuffer.current = [];
    setRealtimeUpdates([]);
    setLastMessage(null);
  }, []);

  // Create stable connection stats object
  const connectionStats: ConnectionStats = {
    isConnected,
    reconnectAttempts: reconnectAttempts.current,
    lastMessageTime: lastMessageTime.current,
    messagesReceived: messagesReceived.current
  };

  // Connect function - stable, no dependencies
  const connect = useCallback(() => {
    if (isConnecting.current || (ws.current && ws.current.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      isConnecting.current = true;
      
      if (ws.current) {
        ws.current.close();
      }

      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => {
        reconnectAttempts.current = 0;
        setIsConnected(true);
        setError(null);
        isConnecting.current = false;
        
        pingTimer.current = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
              type: 'ping',
              timestamp: new Date().toISOString()
            }));
          }
        }, PING_INTERVAL);

        console.log('WebSocket connected');
        options?.onConnect?.();
      };

      ws.current.onmessage = (event: MessageEvent) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          messagesReceived.current += 1;
          lastMessageTime.current = message.timestamp;
          
          addRealtimeUpdate(message);
          options?.onMessage?.(message);

          if (message.type === 'ping' && ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString()
            }));
          }

        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          setError('Failed to parse message from server');
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        isConnecting.current = false;
        
        if (pingTimer.current) {
          clearInterval(pingTimer.current);
          pingTimer.current = null;
        }

        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current += 1;
          const currentAttempt = reconnectAttempts.current;
          
          reconnectTimer.current = setTimeout(() => {
            console.log(`Reconnecting... (attempt ${currentAttempt}/${MAX_RECONNECT_ATTEMPTS})`);
            connect();
          }, RECONNECT_DELAY);
        } else {
          setError('Max reconnection attempts reached');
          console.error('Max reconnection attempts reached');
        }

        console.log('WebSocket disconnected');
        options?.onDisconnect?.();
      };

      ws.current.onerror = (event: Event) => {
        const errorMessage = 'WebSocket connection error';
        setError(errorMessage);
        setIsConnected(false);
        isConnecting.current = false;
        
        console.error('WebSocket error:', event);
        options?.onError?.(errorMessage);
      };

      console.log('Connecting to WebSocket...');

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setError('Failed to create WebSocket connection');
      isConnecting.current = false;
    }
  }, [wsUrl, options, MAX_RECONNECT_ATTEMPTS, RECONNECT_DELAY, PING_INTERVAL]);

  // Disconnect function - stable, no dependencies that cause loops
  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (pingTimer.current) {
      clearInterval(pingTimer.current);
      pingTimer.current = null;
    }

    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    reconnectAttempts.current = 0;
    isConnecting.current = false;
    setIsConnected(false);
    
    console.log('WebSocket disconnected manually');
  }, []);

  // Reconnect function
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  // Disconnect function - stable, no dependencies that cause loops
  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (pingTimer.current) {
      clearInterval(pingTimer.current);
      pingTimer.current = null;
    }

    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    reconnectAttempts.current = 0;
    isConnecting.current = false;
    setIsConnected(false);
    
    console.log('WebSocket disconnected manually');
  }, []);

  // Reconnect function
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  // Effect to establish connection - only runs once or when wsUrl changes
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [wsUrl]); // Only depend on wsUrl, not the functions

  // Return stable interface
  return {
    // Connection status
    isConnected,
    isConnecting: isConnecting.current,
    connectionStats,
    error,
    
    // Data
    lastMessage,
    realtimeUpdates,
    
    // Actions
    connect,
    disconnect,
    reconnect,
    clearRealtimeUpdates,
    
    // Computed values
    hasRecentActivity: lastMessageTime.current && 
      (Date.now() - new Date(lastMessageTime.current).getTime()) < 60000
  };
};

// Hook for fetching restaurant data - integrating with your API structure
export const useRestaurantData = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/restaurants');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setRestaurants(data.restaurants || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch restaurants';
      setError(errorMessage);
      console.error('Error fetching restaurants:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  return {
    restaurants,
    loading,
    error,
    refresh: fetchRestaurants
  };
};

// Hook for analytics data - matching your store expectations
export const useRestaurantAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [analyticsResponse, trendsResponse] = await Promise.all([
        fetch('http://localhost:8000/api/analytics/summary'),
        fetch('http://localhost:8000/api/analytics/trends')
      ]);

      if (!analyticsResponse.ok || !trendsResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const analyticsData = await analyticsResponse.json();
      const trendsData = await trendsResponse.json();
      
      setAnalytics(analyticsData);
      setTrends(trendsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  return {
    analytics,
    trends,
    loading,
    error,
    refresh: fetchAnalytics
  };
};

// Hook for scraping controls - matching your store API expectations
export const useScrapingControls = () => {
  const [scrapingStatus, setScrapingStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/status');
      if (response.ok) {
        const status = await response.json();
        setScrapingStatus(status);
      }
    } catch (error) {
      console.error('Error fetching scraping status:', error);
    }
  }, []);

  const startScraping = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/scrape/start', {
        method: 'POST'
      });
      if (response.ok) {
        await fetchStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error starting scraping:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  const stopScraping = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/scrape/stop', {
        method: 'POST'
      });
      if (response.ok) {
        await fetchStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error stopping scraping:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  const triggerManualScraping = useCallback(async (restaurantName: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/scrape/restaurant/${encodeURIComponent(restaurantName)}`, {
        method: 'POST'
      });
      return response.ok;
    } catch (error) {
      console.error(`Error triggering manual scraping for ${restaurantName}:`, error);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return {
    scrapingStatus,
    loading,
    startScraping,
    stopScraping,
    triggerManualScraping,
    refreshStatus: fetchStatus
  };
};

  // Effect to establish connection
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Return hook interface matching your expected structure
  return {
    // Connection status
    isConnected: connectionStats.isConnected,
    isConnecting: isConnecting.current,
    connectionStats,
    error,
    
    // Data
    lastMessage,
    realtimeUpdates,
    
    // Actions
    connect,
    disconnect,
    reconnect,
    clearRealtimeUpdates,
    
    // Computed values
    hasRecentActivity: connectionStats.lastMessageTime && 
      (Date.now() - new Date(connectionStats.lastMessageTime).getTime()) < 60000, // Activity within last minute
  };
};

// Hook for fetching restaurant data - integrating with your API structure
export const useRestaurantData = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/restaurants');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setRestaurants(data.restaurants || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch restaurants';
      setError(errorMessage);
      console.error('❌ Error fetching restaurants:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  return {
    restaurants,
    loading,
    error,
    refresh: fetchRestaurants
  };
};

// Hook for analytics data - matching your store expectations
export const useRestaurantAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [analyticsResponse, trendsResponse] = await Promise.all([
        fetch('http://localhost:8000/api/analytics/summary'),
        fetch('http://localhost:8000/api/analytics/trends')
      ]);

      if (!analyticsResponse.ok || !trendsResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const analyticsData = await analyticsResponse.json();
      const trendsData = await trendsResponse.json();
      
      setAnalytics(analyticsData);
      setTrends(trendsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      console.error('❌ Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  return {
    analytics,
    trends,
    loading,
    error,
    refresh: fetchAnalytics
  };
};

// Hook for scraping controls - matching your store API expectations
export const useScrapingControls = () => {
  const [scrapingStatus, setScrapingStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/status');
      if (response.ok) {
        const status = await response.json();
        setScrapingStatus(status);
      }
    } catch (error) {
      console.error('Error fetching scraping status:', error);
    }
  }, []);

  const startScraping = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/scrape/start', {
        method: 'POST'
      });
      if (response.ok) {
        await fetchStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error starting scraping:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  const stopScraping = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/scrape/stop', {
        method: 'POST'
      });
      if (response.ok) {
        await fetchStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error stopping scraping:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  const triggerManualScraping = useCallback(async (restaurantName: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/scrape/restaurant/${encodeURIComponent(restaurantName)}`, {
        method: 'POST'
      });
      return response.ok;
    } catch (error) {
      console.error(`Error triggering manual scraping for ${restaurantName}:`, error);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return {
    scrapingStatus,
    loading,
    startScraping,
    stopScraping,
    triggerManualScraping,
    refreshStatus: fetchStatus
  };
};