import { QueryResultExecutor } from '@/modules/common/application/ports/db';
import { IScheduledQueryRepository } from '../contracts/scheduled-query.repository.port';

export interface ExecuteQueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
}

export class ExecuteQueryUseCase {
  constructor(
    private readonly queryRepository: IScheduledQueryRepository,
    private readonly queryExecutor: QueryResultExecutor
  ) {}

  async execute(id: number): Promise<ExecuteQueryResult> {
    const query = await this.queryRepository.findById(id);
    if (!query) {
      throw new Error(`Query with id ${id} not found`);
    }

    const result = await this.queryExecutor.executeQuery(query.sqlQuery);
    await this.queryRepository.updateLastRunAt(id, new Date());

    return result;
  }
}
