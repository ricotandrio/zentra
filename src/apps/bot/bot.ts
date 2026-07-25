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
import { logging } from '@/shared/logger';

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
          logging.bot.deployCommandsInvalidCommand({ cmd });
          return false;
        }
        return true;
      })
      .map(cmd => cmd.data.toJSON());

    if (body.length === 0) {
      logging.bot.deployCommandsNoCommands();
      return;
    }

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body }
    );

    logging.bot.deployCommands({ commandCount: body.length });
  } catch (error) {
    logging.bot.deployCommandsFailed({ error });
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
      logging.bot.commandFailed({ commandName: interaction.commandName, error });
      const errorMessage = '❌ An unexpected error occurred while executing this command.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  });

  client.once('clientReady', () => {
    const tag = client.user?.tag;
    if (tag) {
      logging.bot.login({ tag });
    }
  });

  client.on('error', (error) => {
    logging.bot.clientError({ error });
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
  logging.bot.startup();

  return client;
};
