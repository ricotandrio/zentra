export interface DatabaseConnection {
  close(): Promise<void> | void;
}

export interface QueryExecutor {
  query<T extends Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<T[]>;

  execute(
    sql: string,
    params?: unknown[],
  ): Promise<void>;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
}

export interface QueryResultExecutor {
  executeQuery(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult>;
}
