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
  Zap,
  Eye,
  Settings,
  Database,
  Target,
  Globe,
  Star,
  MessageSquare,
  Server,
  Shield,
  Monitor,
  HardDrive,
  Cpu,
  Network
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRestaurantStore, useRestaurantSelectors } from '../store/restaurantStore';
import RestaurantList from './RestaurantList';
import RestaurantDetails from './RestaurantDetails';
import AnalyticsChart from './AnalyticsChart';
import RealTimeUpdates from './RealTimeUpdates';
import ReviewsAnalysis from './ReviewAnalysis';

import RealTimeAnalytics from './RealTimeAnalytics';
import ScrappingProgresbar from './ScrappingProgressBar';

const Dashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'restaurants' | 'analytics' | 'reviews' | 'realtime'>('overview');

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

  // WebSocket connection for real-time updates
  const [wsConnected, setWsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    let websocket: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const connectWebSocket = () => {
      try {
        const wsUrl = process.env.NODE_ENV === 'production' 
          ? `wss://${window.location.host}/ws`
          : 'ws://localhost:8000/ws';
          
        websocket = new WebSocket(wsUrl);

        websocket.onopen = () => {
          console.log('WebSocket connected');
          setWsConnected(true);
          setConnectionStatus('connected');
          setWs(websocket);
          toast.success('Connected to live updates');
        };

        websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
            
            // Handle specific message types for real-time progress updates
            if (message.type === 'scraping_progress') {
              console.log('Scraping progress update:', message.data);
            } else if (message.type === 'restaurant_update' && message.data?.status === 'completed') {
              toast.success(`${message.restaurant} updated`);
              fetchRestaurants();
            } else if (message.type === 'scraping_complete') {
              toast.success('Scraping completed successfully');
              Promise.all([
                fetchRestaurants(),
                fetchAnalyticsSummary(),
                fetchTrendsData()
              ]);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        websocket.onclose = () => {
          console.log('WebSocket disconnected');
          setWsConnected(false);
          setConnectionStatus('disconnected');
          setWs(null);
          
          // Attempt to reconnect after 5 seconds
          reconnectTimer = setTimeout(connectWebSocket, 5000);
        };

        websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnectionStatus('error');
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setConnectionStatus('error');
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (websocket) {
        websocket.close();
      }
    };
  }, [handleWebSocketMessage, setConnectionStatus, fetchRestaurants, fetchAnalyticsSummary, fetchTrendsData]);

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
    
    // Set up periodic refresh for scraping status
    const statusInterval = setInterval(() => {
      if (scrapingStatus?.is_running) {
        fetchScrapingStatus().catch(console.error);
      }
    }, 5000);
    
    // Refresh data periodically when not scraping
    const dataInterval = setInterval(() => {
      if (!scrapingStatus?.is_running) {
        fetchAnalyticsSummary().catch(console.error);
        fetchTrendsData().catch(console.error);
      }
    }, 60000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(dataInterval);
    };
  }, [fetchRestaurants, fetchAnalyticsSummary, fetchTrendsData, fetchScrapingStatus, scrapingStatus?.is_running]);

  const handleStartScraping = async () => {
    try {
      await startScraping();
      toast.success('Scraping started successfully');
    } catch (error) {
      console.error('Error starting scraping:', error);
      toast.error('Failed to start scraping');
    }
  };

  const handleStopScraping = async () => {
    try {
      await stopScraping();
      toast.success('Scraping stopped');
    } catch (error) {
      console.error('Error stopping scraping:', error);
      toast.error('Failed to stop scraping');
    }
  };

  const handlePauseScraping = async () => {
    try {
      toast.success('Scraping paused');
    } catch (error) {
      toast.error('Failed to pause scraping');
    }
  };

  const handleResumeScraping = async () => {
    try {
      await startScraping();
      toast.success('Scraping resumed');
    } catch (error) {
      toast.error('Failed to resume scraping');
    }
  };

  const handleRefreshData = async () => {
    try {
      await Promise.all([
        fetchRestaurants(), 
        fetchAnalyticsSummary(), 
        fetchTrendsData()
      ]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    }
  };

  const handleReconnect = () => {
    window.location.reload();
  };

  // Calculate top margin for main content when progress indicator is visible
  const hasActiveProgress = scrapingStatus?.is_running || (scrapingStatus?.progress_percentage && scrapingStatus.progress_percentage > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Compact Progress Indicator - Fixed at top */}
      <ScrappingProgresbar
        isVisible={hasActiveProgress}
        scrapingStatus={scrapingStatus}
        onPause={handlePauseScraping}
        onResume={handleResumeScraping}
        onStop={handleStopScraping}
      />

      {/* Header - Add top margin when progress indicator is visible */}
      <header className={`relative bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm transition-all duration-300 ${
        hasActiveProgress ? 'mt-16' : ''
      }`}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5" />
        <div className="relative max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center space-x-4">
              <motion.div 
                whileHover={{ rotate: 360, scale: 1.05 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="relative"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25">
                  <Database className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-30 -z-10" />
              </motion.div>
              
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Restaurant Intelligence
                </h1>
                <p className="text-sm text-gray-600 font-medium mt-0.5">Competitive analysis and market insights</p>
              </div>
            </div>

            {/* Status & Controls */}
            <div className="flex items-center space-x-6">
              {/* Connection Status */}
              <div className="flex items-center space-x-3 px-4 py-2.5 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    wsConnected ? 'bg-emerald-500 animate-pulse shadow-emerald-500/50 shadow-md' :
                    'bg-red-500'
                  }`} />
                  {wsConnected ? (
                    <Wifi className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div className="border-l border-gray-300 pl-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {wsConnected ? 'Live' : 'Offline'}
                  </span>
                  <p className="text-xs text-gray-500">
                    {wsConnected ? 'Real-time updates' : 'Reconnecting...'}
                  </p>
                </div>
                
                {!wsConnected && (
                  <button
                    onClick={handleReconnect}
                    className="ml-2 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Reconnect
                  </button>
                )}
              </div>

              {/* Control Buttons */}
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
                    <span className="text-sm">Stop</span>
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
                    <span className="text-sm">Start</span>
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

      {/* Error Banner */}
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

      {/* Navigation - Removed Scraping tab */}
      <nav className="bg-white/60 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex space-x-1 py-4 overflow-x-auto">
            {[
              { id: 'overview', label: 'Dashboard', icon: Eye, description: 'Overview & system status' },
              { id: 'restaurants', label: 'Restaurants', icon: Globe, description: 'Boston venues' },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp, description: 'Business insights' },
              { id: 'reviews', label: 'Reviews', icon: MessageSquare, description: 'Sentiment analysis' },
              { id: 'realtime', label: 'Live Feed', icon: Zap, description: 'Real-time updates' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`group relative flex flex-col items-center space-y-2 px-6 py-4 rounded-xl font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
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

      {/* Main Content */}
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
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                  { 
                    title: "Boston Restaurants", 
                    value: selectors.totalRestaurants.toString(), 
                    icon: Globe, 
                    color: "from-blue-600 to-blue-700", 
                    bgColor: "from-blue-50 to-blue-100",
                    loading: loading.restaurants,
                    change: "Active monitoring",
                    changeType: "neutral" as const
                  },
                  { 
                    title: "Active Data Collection", 
                    value: selectors.recentlyUpdatedRestaurants.toString(), 
                    icon: Activity, 
                    color: "from-emerald-600 to-emerald-700", 
                    bgColor: "from-emerald-50 to-emerald-100",
                    loading: loading.restaurants,
                    change: "Live data",
                    changeType: "positive" as const
                  },
                  { 
                    title: "Menu Items", 
                    value: Math.round(selectors.avgMenuSize).toString(), 
                    icon: Target, 
                    color: "from-purple-600 to-purple-700", 
                    bgColor: "from-purple-50 to-purple-100",
                    loading: loading.analytics,
                    change: "Per restaurant",
                    changeType: "neutral" as const
                  },
                  { 
                    title: "System Status", 
                    value: scrapingStatus?.is_running ? 'Processing' : 'Ready', 
                    icon: scrapingStatus?.is_running ? Zap : Clock, 
                    color: scrapingStatus?.is_running ? "from-emerald-600 to-emerald-700" : "from-gray-600 to-gray-700", 
                    bgColor: scrapingStatus?.is_running ? "from-emerald-50 to-emerald-100" : "from-gray-50 to-gray-100",
                    loading: loading.status,
                    change: "Operational",
                    changeType: "positive" as const
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
                      <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300" />
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300`} />
                      
                      <div className="relative p-6 border border-gray-200/50 rounded-2xl bg-white/80 backdrop-blur-sm group-hover:border-gray-300/50 transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                            {stat.loading ? (
                              <div className="h-8 w-16 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg" />
                            ) : (
                              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                            )}
                            
                            {stat.change && !stat.loading && (
                              <div className={`flex items-center space-x-1 text-sm font-medium ${
                                stat.changeType === 'positive' ? 'text-emerald-700' : 
                                stat.changeType === 'negative' ? 'text-red-700' : 'text-gray-600'
                              }`}>
                                {stat.changeType === 'positive' ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : stat.changeType === 'negative' ? (
                                  <TrendingDown className="w-3 h-3" />
                                ) : (
                                  <Activity className="w-3 h-3" />
                                )}
                                <span>{stat.change}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* System Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Database className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800">Data Collection System Active</h3>
                    <p className="text-blue-700">
                      Monitoring {restaurants.length} Boston restaurants • Real-time menu & review data
                    </p>
                  </div>
                  {wsConnected && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Live Updates</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Collection System Status - Integrated Scraping Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* System Performance */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold mb-6 flex items-center">
                    <Monitor className="w-5 h-5 mr-2 text-green-500" />
                    System Performance
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Connection Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        wsConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {wsConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Data Collection</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        scrapingStatus?.is_running ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {scrapingStatus?.is_running ? 'Active' : 'Idle'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Last Update</span>
                      <span className="text-sm text-gray-900">
                        {trendsData?.generated_at ? 
                          new Date(trendsData.generated_at).toLocaleTimeString() : 
                          'Loading...'
                        }
                      </span>
                    </div>
                    {scrapingStatus?.progress_percentage !== undefined && scrapingStatus.progress_percentage > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600">Progress</span>
                          <span className="text-sm text-gray-900">
                            {Math.round(scrapingStatus.progress_percentage)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${scrapingStatus.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Data Collection Stats */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold mb-6 flex items-center">
                    <HardDrive className="w-5 h-5 mr-2 text-purple-500" />
                    Data Collection Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <Globe className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {restaurants.length}
                      </p>
                      <p className="text-sm text-gray-600">Restaurants</p>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <Target className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {restaurants.reduce((sum, r) => sum + r.menu_items_count, 0)}
                      </p>
                      <p className="text-sm text-gray-600">Menu Items</p>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <Star className="w-5 h-5 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {restaurants.reduce((sum, r) => sum + r.review_sources_count, 0)}
                      </p>
                      <p className="text-sm text-gray-600">Review Sources</p>
                    </div>
                    
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <Activity className="w-5 h-5 text-orange-600" />
                      </div>
                      <p className="text-2xl font-bold text-orange-600">
                        {restaurants.filter(r => r.reviews_last_scraped && 
                          new Date(r.reviews_last_scraped) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                        ).length}
                      </p>
                      <p className="text-sm text-gray-600">Active (24h)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Infrastructure Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center">
                  <Server className="w-5 h-5 mr-2 text-blue-500" />
                  Infrastructure Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-lg ${wsConnected ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Network className={`w-5 h-5 ${wsConnected ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">WebSocket</p>
                      <p className={`text-sm ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
                        {wsConnected ? 'Connected' : 'Disconnected'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Cpu className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Processing</p>
                      <p className="text-sm text-blue-600">
                        {scrapingStatus?.is_running ? 'Active' : 'Idle'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Security</p>
                      <p className="text-sm text-purple-600">Secured</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <AnalyticsChart data={trendsData} loading={loading.trends} />
                
                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold mb-6 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-green-500" />
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    {restaurants
                      .filter(r => r.reviews_last_scraped)
                      .sort((a, b) => new Date(b.reviews_last_scraped!).getTime() - new Date(a.reviews_last_scraped!).getTime())
                      .slice(0, 5)
                      .map((restaurant, index) => (
                        <div key={restaurant.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                            <div>
                              <p className="font-medium text-gray-900">{restaurant.name}</p>
                              <p className="text-sm text-gray-600">
                                {restaurant.menu_items_count} items • {restaurant.review_sources_count} sources
                              </p>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(restaurant.reviews_last_scraped!).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
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
              <RealTimeAnalytics loading={loading.analytics} />
            </motion.div>
          )}

          {selectedTab === 'reviews' && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <ReviewsAnalysis />
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