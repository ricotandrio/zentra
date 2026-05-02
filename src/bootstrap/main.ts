import { Client } from 'discord.js';
import { env } from '@/config';
import { getLogger, initializeEventBus } from '@/shared';
import { startExpressApp } from '@/interfaces/api';
import { startBot } from '@/interfaces/bot';
import { initDatabase } from '@/infrastructure/persistence/db/database';
import { SqliteTickerRepository } from '@/infrastructure/persistence/db/sqlite-ticker.repository';
import { MarketAnalysisScheduler, MarketAnalysisSubscriber } from '@/interfaces/worker/market-analysis';

const logger = getLogger();

// -----------------------------
// INIT SHARED DEPENDENCIES
// -----------------------------

const eventBus = initializeEventBus();
logger.info('Event bus initialized');

const db = initDatabase();
logger.info('Database initialized');

const tickerRepository = new SqliteTickerRepository(db);

// -----------------------------
// DISCORD CLIENT (shared)
// -----------------------------

const botToken = env.DISCORD.BOT_TOKEN;
const clientId = env.DISCORD.CLIENT_ID;
const guildId = env.DISCORD.GUILD_ID;
const channelId = env.DISCORD.DISCORD_STANDUP_CHANNEL_ID;

if (!botToken || !clientId || !guildId || !channelId) {
  logger.error('Missing required Discord environment variables');
  process.exit(1);
}

// const discordClient = new Client({
//   intents: [GatewayIntentBits.Guilds],
// });

// discordClient.once('clientReady', () => {
//   logger.info(`Discord ready as ${discordClient.user?.tag}`);
// });

// discordClient.on('error', (error) => {
//   logger.error(error, 'Discord client error');
// });

// -----------------------------
// START EVERYTHING
// -----------------------------

let discordClient: Client;

(async () => {
  discordClient = await startBot(
    botToken,
    clientId,
    guildId,
    channelId,
    logger,
    tickerRepository,
    eventBus
  );

  startExpressApp(env.EXPRESS.PORT, logger, discordClient, eventBus);

  const scheduler = new MarketAnalysisScheduler({
    logger,
    tickerRepository,
    channelId,
    eventBus,
  });

  const subscriber = new MarketAnalysisSubscriber(
    eventBus,
    logger,
    tickerRepository,
    channelId
  );

  subscriber.subscribe();
  scheduler.start();

  logger.info('All systems started (API + Bot + Worker)');
})().catch((error) => {
  logger.error(error, 'Failed to start application');
  process.exit(1);
});

// -----------------------------
// GRACEFUL SHUTDOWN
// -----------------------------

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  logger.info('Shutting down...');
  discordClient.destroy();
  db.close();
  process.exit(0);
}
