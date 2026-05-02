/**
 * Worker Log Entity
 * Represents a log entry for worker activities, stored in the database for persistence
 */
export class WorkerLog {
  constructor(
    readonly id: number,
    readonly timestamp: Date,
    readonly level: 'info' | 'error' | 'warn',
    readonly message: string
  ) {}

  static create(level: 'info' | 'error' | 'warn', message: string): WorkerLog {
    return new WorkerLog(0, new Date(), level, message);
  }
}
