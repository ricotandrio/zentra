# Market Analysis Webhook Integration

## Architecture

```
┌──────────────┐
│   Worker     │  Reads tickers from DB
│              │  Analyzes market data
└──────┬───────┘
       │
       │ HTTP POST (JSON)
       │
       └──────────────────────────────┐
                                      │
                                      ▼
                        ┌─────────────────────────┐
                        │  API Webhook Endpoint   │
                        │  POST /webhooks/        │
                        │  market-results         │
                        └────────┬────────────────┘
                                 │
                                 │ Validate payload
                                 │ Format embeds
                                 │
                                 ▼
                        ┌─────────────────────────┐
                        │   Discord Client        │
                        │   (in API process)      │
                        │   Sends to channel      │
                        └─────────────────────────┘
```

## Webhook Endpoint

**URL:** `POST /webhooks/market-results`

### Request Headers
```
Content-Type: application/json
```

### Request Body

```json
{
  "source": "market-analysis-job",
  "timestamp": "2026-05-01T08:00:00Z",
  "channelId": "123456789",
  "results": [
    {
      "ticker": "BBCA.JK",
      "price": 8650,
      "changePercent": 1.25,
      "sentiment": {
        "label": "bullish",
        "score": 0.45,
        "signals": ["+growth", "+positive", "-risk"]
      },
      "volume": 15000000,
      "fiftyTwoWeekHigh": 9500,
      "fiftyTwoWeekLow": 7800,
      "newsCount": 12,
      "topHeadlines": ["BBCA posts strong Q1 profit", "Merger talks announced", "New dividend"]
    }
  ]
}
```

### Response (Success)

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Market analysis results delivered",
  "messagesCount": 1,
  "embedsCount": 1
}
```

### Response (Error)

**Status:** `400 Bad Request`

```json
{
  "error": "Invalid payload: missing required fields"
}
```

## Setup Instructions

### 1. Environment Variables

Add to `.env`:

```env
# API
EXPRESS_PORT=3000

# Worker Webhook
MARKET_ANALYSIS_WEBHOOK_URL=http://localhost:3000/webhooks/market-results

# Discord
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_guild_id_here
DISCORD_STANDUP_CHANNEL_ID=your_channel_id_here

# Database
DATABASE_PATH=./zentra.db
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Services

**Terminal 1 - API:**
```bash
npm run dev:api
# API listens on http://localhost:3000
```

**Terminal 2 - Worker:**
```bash
npm run dev:worker
# Worker sends results to http://localhost:3000/webhooks/market-results
```

**Terminal 3 - Bot (optional):**
```bash
npm run dev:bot
# Bot handles slash commands
```

## Workflow

### 1. Add Tickers (via Bot Slash Command)

```
/add-ticker symbol:BBCA.JK name:Bank Central Asia
/add-ticker symbol:BBRI.JK name:Bank Rakyat Indonesia
```

**Database:**
```
tickers table:
- BBCA.JK | Bank Central Asia    | 2026-05-01 08:00:00
- BBRI.JK | Bank Rakyat Indonesia | 2026-05-01 08:05:00
```

### 2. Scheduled Analysis (Daily at 18 PM UTC)

**Worker Process:**
1. Reads all tickers from database
2. Calls Yahoo Finance API for each ticker
3. Analyzes sentiment from news articles
4. Sends results to API webhook

### 3. API Receives and Delivers

**API Process:**
1. Receives webhook POST from worker
2. Validates payload format
3. Creates Discord embeds
4. Sends to configured Discord channel
5. Returns success response

### 4. Discord Channel

Market analysis results appear as richly formatted embeds:

```
🟢 BBCA.JK
━━━━━━━━━━━━━━━━
📈 Price: Rp 8,650 (+1.25%)
📊 Volume: 15,000,000
📈 52w High: Rp 9,500
📉 52w Low: Rp 7,800
🟢 Sentiment: BULLISH (0.45)
🎯 Signals: +growth +positive -risk
📰 News: 12 recent articles analyzed
```

## Webhook Payload Validation

The API validates:
- ✅ `source` must be `"market-analysis-job"`
- ✅ `results` must be a non-empty array
- ✅ `channelId` must be a valid Discord channel ID
- ✅ Each result has required fields (ticker, price, sentiment, etc.)
- ❌ Returns `400 Bad Request` if any validation fails

## Error Handling

**Webhook Errors:**
- Invalid payload format → `400 Bad Request` with error message
- Discord channel not found → `400 Bad Request`
- Discord API error → `400 Bad Request` with error details

**Worker Errors:**
- Market data fetch fails → Job logs error, continues to next ticker
- Network error to webhook → Job logs error with details
- Invalid webhook URL → Worker exits with error message

## Monitoring

### API Logs
```
[INFO] Webhook routes registered
[INFO] API server running on http://localhost:3000
[INFO] Market analysis results delivered to Discord
[INFO]  - channelId: 123456789
[INFO]  - messagesCount: 1
[INFO]  - embedsCount: 3
```

### Worker Logs
```
[INFO] Worker started with market analysis scheduler
[INFO] Starting market analysis scheduler
[INFO] Scheduled market analysis job running...
[INFO] Starting market analysis job
[INFO] Analyzing tickers: BBCA.JK, BBRI.JK
[INFO] Sending results to webhook: http://localhost:3000/webhooks/market-results
[INFO] Webhook response received: { success: true, ... }
```

## Testing the Webhook Manually

```bash
# Test with curl
curl -X POST http://localhost:3000/webhooks/market-results \
  -H "Content-Type: application/json" \
  -d '{
    "source": "market-analysis-job",
    "timestamp": "2026-05-01T08:00:00Z",
    "channelId": "YOUR_CHANNEL_ID",
    "results": [
      {
        "ticker": "BBCA.JK",
        "price": 8650,
        "changePercent": 1.25,
        "sentiment": {
          "label": "bullish",
          "score": 0.45,
          "signals": ["+growth"]
        },
        "volume": 15000000,
        "fiftyTwoWeekHigh": 9500,
        "fiftyTwoWeekLow": 7800,
        "newsCount": 5,
        "topHeadlines": ["BBCA posts strong profit"]
      }
    ]
  }'
```

## Future Enhancements

- [ ] Add webhook authentication (API key / HMAC signing)
- [ ] Store webhook results in database for history
- [ ] Add retry logic for failed webhook deliveries
- [ ] Support multiple Discord channels
- [ ] Add webhook delivery status tracking
- [ ] Email notifications on errors
