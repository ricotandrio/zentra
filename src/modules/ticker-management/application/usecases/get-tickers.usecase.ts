import { Ticker } from '@/modules/ticker-management/domain/entities/ticker.entity';
import { ITickerRepository } from '@/modules/ticker-management/domain/repositories/ticker.repository';

export class GetTickersUseCase {
  constructor(private tickerRepository: ITickerRepository) {}

  async execute(): Promise<Ticker[]> {
    return this.tickerRepository.getAll();
  }
}
