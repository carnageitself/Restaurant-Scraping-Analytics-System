'use client';

import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Dashboard from '../components/Dashboard';
import { useRestaurantStore } from '../store/restaurantStore';

export default function HomePage() {
  const { fetchRestaurants, fetchAnalyticsSummary, fetchScrapingStatus } = useRestaurantStore();

  useEffect(() => {
    // Initialize data on app load
    const initializeApp = async () => {
      try {
        await Promise.all([
          fetchRestaurants(),
          fetchAnalyticsSummary(),
          fetchScrapingStatus(),
        ]);
      } catch (error) {
        console.error('Failed to initialize app data:', error);
      }
    };

    initializeApp();
  }, [fetchRestaurants, fetchAnalyticsSummary, fetchScrapingStatus]);

  return (
    <>
      <Dashboard />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}