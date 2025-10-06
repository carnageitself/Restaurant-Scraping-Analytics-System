'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import RestaurantDetails from '../../../components/RestaurantDetails';
import { useRestaurantStore } from '../../../store/restaurantStore';

export default function RestaurantDetailsPage() {
  const params = useParams();
  const restaurantName = decodeURIComponent(params.name as string);
  
  const { 
    selectedRestaurant, 
    loading, 
    fetchRestaurant, 
    scrapeRestaurant 
  } = useRestaurantStore();

  useEffect(() => {
    if (restaurantName) {
      fetchRestaurant(restaurantName);
    }
  }, [restaurantName, fetchRestaurant]);

  const handleRefresh = async () => {
    try {
      await fetchRestaurant(restaurantName);
      toast.success('Restaurant data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    }
  };

  const handleScrapeNow = async () => {
    try {
      await scrapeRestaurant(restaurantName);
      toast.success(`Scraping started for ${restaurantName}`);
      
      // Refresh data after a delay to show updated results
      setTimeout(() => {
        fetchRestaurant(restaurantName);
      }, 5000);
    } catch (error) {
      toast.error('Failed to trigger scraping');
    }
  };

  if (loading.restaurant && !selectedRestaurant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link 
                  href="/restaurants" 
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Restaurants</span>
                </Link>
                <div className="h-6 w-px bg-gray-300" />
                <div className="h-6 bg-gray-200 animate-pulse rounded w-48" />
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Loading skeleton */}
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded" />
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4" />
              <div className="h-32 bg-gray-200 rounded" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!loading.restaurant && !selectedRestaurant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link 
                  href="/restaurants" 
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Restaurants</span>
                </Link>
                <div className="h-6 w-px bg-gray-300" />
                <h1 className="text-2xl font-bold text-gray-900">Restaurant Not Found</h1>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Restaurant Not Found</h3>
            <p className="text-gray-600 mb-4">
              Could not find restaurant "{restaurantName}". It may not be configured or there was an error loading the data.
            </p>
            <div className="flex justify-center space-x-4">
              <Link 
                href="/restaurants"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                View All Restaurants
              </Link>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/restaurants" 
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Restaurants</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900">{restaurantName}</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Last Updated Info */}
              {selectedRestaurant && (
                <div className="text-sm text-gray-600">
                  Last updated: {new Date(selectedRestaurant.last_updated).toLocaleString()}
                </div>
              )}
              
              {/* Action Buttons */}
              <button
                onClick={handleRefresh}
                disabled={loading.restaurant}
                className="flex items-center space-x-1 px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading.restaurant ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={handleScrapeNow}
                disabled={loading.scraping}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading.scraping ? 'animate-spin' : ''}`} />
                <span>Scrape Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RestaurantDetails restaurantName={restaurantName} />
      </main>
    </div>
  );
}