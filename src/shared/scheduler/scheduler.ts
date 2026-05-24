import cron, { ScheduledTask } from 'node-cron';

import { SchedulerJob } from './scheduler.types';

export class Scheduler {
  private tasks = new Map<string, ScheduledTask>();

  register(job: SchedulerJob): void {
    const task = cron.schedule(
      job.schedule,
      async () => {
        try {
          await job.execute();
        } catch (error) {
          console.error(
            `[Scheduler] Job failed: ${job.name}`,
            error
          );
        }
      }
    );

    this.tasks.set(job.name, task);
  }

  stop(name: string): void {
    this.tasks.get(name)?.stop();
  }

  stopAll(): void {
    this.tasks.forEach((task) => task.stop());
  }
}
