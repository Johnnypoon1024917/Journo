import { Request, Response } from 'express';
import { QuickPlanPerformanceService } from '../services/quickPlanPerformanceService.js';
import { QuickPlanAnalyticsService } from '../services/quickPlanAnalyticsService.js';

export class QuickPlanAnalyticsController {
  // Get performance dashboard data
  static async getPerformanceDashboard(req: Request, res: Response) {
    try {
      const { timeframe = 'week' } = req.query;
      
      if (!['day', 'week', 'month'].includes(timeframe as string)) {
        return res.status(400).json({
          error: 'Invalid timeframe. Must be day, week, or month'
        });
      }

      const dashboard = await QuickPlanPerformanceService.getPerformanceDashboard(
        timeframe as 'day' | 'week' | 'month'
      );

      res.json({
        success: true,
        data: dashboard,
        timeframe
      });
    } catch (error) {
      console.error('Error getting performance dashboard:', error);
      res.status(500).json({
        error: 'Failed to get performance dashboard',
        message: 'Please try again or contact support if the problem persists'
      });
    }
  }

  // Get cache performance metrics
  static async getCacheMetrics(req: Request, res: Response) {
    try {
      const { timeframe = 'day' } = req.query;
      
      if (!['hour', 'day', 'week'].includes(timeframe as string)) {
        return res.status(400).json({
          error: 'Invalid timeframe. Must be hour, day, or week'
        });
      }

      const metrics = await QuickPlanPerformanceService.getCachePerformanceMetrics(
        timeframe as 'hour' | 'day' | 'week'
      );

      res.json({
        success: true,
        data: metrics,
        timeframe
      });
    } catch (error) {
      console.error('Error getting cache metrics:', error);
      res.status(500).json({
        error: 'Failed to get cache metrics'
      });
    }
  }

  // Get external API performance metrics
  static async getApiMetrics(req: Request, res: Response) {
    try {
      const { timeframe = 'day' } = req.query;
      
      if (!['hour', 'day', 'week'].includes(timeframe as string)) {
        return res.status(400).json({
          error: 'Invalid timeframe. Must be hour, day, or week'
        });
      }

      const metrics = await QuickPlanPerformanceService.getExternalApiMetrics(
        timeframe as 'hour' | 'day' | 'week'
      );

      res.json({
        success: true,
        data: metrics,
        timeframe
      });
    } catch (error) {
      console.error('Error getting API metrics:', error);
      res.status(500).json({
        error: 'Failed to get API metrics'
      });
    }
  }

  // Get user satisfaction metrics
  static async getUserSatisfactionMetrics(req: Request, res: Response) {
    try {
      const { timeframe = 'week' } = req.query;
      
      if (!['day', 'week', 'month'].includes(timeframe as string)) {
        return res.status(400).json({
          error: 'Invalid timeframe. Must be day, week, or month'
        });
      }

      const metrics = await QuickPlanPerformanceService.getUserSatisfactionMetrics(
        timeframe as 'day' | 'week' | 'month'
      );

      res.json({
        success: true,
        data: metrics,
        timeframe
      });
    } catch (error) {
      console.error('Error getting user satisfaction metrics:', error);
      res.status(500).json({
        error: 'Failed to get user satisfaction metrics'
      });
    }
  }

  // Get usage patterns analytics
  static async getUsagePatterns(req: Request, res: Response) {
    try {
      const { timeframe = 'month' } = req.query;
      
      if (!['week', 'month', 'quarter'].includes(timeframe as string)) {
        return res.status(400).json({
          error: 'Invalid timeframe. Must be week, month, or quarter'
        });
      }

      const patterns = await QuickPlanAnalyticsService.getUsagePatterns(
        timeframe as 'week' | 'month' | 'quarter'
      );

      res.json({
        success: true,
        data: patterns,
        timeframe
      });
    } catch (error) {
      console.error('Error getting usage patterns:', error);
      res.status(500).json({
        error: 'Failed to get usage patterns'
      });
    }
  }

  // Get conversion metrics
  static async getConversionMetrics(req: Request, res: Response) {
    try {
      const { timeframe = 'month' } = req.query;
      
      if (!['week', 'month', 'quarter'].includes(timeframe as string)) {
        return res.status(400).json({
          error: 'Invalid timeframe. Must be week, month, or quarter'
        });
      }

      const metrics = await QuickPlanAnalyticsService.getConversionMetrics(
        timeframe as 'week' | 'month' | 'quarter'
      );

      res.json({
        success: true,
        data: metrics,
        timeframe
      });
    } catch (error) {
      console.error('Error getting conversion metrics:', error);
      res.status(500).json({
        error: 'Failed to get conversion metrics'
      });
    }
  }

  // Get popular destinations
  static async getPopularDestinations(req: Request, res: Response) {
    try {
      const { limit = 20 } = req.query;
      const limitNum = parseInt(limit as string);
      
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          error: 'Invalid limit. Must be a number between 1 and 100'
        });
      }

      const destinations = await QuickPlanAnalyticsService.getPopularDestinations(limitNum);

      res.json({
        success: true,
        data: destinations
      });
    } catch (error) {
      console.error('Error getting popular destinations:', error);
      res.status(500).json({
        error: 'Failed to get popular destinations'
      });
    }
  }

  // Get user customization patterns
  static async getUserCustomizationPatterns(req: Request, res: Response) {
    try {
      const { userId, limit = 100 } = req.query;
      const limitNum = parseInt(limit as string);
      
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
        return res.status(400).json({
          error: 'Invalid limit. Must be a number between 1 and 1000'
        });
      }

      const patterns = await QuickPlanAnalyticsService.analyzeUserCustomizationPatterns(
        userId as string,
        limitNum
      );

      res.json({
        success: true,
        data: patterns
      });
    } catch (error) {
      console.error('Error getting user customization patterns:', error);
      res.status(500).json({
        error: 'Failed to get user customization patterns'
      });
    }
  }

  // Analyze feedback
  static async analyzeFeedback(req: Request, res: Response) {
    try {
      const { timeframe = 'month' } = req.query;
      
      if (!['week', 'month', 'quarter'].includes(timeframe as string)) {
        return res.status(400).json({
          error: 'Invalid timeframe. Must be week, month, or quarter'
        });
      }

      const analysis = await QuickPlanAnalyticsService.analyzeFeedback(
        timeframe as 'week' | 'month' | 'quarter'
      );

      res.json({
        success: true,
        data: analysis,
        timeframe
      });
    } catch (error) {
      console.error('Error analyzing feedback:', error);
      res.status(500).json({
        error: 'Failed to analyze feedback'
      });
    }
  }

  // Create A/B test
  static async createABTest(req: Request, res: Response) {
    try {
      const { testName, variants, trafficSplit } = req.body;

      if (!testName || !variants || !trafficSplit) {
        return res.status(400).json({
          error: 'Test name, variants, and traffic split are required'
        });
      }

      if (!Array.isArray(variants) || variants.length < 2) {
        return res.status(400).json({
          error: 'At least 2 variants are required'
        });
      }

      if (!Array.isArray(trafficSplit) || trafficSplit.length !== variants.length) {
        return res.status(400).json({
          error: 'Traffic split must match number of variants'
        });
      }

      const totalSplit = trafficSplit.reduce((sum, split) => sum + split, 0);
      if (Math.abs(totalSplit - 100) > 0.1) {
        return res.status(400).json({
          error: 'Traffic split must sum to 100%'
        });
      }

      const testId = await QuickPlanAnalyticsService.createABTest(
        testName,
        variants,
        trafficSplit
      );

      res.status(201).json({
        success: true,
        data: { testId },
        message: 'A/B test created successfully'
      });
    } catch (error) {
      console.error('Error creating A/B test:', error);
      res.status(500).json({
        error: 'Failed to create A/B test'
      });
    }
  }

  // Get A/B test results
  static async getABTestResults(req: Request, res: Response) {
    try {
      const { testId } = req.params;

      if (!testId) {
        return res.status(400).json({
          error: 'Test ID is required'
        });
      }

      const results = await QuickPlanAnalyticsService.getABTestResults(testId);

      if (!results) {
        return res.status(404).json({
          error: 'A/B test not found'
        });
      }

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error getting A/B test results:', error);
      res.status(500).json({
        error: 'Failed to get A/B test results'
      });
    }
  }

  // Submit user feedback
  static async submitUserFeedback(req: Request, res: Response) {
    try {
      const { sessionId, rating, comments } = req.body;

      if (!sessionId || !rating) {
        return res.status(400).json({
          error: 'Session ID and rating are required'
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          error: 'Rating must be between 1 and 5'
        });
      }

      await QuickPlanPerformanceService.completePerformanceTracking(
        sessionId,
        true,
        { rating, comments }
      );

      res.json({
        success: true,
        message: 'Feedback submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting user feedback:', error);
      res.status(500).json({
        error: 'Failed to submit feedback'
      });
    }
  }

  // Get comprehensive analytics report
  static async getAnalyticsReport(req: Request, res: Response) {
    try {
      const { timeframe = 'month' } = req.query;
      
      if (!['week', 'month', 'quarter'].includes(timeframe as string)) {
        return res.status(400).json({
          error: 'Invalid timeframe. Must be week, month, or quarter'
        });
      }

      const tf = timeframe as 'week' | 'month' | 'quarter';

      // Get all analytics data in parallel
      const [
        performanceDashboard,
        usagePatterns,
        conversionMetrics,
        popularDestinations,
        feedbackAnalysis,
        cacheMetrics,
        apiMetrics
      ] = await Promise.all([
        QuickPlanPerformanceService.getPerformanceDashboard(tf === 'quarter' ? 'month' : tf),
        QuickPlanAnalyticsService.getUsagePatterns(tf),
        QuickPlanAnalyticsService.getConversionMetrics(tf),
        QuickPlanAnalyticsService.getPopularDestinations(10),
        QuickPlanAnalyticsService.analyzeFeedback(tf),
        QuickPlanPerformanceService.getCachePerformanceMetrics(tf === 'quarter' ? 'week' : 'day'),
        QuickPlanPerformanceService.getExternalApiMetrics(tf === 'quarter' ? 'week' : 'day')
      ]);

      const report = {
        timeframe,
        generatedAt: new Date().toISOString(),
        performance: performanceDashboard,
        usage: {
          patterns: usagePatterns,
          conversions: conversionMetrics,
          popularDestinations: popularDestinations.slice(0, 5)
        },
        feedback: feedbackAnalysis,
        technical: {
          cache: cacheMetrics,
          apis: apiMetrics
        },
        summary: {
          totalSessions: performanceDashboard.overview.totalSessions,
          completionRate: performanceDashboard.overview.completionRate,
          conversionRate: conversionMetrics.conversionRate,
          averageRating: feedbackAnalysis.averageRating,
          cacheHitRate: cacheMetrics.hitRate,
          topDestination: popularDestinations[0]?.destination || 'N/A'
        }
      };

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Error generating analytics report:', error);
      res.status(500).json({
        error: 'Failed to generate analytics report'
      });
    }
  }
}