import { ITickerRepository } from '@/modules/ticker-management/domain/repositories/ticker.repository';

/**
 * Remove Ticker Use Case
 * Removes a ticker from the global subscription list
 */
export class RemoveTickerUseCase {
  constructor(private tickerRepository: ITickerRepository) {}

  async execute(input: { symbol: string; }): Promise<void> {
    const ticker = await this.tickerRepository.get(input.symbol);

    if (!ticker) {
      throw new Error(`Ticker ${input.symbol} is not subscribed`);
    }

    await this.tickerRepository.remove(input.symbol);
  }
}
