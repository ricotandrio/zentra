import { SqliteTickerRepository } from './infrastructure/db/sqlite-ticker.repository';
import { AddTickerUseCase } from './application/usecases/add-ticker.usecase';
import { RemoveTickerUseCase } from './application/usecases/remove-ticker.usecase';
import { GetTickersUseCase } from './application/usecases/get-tickers.usecase';
import { initDatabase } from './infrastructure/db/database';
import { Module, Runtime } from '@/shared/runtime';
import Database from 'better-sqlite3';

export interface TickerManagementModule {
  addTickerUseCase: AddTickerUseCase;
  removeTickerUseCase: RemoveTickerUseCase;
  getTickersUseCase: GetTickersUseCase;
}

export function createTickerManagementModule(): Module {
  let db: Database.Database | null = null;

  return {
    register(runtime: Runtime) {
      db = initDatabase();

      const repository = new SqliteTickerRepository(db);

      const tickerManagement: TickerManagementModule = {
        addTickerUseCase: new AddTickerUseCase(repository),
        removeTickerUseCase: new RemoveTickerUseCase(repository),
        getTickersUseCase: new GetTickersUseCase(repository),
      };

      runtime.modules.set('tickerManagement', tickerManagement);
    },

    shutdown() {
      db?.close();
    },
  };
}
