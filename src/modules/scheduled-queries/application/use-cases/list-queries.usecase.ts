import { IScheduledQueryRepository } from '../contracts/scheduled-query.repository.port';
import { ScheduledQuery } from '@/modules/scheduled-queries/domain/entities/scheduled-query.entity';

export class ListQueriesUseCase {
  constructor(private readonly queryRepository: IScheduledQueryRepository) {}

  async execute(): Promise<ScheduledQuery[]> {
    return this.queryRepository.findAll();
  }
}
