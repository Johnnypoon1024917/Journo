import React, { useState, useEffect } from 'react';
import { errorHandlingService } from '../../services/errorHandlingService';

interface ServiceHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: { [key: string]: boolean };
  latency: number;
  lastChecked: Date;
}

interface ServiceHealthMonitorProps {
  onHealthChange?: (status: ServiceHealthStatus) => void;
  checkInterval?: number; // in milliseconds
  showDetails?: boolean;
}

export const ServiceHealthMonitor: React.FC<ServiceHealthMonitorProps> = ({
  onHealthChange,
  checkInterval = 30000, // 30 seconds
  showDetails = false
}) => {
  const [healthStatus, setHealthStatus] = useState<ServiceHealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const health = await errorHandlingService.checkServiceHealth();
      const status: ServiceHealthStatus = {
        ...health,
        lastChecked: new Date()
      };
      
      setHealthStatus(status);
      
      if (onHealthChange) {
        onHealthChange(status);
      }
    } catch (error) {
      console.error('Health check failed:', error);
      const status: ServiceHealthStatus = {
        status: 'unhealthy',
        services: {},
        latency: 0,
        lastChecked: new Date()
      };
      setHealthStatus(status);
      
      if (onHealthChange) {
        onHealthChange(status);
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Initial health check
    checkHealth();
    
    // Set up periodic health checks
    const interval = setInterval(checkHealth, checkInterval);
    
    return () => clearInterval(interval);
  }, [checkInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'unhealthy':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'degraded':
        return '⚠️';
      case 'unhealthy':
        return '❌';
      default:
        return '❓';
    }
  };

  if (!healthStatus) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
        <span>Checking service health...</span>
      </div>
    );
  }

  return (
    <div className="service-health-monitor">
      <div className="flex items-center space-x-2">
        <span className="text-lg">{getStatusIcon(healthStatus.status)}</span>
        <span className={`text-sm font-medium ${getStatusColor(healthStatus.status)}`}>
          {healthStatus.status.charAt(0).toUpperCase() + healthStatus.status.slice(1)}
        </span>
        {isChecking && (
          <div className="animate-spin w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full"></div>
        )}
      </div>

      {showDetails && (
        <div className="mt-2 text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Latency: {healthStatus.latency}ms</span>
            <span>
              Last checked: {healthStatus.lastChecked.toLocaleTimeString()}
            </span>
          </div>
          
          {Object.keys(healthStatus.services).length > 0 && (
            <div className="mt-1">
              <span className="font-medium">Services: </span>
              {Object.entries(healthStatus.services).map(([service, isHealthy]) => (
                <span key={service} className="mr-2">
                  {service}: {isHealthy ? '✅' : '❌'}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {healthStatus.status === 'degraded' && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          Some services are experiencing issues. You may encounter slower performance.
        </div>
      )}

      {healthStatus.status === 'unhealthy' && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
          Services are currently unavailable. Please try again later.
        </div>
      )}
    </div>
  );
};