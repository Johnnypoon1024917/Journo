import { Request, Response } from 'express';
import { CountryRecommendationController } from '../countryRecommendationController';

// Mock the service
jest.mock('../../services/countryRecommendationService', () => ({
  CountryRecommendationService: {
    validateFilters: jest.fn(),
    queryCountries: jest.fn()
  }
}));

// Import after mocking
import { CountryRecommendationService } from '../../services/countryRecommendationService';

describe('CountryRecommendationController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  const mockCountries = [
    {
      id: '1',
      country_name: 'Japan',
      best_months: [3, 4, 5, 10, 11],
      temp_range: '10-25°C',
      avoid_months: [7, 8],
      region: 'Asia',
      description: 'Experience cherry blossoms in spring or vibrant autumn foliage.'
    },
    {
      id: '2',
      country_name: 'Iceland',
      best_months: [6, 7, 8],
      temp_range: 'Cold (8-15°C)',
      avoid_months: [12, 1, 2],
      region: 'Europe',
      description: 'Midnight sun and accessible highlands in summer.'
    }
  ];

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockRequest = {
      params: {},
      query: {},
      body: {}
    };

    mockResponse = {
      json: mockJson,
      status: mockStatus
    };

    jest.clearAllMocks();
  });

  describe('getRecommendations', () => {
    it('should return all countries when no filters are provided', async () => {
      (CountryRecommendationService.validateFilters as jest.Mock).mockReturnValue({
        valid: true,
        errors: []
      });
      (CountryRecommendationService.queryCountries as jest.Mock).mockResolvedValue(mockCountries);

      await CountryRecommendationController.getRecommendations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(CountryRecommendationService.queryCountries).toHaveBeenCalledWith({});
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          countries: mockCountries,
          total: 2,
          filters: {}
        }
      });
    });

    it('should filter by month when month query parameter is provided', async () => {
      mockRequest.query = { month: '5' };

      (CountryRecommendationService.validateFilters as jest.Mock).mockReturnValue({
        valid: true,
        errors: []
      });
      (CountryRecommendationService.queryCountries as jest.Mock).mockResolvedValue([mockCountries[0]]);

      await CountryRecommendationController.getRecommendations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(CountryRecommendationService.queryCountries).toHaveBeenCalledWith({
        month: 5
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          countries: [mockCountries[0]],
          total: 1,
          filters: { month: 5 }
        }
      });
    });

    it('should filter by weather preference when weather query parameter is provided', async () => {
      mockRequest.query = { weather: 'cold' };

      (CountryRecommendationService.validateFilters as jest.Mock).mockReturnValue({
        valid: true,
        errors: []
      });
      (CountryRecommendationService.queryCountries as jest.Mock).mockResolvedValue([mockCountries[1]]);

      await CountryRecommendationController.getRecommendations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(CountryRecommendationService.queryCountries).toHaveBeenCalledWith({
        weather: 'Cold'
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should normalize weather preference to proper case', async () => {
      mockRequest.query = { weather: 'WARM' };

      (CountryRecommendationService.validateFilters as jest.Mock).mockReturnValue({
        valid: true,
        errors: []
      });
      (CountryRecommendationService.queryCountries as jest.Mock).mockResolvedValue([]);

      await CountryRecommendationController.getRecommendations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(CountryRecommendationService.queryCountries).toHaveBeenCalledWith({
        weather: 'Warm'
      });
    });

    it('should filter by region when region query parameter is provided', async () => {
      mockRequest.query = { region: 'Asia' };

      (CountryRecommendationService.validateFilters as jest.Mock).mockReturnValue({
        valid: true,
        errors: []
      });
      (CountryRecommendationService.queryCountries as jest.Mock).mockResolvedValue([mockCountries[0]]);

      await CountryRecommendationController.getRecommendations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(CountryRecommendationService.queryCountries).toHaveBeenCalledWith({
        region: 'Asia'
      });
    });

    it('should handle multiple filters simultaneously', async () => {
      mockRequest.query = { month: '5', weather: 'warm', region: 'Asia' };

      (CountryRecommendationService.validateFilters as jest.Mock).mockReturnValue({
        valid: true,
        errors: []
      });
      (CountryRecommendationService.queryCountries as jest.Mock).mockResolvedValue([mockCountries[0]]);

      await CountryRecommendationController.getRecommendations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(CountryRecommendationService.queryCountries).toHaveBeenCalledWith({
        month: 5,
        weather: 'Warm',
        region: 'Asia'
      });
    });

    it('should return 400 error for invalid month parameter', async () => {
      mockRequest.query = { month: 'invalid' };

      await CountryRecommendationController.getRecommendations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Month must be a valid number'
      });
    });

    it('should return 400 error for invalid weather preference', async () => {
      mockRequest.query = { weather: 'invalid' };

      await CountryRecommendationController.getRecommendations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Weather preference must be "warm", "cold", or "any"'
      });
    });

    it('should return 400 error when validation fails', async () => {
      mockRequest.query = { month: '13' };

      (CountryRecommendationService.validateFilters as jest.Mock).mockReturnValue({
        valid: false,
        errors: ['Month must be between 1 and 12']
      });

      await CountryRecommendationController.getRecommendations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Month must be between 1 and 12'
      });
    });

    it('should handle limit and offset parameters', async () => {
      mockRequest.query = { limit: '10', offset: '5' };

      (CountryRecommendationService.validateFilters as jest.Mock).mockReturnValue({
        valid: true,
        errors: []
      });
      (CountryRecommendationService.queryCountries as jest.Mock).mockResolvedValue([]);

      await CountryRecommendationController.getRecommendations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(CountryRecommendationService.queryCountries).toHaveBeenCalledWith({
        limit: 10,
        offset: 5
      });
    });

    it('should return 400 error for invalid limit parameter', async () => {
      mockRequest.query = { limit: '-1' };

      await CountryRecommendationController.getRecommendations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Limit must be a positive number'
      });
    });

    it('should return 400 error for invalid offset parameter', async () => {
      mockRequest.query = { offset: '-1' };

      await CountryRecommendationController.getRecommendations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Offset must be a non-negative number'
      });
    });

    it('should return 500 error when service throws an error', async () => {
      (CountryRecommendationService.validateFilters as jest.Mock).mockReturnValue({
        valid: true,
        errors: []
      });
      (CountryRecommendationService.queryCountries as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await CountryRecommendationController.getRecommendations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch country recommendations'
      });
    });
  });

  describe('getRecommendationsByMonth', () => {
    it('should return countries for a specific month', async () => {
      mockRequest.params = { month: '5' };

      (CountryRecommendationService.queryCountries as jest.Mock).mockResolvedValue([mockCountries[0]]);

      await CountryRecommendationController.getRecommendationsByMonth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(CountryRecommendationService.queryCountries).toHaveBeenCalledWith({
        month: 5
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          countries: [mockCountries[0]],
          month: 5,
          total: 1
        }
      });
    });

    it('should filter by weather when weather query parameter is provided', async () => {
      mockRequest.params = { month: '7' };
      mockRequest.query = { weather: 'cold' };

      (CountryRecommendationService.queryCountries as jest.Mock).mockResolvedValue([mockCountries[1]]);

      await CountryRecommendationController.getRecommendationsByMonth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(CountryRecommendationService.queryCountries).toHaveBeenCalledWith({
        month: 7,
        weather: 'Cold'
      });
    });

    it('should return 400 error for invalid month parameter', async () => {
      mockRequest.params = { month: 'invalid' };

      await CountryRecommendationController.getRecommendationsByMonth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Month must be a valid number'
      });
    });

    it('should return 400 error for month less than 1', async () => {
      mockRequest.params = { month: '0' };

      await CountryRecommendationController.getRecommendationsByMonth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Month must be between 1 and 12'
      });
    });

    it('should return 400 error for month greater than 12', async () => {
      mockRequest.params = { month: '13' };

      await CountryRecommendationController.getRecommendationsByMonth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Month must be between 1 and 12'
      });
    });

    it('should return 400 error for invalid weather preference', async () => {
      mockRequest.params = { month: '5' };
      mockRequest.query = { weather: 'invalid' };

      await CountryRecommendationController.getRecommendationsByMonth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Weather preference must be "warm", "cold", or "any"'
      });
    });

    it('should return 500 error when service throws an error', async () => {
      mockRequest.params = { month: '5' };

      (CountryRecommendationService.queryCountries as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await CountryRecommendationController.getRecommendationsByMonth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch country recommendations for the specified month'
      });
    });
  });
});
