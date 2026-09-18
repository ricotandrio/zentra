import { Module, Runtime } from '@/shared/runtime';
import { GeminiAdapter } from './infrastructure/gemini/gemini.adapter';
import { GenerateResponseUseCase } from './application/usecases/generate-response.usecase';
import { WebScraperAdapter } from './infrastructure/web-scraper/web-scraper.adapter';
import { SummarizeContentUseCase } from './application/usecases/summarize-content.usecase';
import { subscribeToGenerateResponseRequests, subscribeToSummarizeContentRequests } from './events';

export function createLlmModule(): Module {
  const scraperAdapter = new WebScraperAdapter();
  let unsubscribeRequested: (() => void) | null = null;
  let unsubscribeSummarizeRequested: (() => void) | null = null;

  return {
    register(runtime: Runtime) {
      const { apiKey, modelName } = runtime.config.llm;

      const geminiAdapter = new GeminiAdapter(apiKey, modelName);
      const generateUseCase = new GenerateResponseUseCase(geminiAdapter);
      const summarizeUseCase = new SummarizeContentUseCase(scraperAdapter, generateUseCase);

      unsubscribeRequested = subscribeToGenerateResponseRequests(runtime.eventBus, generateUseCase);
      unsubscribeSummarizeRequested = subscribeToSummarizeContentRequests(
        runtime.eventBus,
        summarizeUseCase
      );

      runtime.logging.llm.moduleInit();
    },

    async shutdown() {
      unsubscribeRequested?.();
      unsubscribeSummarizeRequested?.();
      await scraperAdapter.close();
    },
  };
}
