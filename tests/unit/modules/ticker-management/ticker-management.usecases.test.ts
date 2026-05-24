import { AddTickerUseCase } from '@/modules/ticker-management/application/usecases/add-ticker.usecase';
import { RemoveTickerUseCase } from '@/modules/ticker-management/application/usecases/remove-ticker.usecase';
import { GetTickersUseCase } from '@/modules/ticker-management/application/usecases/get-tickers.usecase';
import { Ticker } from '@/modules/ticker-management/domain/entities/ticker.entity';

describe('Ticker Management Use Cases', () => {
  let mockTickerRepository: any;

  beforeEach(() => {
    mockTickerRepository = {
      add: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      getAll: jest.fn().mockResolvedValue([]),
      remove: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('AddTickerUseCase', () => {
    it('should add a new ticker', async () => {
      // Arrange
      mockTickerRepository.get.mockResolvedValue(null);
      const useCase = new AddTickerUseCase(mockTickerRepository);

      // Act
      await useCase.execute({ symbol: 'BBCA.JK' });

      // Assert
      expect(mockTickerRepository.add).toHaveBeenCalledWith(expect.any(Ticker));
    });

    it('should throw error if ticker already exists', async () => {
      // Arrange
      const existingTicker = new Ticker('BBCA.JK');
      mockTickerRepository.get.mockResolvedValue(existingTicker);

      const useCase = new AddTickerUseCase(mockTickerRepository);

      // Act & Assert
      await expect(useCase.execute({ symbol: 'BBCA.JK' })).rejects.toThrow(
        'Ticker BBCA.JK is already subscribed'
      );
    });

    it('should throw error if symbol is missing .JK suffix', async () => {
      // Arrange
      mockTickerRepository.get.mockResolvedValue(null);
      const useCase = new AddTickerUseCase(mockTickerRepository);

      // Act & Assert
      await expect(useCase.execute({ symbol: 'BBCA' })).rejects.toThrow(
        'Invalid ticker symbol. Must be in format: SYMBOL.JK'
      );
    });
  });

  describe('RemoveTickerUseCase', () => {
    it('should remove an existing ticker', async () => {
      // Arrange
      const ticker = new Ticker('BBCA.JK');
      mockTickerRepository.get.mockResolvedValue(ticker);

      const useCase = new RemoveTickerUseCase(mockTickerRepository);

      // Act
      await useCase.execute({ symbol: 'BBCA.JK' });

      // Assert
      expect(mockTickerRepository.remove).toHaveBeenCalledWith('BBCA.JK');
    });

    it('should throw error if ticker not found', async () => {
      // Arrange
      mockTickerRepository.get.mockResolvedValue(null);

      const useCase = new RemoveTickerUseCase(mockTickerRepository);

      // Act & Assert
      await expect(useCase.execute({ symbol: 'NONEXISTENT.JK' })).rejects.toThrow(
        'Ticker NONEXISTENT.JK is not subscribed'
      );
    });

    it('should not call remove if ticker does not exist', async () => {
      // Arrange
      mockTickerRepository.get.mockResolvedValue(null);

      const useCase = new RemoveTickerUseCase(mockTickerRepository);

      // Act
      try {
        await useCase.execute({ symbol: 'NONEXISTENT.JK' });
      } catch (e) {
        // Expected
        console.log(e);
      }

      // Assert
      expect(mockTickerRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('GetTickersUseCase', () => {
    it('should return all tickers', async () => {
      // Arrange
      const tickers = [
        new Ticker('BBCA.JK'),
        new Ticker('BMRI.JK'),
      ];
      mockTickerRepository.getAll.mockResolvedValue(tickers);

      const useCase = new GetTickersUseCase(mockTickerRepository);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual(tickers);
      expect(result.length).toBe(2);
    });

    it('should return empty array if no tickers', async () => {
      // Arrange
      mockTickerRepository.getAll.mockResolvedValue([]);

      const useCase = new GetTickersUseCase(mockTickerRepository);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });
});
