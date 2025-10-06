import React, { useEffect } from 'react';
import { useRestaurantStore } from '../store/restaurantStore';
import { format } from 'date-fns';
import { ExternalLink, TrendingUp, MessageSquare, Star } from 'lucide-react';

interface RestaurantDetailsProps {
  restaurantName: string;
}

const RestaurantDetails: React.FC<RestaurantDetailsProps> = ({ restaurantName }) => {
  const { selectedRestaurant, loading, fetchRestaurant } = useRestaurantStore();

  useEffect(() => {
    fetchRestaurant(restaurantName);
  }, [restaurantName, fetchRestaurant]);

  if (loading.restaurant) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!selectedRestaurant) {
    return <div>Restaurant not found</div>;
  }

  const menuData = selectedRestaurant.menu_data;
  const reviewsData = selectedRestaurant.reviews_data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{selectedRestaurant.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              {selectedRestaurant.url && (
                <a
                  href={selectedRestaurant.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Visit Website</span>
                </a>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Last Updated</p>
            <p className="font-medium">
              {format(new Date(selectedRestaurant.last_updated), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Data */}
      {menuData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Menu Analysis
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded">
              <p className="text-2xl font-bold text-blue-600">{menuData.total_items}</p>
              <p className="text-sm text-gray-600">Total Items</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <p className="text-2xl font-bold text-green-600">{menuData.categories}</p>
              <p className="text-sm text-gray-600">Categories</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded">
              <p className="text-2xl font-bold text-purple-600">
                ${menuData.price_stats?.mean?.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-gray-600">Avg Price</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded">
              <p className="text-2xl font-bold text-orange-600">
                ${menuData.price_stats?.min?.toFixed(2)} - ${menuData.price_stats?.max?.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Price Range</p>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-medium mb-3">Menu Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(menuData.categorized_items || {}).map(([category, items]) => (
                <div key={category} className="text-center p-3 border rounded">
                  <p className="font-medium">{category}</p>
                  <p className="text-lg text-blue-600">{Array.isArray(items) ? items.length : 0}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews Data */}
      {reviewsData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Reviews Analysis
          </h2>
          
          {reviewsData.summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded">
                <p className="text-2xl font-bold text-blue-600">
                  {reviewsData.summary.total_reviews || 0}
                </p>
                <p className="text-sm text-gray-600">Total Reviews</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded">
                <p className="text-2xl font-bold text-green-600">
                  {reviewsData.summary.avg_rating?.toFixed(1) || '0.0'}
                </p>
                <p className="text-sm text-gray-600">Avg Rating</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded">
                <p className="text-2xl font-bold text-purple-600">
                  {reviewsData.summary.recent_reviews_count || 0}
                </p>
                <p className="text-sm text-gray-600">Recent (24h)</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded">
                <p className="text-2xl font-bold text-orange-600">
                  {reviewsData.summary.sources_count || 0}
                </p>
                <p className="text-sm text-gray-600">Sources</p>
              </div>
            </div>
          )}

          {/* Sentiment Analysis */}
          {reviewsData.sentiment_analysis && (
            <div>
              <h3 className="font-medium mb-3">Sentiment Distribution</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded">
                  <p className="text-lg font-bold text-green-600">
                    {reviewsData.sentiment_analysis.positive_reviews || 0}
                  </p>
                  <p className="text-sm text-gray-600">Positive</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded">
                  <p className="text-lg font-bold text-yellow-600">
                    {reviewsData.sentiment_analysis.neutral_reviews || 0}
                  </p>
                  <p className="text-sm text-gray-600">Neutral</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded">
                  <p className="text-lg font-bold text-red-600">
                    {reviewsData.sentiment_analysis.negative_reviews || 0}
                  </p>
                  <p className="text-sm text-gray-600">Negative</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RestaurantDetails;