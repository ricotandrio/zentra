import { SqliteTickerRepository } from './infrastructure/db/sqlite-ticker.repository';
import { AddTickerUseCase } from './application/usecases/add-ticker.usecase';
import { RemoveTickerUseCase } from './application/usecases/remove-ticker.usecase';
import { GetTickersUseCase } from './application/usecases/get-tickers.usecase';
import { initDatabase } from './infrastructure/db/database';
import { ModuleHandle, Runtime } from '@/shared/runtime';
import Database from 'better-sqlite3';

export interface TickerManagementModule {
  addTickerUseCase: AddTickerUseCase;
  removeTickerUseCase: RemoveTickerUseCase;
  getTickersUseCase: GetTickersUseCase;
}

export function createTickerManagementModule(): ModuleHandle<TickerManagementModule> {
  let db: Database.Database | null = null;
  let service: TickerManagementModule | null = null;

  return {
    getService() {
      if (!service) throw new Error('Ticker management module is not registered');
      return service;
    },

    register(_runtime: Runtime) {
      db = initDatabase();

      const repository = new SqliteTickerRepository(db);

      service = {
        addTickerUseCase: new AddTickerUseCase(repository),
        removeTickerUseCase: new RemoveTickerUseCase(repository),
        getTickersUseCase: new GetTickersUseCase(repository),
      };
    },

    shutdown() {
      db?.close();
    },
  };
}
