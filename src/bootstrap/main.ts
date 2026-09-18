import { createRuntime } from '@/shared/runtime';
import { startExpressApp } from '@/apps/api';
import { startBot } from '@/apps/bot';
import { createTickerManagementModule } from '@/modules/ticker-management';
import { createMarketAnalysisModule } from '@/modules/market-analysis';
import { createLlmModule } from '@/modules/llm';
import { createScheduledQueriesModule } from '@/modules/scheduled-queries';
import { YahooMarketDataAdapter } from '@/modules/market-analysis/infrastructure/yahoo';
import { MarketScraperAdapter } from '@/modules/market-analysis/infrastructure/data-sources';
import { logging } from '@/shared/logger';
import { generateTraceId } from '@/shared/utils';

(async () => {
  const runtime = createRuntime();

  const tickerManagementHandle = createTickerManagementModule();
  await runtime.registerModule(tickerManagementHandle);
  const tickerManagement = tickerManagementHandle.getService();

  await runtime.registerModule(createMarketAnalysisModule({
    tickerReader: {
      getTickers: () => tickerManagement.getTickersUseCase.execute(),
    },
    marketData: new YahooMarketDataAdapter(),
    marketSummary: new MarketScraperAdapter(),
  }));

  await runtime.registerModule(createLlmModule());

  const scheduledQueriesHandle = createScheduledQueriesModule();
  await runtime.registerModule(scheduledQueriesHandle);
  const scheduledQueries = scheduledQueriesHandle.getService();

  await startBot(runtime, {
    tickerManagement,
    scheduledQueries,
  });

  registerHeartbeatJob(runtime);

  startExpressApp(runtime.eventBus, runtime.config);

  runtime.scheduler.start();

  logging.system.allStarted();

  process.on('SIGTERM', () => runtime.shutdown());
  process.on('SIGINT', () => runtime.shutdown());
})().catch((error) => {
  logging.system.startupFailed({ error });
  process.exit(1);
});

function registerHeartbeatJob(runtime: ReturnType<typeof createRuntime>): void {
  const channelId = runtime.config.discord.standupChannelId;

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
