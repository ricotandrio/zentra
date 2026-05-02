/**
 * Event Log Entity
 * Represents a log entry for events published on the event bus, stored in the database for persistence
 */
export class EventLog {
  constructor(
    readonly id: number,
    readonly timestamp: Date,
    readonly eventType: string,
    readonly payload: string
  ) {}

  static create(eventType: string, payload: any): EventLog {
    return new EventLog(0, new Date(), eventType, JSON.stringify(payload));
  }
}
