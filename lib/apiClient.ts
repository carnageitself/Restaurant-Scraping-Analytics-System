import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types
export interface Restaurant {
  name: string;
  url: string;
  updated_at: string;
  menu_items_count: number;
  categories_count: number;
  menu_last_scraped: string;
  review_sources_count: number;
  reviews_last_scraped: string;
}

export interface RestaurantData {
  name: string;
  url: string;
  menu_data: {
    menu_items: MenuItem[];
    categorized_items: Record<string, MenuItem[]>;
    price_stats: PriceStats;
    total_items: number;
    categories: number;
    scraped_at: string;
  };
  reviews_data: {
    sources: Record<string, ReviewSource>;
    sentiment_analysis: SentimentAnalysis;
    summary: ReviewSummary;
    last_scraped: string;
  };
  last_updated: string;
}

export interface MenuItem {
  name: string;
  price: number;
  description: string;
  category: string;
}

export interface PriceStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  count: number;
}

export interface ReviewSource {
  reviews: Review[];
  sentiment: SentimentAnalysis;
  summary: ReviewSummary;
  scraped_at: string;
}

export interface Review {
  author: string;
  rating: number;
  text: string;
  date: string;
  source: string;
}

export interface SentimentAnalysis {
  avg_sentiment: number;
  positive_reviews: number;
  negative_reviews: number;
  neutral_reviews: number;
  sentiment_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface ReviewSummary {
  total_reviews: number;
  recent_reviews_count: number;
  avg_rating: number;
  sources_count: number;
}

export interface AnalyticsSummary {
  total_restaurants: number;
  total_menu_scrapes: number;
  total_review_scrapes: number;
  avg_menu_items: number;
  total_menu_items: number;
  active_restaurants_24h: number;
  recent_scrapes_24h: number;
  top_categories: [string, number][];
  generated_at: string;
}

export interface TrendsData {
  activity_trends: Array<{
    date: string;
    reviews: number;
    menu_scrapes: number;
  }>;
  sentiment_trends: Array<{
    restaurant: string;
    sentiment: number;
    date: string;
  }>;
  generated_at: string;
}

export interface ScrapingStatus {
  is_running: boolean;
  last_scrape_time?: string;
  total_restaurants: number;
  successful_scrapes: number;
  errors: Array<{
    restaurant: string;
    error: string;
    timestamp: string;
  }>;
}

class ApiClient {
  private client: AxiosInstance;
  
  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL: baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Restaurant endpoints
  async getAllRestaurants(): Promise<Restaurant[]> {
    const response: AxiosResponse<Restaurant[]> = await this.client.get('/api/restaurants');
    return response.data;
  }

  async getRestaurant(restaurantName: string): Promise<RestaurantData> {
    const response: AxiosResponse<RestaurantData> = await this.client.get(
      `/api/restaurants/${encodeURIComponent(restaurantName)}`
    );
    return response.data;
  }

  async getRestaurantReviews(restaurantName: string): Promise<ReviewSource> {
    const response: AxiosResponse<ReviewSource> = await this.client.get(
      `/api/restaurants/${encodeURIComponent(restaurantName)}/reviews`
    );
    return response.data;
  }

  // Analytics endpoints
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const response: AxiosResponse<AnalyticsSummary> = await this.client.get('/api/analytics/summary');
    return response.data;
  }

  async getTrendsData(): Promise<TrendsData> {
    const response: AxiosResponse<TrendsData> = await this.client.get('/api/analytics/trends');
    return response.data;
  }

  // Scraping control endpoints
  async getScrapingStatus(): Promise<ScrapingStatus> {
    const response: AxiosResponse<ScrapingStatus> = await this.client.get('/api/status');
    return response.data;
  }

  async startScraping(): Promise<{ message: string }> {
    const response = await this.client.post('/api/scrape/start');
    return response.data;
  }

  async stopScraping(): Promise<{ message: string }> {
    const response = await this.client.post('/api/scrape/stop');
    return response.data;
  }

  async scrapeRestaurant(restaurantName: string): Promise<{ message: string }> {
    const response = await this.client.post(
      `/api/scrape/restaurant/${encodeURIComponent(restaurantName)}`
    );
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;