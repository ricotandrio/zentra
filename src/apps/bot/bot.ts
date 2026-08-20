import { AutocompleteInteraction, ChatInputCommandInteraction, Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from 'discord.js';
import { handleNaturalLanguageMessage } from './handlers';
import * as ping from './commands/ping.command';
import * as addTicker from './commands/add-ticker.command';
import * as removeTicker from './commands/remove-ticker.command';
import * as listTickers from './commands/list-tickers.command';
import * as marketSummary from './commands/market-summary.command';
import * as summarize from './commands/summarize.command';
import { IEventBus } from '@/shared/event-bus';
import { LlmModule } from '@/modules/llm';
import { ContentSummaryModule } from '@/modules/content-summary';
import { registerMarketAnalysisSubscriber, registerMarketSummarySubscriber } from './subscribers';
import { TickerManagementModule } from '@/modules/ticker-management';
import { Runtime } from '@/shared/runtime';
import { env } from '@/shared/config';

export interface BotCommandWithDeps {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (
    interaction: ChatInputCommandInteraction,
    eventBus?: IEventBus,
    tickerManagementModule?: TickerManagementModule,
    contentSummaryModule?: ContentSummaryModule
  ) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export interface BotCommand extends BotCommandWithDeps {
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const allBotCommands: Record<string, BotCommandWithDeps> = {
  ping: ping as BotCommand,
  'add-ticker': addTicker as BotCommandWithDeps,
  'remove-ticker': removeTicker as BotCommandWithDeps,
  'list-tickers': listTickers as BotCommandWithDeps,
  'market-summary': marketSummary as BotCommandWithDeps,
  summarize: summarize as BotCommandWithDeps,
};

const commandFeatureFlags: Record<string, keyof typeof env.FEATURES> = {
  ping: 'COMMAND_PING',
  'add-ticker': 'COMMAND_ADD_TICKER',
  'remove-ticker': 'COMMAND_REMOVE_TICKER',
  'list-tickers': 'COMMAND_LIST_TICKERS',
  'market-summary': 'COMMAND_MARKET_SUMMARY',
  summarize: 'COMMAND_SUMMARIZE',
};

const getEnabledCommands = (runtime: Runtime): Record<string, BotCommandWithDeps> => {
  const features = runtime.config.FEATURES;
  return Object.fromEntries(
    Object.entries(allBotCommands).filter(([name]) => {
      const flag = commandFeatureFlags[name];
      return flag ? features[flag] : true;
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
  tickerManagementModule?: TickerManagementModule,
  contentSummaryModule?: ContentSummaryModule
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

    const llmModule = runtime.modules.get('llm') as LlmModule | undefined;
    await handleNaturalLanguageMessage(message, llmModule);
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = enabledCommands[interaction.commandName];
    if (!command) return;

    try {
      await command.execute(interaction, runtime.eventBus, tickerManagementModule, contentSummaryModule);
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
  contentSummaryModule?: ContentSummaryModule
): Promise<void> => {
  const tickerManagement = runtime.modules.get('tickerManagement') as TickerManagementModule | undefined;
  const { BOT_TOKEN, CLIENT_ID, GUILD_ID } = runtime.config.DISCORD;

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });

  const rest = new REST().setToken(BOT_TOKEN);

  await deployBot(rest, CLIENT_ID, GUILD_ID, runtime);

  registerHandlers(client, runtime, tickerManagement, contentSummaryModule);

  registerMarketAnalysisSubscriber(client, runtime.eventBus);
  registerMarketSummarySubscriber(client, runtime.eventBus);

  await client.login(BOT_TOKEN);
  runtime.logging.bot.startup();

  runtime.onShutdown(() => {
    client.destroy();
  });
};
