import { createRuntime } from '@/shared/runtime';
import { startExpressApp } from '@/apps/api';
import { startBot } from '@/apps/bot';
import { createTickerManagementModule } from '@/modules/ticker-management';
import { createMarketAnalysisModule } from '@/modules/market-analysis';
import { createLlmModule } from '@/modules/llm';
import { logging } from '@/shared/logger';

(async () => {
  const runtime = createRuntime();

  runtime.registerModule(createTickerManagementModule());
  runtime.registerModule(createMarketAnalysisModule());

  runtime.registerModule(createLlmModule());

  await startBot(runtime);
  startExpressApp(runtime);

  runtime.scheduler.start();

  logging.system.allStarted();

  process.on('SIGTERM', () => runtime.shutdown());
  process.on('SIGINT', () => runtime.shutdown());
})().catch((error) => {
  logging.system.startupFailed({ error });
  process.exit(1);
});
