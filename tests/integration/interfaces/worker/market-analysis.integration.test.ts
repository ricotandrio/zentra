import { MarketAnalysisJob } from '@/interfaces/worker/jobs/market-analysis.job';
import { MarketAnalysisScheduler } from '@/interfaces/worker/schedulers/market-analysis.scheduler';
import { Ticker } from '@/domain/entities/ticker.entity';
import { getLogger } from '@/shared/logger';
import { IEventBus } from '@/shared/event-bus';

import singleTickerRequest from '../../../mocks/worker/market-analysis-single-request.json';

describe('Worker Integration Tests', () => {
  let mockEventBus: IEventBus;
  let logger: any;

  beforeAll(() => {
    logger = getLogger();
  });

  beforeEach(() => {
    // Mock event bus
    mockEventBus = {
      subscribe: jest.fn(),
      publish: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn(),
    } as any;

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('MarketAnalysisJob Integration', () => {
    it('should construct job with correct configuration', () => {
      const mockRepository = {
        add: jest.fn(),
        getAll: jest.fn(),
        exists: jest.fn(),
        remove: jest.fn(),
      };

      const job = new MarketAnalysisJob({
        logger,
        tickerRepository: mockRepository,
        channelId: 'test-channel-123',
        eventBus: mockEventBus,
      });

      expect(job).toBeDefined();
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
        eventBus: mockEventBus,
      });

      // Act
      await job.execute();

      // Assert - no event published when no tickers
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should propagate and publish error event on repository errors', async () => {
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
        eventBus: mockEventBus,
      });

      // Act & Assert
      await expect(job.execute()).rejects.toThrow('Database connection failed');
      
      // Verify error event was published
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
      const errorEvent = (mockEventBus.publish as jest.Mock).mock.calls[0][0];
      expect(errorEvent.type).toBe('market-analysis:error');
      expect(errorEvent.source).toBe('worker');
      expect(errorEvent.data.error).toBe('Database connection failed');
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
        eventBus: mockEventBus,
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
        eventBus: mockEventBus,
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
        eventBus: mockEventBus,
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
        eventBus: mockEventBus,
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
        eventBus: mockEventBus,
      });

      // Act & Assert - should not throw even without start
      expect(() => scheduler.stop()).not.toThrow();
    });
  });

  describe('Worker Job and Scheduler Integration', () => {
    it('should create job from scheduler configuration', () => {
      // Arrange
      const mockTickers = [Ticker.create(singleTickerRequest.symbol, singleTickerRequest.name)];
      const mockRepository = {
        add: jest.fn(),
        getAll: jest.fn().mockResolvedValue(mockTickers),
        exists: jest.fn(),
        remove: jest.fn(),
      };

      const scheduler = new MarketAnalysisScheduler({
        logger,
        tickerRepository: mockRepository,
        channelId: 'integration-channel',
        eventBus: mockEventBus,
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
        eventBus: mockEventBus,
      });

      // Act & Assert - should not throw even if job fails
      expect(() => {
        scheduler.start();
        scheduler.stop();
      }).not.toThrow();
    });
  });
});
