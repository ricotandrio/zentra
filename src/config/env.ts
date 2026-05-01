const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
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
    PROVIDER_NAME: (process.env.LLM_PROVIDER_NAME as 'openai' | 'gemini'),
    MODEL_NAME: requireEnv('LLM_MODEL_NAME'),
  },
  GITHUB: {
    PERSONAL_ACCESS_TOKEN: requireEnv('GITHUB_PERSONAL_ACCESS_TOKEN'),
    OWNER: requireEnv('GITHUB_OWNER_USERNAME'),
    REPO: requireEnv('GITHUB_REPOSITORY_NAME'),
  },
};
