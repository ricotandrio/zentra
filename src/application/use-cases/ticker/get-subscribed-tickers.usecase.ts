import { Ticker } from '@/domain/entities/ticker.entity';
import { ITickerRepository } from '@/domain/repositories/ticker.repository';

/**
 * Get Subscribed Tickers Use Case
 * Retrieves all subscribed tickers
 */
export class GetSubscribedTickersUseCase {
  constructor(private tickerRepository: ITickerRepository) {}

  async execute(): Promise<Ticker[]> {
    return this.tickerRepository.getAll();
  }
}
