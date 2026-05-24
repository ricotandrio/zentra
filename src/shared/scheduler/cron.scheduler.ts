import cron from 'node-cron';
import { SchedulerJob } from './scheduler.types';

export class CronScheduler {
  private tasks = new Map<string, cron.ScheduledTask>();

  register(job: SchedulerJob): void {
    const task = cron.schedule(job.schedule, async () => {
      try {
        await job.execute();
      } catch (error) {
        console.error(`[Scheduler] ${job.name} failed`, error);
      }
    });

    this.tasks.set(job.name, task);
  }

  stop(name: string): void {
    this.tasks.get(name)?.stop();
  }

  stopAll(): void {
    this.tasks.forEach((task) => task.stop());
  }
}
