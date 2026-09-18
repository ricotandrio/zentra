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
