import { createRuntime } from '@/shared/runtime';
import { startExpressApp } from '@/apps/api';
import { startBot } from '@/apps/bot';
import { createTickerManagementModule } from '@/modules/ticker-management';
import { createMarketAnalysisModule } from '@/modules/market-analysis';
import { createLlmModule } from '@/modules/llm';
import { createContentSummaryModule, ContentSummaryModule } from '@/modules/content-summary';
import { logging } from '@/shared/logger';

(async () => {
  const runtime = createRuntime();

  runtime.registerModule(createTickerManagementModule());
  runtime.registerModule(createMarketAnalysisModule());

  runtime.registerModule(createLlmModule());
  runtime.registerModule(createContentSummaryModule());

  const contentSummaryModule = runtime.modules.get('contentSummary') as ContentSummaryModule | undefined;
  await startBot(runtime, contentSummaryModule);
  startExpressApp(runtime);

  runtime.scheduler.start();

  logging.system.allStarted();

  process.on('SIGTERM', () => runtime.shutdown());
  process.on('SIGINT', () => runtime.shutdown());
})().catch((error) => {
  logging.system.startupFailed({ error });
  process.exit(1);
});
