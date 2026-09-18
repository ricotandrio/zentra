import { AutocompleteInteraction, ChatInputCommandInteraction, Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from 'discord.js';
import { handleNaturalLanguageMessage } from './handlers';
import * as ping from './commands/general/ping.command';
import * as addTicker from './commands/watchlist/add-ticker.command';
import * as removeTicker from './commands/watchlist/remove-ticker.command';
import * as listTickers from './commands/watchlist/list-tickers.command';
import * as marketSummary from './commands/market/market-summary.command';
import * as summarize from './commands/content/summarize.command';
import * as queries from './commands/queries/queries.command';
import * as useQuery from './commands/queries/use-query.command';
import { IEventBus } from '@/shared/event-bus';
import { ScheduledQueriesModule } from '@/modules/scheduled-queries';
import { createLlmResponseSubscriber, registerHeartbeatSubscriber, registerMarketAnalysisSubscriber, registerMarketSummarySubscriber } from './subscribers';
import { TickerManagementModule } from '@/modules/ticker-management';
import { Runtime } from '@/shared/runtime';
import { config } from '@/shared/config';

export interface BotCommandWithDeps {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (
    interaction: ChatInputCommandInteraction,
    eventBus?: IEventBus,
    tickerManagementModule?: TickerManagementModule,
    scheduledQueriesModule?: ScheduledQueriesModule
  ) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export interface BotCommand extends BotCommandWithDeps {
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface BotDependencies {
  tickerManagement: TickerManagementModule;
  scheduledQueries: ScheduledQueriesModule;
}

const allBotCommands: Record<string, BotCommandWithDeps> = {
  ping: ping as BotCommand,
  'add-ticker': addTicker as BotCommandWithDeps,
  'remove-ticker': removeTicker as BotCommandWithDeps,
  'list-tickers': listTickers as BotCommandWithDeps,
  'market-summary': marketSummary as BotCommandWithDeps,
  summarize: summarize as BotCommandWithDeps,
  queries: queries as BotCommandWithDeps,
  'use-query': useQuery as BotCommandWithDeps,
};

const commandFeatureFlags: Record<string, keyof typeof config.features> = {
  ping: 'commandPing',
  'add-ticker': 'commandAddTicker',
  'remove-ticker': 'commandRemoveTicker',
  'list-tickers': 'commandListTickers',
  'market-summary': 'commandMarketSummary',
  summarize: 'commandSummarize',
  queries: 'commandQueries',
  'use-query': 'commandUseQuery',
};

const getEnabledCommands = (runtime: Runtime): Record<string, BotCommandWithDeps> => {
  const features = runtime.config.features;
  return Object.fromEntries(
    Object.entries(allBotCommands).filter(([commandName]) => {
      const featureFlag = commandFeatureFlags[commandName];
      return featureFlag ? features[featureFlag] : true;
    })
  );
};

export const deployBot = async (
  rest: REST,
  clientId: string,
  guildId: string,
  runtime: Runtime
) => {
  try {
    const enabledCommands = getEnabledCommands(runtime);

    const body = Object
      .values(enabledCommands)
      .filter(cmd => {
        if (!cmd || !cmd.data) {
          runtime.logging.bot.deployCommandsInvalidCommand({ cmd });
          return false;
        }
        return true;
      })
      .map(cmd => cmd.data.toJSON());

    if (body.length === 0) {
      runtime.logging.bot.deployCommandsNoCommands();
      return;
    }

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body }
    );

    runtime.logging.bot.deployCommands({ commandCount: body.length });
  } catch (error) {
    runtime.logging.bot.deployCommandsFailed({ error });
  }
};

const registerHandlers = (
  client: Client,
  runtime: Runtime,
  dependencies: BotDependencies
) => {
  const enabledCommands = getEnabledCommands(runtime);

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

    await handleNaturalLanguageMessage(message, runtime.eventBus);
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = enabledCommands[interaction.commandName];
    if (!command) return;

    try {
      await command.execute(
        interaction,
        runtime.eventBus,
        dependencies.tickerManagement,
        dependencies.scheduledQueries
      );
    } catch (error) {
      runtime.logging.bot.commandFailed({ commandName: interaction.commandName, error });
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
      runtime.logging.bot.login({ tag });
    }
  });

  client.on('error', (error) => {
    runtime.logging.bot.clientError({ error });
  });
};

export const startBot = async (
  runtime: Runtime,
  dependencies: BotDependencies
): Promise<void> => {
  const { botToken, clientId, guildId } = runtime.config.discord;

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });

  const rest = new REST().setToken(botToken);
  const responseSubscriber = createLlmResponseSubscriber(runtime.eventBus, client);

  await deployBot(rest, clientId, guildId, runtime);

  registerHandlers(client, runtime, dependencies);

  registerMarketAnalysisSubscriber(client, runtime.eventBus);
  registerMarketSummarySubscriber(client, runtime.eventBus);
  registerHeartbeatSubscriber(client, runtime.eventBus);

  await client.login(botToken);
  runtime.logging.bot.startup();

  runtime.onShutdown(() => {
    responseSubscriber.unsubscribe();
    client.destroy();
  });
};
