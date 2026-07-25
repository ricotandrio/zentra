import { Module, Runtime } from '@/shared/runtime';
import { TickerManagementModule } from '@/modules/ticker-management';
import { MarketAnalysisJob } from './job';
import { MarketAnalysisSubscriber } from './subscriber';

export function createMarketAnalysisModule(): Module {
  let unsubscribeFunctions: Array<() => void> = [];

  return {
    register(runtime: Runtime) {
      const channelId = runtime.config.DISCORD.DISCORD_STANDUP_CHANNEL_ID;
      const tickerManagement = runtime.modules.get('tickerManagement') as TickerManagementModule;

      const job = new MarketAnalysisJob({
        eventBus: runtime.eventBus,
        channelId,
        tickerManagementModule: tickerManagement,
        traceId: '',
      });
      runtime.scheduler.register(job);

      const subscriber = new MarketAnalysisSubscriber(
        runtime.eventBus,
        channelId,
        tickerManagement
      );
      const { unsubscribeComplete, unsubscribeError, unsubscribeTrigger } = subscriber.subscribe();
      unsubscribeFunctions = [unsubscribeComplete, unsubscribeError, unsubscribeTrigger];
    },

    shutdown() {
      for (const unsub of unsubscribeFunctions) {
        unsub();
      }
    },
  };
}
