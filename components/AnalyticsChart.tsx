'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface TrendsData {
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

interface AnalyticsChartProps {
  data: TrendsData | null;
  loading: boolean;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ data, loading }) => {
  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-200 animate-pulse rounded mb-4"></div>
          <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-200 animate-pulse rounded mb-4"></div>
          <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data || (!data.activity_trends?.length && !data.sentiment_trends?.length)) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">No analytics data available</p>
        </div>
      </div>
    );
  }

  // Process activity trends data
  const activityData = data.activity_trends?.map(item => {
    const date = new Date(item.date);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      reviews: item.reviews || 0,
      menu_scrapes: item.menu_scrapes || 0,
      total: (item.reviews || 0) + (item.menu_scrapes || 0)
    };
  }) || [];

  // Process sentiment data - get latest sentiment for each restaurant
  const sentimentData = data.sentiment_trends?.reduce((acc, item) => {
    const restaurantName = item.restaurant?.length > 15 
      ? item.restaurant.substring(0, 15) + '...' 
      : item.restaurant || 'Unknown';
    
    if (!acc[restaurantName] || new Date(item.date) > new Date(acc[restaurantName].date)) {
      acc[restaurantName] = {
        restaurant: restaurantName,
        sentiment: item.sentiment || 0,
        date: item.date
      };
    }
    return acc;
  }, {} as Record<string, { restaurant: string; sentiment: number; date: string }>) || {};

  const latestSentiment = Object.values(sentimentData)
    .sort((a, b) => b.sentiment - a.sentiment)
    .slice(0, 10);

  // Helper function to get color based on sentiment
  const getSentimentColor = (sentiment: number): string => {
    if (sentiment > 0.3) return '#10B981'; // Green
    if (sentiment < -0.3) return '#EF4444'; // Red
    return '#6B7280'; // Gray
  };

  return (
    <div className="space-y-8">
      {/* Activity Trends Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Scraping Activity (Last 7 Days)</h2>
          <div className="text-sm text-gray-500">
            Last updated: {new Date(data.generated_at).toLocaleString()}
          </div>
        </div>
        
        {activityData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="reviews" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Review Scrapes"
                />
                <Line 
                  type="monotone" 
                  dataKey="menu_scrapes" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Menu Scrapes"
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Total Scrapes"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No activity data available for the last 7 days
          </div>
        )}
      </div>

      {/* Sentiment Analysis Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Restaurant Sentiment Analysis</h2>
        
        {latestSentiment.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latestSentiment} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[-1, 1]} />
                <YAxis dataKey="restaurant" type="category" width={120} />
                <Tooltip 
                  formatter={(value: number) => [
                    `${(value * 100).toFixed(1)}%`,
                    'Sentiment Score'
                  ]}
                />
                <Bar dataKey="sentiment">
                  {latestSentiment.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSentimentColor(entry.sentiment)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No sentiment data available
          </div>
        )}

        {/* Sentiment Legend */}
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Positive (&gt;30%)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-500 rounded"></div>
            <span>Neutral (-30% to 30%)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Negative (&lt;-30%)</span>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Activity (7 days)</h3>
          <p className="text-2xl font-bold text-blue-600">
            {activityData.reduce((sum, item) => sum + item.total, 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Scraping operations</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Average Daily Reviews</h3>
          <p className="text-2xl font-bold text-green-600">
            {activityData.length > 0 ? 
              Math.round(activityData.reduce((sum, item) => sum + item.reviews, 0) / activityData.length) : 
              0
            }
          </p>
          <p className="text-sm text-gray-500 mt-1">Per day</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Positive Sentiment</h3>
          <p className="text-2xl font-bold text-purple-600">
            {latestSentiment.length > 0 ? 
              Math.round((latestSentiment.filter(r => r.sentiment > 0.3).length / latestSentiment.length) * 100) : 
              0
            }%
          </p>
          <p className="text-sm text-gray-500 mt-1">Of restaurants</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsChart;