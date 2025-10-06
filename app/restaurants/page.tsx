'use client';

import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import RestaurantList from '../../components/RestaurantList';
import { useRestaurantStore } from '../../store/restaurantStore';

export default function RestaurantsPage() {
  const { fetchRestaurants, loading, restaurants } = useRestaurantStore();

  useEffect(() => {
    // Fetch restaurants if not already loaded
    if (restaurants.length === 0 && !loading.restaurants) {
      fetchRestaurants();
    }
  }, [fetchRestaurants, restaurants.length, loading.restaurants]);

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
              <h1 className="text-2xl font-bold text-gray-900">Restaurant Management</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-600">
                {loading.restaurants ? (
                  <span>Loading restaurants...</span>
                ) : (
                  <span>{restaurants.length} restaurants configured</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Restaurant Collection
          </h2>
          <p className="text-gray-600">
            Monitor and manage restaurant data collection. Click on any restaurant to view detailed analytics 
            and recent scraping activity.
          </p>
        </div>

        <RestaurantList />
      </main>
    </div>
  );
}