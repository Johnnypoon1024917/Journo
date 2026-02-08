import { spawn, ChildProcess } from 'child_process';
import { pool } from '../config/database.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ScrapingJob {
  id: string;
  destination: string;
  category?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: Date;
  completed_at?: Date;
  places_scraped: number;
  error_message?: string;
  scheduled_for: Date;
}

export class PythonScraperService {
  private static runningJobs = new Map<string, ChildProcess>();
  private static pythonScraperPath = path.join(__dirname, '../../python_scraper');

  // Schedule weekly scraping for all popular destinations
  static async scheduleWeeklyScraping(): Promise<void> {
    try {
      console.log('🕐 Scheduling weekly scraping jobs...');
      
      const destinations = [
        'Tokyo, Japan',
        'Paris, France', 
        'London, United Kingdom',
        'New York, United States',
        'Bangkok, Thailand',
        'Seoul, South Korea',
        'Singapore, Singapore',
        'Barcelona, Spain',
        'Rome, Italy',
        'Amsterdam, Netherlands'
      ];

      const categories = ['attractions', 'restaurants', 'museums', 'parks', 'shopping', 'nightlife'];

      for (const destination of destinations) {
        for (const category of categories) {
          await this.scheduleScrapingJob(destination, category);
        }
      }

      console.log('✅ Weekly scraping jobs scheduled');
    } catch (error) {
      console.error('Error scheduling weekly scraping:', error);
    }
  }

  // Schedule a single scraping job
  static async scheduleScrapingJob(
    destination: string, 
    category?: string,
    scheduledFor?: Date
  ): Promise<string> {
    try {
      const query = `
        INSERT INTO scraping_jobs (destination, category, scheduled_for)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      
      const values = [
        destination,
        category || null,
        scheduledFor || new Date()
      ];
      
      const result = await pool.query(query, values);
      const jobId = result.rows[0].id;
      
      console.log(`📅 Scheduled scraping job ${jobId} for ${destination}${category ? ` (${category})` : ''}`);
      
      return jobId;
    } catch (error) {
      console.error('Error scheduling scraping job:', error);
      throw error;
    }
  }

  // Run pending scraping jobs
  static async runPendingJobs(): Promise<void> {
    try {
      const query = `
        SELECT * FROM scraping_jobs 
        WHERE status = 'pending' 
        AND scheduled_for <= NOW()
        ORDER BY scheduled_for ASC
        LIMIT 5
      `;
      
      const result = await pool.query(query);
      const pendingJobs = result.rows;
      
      if (pendingJobs.length === 0) {
        console.log('No pending scraping jobs');
        return;
      }
      
      console.log(`🚀 Running ${pendingJobs.length} pending scraping jobs`);
      
      for (const job of pendingJobs) {
        await this.runScrapingJob(job);
        // Add delay between jobs to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error('Error running pending jobs:', error);
    }
  }

  // Run a specific scraping job
  static async runScrapingJob(job: ScrapingJob): Promise<void> {
    try {
      console.log(`🤖 Starting scraping job ${job.id} for ${job.destination}`);
      
      // Update job status to running
      await this.updateJobStatus(job.id, 'running', { started_at: new Date() });
      
      // Prepare Python scraper command
      const pythonScript = path.join(this.pythonScraperPath, 'scraper.py');
      const args = [pythonScript, job.destination];
      
      // Run Python scraper
      const pythonProcess = spawn('python3', args, {
        cwd: this.pythonScraperPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      this.runningJobs.set(job.id, pythonProcess);
      
      let stdout = '';
      let stderr = '';
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log(`[${job.id}] ${data.toString().trim()}`);
      });
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error(`[${job.id}] ERROR: ${data.toString().trim()}`);
      });
      
      pythonProcess.on('close', async (code) => {
        this.runningJobs.delete(job.id);
        
        if (code === 0) {
          // Success
          const placesScraped = this.extractPlacesCount(stdout);
          await this.updateJobStatus(job.id, 'completed', {
            completed_at: new Date(),
            places_scraped: placesScraped
          });
          console.log(`✅ Scraping job ${job.id} completed successfully. Places scraped: ${placesScraped}`);
        } else {
          // Failure
          await this.updateJobStatus(job.id, 'failed', {
            completed_at: new Date(),
            error_message: stderr || `Process exited with code ${code}`
          });
          console.error(`❌ Scraping job ${job.id} failed with code ${code}`);
        }
      });
      
      pythonProcess.on('error', async (error) => {
        this.runningJobs.delete(job.id);
        await this.updateJobStatus(job.id, 'failed', {
          completed_at: new Date(),
          error_message: error.message
        });
        console.error(`❌ Scraping job ${job.id} failed:`, error);
      });
      
    } catch (error) {
      console.error(`Error running scraping job ${job.id}:`, error);
      await this.updateJobStatus(job.id, 'failed', {
        completed_at: new Date(),
        error_message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Update job status in database
  private static async updateJobStatus(
    jobId: string, 
    status: string, 
    updates: any = {}
  ): Promise<void> {
    try {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 3}`)
        .join(', ');
      
      const query = `
        UPDATE scraping_jobs 
        SET status = $1, updated_at = NOW()${setClause ? ', ' + setClause : ''}
        WHERE id = $2
      `;
      
      const values = [status, jobId, ...Object.values(updates)];
      
      await pool.query(query, values);
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  }

  // Extract places count from Python scraper output
  private static extractPlacesCount(output: string): number {
    const match = output.match(/Total places: (\d+)/i) || 
                  output.match(/Stored (\d+) places/i) ||
                  output.match(/(\d+) places found/i);
    
    return match ? parseInt(match[1]) : 0;
  }

  // Get scraping job statistics
  static async getScrapingStatistics(): Promise<any> {
    try {
      const query = `
        SELECT 
          status,
          COUNT(*) as count,
          AVG(places_scraped) as avg_places_scraped,
          SUM(places_scraped) as total_places_scraped,
          AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
        FROM scraping_jobs
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY status
        ORDER BY status
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting scraping statistics:', error);
      return [];
    }
  }

  // Get recent scraping jobs
  static async getRecentJobs(limit: number = 20): Promise<ScrapingJob[]> {
    try {
      const query = `
        SELECT * FROM scraping_jobs
        ORDER BY created_at DESC
        LIMIT $1
      `;
      
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting recent jobs:', error);
      return [];
    }
  }

  // Cancel a running job
  static async cancelJob(jobId: string): Promise<boolean> {
    try {
      const process = this.runningJobs.get(jobId);
      if (process) {
        process.kill('SIGTERM');
        this.runningJobs.delete(jobId);
        
        await this.updateJobStatus(jobId, 'failed', {
          completed_at: new Date(),
          error_message: 'Job cancelled by user'
        });
        
        console.log(`🛑 Cancelled scraping job ${jobId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error cancelling job:', error);
      return false;
    }
  }

  // Run immediate scraping for a destination
  static async runImmediateScraping(destination: string, category?: string): Promise<string> {
    try {
      const jobId = await this.scheduleScrapingJob(destination, category, new Date());
      
      // Get the job and run it immediately
      const query = `SELECT * FROM scraping_jobs WHERE id = $1`;
      const result = await pool.query(query, [jobId]);
      const job = result.rows[0];
      
      if (job) {
        // Don't await - run in background
        this.runScrapingJob(job);
      }
      
      return jobId;
    } catch (error) {
      console.error('Error running immediate scraping:', error);
      throw error;
    }
  }

  // Setup weekly scraping schedule
  static async setupWeeklySchedule(): Promise<void> {
    try {
      console.log('🕐 Setting up weekly scraping schedule...');
      
      const destinations = [
        'Tokyo, Japan',
        'Paris, France', 
        'London, United Kingdom',
        'New York, United States',
        'Bangkok, Thailand',
        'Seoul, South Korea',
        'Singapore, Singapore',
        'Barcelona, Spain',
        'Rome, Italy',
        'Amsterdam, Netherlands'
      ];

      const categories = ['attractions', 'restaurants', 'museums', 'parks', 'shopping', 'nightlife'];

      for (const destination of destinations) {
        for (const category of categories) {
          const query = `
            INSERT INTO scraping_schedule (destination, category, next_run)
            VALUES ($1, $2, NOW() + INTERVAL '7 days')
            ON CONFLICT (destination, category)
            DO UPDATE SET 
              next_run = CASE 
                WHEN scraping_schedule.next_run < NOW() 
                THEN NOW() + INTERVAL '1 hour'
                ELSE scraping_schedule.next_run
              END,
              is_active = true
          `;
          
          await pool.query(query, [destination, category]);
        }
      }
      
      console.log('✅ Weekly scraping schedule setup completed');
    } catch (error) {
      console.error('Error setting up weekly schedule:', error);
    }
  }

  // Check and run scheduled jobs
  static async checkScheduledJobs(): Promise<void> {
    try {
      const query = `
        SELECT * FROM scraping_schedule
        WHERE is_active = true 
        AND next_run <= NOW()
        ORDER BY priority DESC, next_run ASC
        LIMIT 10
      `;
      
      const result = await pool.query(query);
      const scheduledJobs = result.rows;
      
      for (const scheduled of scheduledJobs) {
        // Create a scraping job
        await this.scheduleScrapingJob(scheduled.destination, scheduled.category);
        
        // Update next run time
        const updateQuery = `
          UPDATE scraping_schedule 
          SET last_run = NOW(), next_run = NOW() + INTERVAL '7 days'
          WHERE id = $1
        `;
        
        await pool.query(updateQuery, [scheduled.id]);
      }
      
      if (scheduledJobs.length > 0) {
        console.log(`📅 Created ${scheduledJobs.length} scheduled scraping jobs`);
      }
    } catch (error) {
      console.error('Error checking scheduled jobs:', error);
    }
  }

  // Start the scraping service (run this on server startup)
  static start(): void {
    console.log('🤖 Starting Python Scraper Service...');
    
    // Setup weekly schedule
    this.setupWeeklySchedule();
    
    // Check for scheduled jobs every hour
    setInterval(() => {
      this.checkScheduledJobs();
    }, 60 * 60 * 1000); // 1 hour
    
    // Run pending jobs every 10 minutes
    setInterval(() => {
      this.runPendingJobs();
    }, 10 * 60 * 1000); // 10 minutes
    
    console.log('✅ Python Scraper Service started');
  }
}