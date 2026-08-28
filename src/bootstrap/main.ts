import { createRuntime } from '@/shared/runtime';
import { startExpressApp } from '@/apps/api';
import { startBot } from '@/apps/bot';
import { createTickerManagementModule } from '@/modules/ticker-management';
import { createMarketAnalysisModule } from '@/modules/market-analysis';
import { createLlmModule } from '@/modules/llm';
import { createContentSummaryModule, ContentSummaryModule } from '@/modules/content-summary';
import { createScheduledQueriesModule } from '@/modules/scheduled-queries';
import { logging } from '@/shared/logger';
import { generateTraceId } from '@/shared/utils';

(async () => {
  const runtime = createRuntime();

  await runtime.registerModule(createTickerManagementModule());
  await runtime.registerModule(createMarketAnalysisModule());

  await runtime.registerModule(createLlmModule());
  await runtime.registerModule(createContentSummaryModule());
  await runtime.registerModule(createScheduledQueriesModule());

  const contentSummaryModule = runtime.modules.get('contentSummary') as ContentSummaryModule | undefined;
  await startBot(runtime, contentSummaryModule);

  registerHeartbeatJob(runtime);

  startExpressApp(runtime);

  runtime.scheduler.start();

  logging.system.allStarted();

  process.on('SIGTERM', () => runtime.shutdown());
  process.on('SIGINT', () => runtime.shutdown());
})().catch((error) => {
  logging.system.startupFailed({ error });
  process.exit(1);
});

function registerHeartbeatJob(runtime: ReturnType<typeof createRuntime>): void {
  const channelId = runtime.config.DISCORD.DISCORD_STANDUP_CHANNEL_ID;

  runtime.scheduler.register({
    name: 'heartbeat',
    schedule: '*/30 * * * *',
    execute: async () => {
      const traceId = generateTraceId();
      await runtime.eventBus.publish({
        type: 'heartbeat:tick',
        source: 'worker',
        timestamp: new Date(),
        traceId,
        data: {
          channelId,
          timestamp: new Date().toISOString(),
        },
      });
    },
  });
}
