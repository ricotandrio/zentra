import { Client } from 'discord.js';
import { env } from '@/shared/config';
import { logging } from '@/shared/logger';
import { rotateLogs } from '@/shared/logger/log-rotate';
import { startExpressApp } from '@/apps/api';
import { startBot } from '@/apps/bot';
import { MarketAnalysisJob, MarketAnalysisSubscriber } from '@/modules/market-analysis';
import { createTickerManagementModule } from '@/modules/ticker-management';
import { initializeEventBus } from '@/shared/event-bus';
import { Scheduler } from '@/shared/scheduler';


/**
 * Shared dependencies initialization
 */
const eventBus = initializeEventBus();
logging.system.componentInitialized({ component: 'Event bus' });

const tickerManagementModule = createTickerManagementModule();
logging.system.componentInitialized({ component: 'Ticker management module' });

const scheduler = new Scheduler();
logging.system.componentInitialized({ component: 'Scheduler' });

let discordClient: Client;

/**
 * Main application entry point
 */
(async () => {
  const botToken = env.DISCORD.BOT_TOKEN;
  const clientId = env.DISCORD.CLIENT_ID;
  const guildId = env.DISCORD.GUILD_ID;
  const channelId = env.DISCORD.DISCORD_STANDUP_CHANNEL_ID;

  discordClient = await startBot(
    botToken,
    clientId,
    guildId,
    channelId,
    eventBus,
    tickerManagementModule
  );
  logging.system.componentInitialized({ component: 'Discord bot' });

  startExpressApp(env.EXPRESS.PORT, eventBus);
  logging.system.componentInitialized({ component: 'Express API server' });

  const marketAnalysisJob = new MarketAnalysisJob({
    eventBus,
    channelId,
    traceId: '',
    tickerManagementModule,
  });

  scheduler.register(marketAnalysisJob);
  logging.system.componentInitialized({ component: 'Market analysis scheduler' });

  const subscriber = new MarketAnalysisSubscriber(
    eventBus,
    channelId,
    tickerManagementModule
  );
  logging.system.componentInitialized({ component: 'Market analysis subscriber' });

  subscriber.subscribe();

  rotateLogs(env.LOG.HOT_ROTATE, env.LOG.COLD_ROTATE);

  scheduler.register({
    name: 'log-rotation',
    schedule: '0 0 * * *',
    execute: async () => {
      rotateLogs(env.LOG.HOT_ROTATE, env.LOG.COLD_ROTATE);
    },
  });

  logging.system.allStarted();
})().catch((error) => {
  logging.system.startupFailed({ error });
  process.exit(1);
});


/**
 * Graceful shutdown handling
 */
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  logging.system.shutdown();
  discordClient.destroy();
  tickerManagementModule.closeDb();
  process.exit(0);
}
