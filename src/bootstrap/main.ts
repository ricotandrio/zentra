import { Client } from 'discord.js';
import { env } from '@/config';
import { logger } from '@/shared/logger';
import { startExpressApp } from '@/apps/api';
import { startBot } from '@/apps/bot';
import { MarketAnalysisScheduler, MarketAnalysisSubscriber } from '@/modules/market-analysis';
import { createTickerManagementModule } from '@/modules/ticker-management';
import { initializeEventBus } from '@/shared/event-bus';


/**
 * Shared dependencies initialization
 */
const eventBus = initializeEventBus();
logger.info('Event bus initialized');

const tickerManagementModule = createTickerManagementModule();
logger.info('Ticker management module initialized');

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
    logger,
    eventBus,
    tickerManagementModule
  );
  logger.info('Discord bot started');

  startExpressApp(env.EXPRESS.PORT, logger, discordClient, eventBus);
  logger.info('Express API server started');

  const scheduler = new MarketAnalysisScheduler({
    logger,
    channelId,
    eventBus,
    tickerManagementModule,
  });
  logger.info('Market analysis scheduler initialized');

  const subscriber = new MarketAnalysisSubscriber(
    eventBus,
    logger,
    channelId,
    tickerManagementModule
  );
  logger.info('Market analysis subscriber initialized');

  subscriber.subscribe();
  scheduler.start();

  logger.info('All systems started (API + Bot + Worker)');
})().catch((error) => {
  logger.error(error, 'Failed to start application');
  process.exit(1);
});


/**
 * Graceful shutdown handling
 */
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  logger.info('Shutting down...');
  discordClient.destroy();
  tickerManagementModule.closeDb();
  process.exit(0);
}
