import { Request, Response } from 'express';
import { QuickPlanService, EnhancedQuickPlanRequest } from '../services/quickPlanService.js';
import { PlaceCustomizationService } from '../services/placeCustomizationService.js';
import { RegenerationMemoryService } from '../services/regenerationMemoryService.js';

export class QuickPlanController {
  // Generate quick plan suggestions (existing functionality)
  static async generateQuickPlan(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ 
          error: 'Unauthorized' 
        });
      }
      const {
        destination,
        startDate,
        duration,
        interests = [],
        budget = 'medium',
        enableWeatherOptimization = true
      } = req.body;

      // Validate required fields
      if (!destination || !startDate || !duration) {
        return res.status(400).json({ 
          error: 'Destination, start date, and duration are required' 
        });
      }

      // Validate duration
      if (duration < 1 || duration > 30) {
        return res.status(400).json({ 
          error: 'Duration must be between 1 and 30 days' 
        });
      }

      // Generate quick plan
      const result = await QuickPlanService.generateQuickPlan(userId, {
        destination,
        startDate,
        duration,
        interests,
        budget,
        enableWeatherOptimization
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Quick plan generated successfully'
      });

    } catch (error) {
      console.error('Error generating quick plan:', error);
      res.status(500).json({ 
        error: 'Failed to generate quick plan',
        message: 'Please try again or contact support if the problem persists'
      });
    }
  }

  // Create trip from approved suggestions (new enhanced functionality)
  static async createTripFromSuggestions(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ 
          error: 'Unauthorized' 
        });
      }
      const {
        travelInformation,
        approvedSuggestions
      } = req.body;

      // Validate required fields
      if (!travelInformation || !approvedSuggestions) {
        return res.status(400).json({ 
          error: 'Travel information and approved suggestions are required' 
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
          error: 'Destination, start date, end date, and duration are required' 
        });
      }

      // Validate date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        return res.status(400).json({ 
          error: 'End date must be after start date' 
        });
      }

      // Validate duration matches date range
      const calculatedDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (Math.abs(calculatedDuration - duration) > 1) {
        return res.status(400).json({ 
          error: 'Duration does not match the date range' 
        });
      }

      // Validate approved suggestions
      if (!Array.isArray(approvedSuggestions) || approvedSuggestions.length === 0) {
        return res.status(400).json({ 
          error: 'At least one day of suggestions is required' 
        });
      }

      // Validate each day has places
      for (const day of approvedSuggestions) {
        if (!day.places || !Array.isArray(day.places) || day.places.length === 0) {
          return res.status(400).json({ 
            error: `Day ${day.dayNumber} must have at least one place` 
          });
        }
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
          error: 'Failed to create trip',
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

    } catch (error) {
      console.error('Error creating trip from suggestions:', error);
      res.status(500).json({ 
        error: 'Failed to create trip from suggestions',
        message: 'Please try again or contact support if the problem persists'
      });
    }
  }
}