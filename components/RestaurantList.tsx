'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Clock, 
  TrendingUp, 
  RefreshCw,
  AlertTriangle,
  MapPin,
  Star,
  Users,
  BarChart3,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useRestaurantStore } from '../store/restaurantStore';
import RestaurantDetails from './RestaurantDetails';

const RestaurantList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'items' | 'sources'>('updated');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);

  const {
    restaurants,
    loading,
    scrapeRestaurant,
    fetchRestaurant
  } = useRestaurantStore();

  // Filter and sort restaurants
  const filteredRestaurants = restaurants
    .filter(restaurant => {
      const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      if (filterBy === 'active') {
        return restaurant.reviews_last_scraped && 
               new Date(restaurant.reviews_last_scraped) > new Date(Date.now() - 24 * 60 * 60 * 1000);
      }
      
      if (filterBy === 'inactive') {
        return !restaurant.reviews_last_scraped ||
               new Date(restaurant.reviews_last_scraped) <= new Date(Date.now() - 24 * 60 * 60 * 1000);
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'updated':
          const aDate = a.reviews_last_scraped ? new Date(a.reviews_last_scraped) : new Date(0);
          const bDate = b.reviews_last_scraped ? new Date(b.reviews_last_scraped) : new Date(0);
          return bDate.getTime() - aDate.getTime();
        case 'items':
          return b.menu_items_count - a.menu_items_count;
        case 'sources':
          return b.review_sources_count - a.review_sources_count;
        default:
          return 0;
      }
    });

  const handleRestaurantClick = async (restaurantName: string) => {
    setSelectedRestaurant(restaurantName);
    await fetchRestaurant(restaurantName);
  };

  const handleScrapeRestaurant = async (restaurantName: string) => {
    try {
      await scrapeRestaurant(restaurantName);
      toast.success(`Scraping started for ${restaurantName}`, {
        icon: '🔄'
      });
    } catch (error) {
      toast.error(`Failed to start scraping for ${restaurantName}`);
    }
  };

  const getStatusColor = (restaurant: any) => {
    if (!restaurant.reviews_last_scraped) return 'bg-slate-400';
    
    const lastUpdate = new Date(restaurant.reviews_last_scraped);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate < 1) return 'bg-emerald-500';
    if (hoursSinceUpdate < 6) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatusText = (restaurant: any) => {
    if (!restaurant.reviews_last_scraped) return 'Never scraped';
    
    const lastUpdate = new Date(restaurant.reviews_last_scraped);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate < 1) return 'Active';
    if (hoursSinceUpdate < 6) return 'Recent';
    if (hoursSinceUpdate < 24) return 'Stale';
    return 'Inactive';
  };

  const getStatusIcon = (restaurant: any) => {
    if (!restaurant.reviews_last_scraped) return <XCircle className="w-4 h-4" />;
    
    const lastUpdate = new Date(restaurant.reviews_last_scraped);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate < 1) return <CheckCircle className="w-4 h-4" />;
    if (hoursSinceUpdate < 6) return <Clock className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  if (selectedRestaurant) {
    return (
      <div>
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setSelectedRestaurant(null)}
          className="mb-6 flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
        >
          <motion.div
            whileHover={{ x: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            ← Back to restaurants
          </motion.div>
        </motion.button>
        <RestaurantDetails restaurantName={selectedRestaurant} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 p-8"
      >
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Enhanced Search */}
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors duration-200" />
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200/50 rounded-xl focus:ring-4 focus:ring-blue-500/25 focus:border-blue-500 transition-all duration-200 text-slate-900 placeholder-slate-500"
            />
          </div>

          {/* Enhanced Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="px-4 py-4 bg-slate-50/50 border border-slate-200/50 rounded-xl focus:ring-4 focus:ring-blue-500/25 focus:border-blue-500 transition-all duration-200 text-slate-900 min-w-[140px]"
              >
                <option value="all">All Restaurants</option>
                <option value="active">Active (24h)</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-4 bg-slate-50/50 border border-slate-200/50 rounded-xl focus:ring-4 focus:ring-blue-500/25 focus:border-blue-500 transition-all duration-200 text-slate-900 min-w-[140px]"
              >
                <option value="updated">Last Updated</option>
                <option value="name">Name</option>
                <option value="items">Menu Items</option>
                <option value="sources">Review Sources</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">{filteredRestaurants.length}</span> of{' '}
            <span className="font-medium text-slate-900">{restaurants.length}</span> restaurants
          </div>
          {searchTerm && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSearchTerm('')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear search
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Enhanced Restaurant Grid */}
      <AnimatePresence mode="wait">
        {loading.restaurants ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="card p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-slate-200 rounded-lg" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-16 bg-slate-200 rounded-lg" />
                    <div className="h-16 bg-slate-200 rounded-lg" />
                  </div>
                  <div className="h-8 bg-slate-200 rounded-lg" />
                </div>
              </div>
            ))}
          </motion.div>
        ) : filteredRestaurants.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No restaurants found</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              {searchTerm ? 
                `No restaurants match "${searchTerm}". Try adjusting your search or filters.` : 
                'No restaurants match the current filters. Try changing your filter settings.'
              }
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="restaurants"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredRestaurants.map((restaurant, index) => (
              <motion.div
                key={restaurant.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="card p-6 cursor-pointer group hover:shadow-2xl transition-all duration-300"
                onClick={() => handleRestaurantClick(restaurant.name)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                      {restaurant.name}
                    </h3>
                    
                    {/* Status Indicator */}
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(restaurant)} animate-pulse`} />
                      <span className="flex items-center space-x-1 text-xs font-medium text-slate-600">
                        {getStatusIcon(restaurant)}
                        <span>{getStatusText(restaurant)}</span>
                      </span>
                    </div>
                  </div>

                  {/* External Link */}
                  {restaurant.url && (
                    <motion.a
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      href={restaurant.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </motion.a>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100/50">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-blue-600 font-medium">Menu Items</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">
                      {restaurant.menu_items_count.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100/50">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Users className="w-4 h-4 text-purple-600" />
                      <p className="text-xs text-purple-600 font-medium">Categories</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-700">
                      {restaurant.categories_count}
                    </p>
                  </div>
                </div>

                {/* Review Sources */}
                <div className="mb-6">
                  <p className="text-sm text-slate-600 mb-2">Review Sources</p>
                  <div className="flex items-center space-x-2">
                    {restaurant.review_sources_count > 0 ? (
                      <span className="badge-success">
                        <Star className="w-3 h-3 mr-1" />
                        {restaurant.review_sources_count} active
                      </span>
                    ) : (
                      <span className="badge text-slate-600 bg-slate-100 border-slate-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        None
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>
                      {restaurant.reviews_last_scraped ? 
                        format(new Date(restaurant.reviews_last_scraped), 'MMM dd, HH:mm') : 
                        'Never updated'
                      }
                    </span>
                  </div>

                  {/* Manual Scrape Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleScrapeRestaurant(restaurant.name);
                    }}
                    disabled={loading.scraping}
                    className="flex items-center space-x-1 px-3 py-2 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg border border-blue-200 hover:border-blue-600 transition-all duration-200"
                    title="Trigger manual scrape"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading.scraping ? 'animate-spin' : ''}`} />
                    <span>Scrape</span>
                  </motion.button>
                </div>

                {/* Warning for stale data */}
                {restaurant.reviews_last_scraped && 
                 new Date(restaurant.reviews_last_scraped) < new Date(Date.now() - 24 * 60 * 60 * 1000) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 flex items-center space-x-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3"
                  >
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs">Data may be outdated</span>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RestaurantList;