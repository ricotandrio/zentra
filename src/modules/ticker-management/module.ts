import { SqliteTickerRepository } from './infrastructure/db/sqlite-ticker.repository';
import { AddTickerUseCase } from './application/usecases/add-ticker.usecase';
import { RemoveTickerUseCase } from './application/usecases/remove-ticker.usecase';
import { GetTickersUseCase } from './application/usecases/get-tickers.usecase';
import { initDatabase } from './infrastructure/db/database';
import { logger } from '@/shared/logger';

export interface TickerManagementModule {
  addTickerUseCase: AddTickerUseCase;
  removeTickerUseCase: RemoveTickerUseCase;
  getTickersUseCase: GetTickersUseCase;
  closeDb: () => void;
}

export function createTickerManagementModule(): TickerManagementModule {
  const db = initDatabase();
  logger.info('Database initialized');

  const repository = new SqliteTickerRepository(db);

  return {
    addTickerUseCase: new AddTickerUseCase(repository),
    removeTickerUseCase: new RemoveTickerUseCase(repository),
    getTickersUseCase: new GetTickersUseCase(repository),
    closeDb: () => db.close(),
  };
}
