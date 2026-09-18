const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
};

const parseBool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
};

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',

  express: {
    port: parseInt(process.env.EXPRESS_PORT || '3000', 10),
  },

  discord: {
    botToken: requireEnv('DISCORD_BOT_TOKEN'),
    clientId: requireEnv('DISCORD_CLIENT_ID'),
    guildId: requireEnv('DISCORD_GUILD_ID'),
    standupChannelId: requireEnv('DISCORD_STANDUP_CHANNEL_ID'),
  },

  llm: {
    apiKey: requireEnv('LLM_API_KEY'),
    providerName: (process.env.LLM_PROVIDER_NAME || 'gemini') as
      | 'openai'
      | 'gemini',
    modelName: process.env.LLM_MODEL_NAME || 'gemini-2.5-flash',
  },

  postgresql: {
    url: requireEnv('POSTGRESQL_URL'),
  },

  log: {
    hotRotate: parseInt(process.env.LOG_HOT_ROTATE || '3', 10),
    coldRotate: parseInt(process.env.LOG_COLD_ROTATE || '7', 10),
  },

  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  },

  features: {
    commandPing: parseBool(process.env.FEATURE_COMMAND_PING, true),
    commandAddTicker: parseBool(process.env.FEATURE_COMMAND_ADD_TICKER, false),
    commandRemoveTicker: parseBool(process.env.FEATURE_COMMAND_REMOVE_TICKER,false
    ),
    commandListTickers: parseBool(process.env.FEATURE_COMMAND_LIST_TICKERS,false
    ),
    commandMarketSummary: parseBool(process.env.FEATURE_COMMAND_MARKET_SUMMARY,false
    ),
    commandSummarize: parseBool(process.env.FEATURE_COMMAND_SUMMARIZE,false
    ),
    commandQueries: parseBool(process.env.FEATURE_COMMAND_QUERIES,false
    ),
    commandUseQuery: parseBool(process.env.FEATURE_COMMAND_USE_QUERY,false
    ),
  },

  market: {
    summaryUrl: requireEnv('TRADING_SUMMARY_URL'),
  },
} as const;
