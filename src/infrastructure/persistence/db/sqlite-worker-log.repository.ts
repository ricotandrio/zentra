import Database from 'better-sqlite3';
import { IWorkerLogRepository } from '@/domain/repositories/worker-log.repository';
import { WorkerLog } from '@/domain/entities/worker-log';

export class SqliteWorkerLogRepository implements IWorkerLogRepository {
  constructor(private db: Database.Database) {}

  async add(log: WorkerLog): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO worker_logs (timestamp, level, message)
      VALUES (?, ?, ?)
    `);
    stmt.run(log.timestamp.toISOString(), log.level, log.message);
  }

  async getAll(): Promise<WorkerLog[]> {
    const stmt = this.db.prepare('SELECT id, timestamp, level, message FROM worker_logs ORDER BY timestamp DESC');
    const rows = stmt.all() as Array<{ id: number; timestamp: string; level: 'info' | 'error' | 'warn'; message: string }>;

    return rows.map(
      (row) => new WorkerLog(row.id, new Date(row.timestamp), row.level, row.message)
    );
  }
}
