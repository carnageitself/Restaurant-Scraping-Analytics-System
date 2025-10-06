import React, { useState } from 'react';
import { useRestaurantStore } from '../store/restaurantStore';
import { format } from 'date-fns';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Filter 
} from 'lucide-react';

const RealTimeUpdates: React.FC = () => {
  const { realtimeUpdates, connectionStatus } = useRestaurantStore();
  const [filterType, setFilterType] = useState<string>('all');

  const filteredUpdates = realtimeUpdates.filter(update => {
    if (filterType === 'all') return true;
    return update.type === filterType;
  });

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'restaurant_update': return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'system_status': return <Activity className="w-4 h-4 text-green-600" />;
      case 'connection_established': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getUpdateColor = (type: string) => {
    switch (type) {
      case 'restaurant_update': return 'border-blue-200 bg-blue-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'system_status': return 'border-green-200 bg-green-50';
      case 'connection_established': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const messageTypes = [
    { value: 'all', label: 'All Updates' },
    { value: 'restaurant_update', label: 'Restaurant Updates' },
    { value: 'system_status', label: 'System Status' },
    { value: 'error', label: 'Errors' },
  ];

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Real-time Connection Status</h2>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
            connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
            connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500' :
              connectionStatus === 'error' ? 'bg-red-500' :
              'bg-gray-500'
            }`} />
            <span className="capitalize">{connectionStatus}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {connectionStatus === 'connected' ? 
            'Receiving real-time updates from the scraping service' :
            connectionStatus === 'connecting' ?
            'Establishing connection to real-time updates' :
            'Not connected to real-time updates'
          }
        </p>
      </div>

      {/* Updates Feed */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Live Updates Feed</h2>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                {messageTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Showing {filteredUpdates.length} of {realtimeUpdates.length} updates
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filteredUpdates.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {realtimeUpdates.length === 0 ? 
                'No real-time updates received yet' :
                'No updates match the current filter'
              }
            </div>
          ) : (
            <div className="divide-y">
              {filteredUpdates.map((update, index) => (
                <div 
                  key={index} 
                  className={`p-4 border-l-4 ${getUpdateColor(update.type)}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">{getUpdateIcon(update.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {update.type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(update.timestamp), 'HH:mm:ss')}
                        </p>
                      </div>
                      
                      {update.restaurant && (
                        <p className="text-sm text-gray-600 mt-1">
                          Restaurant: <span className="font-medium">{update.restaurant}</span>
                        </p>
                      )}
                      
                      {update.message && (
                        <p className="text-sm text-gray-700 mt-1">{update.message}</p>
                      )}
                      
                      {update.error && (
                        <p className="text-sm text-red-600 mt-1">{update.error}</p>
                      )}
                      
                      {update.update_type && (
                        <p className="text-xs text-gray-500 mt-1">
                          Type: {update.update_type}
                        </p>
                      )}
                      
                      {update.data && typeof update.data === 'object' && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer">
                            Show details
                          </summary>
                          <pre className="text-xs text-gray-600 mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(update.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTimeUpdates;