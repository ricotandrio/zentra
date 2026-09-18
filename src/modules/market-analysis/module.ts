import { Module, Runtime } from '@/shared/runtime';
import { AnalyzeTickersUseCase } from './application/usecases/analyze-tickers.usecase';
import { MarketSummaryUseCase } from './application/usecases/market-summary.usecase';
import { MarketDataPort, MarketSummaryPort, TickerReaderPort } from './application/contracts';
import { MarketAnalysisJob, MarketAnalysisJobDependencies } from './job';
import { MarketAnalysisSubscriber } from './subscriber';

export interface MarketAnalysisDependencies {
  tickerReader: TickerReaderPort;
  marketData: MarketDataPort;
  marketSummary: MarketSummaryPort;
}

export function createMarketAnalysisModule(dependencies: MarketAnalysisDependencies): Module {
  let unsubscribeFunctions: Array<() => void> = [];
  const analyzeTickersUseCase = new AnalyzeTickersUseCase(dependencies.marketData);
  const marketSummaryUseCase = new MarketSummaryUseCase(dependencies.marketSummary);

  return {
    async register(runtime: Runtime) {
      const channelId = runtime.config.discord.standupChannelId;
      await dependencies.marketSummary.initialize?.();

      const jobDependencies: MarketAnalysisJobDependencies = {
        eventBus: runtime.eventBus,
        channelId,
        tickerReader: dependencies.tickerReader,
        analyzeTickersUseCase,
        marketSummaryUseCase,
      };

      const job = new MarketAnalysisJob(jobDependencies);
      runtime.scheduler.register(job);

      const subscriber = new MarketAnalysisSubscriber(
        runtime.eventBus,
        channelId,
        jobDependencies
      );
      const { unsubscribeComplete, unsubscribeError, unsubscribeTrigger } = subscriber.subscribe();
      unsubscribeFunctions = [unsubscribeComplete, unsubscribeError, unsubscribeTrigger];
    },

    async shutdown() {
      for (const unsub of unsubscribeFunctions) {
        unsub();
      }
      await dependencies.marketSummary.close?.();
    },
  };
}
