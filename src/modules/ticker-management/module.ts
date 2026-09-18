import { ModuleHandle, Runtime } from '@/shared/runtime';

import { AddTickerUseCase } from './application/usecases/add-ticker.usecase';
import { GetTickersUseCase } from './application/usecases/get-tickers.usecase';
import { RemoveTickerUseCase } from './application/usecases/remove-ticker.usecase';
import { SqliteTickerRepository } from './infrastructure/db/sqlite-ticker.repository';

import { SQLiteAdapter } from '../common';
import { DatabaseConnection } from '../common/application/ports/db';

export interface TickerManagementModule {
  addTickerUseCase: AddTickerUseCase;
  removeTickerUseCase: RemoveTickerUseCase;
  getTickersUseCase: GetTickersUseCase;
}

export function createTickerManagementModule(): ModuleHandle<TickerManagementModule> {
  let db: DatabaseConnection | null = null;
  let service: TickerManagementModule | null = null;

  return {
    getService() {
      if (!service) {
        throw new Error('Ticker management module is not registered');
      }

      return service;
    },

    register(_runtime: Runtime) {
      const sqliteAdapter = new SQLiteAdapter();

      db = sqliteAdapter;

      const repository = new SqliteTickerRepository(sqliteAdapter);

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
