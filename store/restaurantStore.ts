import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import apiClient, { 
  Restaurant, 
  RestaurantData, 
  AnalyticsSummary, 
  TrendsData, 
  ScrapingStatus,
  WebSocketMessage 
} from '../lib/apiClient';

interface RestaurantStore {
  // Data state
  restaurants: Restaurant[];
  selectedRestaurant: RestaurantData | null;
  analyticsSummary: AnalyticsSummary | null;
  trendsData: TrendsData | null;
  scrapingStatus: ScrapingStatus | null;
  
  // UI state
  loading: {
    restaurants: boolean;
    restaurant: boolean;
    analytics: boolean;
    trends: boolean;
    status: boolean;
    scraping: boolean;
  };
  
  error: string | null;
  lastUpdated: Record<string, string>;
  
  // Real-time updates
  realtimeUpdates: WebSocketMessage[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  
  // Actions
  fetchRestaurants: () => Promise<void>;
  fetchRestaurant: (name: string) => Promise<void>;
  fetchAnalyticsSummary: () => Promise<void>;
  fetchTrendsData: () => Promise<void>;
  fetchScrapingStatus: () => Promise<void>;
  
  startScraping: () => Promise<void>;
  stopScraping: () => Promise<void>;
  scrapeRestaurant: (name: string) => Promise<void>;
  
  // WebSocket handlers
  handleWebSocketMessage: (message: WebSocketMessage) => void;
  setConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  
  // Utility actions
  setError: (error: string | null) => void;
  clearError: () => void;
  resetStore: () => void;
}

const initialLoadingState = {
  restaurants: false,
  restaurant: false,
  analytics: false,
  trends: false,
  status: false,
  scraping: false,
};

export const useRestaurantStore = create<RestaurantStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      restaurants: [],
      selectedRestaurant: null,
      analyticsSummary: null,
      trendsData: null,
      scrapingStatus: null,
      
      loading: initialLoadingState,
      error: null,
      lastUpdated: {},
      
      realtimeUpdates: [],
      connectionStatus: 'disconnected',
      
      // Actions
      fetchRestaurants: async () => {
        set((state) => ({
          loading: { ...state.loading, restaurants: true },
          error: null,
        }));
        
        try {
          const restaurants = await apiClient.getAllRestaurants();
          set((state) => ({
            restaurants,
            loading: { ...state.loading, restaurants: false },
            lastUpdated: { ...state.lastUpdated, restaurants: new Date().toISOString() },
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, restaurants: false },
            error: error instanceof Error ? error.message : 'Failed to fetch restaurants',
          }));
        }
      },
      
      fetchRestaurant: async (name: string) => {
        set((state) => ({
          loading: { ...state.loading, restaurant: true },
          error: null,
        }));
        
        try {
          const restaurant = await apiClient.getRestaurant(name);
          set((state) => ({
            selectedRestaurant: restaurant,
            loading: { ...state.loading, restaurant: false },
            lastUpdated: { ...state.lastUpdated, [`restaurant_${name}`]: new Date().toISOString() },
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, restaurant: false },
            error: error instanceof Error ? error.message : `Failed to fetch restaurant ${name}`,
          }));
        }
      },
      
      fetchAnalyticsSummary: async () => {
        set((state) => ({
          loading: { ...state.loading, analytics: true },
          error: null,
        }));
        
        try {
          const summary = await apiClient.getAnalyticsSummary();
          set((state) => ({
            analyticsSummary: summary,
            loading: { ...state.loading, analytics: false },
            lastUpdated: { ...state.lastUpdated, analytics: new Date().toISOString() },
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, analytics: false },
            error: error instanceof Error ? error.message : 'Failed to fetch analytics',
          }));
        }
      },
      
      fetchTrendsData: async () => {
        set((state) => ({
          loading: { ...state.loading, trends: true },
          error: null,
        }));
        
        try {
          const trends = await apiClient.getTrendsData();
          set((state) => ({
            trendsData: trends,
            loading: { ...state.loading, trends: false },
            lastUpdated: { ...state.lastUpdated, trends: new Date().toISOString() },
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, trends: false },
            error: error instanceof Error ? error.message : 'Failed to fetch trends',
          }));
        }
      },
      
      fetchScrapingStatus: async () => {
        set((state) => ({
          loading: { ...state.loading, status: true },
          error: null,
        }));
        
        try {
          const status = await apiClient.getScrapingStatus();
          set((state) => ({
            scrapingStatus: status,
            loading: { ...state.loading, status: false },
            lastUpdated: { ...state.lastUpdated, status: new Date().toISOString() },
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, status: false },
            error: error instanceof Error ? error.message : 'Failed to fetch scraping status',
          }));
        }
      },
      
      startScraping: async () => {
        set((state) => ({
          loading: { ...state.loading, scraping: true },
          error: null,
        }));
        
        try {
          await apiClient.startScraping();
          // Refresh status after starting
          await get().fetchScrapingStatus();
          set((state) => ({
            loading: { ...state.loading, scraping: false },
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, scraping: false },
            error: error instanceof Error ? error.message : 'Failed to start scraping',
          }));
        }
      },
      
      stopScraping: async () => {
        set((state) => ({
          loading: { ...state.loading, scraping: true },
          error: null,
        }));
        
        try {
          await apiClient.stopScraping();
          // Refresh status after stopping
          await get().fetchScrapingStatus();
          set((state) => ({
            loading: { ...state.loading, scraping: false },
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, scraping: false },
            error: error instanceof Error ? error.message : 'Failed to stop scraping',
          }));
        }
      },
      
      scrapeRestaurant: async (name: string) => {
        set((state) => ({
          loading: { ...state.loading, scraping: true },
          error: null,
        }));
        
        try {
          await apiClient.scrapeRestaurant(name);
          // Refresh restaurant data after scraping
          setTimeout(() => {
            get().fetchRestaurant(name);
          }, 2000); // Wait 2 seconds for scraping to complete
          
          set((state) => ({
            loading: { ...state.loading, scraping: false },
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, scraping: false },
            error: error instanceof Error ? error.message : `Failed to scrape restaurant ${name}`,
          }));
        }
      },
      
      handleWebSocketMessage: (message: WebSocketMessage) => {
        set((state) => ({
          realtimeUpdates: [message, ...state.realtimeUpdates].slice(0, 100), // Keep last 100 messages
        }));
        
        // Handle specific message types
        switch (message.type) {
          case 'restaurant_update':
            // Auto-refresh data when restaurant is updated
            if (message.restaurant && message.restaurant === state.selectedRestaurant?.name) {
              // Refresh the selected restaurant after a short delay
              setTimeout(() => {
                get().fetchRestaurant(message.restaurant!);
              }, 1000);
            }
            
            // Also refresh the restaurants list to update counts
            setTimeout(() => {
              get().fetchRestaurants();
            }, 1500);
            break;
            
          case 'system_status':
            // Update scraping status from real-time data
            if (message.data) {
              set((state) => ({
                scrapingStatus: { ...state.scrapingStatus, ...message.data },
              }));
            }
            break;
            
          case 'scraping_progress':
            // Update analytics in real-time
            setTimeout(() => {
              get().fetchAnalyticsSummary();
            }, 2000);
            break;
        }
      },
      
      setConnectionStatus: (status) => {
        set({ connectionStatus: status });
      },
      
      setError: (error) => {
        set({ error });
      },
      
      clearError: () => {
        set({ error: null });
      },
      
      resetStore: () => {
        set({
          restaurants: [],
          selectedRestaurant: null,
          analyticsSummary: null,
          trendsData: null,
          scrapingStatus: null,
          loading: initialLoadingState,
          error: null,
          lastUpdated: {},
          realtimeUpdates: [],
          connectionStatus: 'disconnected',
        });
      },
    }))
  )
);

// Selectors for computed values
export const useRestaurantSelectors = () => {
  const restaurants = useRestaurantStore((state) => state.restaurants);
  const selectedRestaurant = useRestaurantStore((state) => state.selectedRestaurant);
  const analyticsSummary = useRestaurantStore((state) => state.analyticsSummary);
  
  return {
    totalRestaurants: restaurants.length,
    activeRestaurants: restaurants.filter(r => r.reviews_last_scraped).length,
    avgMenuSize: restaurants.reduce((sum, r) => sum + r.menu_items_count, 0) / restaurants.length || 0,
    recentlyUpdatedRestaurants: restaurants
      .filter(r => r.reviews_last_scraped && 
        new Date(r.reviews_last_scraped) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      )
      .length,
    selectedRestaurantCategories: selectedRestaurant 
      ? Object.keys(selectedRestaurant.menu_data?.categorized_items || {}).length 
      : 0,
  };
};