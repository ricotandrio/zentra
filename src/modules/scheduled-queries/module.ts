import { ModuleHandle, Runtime } from '@/shared/runtime';

import { PostgresScheduledQueryRepository } from './infrastructure/postgres/scheduled-query.repository';
import { ListQueriesUseCase } from './application/usecases/list-queries.usecase';
import { ExecuteQueryUseCase } from './application/usecases/execute-query.usecase';
import { DatabaseConnection, QueryExecutor } from '../common/application/ports';
import { PostgresAdapter } from '../common';

export interface ScheduledQueriesModule {
  listQueriesUseCase: ListQueriesUseCase;
  executeQueryUseCase: ExecuteQueryUseCase;
}

export function createScheduledQueriesModule(): ModuleHandle<ScheduledQueriesModule> {
  let pool: DatabaseConnection & QueryExecutor | null = null;
  let service: ScheduledQueriesModule | null = null;

  return {
    getService() {
      if (!service) throw new Error('Scheduled queries module is not registered');
      return service;
    },

    async register(runtime: Runtime) {
      const connectionString = runtime.config.postgresql.url;

      pool = new PostgresAdapter(connectionString);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS scheduled_queries (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          schedule TEXT,
          sql_query TEXT,
          enabled BOOLEAN NOT NULL DEFAULT TRUE,
          last_run_at TIMESTAMPTZ,
          next_run_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      const queryRepository = new PostgresScheduledQueryRepository(pool);

      service = {
        listQueriesUseCase: new ListQueriesUseCase(queryRepository),
        executeQueryUseCase: new ExecuteQueryUseCase(queryRepository, pool),
      };
    },

    async shutdown() {
      await pool?.close();
    },
  };
}
