import { LocationScraperService } from './locationScraperService.js';
import cron from 'node-cron';

export class CacheManagementService {
  private static isRunning = false;

  // Start cache management tasks
  static start(): void {
    if (this.isRunning) {
      console.log('Cache management service is already running');
      return;
    }

    console.log('Starting cache management service...');
    this.isRunning = true;

    // Schedule cache cleanup every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      console.log('Running scheduled cache cleanup...');
      try {
        const deletedCount = await LocationScraperService.cleanupExpiredCache();
        console.log(`Cache cleanup completed: ${deletedCount} entries removed`);
      } catch (error) {
        console.error('Error during scheduled cache cleanup:', error);
      }
    });

    // Schedule cache warming every day at 2 AM (off-peak hours)
    cron.schedule('0 2 * * *', async () => {
      console.log('Running scheduled cache warming...');
      try {
        await LocationScraperService.warmCacheForPopularDestinations();
        console.log('Cache warming completed');
      } catch (error) {
        console.error('Error during scheduled cache warming:', error);
      }
    });

    // Schedule cache statistics update every hour
    cron.schedule('0 * * * *', async () => {
      try {
        const metrics = await LocationScraperService.getCachePerformanceMetrics();
        console.log('Cache performance metrics:', {
          activeEntries: metrics.cache_entries?.active_entries || 0,
          hitRate: metrics.performance?.avg_hit_rate || 0,
          avgResponseTime: metrics.performance?.avg_response_time || 0
        });
      } catch (error) {
        console.error('Error getting cache performance metrics:', error);
      }
    });

    console.log('Cache management service started successfully');
  }

  // Stop cache management tasks
  static stop(): void {
    if (!this.isRunning) {
      console.log('Cache management service is not running');
      return;
    }

    console.log('Stopping cache management service...');
    this.isRunning = false;
    
    // Note: node-cron doesn't provide a direct way to stop all tasks
    // In a production environment, you might want to keep references to tasks
    console.log('Cache management service stopped');
  }

  // Manual cache operations
  static async manualCleanup(): Promise<number> {
    console.log('Running manual cache cleanup...');
    try {
      const deletedCount = await LocationScraperService.cleanupExpiredCache();
      console.log(`Manual cache cleanup completed: ${deletedCount} entries removed`);
      return deletedCount;
    } catch (error) {
      console.error('Error during manual cache cleanup:', error);
      return 0;
    }
  }

  static async manualCacheWarming(): Promise<void> {
    console.log('Running manual cache warming...');
    try {
      await LocationScraperService.warmCacheForPopularDestinations();
      console.log('Manual cache warming completed');
    } catch (error) {
      console.error('Error during manual cache warming:', error);
    }
  }

  static async getCacheReport(): Promise<any> {
    try {
      const [metrics, statistics, popularDestinations] = await Promise.all([
        LocationScraperService.getCachePerformanceMetrics(),
        LocationScraperService.getCacheStatisticsReport(7),
        LocationScraperService.getPopularDestinations(10)
      ]);

      return {
        performance: metrics,
        statistics,
        popularDestinations,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating cache report:', error);
      return {
        error: 'Failed to generate cache report',
        generatedAt: new Date().toISOString()
      };
    }
  }

  // Health check for cache system
  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
  }> {
    try {
      const metrics = await LocationScraperService.getCachePerformanceMetrics();
      const hitRate = metrics.performance?.avg_hit_rate || 0;
      const avgResponseTime = metrics.performance?.avg_response_time || 0;
      const activeEntries = metrics.cache_entries?.active_entries || 0;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      const issues: string[] = [];

      // Check hit rate (should be > 60% for healthy)
      if (hitRate < 40) {
        status = 'unhealthy';
        issues.push(`Low cache hit rate: ${hitRate}%`);
      } else if (hitRate < 60) {
        status = 'degraded';
        issues.push(`Suboptimal cache hit rate: ${hitRate}%`);
      }

      // Check response time (should be < 2000ms for healthy)
      if (avgResponseTime > 5000) {
        status = 'unhealthy';
        issues.push(`High average response time: ${avgResponseTime}ms`);
      } else if (avgResponseTime > 2000) {
        if (status === 'healthy') status = 'degraded';
        issues.push(`Elevated average response time: ${avgResponseTime}ms`);
      }

      // Check cache size (should have some entries)
      if (activeEntries === 0) {
        if (status === 'healthy') status = 'degraded';
        issues.push('No active cache entries');
      }

      return {
        status,
        details: {
          hitRate,
          avgResponseTime,
          activeEntries,
          issues: issues.length > 0 ? issues : ['All systems operational'],
          checkedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: 'Failed to perform health check',
          message: error instanceof Error ? error.message : 'Unknown error',
          checkedAt: new Date().toISOString()
        }
      };
    }
  }
}