'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Smile,
  Meh,
  Frown,
  Calendar,
  Filter,
  Search,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Clock,
  User,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Globe,
  Award,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { useRestaurantStore } from '../store/restaurantStore';

interface ReviewsAnalysisProps {
  restaurantName?: string;
}

const ReviewsAnalysis: React.FC<ReviewsAnalysisProps> = ({ restaurantName }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | 'all'>('30d');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'sentiment'>('date');
  
  const { 
    restaurants, 
    selectedRestaurant, 
    fetchRestaurant,
    loading
  } = useRestaurantStore();

  // If analyzing specific restaurant, fetch its details
  useEffect(() => {
    if (restaurantName) {
      fetchRestaurant(restaurantName);
    }
  }, [restaurantName, fetchRestaurant]);

  // Get data source
  const analysisData = restaurantName ? selectedRestaurant : null;
  const allRestaurants = !restaurantName ? restaurants : [];

  // Process reviews data
  const processedReviews = React.useMemo(() => {
    if (!analysisData?.reviews_data?.sources) return [];

    const allReviews: any[] = [];
    
    Object.entries(analysisData.reviews_data.sources).forEach(([source, sourceData]) => {
      sourceData.reviews.forEach((review: any) => {
        allReviews.push({
          ...review,
          source,
          restaurant: analysisData.name,
          parsedDate: parseISO(review.date)
        });
      });
    });

    return allReviews.filter(review => {
      // Time filter
      if (selectedTimeframe !== 'all') {
        const days = selectedTimeframe === '7d' ? 7 : 30;
        if (review.parsedDate < subDays(new Date(), days)) return false;
      }

      // Source filter
      if (selectedSource !== 'all' && review.source !== selectedSource) return false;

      // Sentiment filter
      if (selectedSentiment !== 'all') {
        const sentiment = review.sentiment || getSentimentFromScore(review.sentiment_score);
        if (sentiment !== selectedSentiment) return false;
      }

      // Search filter
      if (searchTerm && !review.text.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.parsedDate.getTime() - a.parsedDate.getTime();
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'sentiment':
          return (b.sentiment_score || 0) - (a.sentiment_score || 0);
        default:
          return 0;
      }
    });
  }, [analysisData, selectedTimeframe, selectedSource, selectedSentiment, searchTerm, sortBy]);

  // Helper function to determine sentiment from score
  const getSentimentFromScore = (score?: number): string => {
    if (!score) return 'neutral';
    if (score > 0.1) return 'positive';
    if (score < -0.1) return 'negative';
    return 'neutral';
  };

  // Calculate analytics
  const reviewAnalytics = React.useMemo(() => {
    if (restaurantName && analysisData?.reviews_data) {
      const sources = analysisData.reviews_data.sources;
      const summary = analysisData.reviews_data.summary;
      
      let totalReviews = 0;
      let totalRating = 0;
      let ratingCount = 0;
      let sentimentScores: number[] = [];
      
      Object.values(sources).forEach(sourceData => {
        sourceData.reviews.forEach((review: any) => {
          totalReviews++;
          if (review.rating) {
            totalRating += review.rating;
            ratingCount++;
          }
          if (review.sentiment_score !== undefined) {
            sentimentScores.push(review.sentiment_score);
          }
        });
      });

      const avgSentiment = sentimentScores.length > 0 ? 
        sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length : 0;

      return {
        totalReviews,
        avgRating: ratingCount > 0 ? totalRating / ratingCount : 0,
        avgSentiment,
        sourcesCount: Object.keys(sources).length,
        recentReviews: summary.recent_reviews_count || 0,
        sentimentDistribution: {
          positive: sentimentScores.filter(s => s > 0.1).length,
          neutral: sentimentScores.filter(s => s >= -0.1 && s <= 0.1).length,
          negative: sentimentScores.filter(s => s < -0.1).length
        }
      };
    }

    // Multi-restaurant analytics
    if (!restaurantName && allRestaurants.length > 0) {
      let totalReviews = 0;
      let totalRestaurantsWithReviews = 0;
      let avgRatings: number[] = [];

      allRestaurants.forEach(restaurant => {
        if (restaurant.review_sources_count > 0) {
          totalRestaurantsWithReviews++;
        }
      });

      return {
        totalRestaurants: allRestaurants.length,
        totalRestaurantsWithReviews,
        avgSourcesPerRestaurant: totalRestaurantsWithReviews > 0 ? 
          allRestaurants.reduce((sum, r) => sum + r.review_sources_count, 0) / allRestaurants.length : 0,
        coverageRate: allRestaurants.length > 0 ? totalRestaurantsWithReviews / allRestaurants.length : 0
      };
    }

    return null;
  }, [analysisData, allRestaurants, restaurantName]);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Smile className="w-4 h-4 text-emerald-600" />;
      case 'negative': return <Frown className="w-4 h-4 text-red-600" />;
      default: return <Meh className="w-4 h-4 text-amber-600" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'negative': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-amber-50 border-amber-200 text-amber-800';
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading.restaurant && restaurantName) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4 w-1/3" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

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
              {restaurantName ? `${restaurantName} Reviews` : 'Reviews Analysis'}
            </h1>
            <p className="text-gray-600 mt-2">
              {restaurantName ? 
                'Comprehensive review analysis and sentiment insights' :
                'Cross-restaurant review insights and performance metrics'
              }
            </p>
          </div>

          {restaurantName && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchRestaurant(restaurantName)}
              disabled={loading.restaurant}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading.restaurant ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </motion.button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>

          {restaurantName && analysisData?.reviews_data && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All sources</option>
                {Object.keys(analysisData.reviews_data.sources).map(source => (
                  <option key={source} value={source}>
                    {source.charAt(0).toUpperCase() + source.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sentiment</label>
            <select
              value={selectedSentiment}
              onChange={(e) => setSelectedSentiment(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Date</option>
              <option value="rating">Rating</option>
              <option value="sentiment">Sentiment</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </motion.div>

      {/* Analytics Cards */}
      {reviewAnalytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {restaurantName ? (
            <>
              <div className="bg-white rounded-2xl p-6 border border-blue-200/50 shadow-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Total Reviews</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{reviewAnalytics.totalReviews}</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-yellow-200/50 shadow-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-600">Avg Rating</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {reviewAnalytics.avgRating.toFixed(1)}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-emerald-200/50 shadow-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-600">Sentiment Score</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {(reviewAnalytics.avgSentiment * 100).toFixed(0)}%
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-purple-200/50 shadow-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <Globe className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-600">Sources</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{reviewAnalytics.sourcesCount}</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-2xl p-6 border border-blue-200/50 shadow-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Total Restaurants</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{reviewAnalytics.totalRestaurants}</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-emerald-200/50 shadow-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-600">With Reviews</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{reviewAnalytics.totalRestaurantsWithReviews}</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-purple-200/50 shadow-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-600">Coverage Rate</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {(reviewAnalytics.coverageRate * 100).toFixed(0)}%
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-amber-200/50 shadow-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <BarChart3 className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-amber-600">Avg Sources</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {reviewAnalytics.avgSourcesPerRestaurant.toFixed(1)}
                </p>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Reviews List */}
      {restaurantName && processedReviews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200/50"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Individual Reviews</h2>
            <p className="text-gray-600">Showing {processedReviews.length} reviews</p>
          </div>

          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {processedReviews.map((review, index) => (
                <motion.div
                  key={`${review.source}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {review.author.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{review.author}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{review.source}</span>
                          <span>•</span>
                          <span>{format(review.parsedDate, 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {review.rating && (
                        <div className="flex items-center space-x-1">
                          {getRatingStars(review.rating)}
                        </div>
                      )}
                      
                      {review.sentiment && (
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getSentimentColor(review.sentiment)}`}>
                          {getSentimentIcon(review.sentiment)}
                          <span>{review.sentiment}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 leading-relaxed">{review.text}</p>

                  {review.sentiment_score !== undefined && (
                    <div className="mt-4 flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Sentiment Score:</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-32">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            review.sentiment_score > 0 ? 'bg-emerald-500' : 
                            review.sentiment_score < 0 ? 'bg-red-500' : 'bg-gray-400'
                          }`}
                          style={{ 
                            width: `${Math.abs(review.sentiment_score) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {(review.sentiment_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Multi-restaurant view */}
      {!restaurantName && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Restaurant Review Performance</h2>
          
          <div className="space-y-4">
            {allRestaurants
              .sort((a, b) => b.review_sources_count - a.review_sources_count)
              .slice(0, 10)
              .map((restaurant, index) => (
                <motion.div
                  key={restaurant.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {restaurant.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{restaurant.name}</p>
                      <p className="text-sm text-gray-500">
                        Last updated: {restaurant.reviews_last_scraped ? 
                          format(parseISO(restaurant.reviews_last_scraped), 'MMM dd, yyyy') : 
                          'Never'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">{restaurant.review_sources_count}</p>
                      <p className="text-xs text-gray-500">Sources</p>
                    </div>
                    
                    <div className={`w-3 h-3 rounded-full ${
                      restaurant.review_sources_count > 0 ? 'bg-emerald-500' : 'bg-gray-400'
                    }`} />
                  </div>
                </motion.div>
              ))
            }
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {restaurantName && processedReviews.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-12 text-center"
        >
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews found</h3>
          <p className="text-gray-600">
            {searchTerm ? 
              `No reviews match "${searchTerm}" with current filters.` :
              'No reviews available for the selected criteria.'
            }
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ReviewsAnalysis;