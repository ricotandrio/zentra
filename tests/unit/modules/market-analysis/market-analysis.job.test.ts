import { MarketAnalysisJob } from '@/modules/market-analysis/job';
import { TickerManagementModule } from '@/modules/ticker-management';
import { IEventBus } from '@/shared/event-bus';

describe('MarketAnalysisJob', () => {
  let mockEventBus: IEventBus;
  let mockTickerManagementModule: Partial<TickerManagementModule>;

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

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should log and skip when no tickers are available', async () => {
      // Arrange
      (mockTickerManagementModule.getTickersUseCase!.execute as jest.Mock).mockResolvedValue([]);

      const job = new MarketAnalysisJob({
        channelId: 'test-channel',
        eventBus: mockEventBus,
        tickerManagementModule: mockTickerManagementModule as TickerManagementModule,
      });

      // Act
      await job.execute();

      // Assert
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should publish error event on failure', async () => {
      // Arrange
      const testError = new Error('Database error');
      (mockTickerManagementModule.getTickersUseCase!.execute as jest.Mock).mockRejectedValue(
        testError
      );

      const job = new MarketAnalysisJob({
        channelId: 'test-channel',
        eventBus: mockEventBus,
        tickerManagementModule: mockTickerManagementModule as TickerManagementModule,
      });

      // Act & Assert
      await expect(job.execute()).rejects.toThrow('Database error');
      
      const publishCalls = (mockEventBus.publish as jest.Mock).mock.calls;
      const errorEvent = publishCalls.find((call) => call[0].type === 'market-analysis:error');
      
      expect(errorEvent).toBeDefined();
      expect(errorEvent[0]).toMatchObject({
        type: 'market-analysis:error',
        source: 'worker',
      });
    });
  });
});
