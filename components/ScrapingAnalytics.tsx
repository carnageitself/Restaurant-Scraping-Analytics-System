'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target,
  Zap,
  Database,
  Globe,
  BarChart3,
  PieChart,
  Calendar,
  RefreshCw,
  Server,
  Wifi,
  Timer,
  Award,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Search
} from 'lucide-react';
import { format, parseISO, subHours, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, Area, AreaChart } from 'recharts';
import { useRestaurantStore } from '../store/restaurantStore';

const ScrapingAnalytics: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');
  const [refreshInterval, setRefreshInterval] = useState<number>(30000); // 30 seconds

  const {
    restaurants,
    analyticsSummary,
    trendsData,
    scrapingStatus,
    scrapingAnalytics,
    realtimeUpdates,
    connectionStatus,
    fetchRestaurants,
    fetchAnalyticsSummary,
    fetchTrendsData,
    fetchScrapingStatus,
    fetchScrapingAnalytics,
    loading
  } = useRestaurantStore();

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      Promise.all([
        fetchRestaurants(),
        fetchAnalyticsSummary(),
        fetchTrendsData(),
        fetchScrapingStatus(),
        fetchScrapingAnalytics()
      ]);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, fetchRestaurants, fetchAnalyticsSummary, fetchTrendsData, fetchScrapingStatus, fetchScrapingAnalytics]);

  // Calculate real-time metrics
  const realtimeMetrics = React.useMemo(() => {
    const now = new Date();
    const timeframeHours = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720
    }[selectedTimeframe];

    const cutoffTime = subHours(now, timeframeHours);

    // Filter recent updates
    const recentUpdates = realtimeUpdates.filter(update => 
      parseISO(update.timestamp) > cutoffTime
    );

    // Calculate metrics
    const successfulScrapes = recentUpdates.filter(update => 
      update.type === 'restaurant_update' && update.data?.status === 'completed'
    ).length;

    const failedScrapes = recentUpdates.filter(update => 
      update.type === 'restaurant_update' && update.data?.status === 'failed'
    ).length;

    const errorCount = recentUpdates.filter(update => 
      update.type === 'error' || update.error
    ).length;

    const uniqueRestaurants = new Set(
      recentUpdates
        .filter(update => update.restaurant)
        .map(update => update.restaurant)
    ).size;

    return {
      totalScrapes: successfulScrapes + failedScrapes,
      successfulScrapes,
      failedScrapes,
      errorCount,
      uniqueRestaurants,
      successRate: successfulScrapes + failedScrapes > 0 ? 
        (successfulScrapes / (successfulScrapes + failedScrapes)) * 100 : 0,
      avgScrapesPerHour: timeframeHours > 0 ? 
        (successfulScrapes + failedScrapes) / timeframeHours : 0
    };
  }, [realtimeUpdates, selectedTimeframe]);

  // Process activity timeline
  const activityTimeline = React.useMemo(() => {
    if (!trendsData?.activity_trends) return [];

    return trendsData.activity_trends.map(item => ({
      date: format(parseISO(item.date), 'MMM dd'),
      menu_scrapes: item.menu_scrapes,
      reviews: item.reviews,
      total: item.menu_scrapes + item.reviews,
      success_rate: Math.random() * 30 + 70 // Mock success rate
    }));
  }, [trendsData]);

  // Restaurant performance data
  const restaurantPerformance = React.useMemo(() => {
    return restaurants
      .map(restaurant => ({
        name: restaurant.name.length > 15 ? 
          restaurant.name.substring(0, 15) + '...' : restaurant.name,
        menu_items: restaurant.menu_items_count,
        categories: restaurant.categories_count,
        review_sources: restaurant.review_sources_count,
        last_scraped: restaurant.reviews_last_scraped,
        status: restaurant.reviews_last_scraped && 
          parseISO(restaurant.reviews_last_scraped) > subHours(new Date(), 6) ?
          'active' : 'inactive'
      }))
      .sort((a, b) => b.menu_items - a.menu_items)
      .slice(0, 10);
  }, [restaurants]);

  // Error analysis
  const errorAnalysis = React.useMemo(() => {
    const errors = realtimeUpdates
      .filter(update => update.type === 'error' || update.error)
      .slice(0, 20);

    const errorTypes = errors.reduce((acc, update) => {
      const errorType = update.error?.includes('timeout') ? 'Timeout' :
                       update.error?.includes('rate') ? 'Rate Limited' :
                       update.error?.includes('connection') ? 'Connection' :
                       update.error?.includes('parse') ? 'Parsing' :
                       'Other';
      
      acc[errorType] = (acc[errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(errorTypes).map(([type, count]) => ({
      name: type,
      value: count,
      color: type === 'Timeout' ? '#ef4444' :
             type === 'Rate Limited' ? '#f59e0b' :
             type === 'Connection' ? '#8b5cf6' :
             type === 'Parsing' ? '#06b6d4' : '#6b7280'
    }));
  }, [realtimeUpdates]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'inactive': return 'bg-gray-400';
      case 'error': return 'bg-red-500';
      default: return 'bg-amber-500';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
              Scraping Analytics
            </h1>
            <p className="text-gray-600 mt-2">
              Real-time monitoring and performance insights
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border ${
              connectionStatus === 'connected' ? 'bg-emerald-50 border-emerald-200' :
              connectionStatus === 'connecting' ? 'bg-amber-50 border-amber-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
                'bg-red-500'
              }`} />
              <Wifi className={`w-4 h-4 ${
                connectionStatus === 'connected' ? 'text-emerald-600' :
                connectionStatus === 'connecting' ? 'text-amber-600' :
                'text-red-600'
              }`} />
              <span className={`text-sm font-medium ${
                connectionStatus === 'connected' ? 'text-emerald-800' :
                connectionStatus === 'connecting' ? 'text-amber-800' :
                'text-red-800'
              }`}>
                {connectionStatus === 'connected' ? 'Live' :
                 connectionStatus === 'connecting' ? 'Connecting' :
                 'Offline'}
              </span>
            </div>

            {/* Timeframe Selector */}
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            {/* Refresh Rate */}
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={10000}>10s refresh</option>
              <option value={30000}>30s refresh</option>
              <option value={60000}>1m refresh</option>
              <option value={300000}>5m refresh</option>
            </select>
          </div>
        </div>

        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-600">Total Scrapes</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{realtimeMetrics.totalScrapes}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-600">Successful</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{realtimeMetrics.successfulScrapes}</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
            <div className="flex items-center space-x-2 mb-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-red-600">Failed</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{realtimeMetrics.failedScrapes}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-600">Success Rate</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">{realtimeMetrics.successRate.toFixed(1)}%</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-600">Per Hour</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{realtimeMetrics.avgScrapesPerHour.toFixed(1)}</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
            <div className="flex items-center space-x-2 mb-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-medium text-indigo-600">Restaurants</span>
            </div>
            <p className="text-2xl font-bold text-indigo-700">{realtimeMetrics.uniqueRestaurants}</p>
          </div>
        </div>
      </motion.div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">System Status</h2>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            scrapingStatus?.is_running ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
          }`}>
            <Zap className="w-4 h-4" />
            <span>{scrapingStatus?.is_running ? 'Active' : 'Standby'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <Server className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-blue-600 mb-1">Total Restaurants</p>
            <p className="text-2xl font-bold text-blue-700">{scrapingStatus?.total_restaurants || 0}</p>
          </div>

          <div className="text-center p-4 bg-emerald-50 rounded-xl">
            <Activity className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm text-emerald-600 mb-1">Recent Scrapes</p>
            <p className="text-2xl font-bold text-emerald-700">{scrapingStatus?.recent_successful_scrapes || 0}</p>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <Wifi className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-purple-600 mb-1">Active Connections</p>
            <p className="text-2xl font-bold text-purple-700">{scrapingStatus?.active_connections || 0}</p>
          </div>

          <div className="text-center p-4 bg-amber-50 rounded-xl">
            <Timer className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="text-sm text-amber-600 mb-1">Next Cycle</p>
            <p className="text-lg font-bold text-amber-700">{scrapingStatus?.next_cycle || 'N/A'}</p>
          </div>
        </div>
      </motion.div>

      {/* Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">Activity Timeline</h2>
        
        {activityTimeline.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="menu_scrapes"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="Menu Scrapes"
                />
                <Area
                  type="monotone"
                  dataKey="reviews"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                  name="Review Scrapes"
                />
                <Line
                  type="monotone"
                  dataKey="success_rate"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Success Rate %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No activity data available</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Restaurant Performance & Error Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Restaurant Performance */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Performing Restaurants</h2>
          
          <div className="space-y-4">
            {restaurantPerformance.map((restaurant, index) => (
              <motion.div
                key={restaurant.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                      {restaurant.name.charAt(0)}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(restaurant.status)}`} />
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900">{restaurant.name}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{restaurant.menu_items} items</span>
                      <span>{restaurant.categories} categories</span>
                      <span>{restaurant.review_sources} sources</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    restaurant.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {restaurant.status === 'active' ? (
                      <><CheckCircle className="w-3 h-3 mr-1" />Active</>
                    ) : (
                      <><Clock className="w-3 h-3 mr-1" />Inactive</>
                    )}
                  </div>
                  {restaurant.last_scraped && (
                    <p className="text-xs text-gray-500 mt-1">
                      {format(parseISO(restaurant.last_scraped), 'MMM dd, HH:mm')}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Error Analysis */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Error Analysis</h2>
          
          {errorAnalysis.length > 0 ? (
            <>
              <div className="h-48 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={errorAnalysis}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {errorAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-3">
                {errorAnalysis.map((error, index) => (
                  <div key={error.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: error.color }}
                      />
                      <span className="text-sm font-medium text-gray-700">{error.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{error.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
                <p>No errors in selected timeframe</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Real-time Updates Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-200/50"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity Feed</h2>
          <p className="text-gray-600 text-sm mt-1">Live updates from scraping operations</p>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {realtimeUpdates.slice(0, 20).map((update, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`p-4 border-l-4 hover:bg-gray-50 transition-colors ${
                update.type === 'restaurant_update' ? 'border-blue-400' :
                update.type === 'system_status' ? 'border-emerald-400' :
                update.type === 'error' ? 'border-red-400' :
                'border-gray-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {update.type === 'restaurant_update' && <Activity className="w-4 h-4 text-blue-600" />}
                    {update.type === 'system_status' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                    {update.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                    
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {update.type.replace('_', ' ')}
                    </span>
                    
                    {update.restaurant && (
                      <span className="text-xs text-gray-500">• {update.restaurant}</span>
                    )}
                  </div>
                  
                  {update.message && (
                    <p className="text-sm text-gray-700 mb-2">{update.message}</p>
                  )}
                  
                  {update.error && (
                    <p className="text-sm text-red-600 mb-2">{update.error}</p>
                  )}
                  
                  {update.data && (
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {update.data.total_items && (
                        <span>{update.data.total_items} items</span>
                      )}
                      {update.data.categories && (
                        <span>{update.data.categories} categories</span>
                      )}
                      {update.data.reviews_count && (
                        <span>{update.data.reviews_count} reviews</span>
                      )}
                      {update.data.status && (
                        <span className={`px-2 py-1 rounded-full font-medium ${
                          update.data.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          update.data.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {update.data.status}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {format(parseISO(update.timestamp), 'HH:mm:ss')}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          
          {realtimeUpdates.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No recent activity to display</p>
              <p className="text-sm">Updates will appear here when scraping operations begin</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ScrapingAnalytics;