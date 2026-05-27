import { AutocompleteInteraction, ChatInputCommandInteraction, Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from 'discord.js';
import { handleNaturalLanguageMessage } from './handlers';
import * as ping from './commands/ping.command';
import * as addTicker from './commands/add-ticker.command';
import * as removeTicker from './commands/remove-ticker.command';
import * as listTickers from './commands/list-tickers.command';
import * as marketSummary from './commands/market-summary.command';
import { IEventBus } from '@/shared/event-bus';
import { registerMarketAnalysisSubscriber, registerMarketSummarySubscriber } from './subscribers';
import { TickerManagementModule } from '@/modules/ticker-management';
import { logger } from '@/shared/logger';

export interface BotCommandWithDeps {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (
    interaction: ChatInputCommandInteraction,
    eventBus?: IEventBus,
    tickerManagementModule?: TickerManagementModule
  ) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export interface BotCommand extends BotCommandWithDeps {
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const botCommands: Record<string, BotCommandWithDeps> = {
  ping: ping as BotCommand,
  'add-ticker': addTicker as BotCommandWithDeps,
  'remove-ticker': removeTicker as BotCommandWithDeps,
  'list-tickers': listTickers as BotCommandWithDeps,
  'market-summary': marketSummary as BotCommandWithDeps,
};

export const deployBot = async (
  rest: REST,
  clientId: string,
  guildId: string
) => {
  try {
    const body = Object
      .values(botCommands)
      .filter(cmd => {
        if (!cmd || !cmd.data) {
          logger.error({
            source: 'bot',
            operation: 'deploy-commands',
            error: 'Invalid command detected',
            metadata: { cmd },
          }, 'Invalid command detected');
          return false;
        }
        return true;
      })
      .map(cmd => cmd.data.toJSON());

    if (body.length === 0) {
      logger.warn({
        source: 'bot',
        operation: 'deploy-commands',
      }, 'No bot commands to deploy');
      return;
    }

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body }
    );

    logger.info({
      source: 'bot',
      operation: 'deploy-commands',
      metadata: { commandCount: body.length },
    }, `Slash commands registered successfully (${body.length} commands)`);
  } catch (error) {
    logger.error({
      source: 'bot',
      operation: 'deploy-commands',
      error,
    }, 'Error deploying bot commands');
  }
};

const registerHandlers = (
  client: Client,
  eventBus?: IEventBus,
  tickerManagementModule?: TickerManagementModule
) => {
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

    await handleNaturalLanguageMessage(message, eventBus);
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = botCommands[interaction.commandName];
    if (!command) return;

    try {
      await command.execute(interaction, eventBus, tickerManagementModule);
    } catch (error) {
      logger.error({
        source: 'bot',
        operation: 'execute-command',
        metadata: { commandName: interaction.commandName },
        error,
      }, `Error executing command: ${interaction.commandName}`);
      const errorMessage = '❌ An unexpected error occurred while executing this command.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  });

  client.once('clientReady', () => {
    logger.info({
      source: 'bot',
      operation: 'login',
      metadata: { tag: client.user?.tag },
    }, `Bot logged in as ${client.user?.tag}`);
  });

  client.on('error', (error) => {
    logger.error({
      source: 'bot',
      operation: 'client-error',
      error,
    }, 'Discord client error');
  });
};

export const startBot = async (
  botToken: string,
  clientId: string,
  guildId: string,
  standupChannelId: string,
  eventBus?: IEventBus,
  tickerManagementModule?: TickerManagementModule
): Promise<Client> => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });

  const rest = new REST().setToken(botToken);

  await deployBot(rest, clientId, guildId);

  registerHandlers(client, eventBus, tickerManagementModule);

  // Register event bus subscribers for market analysis and summary delivery
  if (eventBus) {
    registerMarketAnalysisSubscriber(client, eventBus);
    registerMarketSummarySubscriber(client, eventBus);
  }

  await client.login(botToken);
  logger.info({
    source: 'bot',
    operation: 'startup',
  }, 'Discord bot started');

  return client;
};
