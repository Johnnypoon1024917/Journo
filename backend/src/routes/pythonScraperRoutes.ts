import { Router, Request, Response } from 'express';
import { PythonScraperService } from '../services/pythonScraperService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Get scraping statistics
router.get('/statistics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const stats = await PythonScraperService.getScrapingStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error getting scraping statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get scraping statistics'
    });
  }
});

// Get recent scraping jobs
router.get('/jobs', authenticateToken, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const jobs = await PythonScraperService.getRecentJobs(limit);
    
    res.json({
      success: true,
      data: jobs
    });
  } catch (error: any) {
    console.error('Error getting recent jobs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recent jobs'
    });
  }
});

// Schedule immediate scraping for a destination
router.post('/scrape-now', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { destination, category } = req.body;
    
    if (!destination) {
      return res.status(400).json({
        success: false,
        message: 'Destination is required'
      });
    }
    
    const jobId = await PythonScraperService.runImmediateScraping(destination, category);
    
    res.json({
      success: true,
      data: { jobId },
      message: 'Scraping job started successfully'
    });
  } catch (error: any) {
    console.error('Error starting immediate scraping:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start scraping job'
    });
  }
});

// Schedule weekly scraping for all destinations
router.post('/schedule-weekly', authenticateToken, async (req: Request, res: Response) => {
  try {
    await PythonScraperService.scheduleWeeklyScraping();
    
    res.json({
      success: true,
      message: 'Weekly scraping scheduled successfully'
    });
  } catch (error: any) {
    console.error('Error scheduling weekly scraping:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to schedule weekly scraping'
    });
  }
});

// Cancel a running job
router.post('/cancel/:jobId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    
    const cancelled = await PythonScraperService.cancelJob(jobId);
    
    if (cancelled) {
      res.json({
        success: true,
        message: 'Job cancelled successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Job not found or not running'
      });
    }
  } catch (error: any) {
    console.error('Error cancelling job:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel job'
    });
  }
});

// Run pending jobs manually
router.post('/run-pending', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Don't await - run in background
    PythonScraperService.runPendingJobs();
    
    res.json({
      success: true,
      message: 'Pending jobs are being processed'
    });
  } catch (error: any) {
    console.error('Error running pending jobs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to run pending jobs'
    });
  }
});

// Check scheduled jobs manually
router.post('/check-schedule', authenticateToken, async (req: Request, res: Response) => {
  try {
    await PythonScraperService.checkScheduledJobs();
    
    res.json({
      success: true,
      message: 'Scheduled jobs checked and created'
    });
  } catch (error: any) {
    console.error('Error checking scheduled jobs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check scheduled jobs'
    });
  }
});

export default router;