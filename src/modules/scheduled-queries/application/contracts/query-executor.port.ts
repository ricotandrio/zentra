export interface IQueryExecutorPort {
  execute(sql: string): Promise<{ columns: string[]; rows: Record<string, unknown>[] }>;
}
