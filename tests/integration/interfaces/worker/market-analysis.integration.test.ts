import { MarketAnalysisJob } from '@/interfaces/worker/jobs/market-analysis.job';
import { MarketAnalysisScheduler } from '@/interfaces/worker/schedulers/market-analysis.scheduler';
import { Ticker } from '@/domain/entities/ticker.entity';
import { getLogger } from '@/shared/logger';
import { WorkerWebhookPayload } from '@/application/dto/market-results.dto';

// Import mocks directly from JSON files
import singleTickerRequest from '../../../mocks/worker/market-analysis-single-request.json';
import multipleTickersRequest from '../../../mocks/worker/market-analysis-multiple-request.json';
import webhookSuccessResponse from '../../../mocks/worker/webhook-success-response.json';
import webhookServerErrorResponse from '../../../mocks/worker/webhook-server-error-response.json';

describe('Worker Integration Tests', () => {
  let mockFetch: jest.Mock;
  let logger: any;

  beforeAll(() => {
    logger = getLogger();
  });

  beforeEach(() => {
    // Mock fetch globally
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('MarketAnalysisJob Integration', () => {
    it('should construct job with correct configuration', () => {
      // Arrange
      const mockRepository = {
        add: jest.fn(),
        getAll: jest.fn(),
        exists: jest.fn(),
        remove: jest.fn(),
      };

      // Act
      const job = new MarketAnalysisJob({
        logger,
        tickerRepository: mockRepository,
        channelId: 'test-channel-123',
        webhookUrl: 'http://localhost:3000/webhooks/market-results',
      });

      // Assert - should not throw
      expect(job).toBeDefined();
    });

    it('should handle execution with mocked repository and webhook', async () => {
      // Arrange
      const mockTickers = [
        Ticker.create(multipleTickersRequest[0].symbol, multipleTickersRequest[0].name),
        Ticker.create(multipleTickersRequest[1].symbol, multipleTickersRequest[1].name),
      ];

      const mockRepository = {
        add: jest.fn(),
        getAll: jest.fn().mockResolvedValue(mockTickers),
        exists: jest.fn(),
        remove: jest.fn(),
      };

      const mockResponse = {
        ok: webhookSuccessResponse.ok,
        status: webhookSuccessResponse.status,
        json: jest.fn().mockResolvedValue(webhookSuccessResponse.body),
        text: jest.fn(),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const job = new MarketAnalysisJob({
        logger,
        tickerRepository: mockRepository,
        channelId: 'test-channel',
        webhookUrl: 'http://localhost:3000/webhook',
      });

      // Act
      await job.execute();

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const callArgs = mockFetch.mock.calls[0];
      const payload = JSON.parse(callArgs[1].body) as WorkerWebhookPayload;

      expect(payload.source).toBe('market-analysis-job');
      expect(payload.channelId).toBe('test-channel');
      expect(payload.results).toHaveLength(2);
    });

    it('should skip execution when no tickers are available', async () => {
      // Arrange
      const mockRepository = {
        add: jest.fn(),
        getAll: jest.fn().mockResolvedValue([]),
        exists: jest.fn(),
        remove: jest.fn(),
      };

      const job = new MarketAnalysisJob({
        logger,
        tickerRepository: mockRepository,
        channelId: 'test-channel',
        webhookUrl: 'http://localhost:3000/webhook',
      });

      // Act
      await job.execute();

      // Assert
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const mockRepository = {
        add: jest.fn(),
        getAll: jest.fn().mockRejectedValue(new Error('Database connection failed')),
        exists: jest.fn(),
        remove: jest.fn(),
      };

      const job = new MarketAnalysisJob({
        logger,
        tickerRepository: mockRepository,
        channelId: 'test-channel',
        webhookUrl: 'http://localhost:3000/webhook',
      });

      // Act & Assert
      await expect(job.execute()).rejects.toThrow('Database connection failed');
    });

    it('should propagate webhook errors', async () => {
      // Arrange
      const mockTickers = [Ticker.create(singleTickerRequest.symbol, singleTickerRequest.name)];

      const mockRepository = {
        add: jest.fn(),
        getAll: jest.fn().mockResolvedValue(mockTickers),
        exists: jest.fn(),
        remove: jest.fn(),
      };

      const mockResponse = {
        ok: webhookServerErrorResponse.ok,
        status: webhookServerErrorResponse.status,
        text: jest.fn().mockResolvedValue(webhookServerErrorResponse.body),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const job = new MarketAnalysisJob({
        logger,
        tickerRepository: mockRepository,
        channelId: 'test-channel',
        webhookUrl: 'http://localhost:3000/webhook',
      });

      // Act & Assert
      await expect(job.execute()).rejects.toThrow('Webhook returned 500');
    });

    it('should build correct webhook payload with ticker data', async () => {
      // Arrange
      const mockTickers = [
        Ticker.create(multipleTickersRequest[0].symbol, multipleTickersRequest[0].name),
        Ticker.create(multipleTickersRequest[1].symbol, multipleTickersRequest[1].name),
      ];

      const mockRepository = {
        add: jest.fn(),
        getAll: jest.fn().mockResolvedValue(mockTickers),
        exists: jest.fn(),
        remove: jest.fn(),
      };

      mockFetch.mockResolvedValue({
        ok: webhookSuccessResponse.ok,
        status: webhookSuccessResponse.status,
        json: jest.fn().mockResolvedValue(webhookSuccessResponse.body),
        text: jest.fn(),
      });

      const job = new MarketAnalysisJob({
        logger,
        tickerRepository: mockRepository,
        channelId: 'integration-test-channel',
        webhookUrl: 'http://api.test/webhook',
      });

      // Act
      await job.execute();

      // Assert
      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      expect(payload).toHaveProperty('source', 'market-analysis-job');
      expect(payload).toHaveProperty('channelId', 'integration-test-channel');
      expect(payload).toHaveProperty('timestamp');
      expect(payload).toHaveProperty('results');
      expect(Array.isArray(payload.results)).toBe(true);

      // Verify timestamp is valid ISO string
      const timestamp = new Date(payload.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  describe('MarketAnalysisScheduler Integration', () => {
    it('should initialize scheduler with configuration', () => {
      // Arrange
      const mockRepository = {
        add: jest.fn(),
        getAll: jest.fn(),
        exists: jest.fn(),
        remove: jest.fn(),
      };

      // Act
      const scheduler = new MarketAnalysisScheduler({
        logger,
        tickerRepository: mockRepository,
        channelId: 'test-channel',
        webhookUrl: 'http://localhost:3000/webhook',
      });

      // Assert - should not throw
      expect(scheduler).toBeDefined();
    });

    it('should start and stop scheduler without errors', () => {
      // Arrange
      const mockRepository = {
        add: jest.fn(),
        getAll: jest.fn(),
        exists: jest.fn(),
        remove: jest.fn(),
      };

      const scheduler = new MarketAnalysisScheduler({
        logger,
        tickerRepository: mockRepository,
        channelId: 'test-channel',
        webhookUrl: 'http://localhost:3000/webhook',
        schedule: '0 18 * * *',
      });

      // Act
      scheduler.start();
      expect(() => scheduler.stop()).not.toThrow();

      // Assert - scheduler should have stopped gracefully
      expect(scheduler).toBeDefined();
    });

    it('should use custom schedule when provided', () => {
      // Arrange
      const customSchedule = '0 12 * * *';
      const mockRepository = {
        add: jest.fn(),
        getAll: jest.fn(),
        exists: jest.fn(),
        remove: jest.fn(),
      };

      // Act
      const scheduler = new MarketAnalysisScheduler({
        logger,
        tickerRepository: mockRepository,
        channelId: 'test-channel',
        webhookUrl: 'http://localhost:3000/webhook',
        schedule: customSchedule,
      });

      scheduler.start();
      scheduler.stop();

      // Assert - should not throw with custom schedule
      expect(scheduler).toBeDefined();
    });

    it('should handle multiple start/stop cycles', () => {
      // Arrange
      const mockRepository = {
        add: jest.fn(),
        getAll: jest.fn(),
        exists: jest.fn(),
        remove: jest.fn(),
      };

      const scheduler = new MarketAnalysisScheduler({
        logger,
        tickerRepository: mockRepository,
        channelId: 'test-channel',
        webhookUrl: 'http://localhost:3000/webhook',
      });

      // Act & Assert
      for (let i = 0; i < 3; i++) {
        expect(() => {
          scheduler.start();
          scheduler.stop();
        }).not.toThrow();
      }
    });

    it('should handle stop without start', () => {
      // Arrange
      const mockRepository = {
        add: jest.fn(),
        getAll: jest.fn(),
        exists: jest.fn(),
        remove: jest.fn(),
      };

      const scheduler = new MarketAnalysisScheduler({
        logger,
        tickerRepository: mockRepository,
        channelId: 'test-channel',
        webhookUrl: 'http://localhost:3000/webhook',
      });

      // Act & Assert - should not throw even without start
      expect(() => scheduler.stop()).not.toThrow();
    });
  });

  describe('Worker Job and Scheduler Integration', () => {
    it('should create job from scheduler configuration', async () => {
      // Arrange
      const mockTickers = [Ticker.create(singleTickerRequest.symbol, singleTickerRequest.name)];
      const mockRepository = {
        add: jest.fn(),
        getAll: jest.fn().mockResolvedValue(mockTickers),
        exists: jest.fn(),
        remove: jest.fn(),
      };

      mockFetch.mockResolvedValue({
        ok: webhookSuccessResponse.ok,
        status: webhookSuccessResponse.status,
        json: jest.fn().mockResolvedValue(webhookSuccessResponse.body),
        text: jest.fn(),
      });

      const scheduler = new MarketAnalysisScheduler({
        logger,
        tickerRepository: mockRepository,
        channelId: 'integration-channel',
        webhookUrl: 'http://localhost:3000/webhook',
      });

      // Act
      scheduler.start();
      scheduler.stop();

      // Assert
      expect(scheduler).toBeDefined();
    });

    it('should handle job execution errors during schedule', async () => {
      // Arrange
      const mockRepository = {
        add: jest.fn(),
        getAll: jest.fn().mockRejectedValue(new Error('DB error')),
        exists: jest.fn(),
        remove: jest.fn(),
      };

      const scheduler = new MarketAnalysisScheduler({
        logger,
        tickerRepository: mockRepository,
        channelId: 'error-channel',
        webhookUrl: 'http://localhost:3000/webhook',
      });

      // Act & Assert - should not throw even if job fails
      expect(() => {
        scheduler.start();
        scheduler.stop();
      }).not.toThrow();
    });
  });
});
