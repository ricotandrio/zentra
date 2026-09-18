import { ModuleHandle, Runtime } from '@/shared/runtime';
import { LlmModule } from '@/modules/llm';
import { WebScraperAdapter } from './infrastructure/web-scraper.adapter';
import { SummarizeContentUseCase } from './application/usecases/summarize-content.usecase';

export interface ContentSummaryModule {
  summarize: SummarizeContentUseCase;
}

export function createContentSummaryModule(llmModule: LlmModule): ModuleHandle<ContentSummaryModule> {
  const scraperAdapter = new WebScraperAdapter();
  let service: ContentSummaryModule | null = null;

  return {
    getService() {
      if (!service) throw new Error('Content summary module is not registered');
      return service;
    },

    register(runtime: Runtime) {
      const summarizeUseCase = new SummarizeContentUseCase(
        scraperAdapter,
        llmModule.generate
      );

      service = {
        summarize: summarizeUseCase,
      };

      runtime.logging.contentSummary.moduleInit();
    },

    async shutdown() {
      await scraperAdapter.close();
    },
  };
}
