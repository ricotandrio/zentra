import { MarketAnalysisScheduler } from '@/modules/market-analysis/scheduler';
import { TickerManagementModule } from '@/modules/ticker-management';
import { IEventBus } from '@/shared/event-bus';

// Mock node-cron module
jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

// Import after mocking
import * as cron from 'node-cron';
const mockSchedule = cron.schedule as jest.MockedFunction<typeof cron.schedule>;

describe('MarketAnalysisScheduler', () => {
  let mockEventBus: IEventBus;
  let mockTickerManagementModule: Partial<TickerManagementModule>;
  let mockScheduledTask: any;

  beforeEach(() => {
    // Mock event bus
    mockEventBus = {
      subscribe: jest.fn(),
      publish: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn(),
    } as any;

    // Mock ticker management module
    mockTickerManagementModule = {
      getTickersUseCase: {
        execute: jest.fn(),
      } as any,
      addTickerUseCase: {} as any,
      removeTickerUseCase: {} as any,
      closeDb: jest.fn(),
    };

    // Mock scheduled task
    mockScheduledTask = {
      stop: jest.fn(),
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
        channelId: 'test-channel',
        eventBus: mockEventBus,
        tickerManagementModule: mockTickerManagementModule as TickerManagementModule,
      });

      // Act
      scheduler.start();

      // Assert
      expect(mockSchedule).toHaveBeenCalledWith(
        expect.any(String), // schedule is computed at runtime
        expect.any(Function)
      );
    });

    it('should schedule task with custom cron expression', () => {
      // Arrange
      const customSchedule = '0 12 * * *';
      const scheduler = new MarketAnalysisScheduler({
        channelId: 'test-channel',
        eventBus: mockEventBus,
        tickerManagementModule: mockTickerManagementModule as TickerManagementModule,
        schedule: customSchedule,
      });

      // Act
      scheduler.start();

      // Assert
      expect(mockSchedule).toHaveBeenCalledWith(
        customSchedule,
        expect.any(Function)
      );
    });

    it('should not throw when started multiple times', () => {
      // Arrange
      const scheduler = new MarketAnalysisScheduler({
        channelId: 'test-channel',
        eventBus: mockEventBus,
        tickerManagementModule: mockTickerManagementModule as TickerManagementModule,
      });

      // Act & Assert
      expect(() => {
        scheduler.start();
        scheduler.start(); // Should replace previous schedule
      }).not.toThrow();
    });
  });

  describe('stop', () => {
    it('should stop scheduled task', () => {
      // Arrange
      const scheduler = new MarketAnalysisScheduler({
        channelId: 'test-channel',
        eventBus: mockEventBus,
        tickerManagementModule: mockTickerManagementModule as TickerManagementModule,
      });

      scheduler.start();

      // Act
      scheduler.stop();

      // Assert
      expect(mockScheduledTask.stop).toHaveBeenCalled();
    });

    it('should allow restart after stop', () => {
      // Arrange
      const scheduler = new MarketAnalysisScheduler({
        channelId: 'test-channel',
        eventBus: mockEventBus,
        tickerManagementModule: mockTickerManagementModule as TickerManagementModule,
      });

      // Act
      scheduler.start();
      scheduler.stop();
      mockSchedule.mockClear();

      scheduler.start();

      // Assert
      expect(mockSchedule).toHaveBeenCalled();
    });

    it('should handle stop when task is not running', () => {
      // Arrange
      const scheduler = new MarketAnalysisScheduler({
        channelId: 'test-channel',
        eventBus: mockEventBus,
        tickerManagementModule: mockTickerManagementModule as TickerManagementModule,
      });

      // Act & Assert - should not throw
      expect(() => scheduler.stop()).not.toThrow();
    });

    it('should handle multiple start/stop cycles', () => {
      // Arrange
      const scheduler = new MarketAnalysisScheduler({
        channelId: 'test-channel',
        eventBus: mockEventBus,
        tickerManagementModule: mockTickerManagementModule as TickerManagementModule,
      });

      // Act & Assert
      for (let i = 0; i < 3; i++) {
        expect(() => {
          scheduler.start();
          scheduler.stop();
        }).not.toThrow();
      }
    });
  });
});
