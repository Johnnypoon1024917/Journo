import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { pool } from './config/database.js';
import { runMigrations } from './utils/runMigrations.js';
import { initializeRedis } from './config/redis.js';
import { createEnhancedAuthRoutes } from './routes/enhancedAuth.js';
import { initializeRateLimitMiddleware } from './middleware/rateLimitMiddleware.js';
import tripRoutes from './routes/trips.js';
import dayRoutes from './routes/days.js';
import placeRoutes from './routes/places.js';
import uploadRoutes from './routes/upload.js';
import currencyRoutes from './routes/currency.js';
import packingRoutes from './routes/packingRoutes.js';
import weatherRoutes from './routes/weather.js';
import storyRoutes from './routes/stories.js';
import collaboratorRoutes from './routes/collaborators.js';
import notificationRoutes from './routes/notifications.js';
import userRoutes from './routes/userRoutes.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import invitationLinkRoutes from './routes/invitationLinkRoutes.js';
import versionRoutes from './routes/versions.js';
import communityRoutes from './routes/community.js';
import badgeRoutes from './routes/badges.js';
import destinationRoutes from './routes/destinationRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import shoppingRoutes from './routes/shoppingRoutes.js';
import destinationAutocompleteRoutes from './routes/destinationAutocomplete.js';
import scrapingRoutes from './routes/scraping.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';
import cacheManagementRoutes from './routes/cacheManagement.js';
import quickPlanRoutes from './routes/quickPlanRoutes.js';
import quickPlanAnalyticsRoutes from './routes/quickPlanAnalytics.js';
import scrapingManagementRoutes from './routes/scrapingManagementRoutes.js';
import pythonScraperRoutes from './routes/pythonScraperRoutes.js';
import stickerRoutes from './routes/stickers.js';
import themeRoutes from './routes/theme.js';
import { DestinationService } from './services/destinationService.js';
import { CacheManagementService } from './services/cacheManagementService.js';
import { ScrapingSchedulerService } from './services/scrapingSchedulerService.js';
import { PythonScraperService } from './services/pythonScraperService.js';
import { socketAuthMiddleware, AuthenticatedSocket } from './middleware/socketAuth.js';
import { socketService } from './services/socketService.js';

dotenv.config();

// Debug: Check if API key is loaded
console.log('🔑 OPENWEATHER_API_KEY loaded:', process.env.OPENWEATHER_API_KEY ? 'YES (' + process.env.OPENWEATHER_API_KEY.substring(0, 8) + '...)' : 'NO');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
// Increase body size limit to 10MB for image uploads (base64 encoded images are ~33% larger)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers middleware
app.use((_req, res, next) => {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: http://localhost:* http://127.0.0.1:* blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://maps.googleapis.com https://api.openweathermap.org ws: wss: http://localhost:* http://127.0.0.1:*",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ')
  );
  
  // Other security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});

// Serve static files from uploads directory
const uploadsPath = process.env.STORAGE_PATH || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    res.json({ 
      status: 'ok', 
      message: 'Journo API is running',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      message: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.get('/api', (_req, res) => {
  res.json({ 
    message: 'Welcome to Journo API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      health: '/api/health'
    }
  });
});

// API health check endpoint (for frontend proxy)
app.get('/api/health', async (_req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    res.json({ 
      status: 'ok', 
      message: 'Journo API is running',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      message: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Scraping progress endpoint
app.get('/api/scraping/progress', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        session_id,
        current_destination,
        total_destinations,
        current_category,
        total_categories,
        places_found,
        total_places_scraped,
        current_message,
        level,
        status,
        started_at,
        updated_at,
        completed_at
      FROM scraping_progress 
      WHERE session_id = 'current_session'
      ORDER BY updated_at DESC 
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      res.json({ 
        status: 'idle',
        message: 'No scraping session in progress',
        progress: null
      });
    } else {
      const progress = result.rows[0];
      const progressPercentage = progress.total_destinations > 0 
        ? Math.round(((progress.current_destination - 1) / progress.total_destinations + 
            (progress.current_category / progress.total_categories / progress.total_destinations)) * 100)
        : 0;
      
      res.json({
        status: 'active',
        progress: {
          ...progress,
          progress_percentage: progressPercentage,
          destinations_completed: progress.current_destination - 1,
          categories_completed_in_current: progress.current_category
        }
      });
    }
  } catch (error) {
    console.error('Error fetching scraping progress:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch scraping progress' 
    });
  }
});

// Authentication routes - Enhanced version ONLY
const enhancedAuthRoutes = createEnhancedAuthRoutes(pool);
app.use('/api/auth', enhancedAuthRoutes);
console.log('✅ Enhanced auth routes registered at /api/auth');

// Collaborator routes (must come before trip routes to avoid conflicts)
app.use('/api', collaboratorRoutes);

// Notification routes
app.use('/api/notifications', notificationRoutes);

// User routes (notification preferences, etc.)
app.use('/api/users', userRoutes);

// Activity log routes
app.use('/api', activityLogRoutes);

// Invitation link routes
app.use('/api', invitationLinkRoutes);

// Trip routes
app.use('/api/trips', tripRoutes);

// Day routes
app.use('/api/days', dayRoutes);

// Place routes
app.use('/api/places', placeRoutes);

// Upload routes
app.use('/api/upload', uploadRoutes);

// Currency routes
app.use('/api/currency', currencyRoutes);

// Packing routes
app.use('/api', packingRoutes);

// Weather routes
app.use('/api/weather', weatherRoutes);

// Story routes
app.use('/api', storyRoutes);

// Version routes
app.use('/api', versionRoutes);

// Community routes
app.use('/api/community', communityRoutes);

// Badge routes
app.use('/api/badges', badgeRoutes);

// Destination routes
app.use('/api/destinations', destinationRoutes);
app.use('/api/destinations', destinationAutocompleteRoutes);

// Scraping routes
app.use('/api/scrape', scrapingRoutes);

// Analytics routes
app.use('/api/analytics', analyticsRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Cache management routes
app.use('/api/cache', cacheManagementRoutes);

// Quick plan routes
app.use('/api/quick-plan', quickPlanRoutes);

// Quick plan analytics routes
app.use('/api/quick-plan-analytics', quickPlanAnalyticsRoutes);

// Scraping management routes
app.use('/api/scraping', scrapingManagementRoutes);

// Python scraper routes
app.use('/api/python-scraper', pythonScraperRoutes);

// Sticker routes
app.use('/api/stickers', stickerRoutes);

// Theme routes
app.use('/api/theme', themeRoutes);

// Booking routes
app.use('/api/bookings', bookingRoutes);

// Shopping routes
app.use('/api/shopping', shoppingRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Socket.IO setup for real-time features
const io = new Server(httpServer, {
  cors: {
    origin: process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
});

// Apply authentication middleware
io.use(socketAuthMiddleware);

// Initialize socket service
socketService.initialize(io);

// Socket.IO connection handling
io.on('connection', (socket: AuthenticatedSocket) => {
  console.log('Client connected:', socket.id, socket.userId ? `(User: ${socket.userEmail})` : '(Anonymous)');

  // Handle joining trip rooms
  socket.on('trip:join', (tripId: string) => {
    try {
      socketService.joinTripRoom(socket, tripId);
      socket.emit('trip:joined', { tripId, success: true });
    } catch (error) {
      console.error('Error joining trip room:', error);
      socket.emit('trip:joined', { tripId, success: false, error: 'Failed to join trip room' });
    }
  });

  // Handle leaving trip rooms
  socket.on('trip:leave', (tripId: string) => {
    try {
      socketService.leaveTripRoom(socket, tripId);
      socket.emit('trip:left', { tripId, success: true });
    } catch (error) {
      console.error('Error leaving trip room:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    socketService.handleDisconnect(socket);
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Initialize server
async function startServer() {
  try {
    // Run database migrations
    await runMigrations();

    // Initialize Redis
    await initializeRedis();

    // Initialize rate limiting middleware
    initializeRateLimitMiddleware(pool);
    console.log('🛡️ Rate limiting middleware initialized');

    // Populate initial destination suggestions
    // await DestinationService.populateInitialData();

    // Start cache management service
    // CacheManagementService.start();

    // Start scraping scheduler service
    // ScrapingSchedulerService.start();
    // console.log('🕐 Scraping scheduler started');

    // Start Python scraper service for weekly data collection
    // PythonScraperService.start();
    // console.log('🐍 Python scraper service started');

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 Socket.IO is ready for connections`);
      console.log(`🔗 API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
export { io };
