import { AutocompleteInteraction, ChatInputCommandInteraction, Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from 'discord.js';
import { Logger } from 'pino';
import { handleNaturalLanguageMessage } from './handlers';
import * as ping from './commands';

export interface BotCommand {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export const botCommands: Record<string, BotCommand> = {
  ping,
};

export const deployBot = async (
  rest: REST,
  clientId: string,
  guildId: string,
  logger: Logger
) => {
  try {
    const body = Object.values(botCommands).map((cmd) => cmd.data.toJSON());

    if (body.length === 0) {
      logger.warn('No bot commands to deploy');
      return;
    }

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body }
    );

    logger.info(
      { count: body.length },
      'Slash commands registered successfully'
    );
  } catch (error) {
    logger.error(error, 'Error deploying bot commands');
  }
};

const registerHandlers = (client: Client, logger: Logger) => {
  client.on('messageCreate', async (message) => {
    if (
      message.author.bot ||
      !message.mentions.has(message.client.user.id!) ||
      !message.guild
    ) return;

    const content = message.content.replace(/<@!?(\d+)>/, '').trim();

    if (!content) {
      await message.reply('Hey! How can I help you today? Just mention me followed by your message.');
      return;
    }

    await handleNaturalLanguageMessage(message, logger);
  });

  client.once('ready', () => {
    logger.info(`Bot logged in as ${client.user?.tag}`);
  });

  client.on('error', (error) => {
    logger.error(error, 'Discord client error');
  });
};

export const startBot = async (
  botToken: string,
  clientId: string,
  guildId: string,
  standupChannelId: string,
  logger: Logger
) => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });

  const rest = new REST().setToken(botToken);

  await deployBot(rest, clientId, guildId, logger);

  registerHandlers(client, logger);

  await client.login(botToken);
  logger.info('Discord bot started');
};
