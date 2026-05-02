import Database from 'better-sqlite3';
import { EventLog } from '@/domain/entities/event-log';
import { IEventLogRepository } from '@/domain/repositories/event-log';

export class SqliteEventLogRepository implements IEventLogRepository {
  constructor(private db: Database.Database) {}

  async add(log: EventLog): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO event_logs (timestamp, event_type, payload)
      VALUES (?, ?, ?)
    `);
    stmt.run(log.timestamp.toISOString(), log.eventType, JSON.stringify(log.payload));
  }

  async getAll(): Promise<EventLog[]> {
    const stmt = this.db.prepare('SELECT id, timestamp, event_type, payload FROM event_logs ORDER BY timestamp DESC');
    const rows = stmt.all() as Array<{ id: number; timestamp: string; event_type: string; payload: string }>;

    return rows.map(
      (row) => new EventLog(row.id, new Date(row.timestamp), row.event_type, JSON.parse(row.payload))
    );
  }
}
