import { Logger } from 'pino';

export const createSchedulerLogger = (logger: Logger) => {
  return {
    started: (params: { schedule: string }) => {
      logger.info(
        { source: 'system', operation: 'market-analysis-scheduler-start', metadata: { schedule: params.schedule } },
        `Starting market analysis scheduler at ${params.schedule}`
      );
    },

    stopped: () => {
      logger.info(
        { source: 'system', operation: 'market-analysis-scheduler-stop' },
        'Market analysis scheduler stopped'
      );
    },

    jobFailed: (params: { jobName: string; error: unknown }) => {
      logger.error(
        { source: 'system', operation: 'scheduler-job', metadata: { jobName: params.jobName }, error: params.error },
        `[Scheduler] Job failed: ${params.jobName}`
      );
    },

    scheduledJobFailed: (params: { error: unknown }) => {
      logger.error(
        { source: 'system', operation: 'market-analysis-scheduler-job', error: params.error },
        'Scheduled market analysis job failed'
      );
    },
  };
};
