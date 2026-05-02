import { Client, GatewayIntentBits } from 'discord.js';
import { env } from '@/config';
import { startExpressApp } from '@/interfaces/api';
import { getLogger, initializeEventBus } from '@/shared';

const logger = getLogger();
const PORT = env.EXPRESS.PORT;
const botToken = env.DISCORD.BOT_TOKEN;

if (!botToken) {
  logger.error('Missing DISCORD_BOT_TOKEN environment variable');
  process.exit(1);
}

// Initialize event bus early
const eventBus = initializeEventBus();
logger.info('Event bus initialized');

// Initialize Discord client for webhook delivery
const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds],
});

discordClient.once('clientReady', () => {
  logger.info(`API Discord client ready as ${discordClient.user?.tag}`);
});

discordClient.on('error', (error) => {
  logger.error(error, 'Discord client error');
});

// Login and start API
(async () => {
  await discordClient.login(botToken);
  startExpressApp(PORT, logger, discordClient, eventBus);
})().catch((error) => {
  logger.error(error, 'Failed to start API');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  discordClient.destroy();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  discordClient.destroy();
  process.exit(0);
});
