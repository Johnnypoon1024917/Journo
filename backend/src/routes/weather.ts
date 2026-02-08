import express from 'express';
import { WeatherController } from '../controllers/weatherController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Weather routes - authentication optional for public trips
router.get('/trips/:tripId', authenticate, WeatherController.getWeatherForTrip);
router.post('/trips/:tripId/refresh', authenticate, WeatherController.refreshWeather);

// Weather-based recommendations (no authentication required for testing)
router.get('/recommendations', WeatherController.getWeatherBasedRecommendations);

export default router;
