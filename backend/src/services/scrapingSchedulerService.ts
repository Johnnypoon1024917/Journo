import cron from 'node-cron';
import { ComprehensivePlaceScrapingService } from './comprehensivePlaceScrapingService.js';

export class ScrapingSchedulerService {
  private static isRunning = false;

  // Start the scraping scheduler
  static start(): void {
    console.log('🕐 Starting scraping scheduler...');

    // Run comprehensive scraping daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      if (this.isRunning) {
        console.log('⏳ Scraping already in progress, skipping...');
        return;
      }

      this.isRunning = true;
      console.log('🚀 Starting scheduled comprehensive scraping...');
      
      try {
        await ComprehensivePlaceScrapingService.scrapeTopDestinations();
        console.log('✅ Scheduled scraping completed successfully');
      } catch (error) {
        console.error('❌ Scheduled scraping failed:', error);
      } finally {
        this.isRunning = false;
      }
    });

    // Run high-priority destinations every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      if (this.isRunning) return;

      console.log('🔄 Running high-priority destination update...');
      // This would run a lighter version focusing on top 20 destinations
    });

    console.log('✅ Scraping scheduler started');
  }

  // Manual trigger for scraping
  static async triggerManualScraping(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Scraping is already in progress');
    }

    this.isRunning = true;
    try {
      await ComprehensivePlaceScrapingService.scrapeTopDestinations();
    } finally {
      this.isRunning = false;
    }
  }

  // Check if scraping is currently running
  static isScrapingRunning(): boolean {
    return this.isRunning;
  }
}