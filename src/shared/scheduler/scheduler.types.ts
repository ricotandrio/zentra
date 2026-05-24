export interface SchedulerJob {
  name: string;
  schedule: string;
  execute(): Promise<void>;
}
