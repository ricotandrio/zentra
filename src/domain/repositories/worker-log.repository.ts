import { WorkerLog } from '../entities/worker-log';

export interface IWorkerLogRepository {
  /**
   * Add a new log entry to the database
   */
  add(log: WorkerLog): Promise<void>;

  /**
   * Get all log entries from the database
   */
  getAll(): Promise<WorkerLog[]>;
}
