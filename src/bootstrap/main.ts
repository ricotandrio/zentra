import { Client } from 'discord.js';
import { env } from '@/config';
import { getLogger, initializeEventBus } from '@/shared';
import { startExpressApp } from '@/interfaces/api';
import { startBot } from '@/interfaces/bot';
import { initDatabase } from '@/infrastructure/persistence/db/database';
import { SqliteTickerRepository } from '@/infrastructure/persistence/db/sqlite-ticker.repository';
import { MarketAnalysisScheduler, MarketAnalysisSubscriber } from '@/interfaces/worker/market-analysis';


/**
 * Shared dependencies initialization
 */
const logger = getLogger();
logger.info('Logger initialized');

const eventBus = initializeEventBus();
logger.info('Event bus initialized');

const db = initDatabase();
logger.info('Database initialized');

const tickerRepository = new SqliteTickerRepository(db);
logger.info('Ticker repository initialized');

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
    tickerRepository,
    eventBus
  );
  logger.info('Discord bot started');

  startExpressApp(env.EXPRESS.PORT, logger, discordClient, eventBus);
  logger.info('Express API server started');

  const scheduler = new MarketAnalysisScheduler({
    logger,
    tickerRepository,
    channelId,
    eventBus,
  });
  logger.info('Market analysis scheduler initialized');

  const subscriber = new MarketAnalysisSubscriber(
    eventBus,
    logger,
    tickerRepository,
    channelId
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
  db.close();
  process.exit(0);
}
