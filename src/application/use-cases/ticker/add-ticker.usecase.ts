import { Ticker } from '@/domain/entities/ticker.entity';
import { ITickerRepository } from '@/domain/repositories/ticker.repository';

/**
 * Add Ticker Use Case
 * Adds a new ticker to the global subscription list
 */
export class AddTickerUseCase {
  constructor(private tickerRepository: ITickerRepository) {}

  async execute(input: { symbol: string; }): Promise<void> {
    const exists = await this.tickerRepository.exists(input.symbol);
    if (exists) {
      throw new Error(`Ticker ${input.symbol} is already subscribed`);
    }

    const ticker = Ticker.create(input.symbol);
    await this.tickerRepository.add(ticker);
  }
}
