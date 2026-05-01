import { env } from '@/config';
import { getLogger } from '@/shared';
import { initDatabase } from '@/infrastructure/persistence/db/database';
import { SqliteTickerRepository } from '@/infrastructure/persistence/db/sqlite-ticker.repository';
import { MarketAnalysisScheduler } from '@/interfaces/worker/schedulers/market-analysis.scheduler';

const logger = getLogger();

const marketSummaryChannelId = env.DISCORD.DISCORD_STANDUP_CHANNEL_ID;
const webhookUrl = process.env.MARKET_ANALYSIS_WEBHOOK_URL;

if (!marketSummaryChannelId) {
  logger.error('Missing DISCORD_STANDUP_CHANNEL_ID environment variable');
  process.exit(1);
}

if (!webhookUrl) {
  logger.error('Missing MARKET_ANALYSIS_WEBHOOK_URL environment variable');
  logger.error('Example: http://localhost:3000/webhooks/market-results');
  process.exit(1);
}

// Initialize database and repository
const db = initDatabase();
const tickerRepository = new SqliteTickerRepository(db);

// Start market analysis scheduler (runs daily at 18 PM UTC)
const scheduler = new MarketAnalysisScheduler({
  logger,
  tickerRepository,
  channelId: marketSummaryChannelId,
  webhookUrl,
  schedule: '0 18 * * *', // Cron: 18 PM (6 PM) every day (UTC)
});

scheduler.start();

logger.info({ webhookUrl }, 'Worker started with market analysis scheduler');

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
