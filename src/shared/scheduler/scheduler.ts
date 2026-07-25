import cron, { ScheduledTask } from 'node-cron';

import { SchedulerJob } from './scheduler.types';
import { logging } from '@/shared/logger';

export class Scheduler {
  private pendingJobs: SchedulerJob[] = [];
  private tasks = new Map<string, ScheduledTask>();

  register(job: SchedulerJob): void {
    if (this._started) {
      this.startJob(job);
    } else {
      this.pendingJobs.push(job);
    }
  }

  start(): void {
    for (const job of this.pendingJobs) {
      this.startJob(job);
    }
    this.pendingJobs = [];
    this._started = true;
  }

  private _started = false;

  private startJob(job: SchedulerJob): void {
    const task = cron.schedule(
      job.schedule,
      async () => {
        try {
          await job.execute();
        } catch (error) {
          logging.scheduler.jobFailed({ jobName: job.name, error });
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
