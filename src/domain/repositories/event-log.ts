import { EventLog } from '../entities/event-log';

export interface IEventLogRepository {
  /**
   * Add a new event log entry to the database
   */
  add(log: EventLog): Promise<void>;

  /**
   * Get all event log entries from the database
   */
  getAll(): Promise<EventLog[]>;
}
