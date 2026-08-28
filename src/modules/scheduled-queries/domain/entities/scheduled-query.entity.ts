export class ScheduledQuery {
  constructor(
    readonly id: number,
    readonly name: string,
    readonly schedule: string | null,
    readonly sqlQuery: string,
    readonly enabled: boolean,
    readonly lastRunAt: Date | null,
    readonly nextRunAt: Date | null,
    readonly createdAt: Date,
    readonly updatedAt: Date
  ) {}
}
