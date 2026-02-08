import { Router, Request, Response } from 'express';
import { QuickPlanService, EnhancedQuickPlanRequest } from '../services/quickPlanService.js';
import { PlaceCustomizationService } from '../services/placeCustomizationService.js';
import { RegenerationMemoryService } from '../services/regenerationMemoryService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Generate intelligent suggestions (new enhanced functionality)
router.post('/generate-suggestions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      destination,
      startDate,
      endDate,
      duration,
      interests,
      budgetLevel,
      travelStyle,
      groupSize,
      travelerTypes,
      mustVisitPlaces
    } = req.body;

    // Validate required fields
    if (!destination || !startDate || !endDate || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: destination, startDate, endDate, duration'
      });
    }

    // Prepare enhanced request
    const enhancedRequest: EnhancedQuickPlanRequest = {
      destination,
      startDate,
      endDate,
      duration,
      interests: interests || [],
      budgetLevel: budgetLevel || 'medium',
      travelStyle: travelStyle || 'moderate',
      groupSize: groupSize || 1,
      travelerTypes: travelerTypes || [],
      mustVisitPlaces: mustVisitPlaces || [],
      enableWeatherOptimization: true
    };

    // Generate intelligent suggestions
    const suggestions = await QuickPlanService.generateIntelligentSuggestions(
      userId,
      enhancedRequest
    );

    res.json({
      success: true,
      data: suggestions,
      message: 'Intelligent suggestions generated successfully'
    });

  } catch (error: any) {
    console.error('Error generating intelligent suggestions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate intelligent suggestions'
    });
  }
});

// Generate quick plan (original functionality)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { destination, startDate, duration, interests, budget } = req.body;

    if (!destination || !startDate || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: destination, startDate, duration'
      });
    }

    const result = await QuickPlanService.generateQuickPlan(userId, {
      destination,
      startDate,
      duration,
      interests,
      budget
    });

    res.json({
      success: true,
      data: result,
      message: 'Quick plan generated successfully'
    });
  } catch (error: any) {
    console.error('Error generating quick plan:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate quick plan'
    });
  }
});

// Create trip from approved suggestions (enhanced functionality)
router.post('/create-from-suggestions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { travelInformation, approvedSuggestions } = req.body;

    // Validate required fields
    if (!travelInformation || !approvedSuggestions) {
      return res.status(400).json({ 
        success: false,
        message: 'Travel information and approved suggestions are required' 
      });
    }

    // Validate travel information structure
    const {
      destination,
      startDate,
      endDate,
      duration,
      interests,
      budgetLevel,
      travelStyle,
      groupSize,
      travelerTypes
    } = travelInformation;

    if (!destination || !startDate || !endDate || !duration) {
      return res.status(400).json({ 
        success: false,
        message: 'Destination, start date, end date, and duration are required' 
      });
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({ 
        success: false,
        message: 'End date must be after start date' 
      });
    }

    // Validate approved suggestions
    if (!Array.isArray(approvedSuggestions) || approvedSuggestions.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'At least one day of suggestions is required' 
      });
    }

    // Prepare enhanced request
    const enhancedRequest: EnhancedQuickPlanRequest = {
      destination,
      startDate,
      endDate,
      duration,
      interests: interests || [],
      budgetLevel: budgetLevel || 'medium',
      travelStyle: travelStyle || 'moderate',
      groupSize: groupSize || 1,
      travelerTypes: travelerTypes || [],
      mustVisitPlaces: travelInformation.mustVisitPlaces || [],
      enableWeatherOptimization: true
    };

    // Generate trip from suggestions
    const result = await QuickPlanService.generateTripFromSuggestions(
      userId,
      enhancedRequest,
      approvedSuggestions
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message
      });
    }

    res.status(201).json({
      success: true,
      data: {
        tripId: result.tripId,
        destination: result.destination,
        startDate: result.startDate,
        endDate: result.endDate,
        theme: result.theme,
        totalBudget: result.totalBudget,
        currencyCode: result.currencyCode,
        budgetEntries: result.budgetEntries,
        packingList: result.packingList
      },
      message: 'Trip created successfully from suggestions'
    });

  } catch (error: any) {
    console.error('Error creating trip from suggestions:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to create trip from suggestions'
    });
  }
});

// Find similar places for customization
router.post('/similar-places', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { referencePlace, destination, excludePlaceIds, similarityFactors, maxResults } = req.body;

    if (!referencePlace || !destination) {
      return res.status(400).json({ 
        success: false,
        message: 'Reference place and destination are required' 
      });
    }

    const similarPlaces = await PlaceCustomizationService.findSimilarPlaces({
      referencePlace,
      destination,
      excludePlaceIds: excludePlaceIds || [],
      similarityFactors: similarityFactors || ['type', 'price', 'interests'],
      maxResults: maxResults || 5
    });

    res.json({
      success: true,
      data: similarPlaces
    });

  } catch (error: any) {
    console.error('Error finding similar places:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to find similar places'
    });
  }
});

// Learn from user preferences
router.post('/learn-preferences', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const interaction = { ...req.body, userId };
    
    if (!interaction.interactionType || !interaction.placeData) {
      return res.status(400).json({ 
        success: false,
        message: 'Interaction type and place data are required' 
      });
    }

    await PlaceCustomizationService.learnFromUserInteraction(interaction);

    res.json({
      success: true,
      message: 'User interaction recorded successfully'
    });

  } catch (error: any) {
    console.error('Error learning from user interaction:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to record user interaction'
    });
  }
});

// Get user preferences
router.get('/user-preferences', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const preferences = await PlaceCustomizationService.getUserPreferences(userId);

    res.json({
      success: true,
      data: preferences
    });

  } catch (error: any) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to fetch user preferences'
    });
  }
});

// Update user preferences
router.put('/user-preferences', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const preferences = req.body;
    
    const success = await PlaceCustomizationService.updateUserPreferences(userId, preferences);

    if (success) {
      res.json({
        success: true,
        message: 'User preferences updated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update user preferences'
      });
    }

  } catch (error: any) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to update user preferences'
    });
  }
});

// Regenerate with memory
router.post('/regenerate-with-memory', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      sessionId,
      travelInfo,
      currentSuggestions,
      regenerationType,
      memoryConstraints,
      preservePreferences,
      diversityLevel
    } = req.body;

    if (!sessionId || !travelInfo || !currentSuggestions) {
      return res.status(400).json({ 
        success: false,
        message: 'Session ID, travel info, and current suggestions are required' 
      });
    }

    const result = await RegenerationMemoryService.regenerateWithMemory({
      userId,
      sessionId,
      travelInfo,
      currentSuggestions,
      regenerationType: regenerationType || 'full',
      memoryConstraints: memoryConstraints || { excludePlaceIds: [], preferredPlaceTypes: [], diversityPreferences: {} },
      preservePreferences: preservePreferences !== false,
      diversityLevel: diversityLevel || 'medium'
    });

    res.json(result);

  } catch (error: any) {
    console.error('Error regenerating with memory:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to regenerate with memory'
    });
  }
});

// Generate diverse alternatives
router.post('/diverse-alternatives', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { referencePlace, destination, diversityLevel, memoryConstraints } = req.body;

    if (!referencePlace || !destination) {
      return res.status(400).json({ 
        success: false,
        message: 'Reference place and destination are required' 
      });
    }

    const alternatives = await RegenerationMemoryService.generateDiverseAlternatives({
      referencePlace,
      destination,
      diversityLevel: diversityLevel || 'medium',
      memoryConstraints: memoryConstraints || { excludePlaceIds: [], preferredPlaceTypes: [], diversityPreferences: {} }
    });

    res.json({
      success: true,
      alternatives
    });

  } catch (error: any) {
    console.error('Error generating diverse alternatives:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to generate diverse alternatives'
    });
  }
});

// Memory management endpoints
router.get('/memory/:sessionId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ 
        success: false,
        message: 'Session ID is required' 
      });
    }

    const memory = await RegenerationMemoryService.getMemory(userId, sessionId);

    res.json({
      success: true,
      data: memory
    });

  } catch (error: any) {
    console.error('Error fetching memory:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to fetch memory'
    });
  }
});

router.post('/memory', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const memory = req.body;
    
    if (!memory.sessionId) {
      return res.status(400).json({ 
        success: false,
        message: 'Session ID is required in memory data' 
      });
    }

    await RegenerationMemoryService.storeMemory(userId, memory);

    res.json({
      success: true,
      message: 'Memory stored successfully'
    });

  } catch (error: any) {
    console.error('Error storing memory:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to store memory'
    });
  }
});

router.delete('/memory/:sessionId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ 
        success: false,
        message: 'Session ID is required' 
      });
    }

    await RegenerationMemoryService.clearMemory(userId, sessionId);

    res.json({
      success: true,
      message: 'Memory cleared successfully'
    });

  } catch (error: any) {
    console.error('Error clearing memory:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to clear memory'
    });
  }
});

export default router;
