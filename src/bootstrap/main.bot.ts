import { env } from '@/config';
import { getLogger } from '@/shared';
import { startBot } from '@/interfaces/bot';

const logger = getLogger();

const botToken = env.DISCORD.BOT_TOKEN;
const clientId = env.DISCORD.CLIENT_ID;
const guildId = env.DISCORD.GUILD_ID;
const standupChannelId = env.DISCORD.DISCORD_STANDUP_CHANNEL_ID;

if (!botToken || !clientId || !guildId || !standupChannelId) {
  logger.error('Missing required Discord environment variables');
  process.exit(1);
}

startBot(botToken, clientId, guildId, standupChannelId, logger);
