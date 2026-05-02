import { env } from '@/config';
import { getLogger } from '@/shared';
import { initializeEventBus } from '@/shared/event-bus';
import { initDatabase } from '@/infrastructure/persistence/db/database';
import { SqliteTickerRepository } from '@/infrastructure/persistence/db/sqlite-ticker.repository';
import { MarketAnalysisScheduler } from '@/interfaces/worker/market-analysis';

const logger = getLogger();

// Initialize event bus early
const eventBus = initializeEventBus();
logger.info('Event bus initialized');

const marketSummaryChannelId = env.DISCORD.DISCORD_STANDUP_CHANNEL_ID;

if (!marketSummaryChannelId) {
  logger.error('Missing DISCORD_STANDUP_CHANNEL_ID environment variable');
  process.exit(1);
}

// Initialize database and repository
const db = initDatabase();
logger.info('Database initialized');

const tickerRepository = new SqliteTickerRepository(db);

const scheduler = new MarketAnalysisScheduler({
  logger,
  tickerRepository,
  channelId: marketSummaryChannelId,
  eventBus,
});
logger.info('Market analysis scheduler initialized with daily 6 PM schedule');

scheduler.start();

logger.info({ eventBus: 'initialized' }, 'Worker started with market analysis scheduler');

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  scheduler.stop();
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  scheduler.stop();
  db.close();
  process.exit(0);
});
