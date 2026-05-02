import { MarketAnalysisJob } from '@/interfaces/worker/jobs/market-analysis.job';
import { GetSubscribedTickersUseCase, AnalyzeMarketUseCase } from '@/application/use-cases/ticker';
import { Ticker } from '@/domain/entities/ticker.entity';
import { Logger } from 'pino';
import { IEventBus } from '@/shared/event-bus';

// Import mocks directly from JSON files
import singleTickerRequest from '../../../mocks/worker/market-analysis-single-request.json';
import multipleTickersRequest from '../../../mocks/worker/market-analysis-multiple-request.json';
import singleAnalysisResponse from '../../../mocks/worker/market-analysis-single-response.json';
import multipleAnalysisResponse from '../../../mocks/worker/market-analysis-single-response.json';

// Mock dependencies
jest.mock('@/application/use-cases/ticker');

const mockGetSubscribedTickersUseCase = GetSubscribedTickersUseCase as jest.MockedClass<
  typeof GetSubscribedTickersUseCase
>;
const mockAnalyzeMarketUseCase = AnalyzeMarketUseCase as jest.MockedClass<
  typeof AnalyzeMarketUseCase
>;

describe('MarketAnalysisJob', () => {
  let mockLogger: Logger;
  let mockTickerRepository: any;
  let mockEventBus: IEventBus;
  let mockFetch: jest.Mock;

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

    // Mock event bus
    mockEventBus = {
      subscribe: jest.fn(),
      publish: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn(),
    } as any;

    // Mock fetch globally
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('execute', () => {
    it('should log when no tickers are available', async () => {
      // Arrange
      mockGetSubscribedTickersUseCase.prototype.execute = jest.fn().mockResolvedValue([]);

      const job = new MarketAnalysisJob({
        logger: mockLogger,
        tickerRepository: mockTickerRepository,
        channelId: 'test-channel',
        eventBus: mockEventBus,
      });

      // Act
      await job.execute();

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Starting market analysis job');
      expect(mockLogger.info).toHaveBeenCalledWith('No tickers to analyze');
    });

    it('should analyze tickers and publish event', async () => {
      // Arrange
      const mockTickers = [
        Ticker.create(multipleTickersRequest[0].symbol, multipleTickersRequest[0].name),
        Ticker.create(multipleTickersRequest[1].symbol, multipleTickersRequest[1].name),
      ];

      mockGetSubscribedTickersUseCase.prototype.execute = jest
        .fn()
        .mockResolvedValue(mockTickers);
      mockAnalyzeMarketUseCase.prototype.analyzeMultipleTickers = jest
        .fn()
        .mockResolvedValue(multipleAnalysisResponse.multiple);

      const job = new MarketAnalysisJob({
        logger: mockLogger,
        tickerRepository: mockTickerRepository,
        channelId: 'test-channel',
        eventBus: mockEventBus,
      });

      // Act
      await job.execute();

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Starting market analysis job');
      expect(mockLogger.info).toHaveBeenCalledWith(
        { count: 2 },
        'Analyzing tickers'
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'market-analysis:complete',
          source: 'worker',
        })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ count: 2 }),
        'Market analysis completed'
      );
    });

    it('should publish error event on use case failure', async () => {
      // Arrange
      const testError = new Error('Analysis failed');

      mockGetSubscribedTickersUseCase.prototype.execute = jest
        .fn()
        .mockResolvedValue([Ticker.create(singleTickerRequest.symbol, singleTickerRequest.name)]);
      mockAnalyzeMarketUseCase.prototype.analyzeMultipleTickers = jest
        .fn()
        .mockRejectedValue(testError);

      const job = new MarketAnalysisJob({
        logger: mockLogger,
        tickerRepository: mockTickerRepository,
        channelId: 'test-channel',
        eventBus: mockEventBus,
      });

      // Act & Assert
      await expect(job.execute()).rejects.toThrow('Analysis failed');
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'market-analysis:error',
          source: 'worker',
          data: expect.objectContaining({
            error: 'Analysis failed',
          }),
        })
      );
    });

    it('should handle use case errors', async () => {
      // Arrange
      mockGetSubscribedTickersUseCase.prototype.execute = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const job = new MarketAnalysisJob({
        logger: mockLogger,
        tickerRepository: mockTickerRepository,
        channelId: 'test-channel',
        eventBus: mockEventBus,
      });

      // Act & Assert
      await expect(job.execute()).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.any(Error),
        'Error executing market analysis job'
      );
    });

    it('should publish correct event structure', async () => {
      // Arrange
      const mockTickers = [Ticker.create(singleTickerRequest.symbol, singleTickerRequest.name)];

      mockGetSubscribedTickersUseCase.prototype.execute = jest
        .fn()
        .mockResolvedValue(mockTickers);
      mockAnalyzeMarketUseCase.prototype.analyzeMultipleTickers = jest
        .fn()
        .mockResolvedValue(singleAnalysisResponse.single);

      const job = new MarketAnalysisJob({
        logger: mockLogger,
        tickerRepository: mockTickerRepository,
        channelId: 'test-channel-id',
        eventBus: mockEventBus,
      });

      // Act
      await job.execute();

      // Assert
      const publishCall = (mockEventBus.publish as jest.Mock).mock.calls[0][0];
      expect(publishCall).toMatchObject({
        type: 'market-analysis:complete',
        source: 'worker',
        data: expect.objectContaining({
          channelId: 'test-channel-id',
          results: expect.any(Array),
        }),
      });
      expect(publishCall.data.timestamp).toBeDefined();
      expect(publishCall.data.results).toHaveLength(1);
      expect(publishCall.data.results[0]).toMatchObject({
        ticker: 'BBCA.JK',
        price: 7500,
        changePercent: 1.5,
        sentiment: 0.8,
        volume: 5000000,
        newsCount: 3,
      });
    });
  });
});
