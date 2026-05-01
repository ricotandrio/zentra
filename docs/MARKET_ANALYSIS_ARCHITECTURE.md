# Market Analysis Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ZENTRA SYSTEM                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                      DISCORD SERVER                                    │
│                                                                        │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────┐  │
│  │  #market-summary     │  │  User Issues Chat    │  │  Bot Events  │  │
│  │  (Results delivered  │  │  (Handled via API)   │  │  (Webhooks)  │  │
│  │   via webhook)       │  │                      │  │              │  │
│  └──────────────────────┘  └──────────────────────┘  └──────────────┘  │
│                                                                        │
└─────────────────┬───────────────────────────────────────────────┬──────┘
                  │ Discord.js API calls                          │
                  │ (send messages)                               │
                  │                                               │
                  ▼                                               ▼
        ┌─────────────────────┐                         ┌─────────────────────┐
        │  API SERVICE        │                         │  BOT SERVICE        │
        │  Port: 3000         │                         │  Real-time events   │
        │                     │                         │                     │
        │ ┌─────────────────┐ │                         │ ┌─────────────────┐ │
        │ │ Discord Client  │ │                         │ │ Discord Client  │ │
        │ │ (webhook only)  │ │                         │ │ (full access)   │ │
        │ └────────┬────────┘ │                         │ └────────┬────────┘ │
        │          │          │                         │          │          │
        │ ┌────────▼──────────────────────────────────┐ │          │          │
        │ │  POST /webhooks/market-results            │ │  Commands:          │
        │ │  ├── Validate payload                     │ │  ├── /add-ticker    │
        │ │  ├── Create Discord embeds                │ │  ├── /list-tickers  │
        │ │  └── Send to Discord channel              │ │  └── /market-summary│
        │ │                                           │ │                     │
        │ └───────────────────────────────────────────┘ │                     │
        │                                               │                     │
        │  Dependencies:                                │  Dependencies:      │
        │  • Express.js                                 │ • Discord.js        │
        │  • Discord.js                                 │ • LLM (orchestrator)│
        │  • Application Use Cases                      │ • Application Cases │
        │                                               │                     │
        └────────────────┬────────────────────┬─────────┘                     │
                         │                    │                               │
                         │ HTTP (DI)          │                               │
                         │                    │                               │
                         ▼                    ▼                               │
        ┌────────────────────────────────────────────┐                        │
        │  SHARED INFRASTRUCTURE                     │                        │
        │                                            │                        │
        │  ┌──────────────────────────────────────┐  │                        │
        │  │ SQLite Database                      │  │                        │
        │  │                                      │  │                        │
        │  │ tickers table:                       │  │                        │
        │  │ ├── BBCA.JK | Bank Central Asia      │  │                        │
        │  │ ├── BBRI.JK | Bank Rakyat Indonesia  │  │                        │
        │  │ └── ...                              │  │                        │
        │  └──────────────────────────────────────┘  │                        │
        │                                            │                        │
        │  ┌──────────────────────────────────────┐  │                        │
        │  │ Application Use Cases                │  │                        │
        │  │ ├── AddTickerUseCase                 │  │                        │
        │  │ ├── GetSubscribedTickersUseCase      │  │                        │
        │  │ ├── AnalyzeMarketUseCase             │  │                        │
        │  │ └── ProcessMarketResultsUseCase      │  │                        │
        │  └──────────────────────────────────────┘  │                        │
        │                                            │                        │
        │  ┌──────────────────────────────────────┐  │                        │
        │  │ External Services                    │  │                        │
        │  │ ├── Yahoo Finance API                │  │                        │
        │  │ ├── Gemini LLM (future)              │  │                        │
        │  │ └── GitHub API (existing)            │  │                        │
        │  └──────────────────────────────────────┘  │                        │
        │                                            │                        │
        └────────────┬──────────────────────┬────────┘                        │
                     │                      │                                 │
                     │ Read/Write tickers   │ Analyze market                  │
                     │                      │                                 │
                     ▼                      ▼                                 │
        ┌─────────────────────────────────────────┐                           │
        │  WORKER SERVICE                         │                           │
        │  (Scheduled: 18 PM UTC daily)           │                           │
        │                                         │                           │
        │  MarketAnalysisJob                      │                           │
        │  ├── 1. Read tickers from DB            │                           │
        │  ├── 2. Fetch market data (Yahoo)       │                           │
        │  ├── 3. Analyze sentiment               │                           │
        │  └── 4. Send to webhook                 │                           │
        │                                         │                           │
        │  HTTP POST (JSON) ──────────────────────┼─────────────────────┐     │
        │  /webhooks/market-results               │                     │     │
        │                                         │                     │     │
        └─────────────────────────────────────────┘                     │     │
                                                                        │     │
                                                                        │     │
        ┌─────────────────────────────────────────┐                     │     │
        │  EXTERNAL SERVICES                      │                     │     │
        │                                         │                     │     │
        │  ┌─────────────────────────────────────┐│                     │     │
        │  │ Yahoo Finance                       ││                     │     │
        │  │ • Quote data                        ││                     │     │
        │  │ • News articles                     ││                     │     │
        │  └─────────────────────────────────────┘│                     │     │
        │                                         │                     │     │
        └─────────────────────────────────────────┘                     │     │
                                                                        │     │
                                                                        │     │
                                                                        │     │   
                                                                        │     │
                                                                        └───┐─┘
                                                                            │
                                                                        Results
```

## Data Flow Diagrams

### 1. Add Ticker Flow (Slash Command)

```
User in Discord
    │
    ▼
/add-ticker symbol:BBCA.JK name:Bank Central Asia
    │
    ├─────► Bot Service (slash command handler)
    │
    ├─────► AddTickerUseCase
    │           ├── Validate ticker format
    │           ├── Check if exists
    │           └── Create Ticker entity
    │
    ├─────► SqliteTickerRepository
    │           └── INSERT into tickers table
    │
    └─────► Reply to user
            "✅ Successfully added BBCA.JK"
```

### 2. Market Analysis Flow (Scheduled Job)

```
8:00 AM UTC (Daily)
    │
    ▼
Worker Process (MarketAnalysisScheduler)
    │
    ├─────► GetSubscribedTickersUseCase
    │           └── Read from DB: [BBCA.JK, BBRI.JK, ...]
    │
    ├─────► AnalyzeMarketUseCase
    │           ├── Fetch quote for each ticker
    │           ├── Fetch news articles
    │           ├── Analyze sentiment
    │           └── Return MarketAnalysis[]
    │
    ├─────► Convert to WorkerWebhookPayload
    │
    ├─────► HTTP POST to webhook URL
    │           http://localhost:3000/webhooks/market-results
    │
    └─────► [Continue to API Flow]
```

### 3. Webhook Delivery Flow (Worker → API → Discord)

```
Worker sends HTTP POST
{
  source: "market-analysis-job",
  results: [...],
  channelId: "..."
}
    │
    ▼
API Webhook Endpoint
    ├─────► ProcessMarketAnalysisResultsUseCase
    │           ├── Validate payload
    │           ├── Create Discord embeds
    │           └── Return {embeds, channelId}
    │
    ├─────► API Discord Client
    │           ├── Fetch channel from Discord
    │           ├── Send embeds (max 10 per message)
    │           └── Return success
    │
    └─────► HTTP 200 Response
            {
              success: true,
              messagesCount: 1,
              embedsCount: 2
            }
```

### 4. On-Demand Analysis Flow (Slash Command)

```
User in Discord
    │
    ▼
/market-summary --all
    │
    ├─────► Bot Service (slash command)
    │
    ├─────► GetSubscribedTickersUseCase
    │           └── Read all tickers from DB
    │
    ├─────► AnalyzeMarketUseCase
    │           └── Fetch & analyze each ticker
    │
    ├─────► Create Discord embeds
    │
    ├─────► Send directly to Discord
    │
    └─────► Display in channel immediately
            (no API webhook involved)
```

## Service Dependencies

### API Service
```
app.ts
├── Express.js
├── Discord.js (Client)
├── Logger (pino)
├── Controller (marketResultsController)
│   ├── ProcessMarketAnalysisResultsUseCase
│   │   └── EmbedBuilder (discord.js)
│   └── Discord Client (fetch channel, send)
├── Routes
│   └── /webhooks/market-results
└── Error handling
```

### Bot Service
```
bot.ts
├── Discord.js (Client, SlashCommandBuilder)
├── Logger (pino)
├── Slash Commands
│   ├── /add-ticker ──► AddTickerUseCase
│   ├── /list-tickers ──► GetSubscribedTickersUseCase
│   └── /market-summary ──► AnalyzeMarketUseCase
├── Natural Language Handler
│   └── handleNaturalLanguageMessage
└── ITickerRepository (DI)
```

### Worker Service
```
main.worker.ts
├── SQLite (initDatabase)
├── SqliteTickerRepository
├── Logger (pino)
├── MarketAnalysisScheduler (node-cron)
│   └── MarketAnalysisJob
│       ├── GetSubscribedTickersUseCase
│       ├── AnalyzeMarketUseCase
│       ├── WorkerWebhookPayload formatting
│       └── Fetch (HTTP POST to webhook)
└── Graceful shutdown handling
```

## Database Schema

```sql
CREATE TABLE tickers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Example data:
-- | 1 | BBCA.JK | Bank Central Asia    | 2026-05-01 08:00:00 |
-- | 2 | BBRI.JK | Bank Rakyat Indonesia | 2026-05-01 08:05:00 |
```

## Environment Variables

```env
# API
EXPRESS_PORT=3000

# Worker → API
MARKET_ANALYSIS_WEBHOOK_URL=http://localhost:3000/webhooks/market-results

# Discord
DISCORD_BOT_TOKEN=<bot-token>
DISCORD_CLIENT_ID=<client-id>
DISCORD_GUILD_ID=<guild-id>
DISCORD_STANDUP_CHANNEL_ID=<channel-id>

# Database
DATABASE_PATH=./zentra.db
```

## Deployment Topology

### Development (Single Machine)

```
localhost:3000 (API)
localhost:5000 (Bot)
localhost:worker (Worker)
zentra.db (SQLite)
```

### Production (Multi-Server)

```
Server A: API Service
  - Receives webhooks
  - Discord client
  - Port: 3000

Server B: Bot Service
  - Slash commands
  - Discord client
  - Event handlers

Server C: Worker Service
  - Scheduler
  - Market analysis
  - Sends HTTP to Server A

Shared: SQLite or PostgreSQL
  - Tickers table
  - Accessible from all servers
```

## Key Design Principles

1. **Webhook-Based Communication**
   - Worker doesn't directly call Discord
   - Worker calls API endpoint
   - API handles Discord integration
   - Services are independent

2. **Clean Architecture**
   - Domain: pure business logic
   - Application: use cases & orchestration
   - Infrastructure: external services
   - Interfaces: HTTP, Discord, scheduled jobs

3. **Single Responsibility**
   - Worker: analyzes market data
   - API: receives & delivers to Discord
   - Bot: handles user interactions

4. **Scalability**
   - Can run multiple workers
   - Can deploy API on separate server
   - Can add new webhook endpoints
   - Database can be shared or replicated

## Monitoring & Observability

### Health Checks

```bash
# API health
curl http://localhost:3000/ping
# {"message": "pong"}

# Bot status
# Check Discord for bot online status

# Worker status
# Check logs for scheduler messages
```

### Logs to Monitor

```
Worker:
  ✓ "Starting market analysis job"
  ✓ "Analyzing tickers: ..."
  ✓ "Sending results to webhook: ..."
  ✓ "Webhook response received"

API:
  ✓ "Webhook routes registered"
  ✓ "Market analysis results delivered to Discord"

Bot:
  ✓ "Bot logged in as ..."
  ✓ "Slash commands registered successfully"
```

## Error Scenarios & Recovery

| Scenario | Impact | Recovery |
|----------|--------|----------|
| Worker crashes | No market analysis | Restart worker process |
| API down | Webhook fails | Worker retries (future) |
| Discord API error | Results not sent | API logs error, returns 400 |
| DB unavailable | Can't read tickers | Worker waits for DB recovery |
| Invalid payload | 400 error | Check worker payload format |
| Wrong channel ID | 400 error | Update DISCORD_STANDUP_CHANNEL_ID |

## Future Enhancements

- [ ] Add webhook retry logic (exponential backoff)
- [ ] Store webhook results in DB for history
- [ ] Add webhook authentication (API key / HMAC)
- [ ] Add multiple channels support
- [ ] Add webhook delivery status tracking
- [ ] Add Gemini LLM for sentiment analysis
- [ ] Add user-specific watchlists
- [ ] Add market price alerts
- [ ] Add webhook signature verification
- [ ] Add webhook rate limiting
