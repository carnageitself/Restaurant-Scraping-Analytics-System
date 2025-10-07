import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Zap,
  Database,
  Globe,
  MessageSquare,
  Pause,
  Play,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CompactProgressProps {
  isVisible: boolean;
  scrapingStatus: any | null;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

const ScrappingProgresbar: React.FC<CompactProgressProps> = ({
  isVisible,
  scrapingStatus,
  onPause,
  onResume,
  onStop
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  
  useEffect(() => {
    if (scrapingStatus?.last_message && scrapingStatus.last_message !== currentMessage) {
      setCurrentMessage(scrapingStatus.last_message);
    }
  }, [scrapingStatus?.last_message, currentMessage]);

  if (!isVisible || !scrapingStatus) return null;

  const progress = scrapingStatus.progress_percentage || 0;
  const isRunning = scrapingStatus.is_running;
  const currentRestaurant = scrapingStatus.current_restaurant;
  const currentTask = scrapingStatus.current_task || 'Preparing...';
  const completed = scrapingStatus.completed_restaurants || 0;
  const total = scrapingStatus.total_restaurants || 5;

  const formatDuration = (startTime?: string) => {
    if (!startTime) return '0:00';
    const start = new Date(startTime);
    const now = new Date();
    const duration = Math.floor((now.getTime() - start.getTime()) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm"
      >
        {/* Compact Header - Always Visible */}
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Status Info */}
            <div className="flex items-center space-x-4">
              <motion.div
                animate={{ 
                  rotate: isRunning ? 360 : 0,
                  scale: isRunning ? [1, 1.1, 1] : 1
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1, repeat: Infinity }
                }}
                className={`p-2 rounded-lg ${isRunning ? 'bg-blue-500' : 'bg-gray-400'}`}
              >
                <Activity className="w-4 h-4 text-white" />
              </motion.div>
              
              <div className="flex items-center space-x-6">
                <div>
                  <span className="text-sm font-semibold text-gray-900">
                    Restaurant Scraping
                  </span>
                  <div className="flex items-center space-x-3 text-xs text-gray-600">
                    <span>{formatDuration(scrapingStatus.start_time)}</span>
                    <span>•</span>
                    <span>{completed}/{total} complete</span>
                    <span>•</span>
                    <span className="text-blue-600 font-medium">{Math.round(progress)}%</span>
                  </div>
                </div>

                {/* Compact Progress Bar */}
                <div className="w-32">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Current Task - Truncated */}
                <div className="max-w-xs">
                  <span className="text-xs text-gray-600 truncate block">
                    {currentRestaurant && `${currentRestaurant}: `}{currentTask}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              {isRunning ? (
                <button
                  onClick={onPause}
                  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                  title="Pause scraping"
                >
                  <Pause className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onResume}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Resume scraping"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={onStop}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Stop scraping"
              >
                <X className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                title={isExpanded ? "Collapse" : "Expand details"}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-200 bg-gray-50/50"
            >
              <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Current Status */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Current Task</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-900">
                      <Database className="w-4 h-4 text-blue-500" />
                      <span>{currentTask}</span>
                    </div>
                    {currentMessage && (
                      <p className="text-xs text-gray-600 mt-1">{currentMessage}</p>
                    )}
                  </div>

                  {/* Restaurant Progress */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Progress</h4>
                    <div className="flex items-center space-x-2 mb-2">
                      {Array.from({ length: total }).map((_, index) => (
                        <div
                          key={index}
                          className={`w-3 h-3 rounded-full ${
                            index < completed 
                              ? 'bg-green-500' 
                              : index === completed && isRunning
                              ? 'bg-blue-500 animate-pulse'
                              : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600">
                      {completed} of {total} restaurants completed
                    </p>
                  </div>

                  {/* Timing Info */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Timing</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Elapsed:</span>
                        <span>{formatDuration(scrapingStatus.start_time)}</span>
                      </div>
                      {scrapingStatus.estimated_completion && (
                        <div className="flex justify-between">
                          <span>ETA:</span>
                          <span>{new Date(scrapingStatus.estimated_completion).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Errors */}
                {scrapingStatus.errors && scrapingStatus.errors.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-red-700 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-semibold">Errors ({scrapingStatus.errors.length})</span>
                    </div>
                    <div className="max-h-16 overflow-y-auto">
                      {scrapingStatus.errors.slice(0, 2).map((error: string, index: number) => (
                        <p key={index} className="text-xs text-red-600">{error}</p>
                      ))}
                      {scrapingStatus.errors.length > 2 && (
                        <p className="text-xs text-red-500 font-medium">
                          +{scrapingStatus.errors.length - 2} more errors
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScrappingProgresbar;