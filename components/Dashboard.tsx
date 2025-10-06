// components/Dashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
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
  Globe,
  Star,
  MessageSquare,
  DollarSign,
  ShoppingCart,
  Search,
  Filter,
  ExternalLink,
  MapPin,
  ArrowUpRight,
  Calendar,
  Layers
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Premium Header */}
      <header className="relative bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5" />
        <div className="relative max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Premium Logo & Title */}
            <div className="flex items-center space-x-4">
              <motion.div 
                whileHover={{ rotate: 360, scale: 1.05 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="relative"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-30 -z-10" />
              </motion.div>
              
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Restaurant Intelligence
                </h1>
                <p className="text-sm text-gray-600 font-medium mt-0.5">Real-time competitive analysis platform</p>
              </div>
            </div>

            {/* Professional Status & Controls */}
            <div className="flex items-center space-x-6">
              {/* Enhanced Connection Status */}
              <div className="flex items-center space-x-3 px-4 py-2.5 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse shadow-emerald-500/50 shadow-md' :
                    connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
                    'bg-red-500'
                  }`} />
                  {connectionStatus === 'connected' ? (
                    <Wifi className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div className="border-l border-gray-300 pl-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
                  </span>
                  <p className="text-xs text-gray-500">Real-time updates</p>
                </div>
              </div>

              {/* Professional Control Buttons */}
              <div className="flex items-center space-x-3">
                {scrapingStatus?.is_running ? (
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStopScraping}
                    disabled={loading.scraping}
                    className="flex items-center space-x-2.5 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 disabled:opacity-50"
                  >
                    <PauseCircle className="w-4 h-4" />
                    <span className="text-sm">Stop Monitoring</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartScraping}
                    disabled={loading.scraping}
                    className="flex items-center space-x-2.5 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span className="text-sm">Start Monitoring</span>
                  </motion.button>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRefreshData}
                  disabled={loading.restaurants || loading.analytics}
                  className="flex items-center space-x-2.5 px-5 py-3 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl font-semibold border border-gray-200/60 hover:bg-white hover:border-gray-300 hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading.restaurants || loading.analytics ? 'animate-spin' : ''}`} />
                  <span className="text-sm">Refresh</span>
                </motion.button>

                {/* Settings Button */}
                <motion.button
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 bg-gray-100/80 hover:bg-gray-200/80 text-gray-600 hover:text-gray-800 rounded-xl transition-all duration-300 border border-gray-200/60"
                >
                  <Settings className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200"
          >
            <div className="max-w-7xl mx-auto px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-red-800 font-semibold">System Alert</p>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
                <button
                  onClick={clearError}
                  className="text-red-600 hover:text-red-800 font-medium px-4 py-2 rounded-lg hover:bg-red-200/50 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Navigation */}
      <nav className="bg-white/60 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex space-x-1 py-4">
            {[
              { id: 'overview', label: 'Dashboard', icon: Eye, description: 'Key metrics overview' },
              { id: 'restaurants', label: 'Restaurants', icon: Globe, description: 'Venue management' },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp, description: 'Performance insights' },
              { id: 'realtime', label: 'Live Feed', icon: Zap, description: 'Real-time monitoring' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`group relative flex flex-col items-center space-y-2 px-6 py-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-700 border border-blue-200/50 shadow-lg shadow-blue-500/10'
                      : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'}`} />
                  <div className="text-center">
                    <div className="font-semibold">{tab.label}</div>
                    <div className="text-xs text-gray-500 font-normal">{tab.description}</div>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-xl border border-blue-200/30"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Premium Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        <AnimatePresence mode="wait">
          {selectedTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-8"
            >
              {/* Premium Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                  { 
                    title: "Total Restaurants", 
                    value: selectors.totalRestaurants.toString(), 
                    icon: Globe, 
                    color: "from-blue-600 to-blue-700", 
                    bgColor: "from-blue-50 to-blue-100",
                    loading: loading.restaurants,
                    change: "+12%",
                    changeType: "positive"
                  },
                  { 
                    title: "Active Monitoring", 
                    value: selectors.recentlyUpdatedRestaurants.toString(), 
                    icon: Activity, 
                    color: "from-emerald-600 to-emerald-700", 
                    bgColor: "from-emerald-50 to-emerald-100",
                    loading: loading.restaurants,
                    change: "+8%",
                    changeType: "positive"
                  },
                  { 
                    title: "Avg Menu Size", 
                    value: Math.round(selectors.avgMenuSize).toString(), 
                    icon: Target, 
                    color: "from-purple-600 to-purple-700", 
                    bgColor: "from-purple-50 to-purple-100",
                    loading: loading.analytics,
                    change: "-3%",
                    changeType: "negative"
                  },
                  { 
                    title: "System Status", 
                    value: scrapingStatus?.is_running ? 'Active' : 'Standby', 
                    icon: scrapingStatus?.is_running ? Zap : Clock, 
                    color: scrapingStatus?.is_running ? "from-emerald-600 to-emerald-700" : "from-gray-600 to-gray-700", 
                    bgColor: scrapingStatus?.is_running ? "from-emerald-50 to-emerald-100" : "from-gray-50 to-gray-100",
                    loading: loading.status,
                    status: true
                  }
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 20, 
                        delay: index * 0.1 
                      }}
                      className="group relative cursor-pointer"
                    >
                      {/* Background with hover effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300" />
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300`} />
                      
                      {/* Content */}
                      <div className="relative p-6 border border-gray-200/50 rounded-2xl bg-white/80 backdrop-blur-sm group-hover:border-gray-300/50 transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                            {stat.loading ? (
                              <div className="h-8 w-16 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg" />
                            ) : (
                              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                            )}
                            
                            {/* Change indicator */}
                            {stat.change && !stat.loading && (
                              <div className={`flex items-center space-x-1 text-sm font-medium ${
                                stat.changeType === 'positive' ? 'text-emerald-700' : 'text-red-700'
                              }`}>
                                {stat.changeType === 'positive' ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (
                                  <TrendingDown className="w-3 h-3" />
                                )}
                                <span>{stat.change} vs last month</span>
                              </div>
                            )}
                            
                            {stat.status && !stat.loading && (
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${scrapingStatus?.is_running ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                                <span className="text-sm text-gray-600">
                                  {scrapingStatus?.is_running ? 'Live monitoring' : 'Standby mode'}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Icon */}
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Premium Analytics Overview */}
              {analyticsSummary && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-xl"
                >
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50" />
                  
                  <div className="relative p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Intelligence Overview</h2>
                        <p className="text-gray-600">Comprehensive analytics and insights</p>
                      </div>
                      <div className="flex items-center space-x-3 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/60">
                        <Database className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Live Data</span>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      </div>
                    </div>
                    
                    {/* Main metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                      {[
                        {
                          value: analyticsSummary.total_menu_items.toLocaleString(),
                          label: "Menu Items Tracked",
                          color: "from-blue-600 to-blue-700",
                          icon: Layers
                        },
                        {
                          value: analyticsSummary.total_review_scrapes.toLocaleString(),
                          label: "Reviews Analyzed",
                          color: "from-emerald-600 to-emerald-700",
                          icon: MessageSquare
                        },
                        {
                          value: analyticsSummary.recent_scrapes_24h.toLocaleString(),
                          label: "Recent Activity",
                          color: "from-purple-600 to-purple-700",
                          icon: Activity
                        }
                      ].map((metric, index) => {
                        const Icon = metric.icon;
                        return (
                          <motion.div
                            key={metric.label}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 hover:border-gray-300/50 transition-all duration-300"
                          >
                            <div className="flex items-center justify-center mb-3">
                              <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.color}`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <div className={`text-4xl font-bold bg-gradient-to-br ${metric.color} bg-clip-text text-transparent mb-2`}>
                              {metric.value}
                            </div>
                            <p className="text-gray-700 font-medium">{metric.label}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                    
                    {/* Categories section */}
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Market Categories</h3>
                        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1 group">
                          <span>View all</span>
                          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {analyticsSummary.top_categories.slice(0, 5).map(([category, count], index) => (
                          <motion.div
                            key={category}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            className="group relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200/50 p-4 hover:border-gray-300/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
                          >
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900 mb-1">{count}</div>
                              <div className="text-sm text-gray-600 font-medium group-hover:text-gray-800 transition-colors">{category}</div>
                            </div>
                            
                            {/* Hover effect overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Premium Restaurant Feed */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-blue-50/30 to-purple-50/30" />
                
                <div className="relative">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">Live Restaurant Feed</h2>
                        <p className="text-gray-600 text-sm">Real-time monitoring status</p>
                      </div>
                      <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium group">
                        <span>View all restaurants</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Restaurant list */}
                  <div className="divide-y divide-gray-200/50">
                    {restaurants.slice(0, 6).map((restaurant, index) => (
                      <motion.div
                        key={restaurant.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className="p-6 hover:bg-gray-50/50 transition-all duration-300 cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Restaurant avatar */}
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                                {restaurant.name.charAt(0)}
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                                restaurant.reviews_last_scraped && 
                                new Date(restaurant.reviews_last_scraped) > new Date(Date.now() - 60 * 60 * 1000) 
                                  ? 'bg-emerald-500 animate-pulse' 
                                  : 'bg-gray-400'
                              }`} />
                            </div>
                            
                            {/* Restaurant info */}
                            <div>
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors mb-1">
                                {restaurant.name}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Layers className="w-3 h-3" />
                                  <span>{restaurant.menu_items_count} items</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <BarChart3 className="w-3 h-3" />
                                  <span>{restaurant.categories_count} categories</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Status and time */}
                          <div className="text-right">
                            <div className="flex items-center justify-end space-x-2 mb-2">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <span className="text-xs text-gray-500 font-medium">
                                {restaurant.reviews_last_scraped ? 
                                  format(new Date(restaurant.reviews_last_scraped), 'MMM dd, HH:mm') : 
                                  'Never updated'
                                }
                              </span>
                            </div>
                            
                            {restaurant.review_sources_count > 0 ? (
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Star className="w-3 h-3 mr-1" />
                                {restaurant.review_sources_count} sources
                              </div>
                            ) : (
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                No sources
                              </div>
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