const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
};

const parseBool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  EXPRESS: {
    PORT: parseInt(process.env.EXPRESS_PORT || '3000'),
  },
  DISCORD: {
    BOT_TOKEN: requireEnv('DISCORD_BOT_TOKEN'),
    CLIENT_ID: requireEnv('DISCORD_CLIENT_ID'),
    GUILD_ID: requireEnv('DISCORD_GUILD_ID'),
    DISCORD_STANDUP_CHANNEL_ID: requireEnv('DISCORD_STANDUP_CHANNEL_ID'),
  },
  LLM: {
    API_KEY: requireEnv('LLM_API_KEY'),
    PROVIDER_NAME: (process.env.LLM_PROVIDER_NAME as 'openai' | 'gemini') || 'gemini',
    MODEL_NAME: requireEnv('LLM_MODEL_NAME') || 'gemini-2.0-flash',
  },
  POSTGRESQL: {
    URL: requireEnv('POSTGRESQL_URL'),
  },
  LOG: {
    HOT_ROTATE: parseInt(process.env.LOG_HOT_ROTATE || '3'),
    COLD_ROTATE: parseInt(process.env.LOG_COLD_ROTATE || '7'),
  },
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  FEATURES: {
    COMMAND_PING: parseBool(process.env.FEATURE_COMMAND_PING, true),
    COMMAND_ADD_TICKER: parseBool(process.env.FEATURE_COMMAND_ADD_TICKER, true),
    COMMAND_REMOVE_TICKER: parseBool(process.env.FEATURE_COMMAND_REMOVE_TICKER, true),
    COMMAND_LIST_TICKERS: parseBool(process.env.FEATURE_COMMAND_LIST_TICKERS, true),
    COMMAND_MARKET_SUMMARY: parseBool(process.env.FEATURE_COMMAND_MARKET_SUMMARY, true),
    COMMAND_SUMMARIZE: parseBool(process.env.FEATURE_COMMAND_SUMMARIZE, true),
    COMMAND_QUERIES: parseBool(process.env.FEATURE_COMMAND_QUERIES, true),
    COMMAND_USE_QUERY: parseBool(process.env.FEATURE_COMMAND_USE_QUERY, true),
  },
};

export const MARKET_SUMMARY_URL = requireEnv('TRADING_SUMMARY_URL');
