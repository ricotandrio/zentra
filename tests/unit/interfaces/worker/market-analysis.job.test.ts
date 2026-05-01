import { MarketAnalysisJob } from '@/interfaces/worker/jobs/market-analysis.job';
import { GetSubscribedTickersUseCase, AnalyzeMarketUseCase } from '@/application/use-cases/ticker';
import { Ticker } from '@/domain/entities/ticker.entity';
import { WorkerWebhookPayload } from '@/application/dto/market-results.dto';
import { Logger } from 'pino';
import mocker from '../../../mocks/loader';

// Load mocks from JSON files
const mocks = mocker.loadWorkerMocks();

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
        webhookUrl: 'http://localhost:3000/webhook',
      });

      // Act
      await job.execute();

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Starting market analysis job');
      expect(mockLogger.info).toHaveBeenCalledWith('No tickers to analyze');
    });

    it('should analyze tickers and send webhook', async () => {
      // Arrange
      const mockTickers = [
        Ticker.create(mocks.tickers.multiple[0].symbol, mocks.tickers.multiple[0].name),
        Ticker.create(mocks.tickers.multiple[1].symbol, mocks.tickers.multiple[1].name),
      ];

      const mockResponse = {
        ok: mocks.httpResponses.webhookSuccess.ok,
        status: mocks.httpResponses.webhookSuccess.status,
        json: jest.fn().mockResolvedValue(mocks.httpResponses.webhookSuccess.body),
        text: jest.fn(),
      };

      mockGetSubscribedTickersUseCase.prototype.execute = jest
        .fn()
        .mockResolvedValue(mockTickers);
      mockAnalyzeMarketUseCase.prototype.analyzeMultipleTickers = jest
        .fn()
        .mockResolvedValue(mocks.marketAnalysisResponse.multiple);
      mockFetch.mockResolvedValue(mockResponse);

      const job = new MarketAnalysisJob({
        logger: mockLogger,
        tickerRepository: mockTickerRepository,
        channelId: 'test-channel',
        webhookUrl: 'http://localhost:3000/webhook',
      });

      // Act
      await job.execute();

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Starting market analysis job');
      expect(mockLogger.info).toHaveBeenCalledWith(
        { count: 2 },
        'Analyzing tickers'
      );
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ count: 2 }),
        'Market analysis completed'
      );
    });

    it('should handle webhook errors', async () => {
      // Arrange
      const mockTickers = [Ticker.create(mocks.tickers.single.symbol, mocks.tickers.single.name)];

      const mockResponse = {
        ok: mocks.httpResponses.webhookServerError.ok,
        status: mocks.httpResponses.webhookServerError.status,
        text: jest.fn().mockResolvedValue(mocks.httpResponses.webhookServerError.body),
      };

      mockGetSubscribedTickersUseCase.prototype.execute = jest
        .fn()
        .mockResolvedValue(mockTickers);
      mockAnalyzeMarketUseCase.prototype.analyzeMultipleTickers = jest
        .fn()
        .mockResolvedValue(mocks.marketAnalysisResponse.single);
      mockFetch.mockResolvedValue(mockResponse);

      const job = new MarketAnalysisJob({
        logger: mockLogger,
        tickerRepository: mockTickerRepository,
        channelId: 'test-channel',
        webhookUrl: 'http://localhost:3000/webhook',
      });

      // Act & Assert
      await expect(job.execute()).rejects.toThrow('Webhook returned 500');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.any(Error),
        'Error executing market analysis job'
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
        webhookUrl: 'http://localhost:3000/webhook',
      });

      // Act & Assert
      await expect(job.execute()).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.any(Error),
        'Error executing market analysis job'
      );
    });

    it('should create correct webhook payload structure', async () => {
      // Arrange
      const mockTickers = [Ticker.create(mocks.tickers.single.symbol, mocks.tickers.single.name)];

      const mockResponse = {
        ok: mocks.httpResponses.webhookSuccess.ok,
        status: mocks.httpResponses.webhookSuccess.status,
        json: jest.fn().mockResolvedValue(mocks.httpResponses.webhookSuccess.body),
        text: jest.fn(),
      };

      mockGetSubscribedTickersUseCase.prototype.execute = jest
        .fn()
        .mockResolvedValue(mockTickers);
      mockAnalyzeMarketUseCase.prototype.analyzeMultipleTickers = jest
        .fn()
        .mockResolvedValue(mocks.marketAnalysisResponse.single);
      mockFetch.mockResolvedValue(mockResponse);

      const job = new MarketAnalysisJob({
        logger: mockLogger,
        tickerRepository: mockTickerRepository,
        channelId: 'test-channel-id',
        webhookUrl: 'http://localhost:3000/webhook',
      });

      // Act
      await job.execute();

      // Assert
      const callArgs = mockFetch.mock.calls[0];
      const payload = JSON.parse(callArgs[1].body) as WorkerWebhookPayload;

      expect(payload).toMatchObject({
        source: 'market-analysis-job',
        channelId: 'test-channel-id',
      });
      expect(payload.timestamp).toBeDefined();
      expect(payload.results).toHaveLength(1);
      expect(payload.results[0]).toMatchObject({
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
