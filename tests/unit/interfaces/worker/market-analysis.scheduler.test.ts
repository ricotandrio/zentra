import { MarketAnalysisScheduler } from '@/interfaces/worker/schedulers/market-analysis.scheduler';
import { Logger } from 'pino';

// Mock node-cron module
jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

// Import after mocking
import * as cron from 'node-cron';
const mockSchedule = cron.schedule as jest.MockedFunction<typeof cron.schedule>;

describe('MarketAnalysisScheduler', () => {
  let mockLogger: Logger;
  let mockTickerRepository: any;
  let mockScheduledTask: any;

  beforeEach(() => {
    // Mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    } as any;

    // Mock repository
    mockTickerRepository = {
      add: jest.fn(),
      getAll: jest.fn(),
      exists: jest.fn(),
      remove: jest.fn(),
    };

    // Mock scheduled task
    mockScheduledTask = {
      stop: jest.fn(),
      destroy: jest.fn(),
    };

    mockSchedule.mockReturnValue(mockScheduledTask);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('start', () => {
    it('should schedule task with default cron expression', () => {
      // Arrange
      const scheduler = new MarketAnalysisScheduler({
        logger: mockLogger,
        tickerRepository: mockTickerRepository,
        channelId: 'test-channel',
        webhookUrl: 'http://localhost:3000/webhook',
      });

      // Act
      scheduler.start();

      // Assert
      expect(mockSchedule).toHaveBeenCalledWith(
        '0 18 * * *',
        expect.any(Function)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        { schedule: '0 18 * * *' },
        'Starting market analysis scheduler'
      );
    });

    it('should schedule task with custom cron expression', () => {
      // Arrange
      const customSchedule = '0 12 * * *';
      const scheduler = new MarketAnalysisScheduler({
        logger: mockLogger,
        tickerRepository: mockTickerRepository,
        channelId: 'test-channel',
        webhookUrl: 'http://localhost:3000/webhook',
        schedule: customSchedule,
      });

      // Act
      scheduler.start();

      // Assert
      expect(mockSchedule).toHaveBeenCalledWith(
        customSchedule,
        expect.any(Function)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        { schedule: customSchedule },
        'Starting market analysis scheduler'
      );
    });

    it('should handle job execution errors gracefully', async () => {
      // Arrange
      let jobCallback: () => Promise<void>;
      mockSchedule.mockImplementation((schedule, callback) => {
        jobCallback = callback;
        return mockScheduledTask;
      });

      const scheduler = new MarketAnalysisScheduler({
        logger: mockLogger,
        tickerRepository: mockTickerRepository,
        channelId: 'test-channel',
        webhookUrl: 'http://localhost:3000/webhook',
      });

      // Mock fetch to simulate job failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      scheduler.start();

      // Act
      await jobCallback!();

      // Assert - should not throw, but log error
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.any(Error),
        'Scheduled market analysis job failed'
      );
    });
  });

  describe('stop', () => {
    it('should stop and destroy scheduled task', () => {
      // Arrange
      const scheduler = new MarketAnalysisScheduler({
        logger: mockLogger,
        tickerRepository: mockTickerRepository,
        channelId: 'test-channel',
        webhookUrl: 'http://localhost:3000/webhook',
      });

      scheduler.start();

      // Act
      scheduler.stop();

      // Assert
      expect(mockScheduledTask.stop).toHaveBeenCalled();
      expect(mockScheduledTask.destroy).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Market analysis scheduler stopped');
    });

    it('should handle stop when task is not running', () => {
      // Arrange
      const scheduler = new MarketAnalysisScheduler({
        logger: mockLogger,
        tickerRepository: mockTickerRepository,
        channelId: 'test-channel',
        webhookUrl: 'http://localhost:3000/webhook',
      });

      // Act - call stop without start
      scheduler.stop();

      // Assert - should not throw
      expect(mockLogger.info).not.toHaveBeenCalledWith('Market analysis scheduler stopped');
    });

    it('should allow restart after stop', () => {
      // Arrange
      const scheduler = new MarketAnalysisScheduler({
        logger: mockLogger,
        tickerRepository: mockTickerRepository,
        channelId: 'test-channel',
        webhookUrl: 'http://localhost:3000/webhook',
      });

      // Act
      scheduler.start();
      scheduler.stop();
      mockSchedule.mockClear();
      mockLogger.info.mockClear();

      scheduler.start();

      // Assert
      expect(mockSchedule).toHaveBeenCalledWith(
        '0 18 * * *',
        expect.any(Function)
      );
    });
  });
});
