import { Ticker } from '@/modules/ticker-management/domain/entities/ticker.entity';
import { ITickerRepository } from '@/modules/ticker-management/domain/repositories/ticker.repository';

export class AddTickerUseCase {
  constructor(private tickerRepository: ITickerRepository) {}

  async execute(input: { symbol: string; }): Promise<void> {
    const isTickerExists = await this.tickerRepository.get(input.symbol);
    
    if (isTickerExists) {
      throw new Error(`Ticker ${input.symbol} is already subscribed`);
    }

    const ticker = new Ticker(input.symbol);
    await this.tickerRepository.add(ticker);
  }
}
