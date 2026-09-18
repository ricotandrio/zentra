import { ScheduledQuery } from '@/modules/scheduled-queries/domain/entities/scheduled-query.entity';

export interface IScheduledQueryRepository {
  findAll(): Promise<ScheduledQuery[]>;
  findById(id: number): Promise<ScheduledQuery | null>;
  updateLastRunAt(id: number, date: Date): Promise<void>;
}
