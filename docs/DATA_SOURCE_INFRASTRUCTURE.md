# IDX Data Source Infrastructure

## Overview

Market-analysis module now includes a **Playwright-based scraper adapter** for fetching live ticker data from the Indonesian Stock Exchange (IDX).

## Architecture

```
Application Layer (Use Cases)
    ↓ (depends on)
ITickerDataSource Port (contracts/)
    ↑ (implements)
MarketScraperAdapter (infrastructure/data-sources/)
    ↑ (uses)
Playwright Browser
```

## Usage

### 1. Initialize the Adapter (Bootstrap)

```typescript
// src/bootstrap/market-analysis.bootstrap.ts
import { IdxScraperAdapter } from '@/modules/market-analysis/infrastructure/data-sources';
import { FetchTickersUseCase } from '@/modules/market-analysis/application/usecases';
import { getLogger } from '@/shared/logger';

const logger = getLogger();
const idxScraper = new IdxScraperAdapter(logger);
await idxScraper.initialize(); // Call once on startup

const fetchTickersUseCase = new FetchTickersUseCase(idxScraper);

export { fetchTickersUseCase, idxScraper };
```

### 2. Use the Adapter in Application

```typescript
// Anywhere in your application
const tickerData = await fetchTickersUseCase.execute(['BBCA.JK', 'BMRI.JK']);
// Returns: TickerData[]
```

### 3. Cleanup on Shutdown

```typescript
// In your shutdown handler
await marketScraper.close();
```

## Data Structure

```typescript
interface TickerData {
  code: string;           // e.g., "BBCA.JK"
  name: string;           // e.g., "Bank Central Asia Tbk"
  price: number;          // Current price
  changePercent: number;  // Change in percent
  volume: number;         // Trading volume
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  previousClose?: number;
}
```

## Docker Setup

The Dockerfile now automatically:
1. **Installs Playwright browsers** in the deps stage: `npx playwright install --with-deps`
2. **Includes required libraries** in the runtime stage for Playwright headless execution

Build the image:
```bash
docker build -t zentra .
```

Run with Playwright:
```bash
docker run zentra
```

## Advantages

✅ **No SDK dependency** — Uses Playwright for web scraping  
✅ **Dynamic content** — Handles JavaScript-rendered pages  
✅ **Headless mode** — Optimized for production (no UI needed)  
✅ **Swappable** — Easy to replace with Yahoo or other adapters  
✅ **Clean architecture** — Port/adapter pattern maintained  

## Future Enhancements

- Add caching to avoid repeated scrapes
- Implement fallback to Yahoo Finance if market data source is unavailable
- Add retry logic with exponential backoff
- Cache browser instance for performance
