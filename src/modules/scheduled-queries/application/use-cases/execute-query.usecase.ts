import { IScheduledQueryRepository } from '../contracts/scheduled-query.repository.port';
import { IQueryExecutorPort } from '../contracts/query-executor.port';

export interface ExecuteQueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
}

export class ExecuteQueryUseCase {
  constructor(
    private readonly queryRepository: IScheduledQueryRepository,
    private readonly queryExecutor: IQueryExecutorPort
  ) {}

  async execute(id: number): Promise<ExecuteQueryResult> {
    const query = await this.queryRepository.findById(id);
    if (!query) {
      throw new Error(`Query with id ${id} not found`);
    }

    const result = await this.queryExecutor.execute(query.sqlQuery);
    await this.queryRepository.updateLastRunAt(id, new Date());

    return result;
  }
}
