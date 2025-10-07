import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  Users, 
  Star,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  Filter,
  Download,
  RefreshCw,
  Lightbulb,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  FileText,
  TrendingUp as TrendIcon,
  Globe,
  MessageSquare,
  MapPin,
  Clock,
  Zap,
  PieChart as PieChartIcon,
  ShoppingBag,
  Eye,
  Briefcase
} from 'lucide-react';
import { useRestaurantStore } from '../store/restaurantStore';

interface RealTimeAnalyticsProps {
  loading?: boolean;
}

const RealTimeAnalytics: React.FC<RealTimeAnalyticsProps> = ({ loading: externalLoading = false }) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'competitive' | 'opportunities' | 'optimization' | 'strategy'>('overview');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Get real data from your store
  const {
    restaurants,
    analyticsSummary,
    trendsData,
    loading,
    error,
    fetchRestaurants,
    fetchAnalyticsSummary,
    fetchTrendsData
  } = useRestaurantStore();

  // Refresh data periodically
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      if (!refreshing) {
        try {
          await Promise.all([
            fetchRestaurants(),
            fetchAnalyticsSummary(),
            fetchTrendsData()
          ]);
        } catch (error) {
          console.error('Error refreshing analytics data:', error);
        }
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [fetchRestaurants, fetchAnalyticsSummary, fetchTrendsData, refreshing]);

  // Enhanced business analytics from real data
  const businessAnalytics = useMemo(() => {
    if (!restaurants.length) return null;

    // Calculate revenue potential and efficiency metrics
    const restaurantsWithScores = restaurants.map(restaurant => {
      // Menu diversity score (0-100)
      const menuDiversityScore = Math.min((restaurant.menu_items_count / 150) * 100, 100);
      
      // Price competitiveness (inverse - lower prices score higher)
      const avgPrice = restaurant.avg_price || 0;
      const priceCompetitiveness = avgPrice > 0 ? Math.max(0, 100 - ((avgPrice - 12) * 4)) : 50;
      
      // Customer satisfaction score
      const satisfactionScore = restaurant.avg_rating ? (restaurant.avg_rating / 5) * 100 : 50;
      
      // Digital presence effectiveness
      const reviewSources = restaurant.review_sources_count || 0;
      const digitalPresenceScore = Math.min((reviewSources / 5) * 100, 100);
      
      // Sentiment health score
      const sentimentHealthScore = restaurant.sentiment_score !== null ? 
        ((restaurant.sentiment_score + 1) / 2) * 100 : 50;

      // Calculate overall business performance score
      const businessPerformanceScore = Math.round(
        (menuDiversityScore * 0.25) +
        (priceCompetitiveness * 0.20) +
        (satisfactionScore * 0.25) +
        (digitalPresenceScore * 0.15) +
        (sentimentHealthScore * 0.15)
      );

      // Estimate revenue potential based on performance factors
      const estimatedMonthlyRevenue = Math.round(
        ((menuDiversityScore / 100) * 30000) +
        ((satisfactionScore / 100) * 40000) +
        ((digitalPresenceScore / 100) * 25000) +
        20000 // Base revenue
      );

      // Calculate revenue per menu item efficiency
      const revenuePerItem = restaurant.menu_items_count > 0 ? 
        Math.round(estimatedMonthlyRevenue / restaurant.menu_items_count) : 0;

      // Determine market position
      let marketPosition: 'leader' | 'challenger' | 'follower' | 'niche' = 'follower';
      if (businessPerformanceScore >= 85) marketPosition = 'leader';
      else if (businessPerformanceScore >= 70) marketPosition = 'challenger';
      else if (businessPerformanceScore >= 55) marketPosition = 'follower';
      else marketPosition = 'niche';

      // Identify growth opportunities
      const growthOpportunities = [];
      if (menuDiversityScore < 60) growthOpportunities.push('Expand menu variety');
      if (digitalPresenceScore < 70) growthOpportunities.push('Enhance digital presence');
      if (satisfactionScore < 80) growthOpportunities.push('Improve customer experience');
      if (sentimentHealthScore < 70) growthOpportunities.push('Address negative feedback');

      // Calculate competitive threats and advantages
      const competitiveAdvantages = [];
      const competitiveThreats = [];
      
      if (menuDiversityScore > 80) competitiveAdvantages.push('Menu diversity leader');
      if (satisfactionScore > 85) competitiveAdvantages.push('Superior customer satisfaction');
      if (digitalPresenceScore > 85) competitiveAdvantages.push('Strong digital presence');
      
      if (priceCompetitiveness < 40) competitiveThreats.push('Price disadvantage');
      if (digitalPresenceScore < 40) competitiveThreats.push('Limited online visibility');
      if (sentimentHealthScore < 40) competitiveThreats.push('Negative sentiment trend');

      return {
        ...restaurant,
        business_performance_score: businessPerformanceScore,
        estimated_monthly_revenue: estimatedMonthlyRevenue,
        revenue_per_item: revenuePerItem,
        market_position: marketPosition,
        growth_opportunities: growthOpportunities,
        competitive_advantages: competitiveAdvantages,
        competitive_threats: competitiveThreats,
        scores: {
          menu_diversity: Math.round(menuDiversityScore),
          price_competitiveness: Math.round(priceCompetitiveness),
          customer_satisfaction: Math.round(satisfactionScore),
          digital_presence: Math.round(digitalPresenceScore),
          sentiment_health: Math.round(sentimentHealthScore)
        }
      };
    });

    // Market analysis
    const totalMarketValue = restaurantsWithScores.reduce((sum, r) => sum + r.estimated_monthly_revenue, 0);
    const avgMarketPerformance = restaurantsWithScores.reduce((sum, r) => sum + r.business_performance_score, 0) / restaurantsWithScores.length;
    
    // Identify leaders and opportunities
    const marketLeader = restaurantsWithScores.reduce((prev, current) => 
      prev.business_performance_score > current.business_performance_score ? prev : current
    );
    
    const mostEfficient = restaurantsWithScores.reduce((prev, current) => 
      prev.revenue_per_item > current.revenue_per_item ? prev : current
    );

    const underperformers = restaurantsWithScores
      .filter(r => r.business_performance_score < avgMarketPerformance - 10)
      .sort((a, b) => a.business_performance_score - b.business_performance_score);

    // Market gaps and opportunities
    const marketGaps = [];
    
    // Price gap analysis
    const priceRanges = { low: 0, mid: 0, premium: 0 };
    restaurantsWithScores.forEach(r => {
      if (r.avg_price && r.avg_price < 15) priceRanges.low++;
      else if (r.avg_price && r.avg_price < 25) priceRanges.mid++;
      else priceRanges.premium++;
    });
    
    if (priceRanges.low < restaurantsWithScores.length * 0.3) {
      marketGaps.push({
        opportunity: 'Budget-friendly segment',
        description: 'Limited affordable options under $15',
        potential_revenue: '$35-50K/month',
        investment_required: 'Low-Medium',
        timeline: '3-6 months'
      });
    }
    
    if (priceRanges.premium < restaurantsWithScores.length * 0.2) {
      marketGaps.push({
        opportunity: 'Premium dining segment',
        description: 'Underserved premium market above $25',
        potential_revenue: '$80-120K/month',
        investment_required: 'High',
        timeline: '6-12 months'
      });
    }

    // Menu diversity gap
    const avgMenuSize = restaurantsWithScores.reduce((sum, r) => sum + r.menu_items_count, 0) / restaurantsWithScores.length;
    const menuLeader = restaurantsWithScores.reduce((prev, current) => 
      prev.menu_items_count > current.menu_items_count ? prev : current
    );
    
    if (menuLeader.menu_items_count - avgMenuSize > 20) {
      marketGaps.push({
        opportunity: 'Menu specialization niche',
        description: 'Focus on specific cuisine categories with limited competition',
        potential_revenue: '$45-65K/month',
        investment_required: 'Medium',
        timeline: '2-4 months'
      });
    }

    // Generate strategic recommendations
    const strategicRecommendations = [
      {
        priority: 'HIGH',
        category: 'Revenue Optimization',
        recommendation: `Focus on ${underperformers[0]?.name || 'underperforming restaurants'} - potential ${Math.round((avgMarketPerformance - (underperformers[0]?.business_performance_score || 0)) * 500)} monthly revenue increase`,
        impact: 'High',
        effort: 'Medium',
        timeline: '1-3 months'
      },
      {
        priority: 'HIGH',
        category: 'Market Expansion',
        recommendation: marketGaps.length > 0 ? `Explore ${marketGaps[0].opportunity} - ${marketGaps[0].potential_revenue} potential` : 'Monitor for new market opportunities',
        impact: 'High',
        effort: 'High',
        timeline: '3-6 months'
      },
      {
        priority: 'MEDIUM',
        category: 'Digital Enhancement',
        recommendation: `Improve digital presence for ${restaurantsWithScores.filter(r => r.scores.digital_presence < 70).length} restaurants`,
        impact: 'Medium',
        effort: 'Low',
        timeline: '1-2 months'
      },
      {
        priority: 'MEDIUM',
        category: 'Competitive Strategy',
        recommendation: `Leverage ${marketLeader.name}'s success model - ${marketLeader.competitive_advantages.join(', ')}`,
        impact: 'Medium',
        effort: 'Medium',
        timeline: '2-4 months'
      }
    ];

    return {
      restaurants: restaurantsWithScores,
      market_insights: {
        total_market_value: totalMarketValue,
        avg_performance: Math.round(avgMarketPerformance),
        market_leader: marketLeader,
        most_efficient: mostEfficient,
        underperformers: underperformers.slice(0, 3),
        market_gaps: marketGaps,
        price_distribution: priceRanges
      },
      strategic_recommendations: strategicRecommendations,
      performance_metrics: {
        total_restaurants: restaurantsWithScores.length,
        avg_menu_size: Math.round(avgMenuSize),
        leaders_count: restaurantsWithScores.filter(r => r.market_position === 'leader').length,
        improvement_opportunities: restaurantsWithScores.filter(r => r.growth_opportunities.length > 2).length
      }
    };
  }, [restaurants]);

  // Process trends for business insights
  const businessTrends = useMemo(() => {
    if (!trendsData) return null;

    // Activity trends with business context
    const activityTrends = trendsData.activity_trends?.map(item => {
      const date = new Date(item.date);
      const reviewGrowth = item.reviews || 0;
      const dataGrowth = item.menu_scrapes || 0;
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        market_activity: reviewGrowth + dataGrowth,
        customer_engagement: reviewGrowth,
        competitive_intelligence: dataGrowth,
        business_opportunity_score: Math.round((reviewGrowth * 1.5 + dataGrowth) * 0.8)
      };
    }).slice(-7) || [];

    return { activityTrends };
  }, [trendsData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchRestaurants(),
        fetchAnalyticsSummary(),
        fetchTrendsData()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const isLoading = externalLoading || loading.restaurants || loading.analytics || loading.trends;

  if (isLoading && !businessAnalytics) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6">
            <div className="h-6 bg-gray-200 animate-pulse rounded mb-4" />
            <div className="h-64 bg-gray-200 animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!businessAnalytics) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Business Data Available</h3>
        <p className="text-gray-600 mb-4">Initialize your restaurant competitive intelligence system to see actionable insights.</p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {refreshing ? 'Loading Business Data...' : 'Load Restaurant Intelligence'}
        </button>
      </div>
    );
  }

  const views = [
    { id: 'overview', label: 'Business Overview', icon: BarChart3, desc: 'Market performance' },
    { id: 'competitive', label: 'Competitive Intelligence', icon: Target, desc: 'Market positioning' },
    { id: 'opportunities', label: 'Growth Opportunities', icon: TrendingUp, desc: 'Market gaps' },
    { id: 'optimization', label: 'Performance Optimization', icon: Zap, desc: 'Improvement areas' },
    { id: 'strategy', label: 'Strategic Recommendations', icon: Briefcase, desc: 'Action plan' }
  ];

  return (
    <div className="space-y-8">
      {/* Business Intelligence Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-1 overflow-x-auto">
          {views.map((view) => {
            const Icon = view.icon;
            const isActive = selectedView === view.id;
            return (
              <motion.button
                key={view.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedView(view.id as any)}
                className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{view.label}</span>
                <span className="text-xs opacity-75">{view.desc}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Updating...' : 'Refresh Intelligence'}</span>
          </motion.button>
        </div>
      </div>

      {/* Key Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { 
            title: 'Market Leader', 
            value: businessAnalytics.market_insights.market_leader.name,
            metric: `${businessAnalytics.market_insights.market_leader.business_performance_score}/100 Score`,
            change: `$${(businessAnalytics.market_insights.market_leader.estimated_monthly_revenue / 1000).toFixed(0)}K Revenue`,
            changeType: 'positive' as const,
            icon: Award,
            color: 'from-yellow-500 to-orange-500'
          },
          { 
            title: 'Total Market Value', 
            value: `$${(businessAnalytics.market_insights.total_market_value / 1000).toFixed(0)}K`,
            metric: `${businessAnalytics.performance_metrics.total_restaurants} restaurants`,
            change: `$${Math.round(businessAnalytics.market_insights.total_market_value / businessAnalytics.performance_metrics.total_restaurants / 1000)}K avg`,
            changeType: 'positive' as const,
            icon: DollarSign,
            color: 'from-green-500 to-emerald-600'
          },
          { 
            title: 'Efficiency Leader', 
            value: businessAnalytics.market_insights.most_efficient.name,
            metric: `$${businessAnalytics.market_insights.most_efficient.revenue_per_item}/item`,
            change: `${businessAnalytics.market_insights.most_efficient.menu_items_count} menu items`,
            changeType: 'positive' as const,
            icon: Zap,
            color: 'from-purple-500 to-indigo-600'
          },
          { 
            title: 'Improvement Opportunities', 
            value: `${businessAnalytics.performance_metrics.improvement_opportunities}`,
            metric: 'restaurants need optimization',
            change: `${businessAnalytics.market_insights.underperformers.length} underperforming`,
            changeType: 'negative' as const,
            icon: TrendingUp,
            color: 'from-blue-500 to-cyan-600'
          }
        ].map((stat, index) => {
          const Icon = stat.icon;

          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <div className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {stat.change}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-lg font-bold text-gray-900 mb-1 break-words">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.metric}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Business Intelligence Content */}
      <motion.div
        key={selectedView}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
      >
        {selectedView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Market Performance Matrix */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-500" />
                Revenue vs Performance Matrix
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={businessAnalytics.restaurants}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="business_performance_score" 
                      type="number" 
                      domain={[0, 100]}
                      name="Performance Score"
                    />
                    <YAxis 
                      dataKey="estimated_monthly_revenue" 
                      type="number" 
                      domain={['dataMin', 'dataMax']}
                      name="Monthly Revenue ($)"
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip 
                      formatter={(value, name, props) => {
                        const data = props.payload;
                        if (name === 'estimated_monthly_revenue') {
                          return [`$${(value as number / 1000).toFixed(0)}K`, 'Monthly Revenue'];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(label, payload) => {
                        const data = payload?.[0]?.payload;
                        return data?.name || '';
                      }}
                    />
                    <Scatter 
                      dataKey="estimated_monthly_revenue" 
                      fill="#3b82f6"
                      name="Restaurants"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Market Position Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center">
                <PieChartIcon className="w-5 h-5 mr-2 text-green-500" />
                Market Position Distribution
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { position: 'Leaders', value: businessAnalytics.restaurants.filter(r => r.market_position === 'leader').length, color: '#10b981' },
                        { position: 'Challengers', value: businessAnalytics.restaurants.filter(r => r.market_position === 'challenger').length, color: '#3b82f6' },
                        { position: 'Followers', value: businessAnalytics.restaurants.filter(r => r.market_position === 'follower').length, color: '#f59e0b' },
                        { position: 'Niche', value: businessAnalytics.restaurants.filter(r => r.market_position === 'niche').length, color: '#8b5cf6' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ position, value }) => `${position}: ${value}`}
                    >
                      {[
                        { position: 'Leaders', value: businessAnalytics.restaurants.filter(r => r.market_position === 'leader').length, color: '#10b981' },
                        { position: 'Challengers', value: businessAnalytics.restaurants.filter(r => r.market_position === 'challenger').length, color: '#3b82f6' },
                        { position: 'Followers', value: businessAnalytics.restaurants.filter(r => r.market_position === 'follower').length, color: '#f59e0b' },
                        { position: 'Niche', value: businessAnalytics.restaurants.filter(r => r.market_position === 'niche').length, color: '#8b5cf6' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Business Activity Trends */}
            {businessTrends?.activityTrends && businessTrends.activityTrends.length > 0 && (
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-purple-500" />
                  Market Intelligence Activity (Last 7 Days)
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={businessTrends.activityTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="customer_engagement" 
                        stackId="1" 
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.7}
                        name="Customer Engagement"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="competitive_intelligence" 
                        stackId="1" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.7}
                        name="Competitive Intel"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="business_opportunity_score" 
                        stroke="#8b5cf6" 
                        strokeWidth={3}
                        name="Opportunity Score"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedView === 'competitive' && (
          <div className="space-y-8">
            {/* Competitive Intelligence Matrix */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-500" />
                Competitive Intelligence Dashboard
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Restaurant</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Performance Score</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Revenue Potential</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Market Position</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Competitive Advantages</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Threats</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businessAnalytics.restaurants
                      .sort((a, b) => b.business_performance_score - a.business_performance_score)
                      .map((restaurant, index) => (
                        <motion.tr
                          key={restaurant.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                restaurant.market_position === 'leader' ? 'bg-green-500' :
                                restaurant.market_position === 'challenger' ? 'bg-blue-500' :
                                restaurant.market_position === 'follower' ? 'bg-orange-500' :
                                'bg-purple-500'
                              }`} />
                              <span className="font-medium text-gray-900">{restaurant.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                              restaurant.business_performance_score >= 80 ? 'bg-green-100 text-green-800' :
                              restaurant.business_performance_score >= 60 ? 'bg-blue-100 text-blue-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {restaurant.business_performance_score}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center font-semibold text-gray-900">
                            ${(restaurant.estimated_monthly_revenue / 1000).toFixed(0)}K
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                              restaurant.market_position === 'leader' ? 'bg-green-100 text-green-800' :
                              restaurant.market_position === 'challenger' ? 'bg-blue-100 text-blue-800' :
                              restaurant.market_position === 'follower' ? 'bg-orange-100 text-orange-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {restaurant.market_position}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              {restaurant.competitive_advantages.slice(0, 2).map((advantage, idx) => (
                                <span key={idx} className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded mr-1 mb-1">
                                  {advantage}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              {restaurant.competitive_threats.slice(0, 2).map((threat, idx) => (
                                <span key={idx} className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded mr-1 mb-1">
                                  {threat}
                                </span>
                              ))}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'opportunities' && (
          <div className="space-y-8">
            {/* Market Gaps */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                  Market Gap Analysis
                </h3>
                <div className="space-y-4">
                  {businessAnalytics.market_insights.market_gaps.map((gap, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                    >
                      <h4 className="font-bold text-blue-800 mb-3">{gap.opportunity}</h4>
                      <p className="text-sm text-blue-700 mb-3">{gap.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-blue-600">Revenue Potential:</span>
                          <p className="font-semibold text-blue-800">{gap.potential_revenue}</p>
                        </div>
                        <div>
                          <span className="text-blue-600">Investment:</span>
                          <p className="font-semibold text-blue-800">{gap.investment_required}</p>
                        </div>
                        <div>
                          <span className="text-blue-600">Timeline:</span>
                          <p className="font-semibold text-blue-800">{gap.timeline}</p>
                        </div>
                        <div className="flex items-center justify-end">
                          <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                            High Opportunity
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {businessAnalytics.market_insights.market_gaps.length === 0 && (
                    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                      <Eye className="w-8 h-8 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600">No major market gaps identified. Market appears well-saturated across price segments.</p>
                      <p className="text-sm text-gray-500 mt-2">Focus on differentiation and optimization opportunities.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center">
                  <ShoppingBag className="w-5 h-5 mr-2 text-green-500" />
                  Revenue Expansion Opportunities
                </h3>
                <div className="space-y-4">
                  {businessAnalytics.restaurants
                    .filter(r => r.growth_opportunities.length > 0)
                    .sort((a, b) => b.estimated_monthly_revenue - a.estimated_monthly_revenue)
                    .slice(0, 4)
                    .map((restaurant, index) => (
                      <motion.div
                        key={restaurant.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-green-50 rounded-lg border border-green-200"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-semibold text-green-800">{restaurant.name}</h4>
                          <span className="text-sm font-bold text-green-700">
                            ${(restaurant.estimated_monthly_revenue / 1000).toFixed(0)}K potential
                          </span>
                        </div>
                        <div className="space-y-2">
                          {restaurant.growth_opportunities.map((opp, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <ArrowUpRight className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-700">{opp}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-green-300">
                          <p className="text-xs text-green-600">
                            Estimated uplift potential: ${Math.round((100 - restaurant.business_performance_score) * 300)}/month
                          </p>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'optimization' && (
          <div className="space-y-8">
            {/* Performance Optimization */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-orange-500" />
                Performance Optimization Dashboard
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">Underperforming Restaurants</h4>
                  <div className="space-y-4">
                    {businessAnalytics.market_insights.underperformers.map((restaurant, index) => (
                      <motion.div
                        key={restaurant.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-red-50 rounded-lg border border-red-200"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-medium text-red-800">{restaurant.name}</h5>
                          <span className="text-sm font-bold text-red-700">
                            {restaurant.business_performance_score}/100
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-red-600">Revenue Gap:</span>
                            <p className="font-semibold text-red-800">
                              ${((businessAnalytics.market_insights.total_market_value / businessAnalytics.performance_metrics.total_restaurants - restaurant.estimated_monthly_revenue) / 1000).toFixed(0)}K/month
                            </p>
                          </div>
                          <div>
                            <span className="text-red-600">Priority Issues:</span>
                            <p className="font-semibold text-red-800">{restaurant.growth_opportunities.length} areas</p>
                          </div>
                        </div>
                        <div className="mt-3 space-y-1">
                          {restaurant.growth_opportunities.slice(0, 3).map((opp, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              <span className="text-xs text-red-700">{opp}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">Performance Metrics Breakdown</h4>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={businessAnalytics.restaurants.slice(0, 5).map(r => ({
                        restaurant: r.name.length > 12 ? r.name.substring(0, 12) + '...' : r.name,
                        'Menu Diversity': r.scores.menu_diversity,
                        'Price Competitiveness': r.scores.price_competitiveness,
                        'Customer Satisfaction': r.scores.customer_satisfaction,
                        'Digital Presence': r.scores.digital_presence,
                        'Sentiment Health': r.scores.sentiment_health
                      }))}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="restaurant" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        {['Menu Diversity', 'Price Competitiveness', 'Customer Satisfaction', 'Digital Presence', 'Sentiment Health'].map((key, index) => (
                          <Radar
                            key={key}
                            name={key}
                            dataKey={key}
                            stroke={`hsl(${index * 72}, 70%, 50%)`}
                            fill={`hsl(${index * 72}, 70%, 50%)`}
                            fillOpacity={0.1}
                          />
                        ))}
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'strategy' && (
          <div className="space-y-8">
            {/* Strategic Recommendations */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center">
                <Briefcase className="w-6 h-6 mr-3 text-blue-600" />
                Strategic Action Plan
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {businessAnalytics.strategic_recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.15 }}
                    className="bg-white rounded-lg p-6 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          rec.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {rec.priority}
                        </div>
                        <h4 className="font-bold text-gray-800">{rec.category}</h4>
                      </div>
                      <span className="text-xs text-gray-500">{rec.timeline}</span>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{rec.recommendation}</p>
                    
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-gray-600">Impact</p>
                        <p className={`font-bold ${
                          rec.impact === 'High' ? 'text-green-700' : 
                          rec.impact === 'Medium' ? 'text-orange-700' : 'text-gray-700'
                        }`}>{rec.impact}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-gray-600">Effort</p>
                        <p className={`font-bold ${
                          rec.effort === 'Low' ? 'text-green-700' : 
                          rec.effort === 'Medium' ? 'text-orange-700' : 'text-red-700'
                        }`}>{rec.effort}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-gray-600">Priority</p>
                        <p className={`font-bold ${
                          rec.priority === 'HIGH' ? 'text-red-700' : 
                          rec.priority === 'MEDIUM' ? 'text-orange-700' : 'text-blue-700'
                        }`}>{rec.priority}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Executive Summary */}
              <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <h4 className="font-bold text-gray-800 mb-4">Executive Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-700">{businessAnalytics.performance_metrics.leaders_count}</p>
                    <p className="text-xs text-blue-600">Market Leaders</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">${(businessAnalytics.market_insights.total_market_value / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-green-600">Total Market Value</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-700">{businessAnalytics.market_insights.underperformers.length}</p>
                    <p className="text-xs text-orange-600">Need Optimization</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-700">{businessAnalytics.market_insights.market_gaps.length}</p>
                    <p className="text-xs text-purple-600">Market Opportunities</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Live Data Indicator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Live Business Intelligence Dashboard</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Market Value: ${(businessAnalytics.market_insights.total_market_value / 1000).toFixed(0)}K</span>
            <span>•</span>
            <span>Performance Avg: {businessAnalytics.market_insights.avg_performance}/100</span>
            <span>•</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              refreshing ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            }`}>
              {refreshing ? 'Updating Intelligence...' : 'Real-Time Data'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeAnalytics;