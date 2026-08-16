import { Module, Runtime } from '@/shared/runtime';
import { LlmModule } from '@/modules/llm';
import { WebScraperAdapter } from './infrastructure/web-scraper.adapter';
import { SummarizeContentUseCase } from './application/usecases/summarize-content.usecase';

export interface ContentSummaryModule {
  summarize: SummarizeContentUseCase;
}

export function createContentSummaryModule(): Module {
  const scraperAdapter = new WebScraperAdapter();

  return {
    register(runtime: Runtime) {
      const llmModule = runtime.modules.get('llm') as LlmModule | undefined;

      if (!llmModule) {
        throw new Error('LLM module must be registered before the content-summary module');
      }

      const summarizeUseCase = new SummarizeContentUseCase(
        scraperAdapter,
        llmModule.generate
      );

      runtime.modules.set('contentSummary', {
        summarize: summarizeUseCase,
      } satisfies ContentSummaryModule);

      runtime.logging.contentSummary.moduleInit();
    },

    async shutdown() {
      await scraperAdapter.close();
    },
  };
}
