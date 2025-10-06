'use client';

import { useEffect } from 'react';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import AnalyticsChart from '../../components/AnalyticsChart';
import { useRestaurantStore } from '../../store/restaurantStore';
import { format } from 'date-fns';

export default function AnalyticsPage() {
  const {
    analyticsSummary,
    trendsData,
    loading,
    fetchAnalyticsSummary,
    fetchTrendsData,
    restaurants
  } = useRestaurantStore();

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        await Promise.all([
          fetchAnalyticsSummary(),
          fetchTrendsData(),
        ]);
      } catch (error) {
        toast.error('Failed to load analytics data');
      }
    };

    fetchAnalyticsData();
  }, [fetchAnalyticsSummary, fetchTrendsData]);

  const handleRefreshAnalytics = async () => {
    try {
      await Promise.all([
        fetchAnalyticsSummary(),
        fetchTrendsData(),
      ]);
      toast.success('Analytics data refreshed');
    } catch (error) {
      toast.error('Failed to refresh analytics');
    }
  };

  const handleExportData = () => {
    // This would trigger an API call to export data
    toast.success('Export feature would be implemented here');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Last Updated Info */}
              {analyticsSummary && (
                <div className="text-sm text-gray-600">
                  Last updated: {format(new Date(analyticsSummary.generated_at), 'MMM dd, HH:mm')}
                </div>
              )}
              
              {/* Action Buttons */}
              <button
                onClick={handleExportData}
                className="flex items-center space-x-1 px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              
              <button
                onClick={handleRefreshAnalytics}
                disabled={loading.analytics || loading.trends}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${(loading.analytics || loading.trends) ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">R</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Restaurants</p>
                {loading.analytics ? (
                  <div className="h-6 w-12 bg-gray-200 animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsSummary?.total_restaurants || restaurants.length}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">M</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Menu Items</p>
                {loading.analytics ? (
                  <div className="h-6 w-16 bg-gray-200 animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsSummary?.total_menu_items.toLocaleString() || '0'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-lg">S</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scrapes (24h)</p>
                {loading.analytics ? (
                  <div className="h-6 w-12 bg-gray-200 animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsSummary?.recent_scrapes_24h || '0'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-lg">A</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active (24h)</p>
                {loading.analytics ? (
                  <div className="h-6 w-12 bg-gray-200 animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsSummary?.active_restaurants_24h || '0'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Trends & Analytics</h2>
            <div className="text-sm text-gray-600">
              {trendsData && (
                <span>Data from {format(new Date(trendsData.generated_at), 'MMM dd, yyyy')}</span>
              )}
            </div>
          </div>
          
          <AnalyticsChart data={trendsData} loading={loading.trends} />
        </div>

        {/* Detailed Statistics */}
        {analyticsSummary && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Performance Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Menu Items</span>
                  <span className="font-semibold">{analyticsSummary.avg_menu_items.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Menu Scrapes</span>
                  <span className="font-semibold">{analyticsSummary.total_menu_scrapes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Review Scrapes</span>
                  <span className="font-semibold">{analyticsSummary.total_review_scrapes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Restaurants</span>
                  <span className="font-semibold">{analyticsSummary.active_restaurants_24h}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold">
                    {analyticsSummary.total_restaurants > 0 
                      ? `${((analyticsSummary.active_restaurants_24h / analyticsSummary.total_restaurants) * 100).toFixed(1)}%`
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Menu Categories</h3>
              <div className="space-y-3">
                {analyticsSummary.top_categories.slice(0, 8).map(([category, count], index) => {
                  const maxCount = Math.max(...analyticsSummary.top_categories.map(([, c]) => c));
                  const percentage = (count / maxCount) * 100;
                  
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1">
                        <span className="text-sm text-gray-600 w-4">#{index + 1}</span>
                        <span className="text-sm font-medium text-gray-900">{category}</span>
                      </div>
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 ml-4">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Data Quality Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Quality & Coverage</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {analyticsSummary ? 
                  Math.round((analyticsSummary.active_restaurants_24h / analyticsSummary.total_restaurants) * 100) : 
                  0
                }%
              </div>
              <div className="text-sm text-gray-600">Data Freshness</div>
              <div className="text-xs text-gray-500 mt-1">Restaurants with data < 24h old</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {analyticsSummary?.avg_menu_items.toFixed(0) || '0'}
              </div>
              <div className="text-sm text-gray-600">Avg Menu Coverage</div>
              <div className="text-xs text-gray-500 mt-1">Items per restaurant</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {analyticsSummary?.top_categories.length || '0'}
              </div>
              <div className="text-sm text-gray-600">Categories Found</div>
              <div className="text-xs text-gray-500 mt-1">Unique menu categories</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}