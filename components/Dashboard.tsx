// components/Dashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  BarChart3,
  Wifi,
  WifiOff,
  Server,
  Database,
  Zap,
  Eye,
  Settings,
  Bell,
  ChevronRight,
  Sparkles,
  Target,
  Globe
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useWebSocket } from '../hooks/useWebSocket';
import { useRestaurantStore, useRestaurantSelectors } from '../store/restaurantStore';
import { format } from 'date-fns';
import RestaurantList from './RestaurantList';
import RestaurantDetails from './RestaurantDetails';
import AnalyticsChart from './AnalyticsChart';
import RealTimeUpdates from './RealTimeUpdates';

const Dashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'restaurants' | 'analytics' | 'realtime'>('overview');

  const {
    restaurants,
    analyticsSummary,
    trendsData,
    scrapingStatus,
    loading,
    error,
    connectionStatus,
    fetchRestaurants,
    fetchAnalyticsSummary,
    fetchTrendsData,
    fetchScrapingStatus,
    startScraping,
    stopScraping,
    handleWebSocketMessage,
    setConnectionStatus,
    clearError
  } = useRestaurantStore();

  const selectors = useRestaurantSelectors();

  const { isConnected, isConnecting, lastMessage } = useWebSocket(undefined, {
    onMessage: handleWebSocketMessage,
    onConnect: () => setConnectionStatus('connected'),
    onDisconnect: () => setConnectionStatus('disconnected'),
    onError: () => setConnectionStatus('error'),
  });

  useEffect(() => {
    if (isConnecting) setConnectionStatus('connecting');
    else if (isConnected) setConnectionStatus('connected');
    else setConnectionStatus('disconnected');
  }, [isConnected, isConnecting, setConnectionStatus]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await Promise.all([
          fetchRestaurants(),
          fetchAnalyticsSummary(),
          fetchTrendsData(),
          fetchScrapingStatus()
        ]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Failed to load initial data');
      }
    };

    fetchInitialData();
    const statusInterval = setInterval(fetchScrapingStatus, 30000);
    return () => clearInterval(statusInterval);
  }, [fetchRestaurants, fetchAnalyticsSummary, fetchTrendsData, fetchScrapingStatus]);

  const handleStartScraping = async () => {
    try {
      await startScraping();
      toast.success('Scraping started');
    } catch (error) {
      toast.error('Failed to start scraping');
    }
  };

  const handleStopScraping = async () => {
    try {
      await stopScraping();
      toast.success('Scraping stopped');
    } catch (error) {
      toast.error('Failed to stop scraping');
    }
  };

  const handleRefreshData = async () => {
    try {
      await Promise.all([fetchRestaurants(), fetchAnalyticsSummary(), fetchTrendsData()]);
      toast.success('Data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="relative border-b border-white/10 backdrop-blur-xl bg-black/20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10" />
        <div className="relative max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div 
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="relative w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/25"
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                  Restaurant Intelligence
                </h1>
                <p className="text-sm text-slate-300 font-medium">Real-time competitive analysis platform</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
              >
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' :
                  connectionStatus === 'connecting' ? 'bg-amber-400 animate-pulse' :
                  'bg-red-400'
                }`} />
                {connectionStatus === 'connected' ? (
                  <Wifi className="w-4 h-4 text-emerald-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-sm font-medium text-white/90">
                  {connectionStatus === 'connected' ? 'Live' : 'Offline'}
                </span>
              </motion.div>

              <div className="flex items-center space-x-2">
                {scrapingStatus?.is_running ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStopScraping}
                    disabled={loading.scraping}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 disabled:opacity-50"
                  >
                    <PauseCircle className="w-4 h-4" />
                    <span>Stop</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartScraping}
                    disabled={loading.scraping}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Start</span>
                  </motion.button>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefreshData}
                  disabled={loading.restaurants || loading.analytics}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading.restaurants || loading.analytics ? 'animate-spin' : ''}`} />
                  <span>Sync</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-red-500/90 to-pink-500/90 backdrop-blur-sm border-b border-red-400/20"
          >
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-white" />
                <p className="text-white font-medium">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-white/80 hover:text-white font-medium"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1 py-4">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'restaurants', label: 'Restaurants', icon: Globe },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'realtime', label: 'Live Feed', icon: Zap },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`relative flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-white/20 shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-white/10"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {selectedTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Hero Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "Total Restaurants", value: selectors.totalRestaurants.toString(), icon: Globe, color: "from-blue-500 to-cyan-500", loading: loading.restaurants },
                  { title: "Active Monitoring", value: selectors.recentlyUpdatedRestaurants.toString(), icon: Activity, color: "from-emerald-500 to-green-500", loading: loading.restaurants },
                  { title: "Avg Menu Size", value: Math.round(selectors.avgMenuSize).toString(), icon: Target, color: "from-purple-500 to-pink-500", loading: loading.analytics },
                  { title: "System Status", value: scrapingStatus?.is_running ? 'Active' : 'Standby', icon: scrapingStatus?.is_running ? Zap : Clock, color: scrapingStatus?.is_running ? "from-emerald-500 to-green-500" : "from-slate-500 to-gray-500", loading: loading.status }
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: index * 0.1 }}
                      className="relative group cursor-pointer"
                    >
                      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 p-6 hover:border-white/20 transition-all duration-500">
                        <div className="relative flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-400 mb-2">{stat.title}</p>
                            {stat.loading ? (
                              <div className="h-10 w-24 bg-gradient-to-r from-slate-700 to-slate-600 animate-pulse rounded-xl" />
                            ) : (
                              <div className="text-3xl font-black text-white mb-2">{stat.value}</div>
                            )}
                          </div>
                          <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} shadow-2xl`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Analytics Overview */}
              {analyticsSummary && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
                  <div className="relative p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold text-white">Intelligence Overview</h2>
                      <div className="flex items-center space-x-2 text-slate-300">
                        <Database className="w-4 h-4" />
                        <span className="text-sm">Live Data</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                      <div className="text-center">
                        <div className="text-4xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                          {analyticsSummary.total_menu_items.toLocaleString()}
                        </div>
                        <p className="text-slate-300 font-medium">Menu Items Tracked</p>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-2">
                          {analyticsSummary.total_review_scrapes.toLocaleString()}
                        </div>
                        <p className="text-slate-300 font-medium">Reviews Analyzed</p>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                          {analyticsSummary.recent_scrapes_24h.toLocaleString()}
                        </div>
                        <p className="text-slate-300 font-medium">Recent Activity</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-white mb-6">Market Categories</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {analyticsSummary.top_categories.slice(0, 5).map(([category, count], index) => (
                          <motion.div
                            key={category}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * index }}
                            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 p-4 hover:from-white/10 hover:to-white/15 transition-all duration-300"
                          >
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white mb-1">{count}</div>
                              <div className="text-sm text-slate-300 font-medium">{category}</div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Live Restaurant Feed */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10"
              >
                <div className="relative">
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white">Live Restaurant Feed</h2>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                  <div className="divide-y divide-white/5">
                    {restaurants.slice(0, 6).map((restaurant, index) => (
                      <motion.div
                        key={restaurant.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        className="p-6 hover:bg-white/5 transition-all duration-300 cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                              {restaurant.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                                {restaurant.name}
                              </h3>
                              <p className="text-sm text-slate-400">
                                {restaurant.menu_items_count} items • {restaurant.categories_count} categories
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${
                                restaurant.reviews_last_scraped && 
                                new Date(restaurant.reviews_last_scraped) > new Date(Date.now() - 60 * 60 * 1000) 
                                  ? 'bg-emerald-400 animate-pulse' 
                                  : 'bg-slate-600'
                              }`} />
                              <span className="text-xs text-slate-400">
                                {restaurant.reviews_last_scraped ? 
                                  format(new Date(restaurant.reviews_last_scraped), 'HH:mm') : 
                                  'Offline'
                                }
                              </span>
                            </div>
                            {restaurant.review_sources_count > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {restaurant.review_sources_count} sources
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {selectedTab === 'restaurants' && (
            <motion.div
              key="restaurants"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <RestaurantList />
            </motion.div>
          )}

          {selectedTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <AnalyticsChart data={trendsData} loading={loading.trends} />
            </motion.div>
          )}

          {selectedTab === 'realtime' && (
            <motion.div
              key="realtime"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <RealTimeUpdates />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Dashboard;