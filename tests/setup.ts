// Setup test environment variables
process.env.NODE_ENV = 'test';
process.env.EXPRESS_PORT = '3000';
process.env.DISCORD_BOT_TOKEN = 'test-token';
process.env.DISCORD_CLIENT_ID = 'test-client-id';
process.env.DISCORD_GUILD_ID = 'test-guild-id';
process.env.DISCORD_STANDUP_CHANNEL_ID = 'test-standup-channel-id';
process.env.LLM_API_KEY = 'test-llm-api-key';
process.env.LLM_PROVIDER_NAME = 'gemini';
process.env.LLM_MODEL_NAME = 'gemini-2.0-flash';
process.env.API_BASE_URL = 'http://localhost:3000';
process.env.TRADING_SUMMARY_URL = 'http://localhost:3000';
process.env.POSTGRESQL_URL = 'postgresql://user:password@localhost:5432/testdb';
