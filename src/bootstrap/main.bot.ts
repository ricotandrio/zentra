import { env } from '@/config';
import { getLogger, initializeEventBus } from '@/shared';
import { startBot } from '@/interfaces/bot';
import { initDatabase } from '@/infrastructure/persistence/db/database';
import { SqliteTickerRepository } from '@/infrastructure/persistence/db/sqlite-ticker.repository';

const logger = getLogger();

// Initialize event bus early
const eventBus = initializeEventBus();
logger.info('Event bus initialized');

const botToken = env.DISCORD.BOT_TOKEN;
const clientId = env.DISCORD.CLIENT_ID;
const guildId = env.DISCORD.GUILD_ID;
const standupChannelId = env.DISCORD.DISCORD_STANDUP_CHANNEL_ID;

if (!botToken || !clientId || !guildId || !standupChannelId) {
  logger.error('Missing required Discord environment variables');
  process.exit(1);
}

// Initialize database and repository
const db = initDatabase();
const tickerRepository = new SqliteTickerRepository(db);

startBot(botToken, clientId, guildId, standupChannelId, logger, tickerRepository, eventBus);
