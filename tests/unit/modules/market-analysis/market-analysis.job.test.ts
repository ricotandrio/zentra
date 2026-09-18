import { MarketAnalysisJob } from '@/modules/market-analysis/job';
import { IEventBus } from '@/shared/event-bus';

describe('MarketAnalysisJob', () => {
  let mockEventBus: IEventBus;
  let mockTickerReader: { getTickers: jest.Mock };
  let mockAnalyzeTickersUseCase: { execute: jest.Mock };
  let mockMarketSummaryUseCase: { execute: jest.Mock };

  beforeEach(() => {
    // Mock event bus
    mockEventBus = {
      subscribe: jest.fn(),
      publish: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn(),
    } as any;

    mockTickerReader = { getTickers: jest.fn() };
    mockAnalyzeTickersUseCase = { execute: jest.fn() };
    mockMarketSummaryUseCase = { execute: jest.fn() };

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should log and skip when no tickers are available', async () => {
      // Arrange
      mockTickerReader.getTickers.mockResolvedValue([]);

      const job = new MarketAnalysisJob({
        channelId: 'test-channel',
        eventBus: mockEventBus,
        tickerReader: mockTickerReader,
        analyzeTickersUseCase: mockAnalyzeTickersUseCase as any,
        marketSummaryUseCase: mockMarketSummaryUseCase as any,
      });

      // Act
      await job.execute();

      // Assert
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should publish error event on failure', async () => {
      // Arrange
      const testError = new Error('Database error');
      mockTickerReader.getTickers.mockRejectedValue(testError);

      const job = new MarketAnalysisJob({
        channelId: 'test-channel',
        eventBus: mockEventBus,
        tickerReader: mockTickerReader,
        analyzeTickersUseCase: mockAnalyzeTickersUseCase as any,
        marketSummaryUseCase: mockMarketSummaryUseCase as any,
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
