# Layer Placement Examples

Real Zentra examples for each scenario.

## Example 1: New Feature - Add Ticker Command

**Scenario**: User asks "I want to add a new Discord command that lets users subscribe to ticker symbols"

**Decision**: Is this new business logic?
- YES → Create use case
- Is this a Discord command? YES → Create command

**Implementation**:

### Step 1: Create Use Case (Application)
```typescript
// src/application/use-cases/ticker/add-ticker.usecase.ts
import { TickerEntity } from '@/domain/entities';
import { ITickerRepository } from '@/domain/repositories';
import { IEventBus } from '@/shared/event-bus';

export class AddTickerUseCase {
  constructor(
    private tickerRepository: ITickerRepository,
    private eventBus: IEventBus,
  ) {}

  async execute(symbol: string, userId: string): Promise<TickerEntity> {
    // Business logic: validate and add ticker
    if (symbol.length > 5) {
      throw new InvalidTickerError(`Symbol must be ≤5 characters`);
    }

    const exists = await this.tickerRepository.exists(symbol);
    if (exists) {
      throw new TickerAlreadySubscribedError(`Already subscribed to ${symbol}`);
    }

    const ticker = TickerEntity.create(symbol, userId);
    await this.tickerRepository.add(ticker);

    // Publish event for other components
    await this.eventBus.publish({
      type: 'ticker:added',
      source: 'bot',
      data: { symbol, userId },
      timestamp: new Date(),
    });

    return ticker;
  }
}
```

### Step 2: Create Discord Command (Interfaces)
```typescript
// src/interfaces/bot/commands/add-ticker.command.ts
import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { AddTickerUseCase } from '@/application/use-cases/ticker';

export class AddTickerCommand {
  readonly data = new SlashCommandBuilder()
    .setName('add-ticker')
    .setDescription('Subscribe to a ticker')
    .addStringOption(option =>
      option
        .setName('symbol')
        .setDescription('Stock ticker symbol (e.g., AAPL)')
        .setRequired(true)
    );

  constructor(private addTickerUseCase: AddTickerUseCase) {}

  async execute(interaction: CommandInteraction): Promise<void> {
    const symbol = interaction.options.getString('symbol')!.toUpperCase();

    try {
      const ticker = await this.addTickerUseCase.execute(symbol, interaction.user.id);
      await interaction.reply(`✅ Subscribed to ${ticker.symbol}`);
    } catch (error) {
      if (error instanceof InvalidTickerError) {
        await interaction.reply({ content: error.message, ephemeral: true });
      } else {
        await interaction.reply({ content: 'Error adding ticker', ephemeral: true });
      }
    }
  }
}
```

### Step 3: Wire in Bootstrap
```typescript
// src/bootstrap/main.bot.ts
import { AddTickerCommand } from '@/interfaces/bot/commands';
import { AddTickerUseCase } from '@/application/use-cases/ticker';
import { TickerRepository } from '@/infrastructure/persistence';

const tickerRepository = new TickerRepository(db);
const addTickerUseCase = new AddTickerUseCase(tickerRepository, eventBus);
const addTickerCommand = new AddTickerCommand(addTickerUseCase);

// Register with Discord bot...
```

---

## Example 2: External Integration - Yahoo Finance Adapter

**Scenario**: "I need to fetch market data from Yahoo Finance"

**Decision**: Is this external service? YES → Create adapter

**Implementation**:

### Step 1: Define Contract (Application)
```typescript
// src/application/contracts/market-data.contract.ts
export interface IMarketDataAdapter {
  getQuote(symbol: string): Promise<Quote>;
  getNews(symbol: string): Promise<NewsItem[]>;
}

export interface Quote {
  symbol: string;
  price: number;
  changePercent: number;
  volume: number;
  currency: string;
}

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: Date;
}
```

### Step 2: Implement Adapter (Infrastructure)
```typescript
// src/infrastructure/external/yahoo/yahoo.adapter.ts
import yahooFinance from 'yahoo-finance2';
import { IMarketDataAdapter, Quote, NewsItem } from '@/application/contracts';
import { MarketDataError, TickerNotFoundError } from '@/shared/errors';

export class YahooAdapter implements IMarketDataAdapter {
  async getQuote(symbol: string): Promise<Quote> {
    try {
      const quote = await yahooFinance.quote(symbol);

      if (!quote || !quote.regularMarketPrice) {
        throw new TickerNotFoundError(`Ticker ${symbol} not found`);
      }

      return {
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0,
        currency: quote.currency || 'USD',
      };
    } catch (error) {
      if (error instanceof TickerNotFoundError) {
        throw error;
      }
      throw new MarketDataError(
        `Failed to fetch quote for ${symbol}: ${error.message}`
      );
    }
  }

  async getNews(symbol: string): Promise<NewsItem[]> {
    try {
      const news = await yahooFinance.news({ symbols: [symbol] });
      return news.map(item => ({
        title: item.title,
        link: item.link,
        source: item.publisher || 'Yahoo Finance',
        publishedAt: new Date(item.pubDate * 1000),
      }));
    } catch (error) {
      throw new MarketDataError(
        `Failed to fetch news for ${symbol}: ${error.message}`
      );
    }
  }
}
```

### Step 3: Use in Use Case (Application)
```typescript
// src/application/use-cases/ticker/analyze-market.usecase.ts
import { IMarketDataAdapter } from '@/application/contracts';
import { AnalysisResult } from '@/application/dto';

export class AnalyzeMarketUseCase {
  constructor(private marketDataAdapter: IMarketDataAdapter) {}

  async execute(symbols: string[]): Promise<AnalysisResult[]> {
    // Application layer never imports YahooAdapter directly!
    // It only uses the contract (IMarketDataAdapter)

    const results = await Promise.all(
      symbols.map(async symbol => {
        const quote = await this.marketDataAdapter.getQuote(symbol);
        const news = await this.marketDataAdapter.getNews(symbol);

        return {
          symbol: quote.symbol,
          price: quote.price,
          changePercent: quote.changePercent,
          newsCount: news.length,
        };
      })
    );

    return results;
  }
}
```

### Step 4: Wire in Bootstrap
```typescript
// src/bootstrap/main.api.ts
import { YahooAdapter } from '@/infrastructure/external/yahoo';
import { AnalyzeMarketUseCase } from '@/application/use-cases/ticker';

const yahooAdapter = new YahooAdapter();
const analyzeMarketUseCase = new AnalyzeMarketUseCase(yahooAdapter);

// Now the use case works with any adapter implementing IMarketDataAdapter
// To swap to AlphaVantage later, just change one line:
// const adapter = new AlphaVantageAdapter();
```

---

## Example 3: Database Entity & Repository

**Scenario**: "I need to add persistence for user watchlists"

**Decision**: Is this a domain concept? YES → Create entity + repository

**Implementation**:

### Step 1: Define Entity (Domain)
```typescript
// src/domain/entities/watchlist.entity.ts
export class WatchlistEntity {
  readonly id: string;
  readonly userId: string;
  readonly tickers: string[];
  readonly createdAt: Date;

  private constructor(id: string, userId: string, tickers: string[], createdAt: Date) {
    this.id = id;
    this.userId = userId;
    this.tickers = tickers;
    this.createdAt = createdAt;
  }

  static create(userId: string, tickers: string[] = []): WatchlistEntity {
    return new WatchlistEntity(
      crypto.randomUUID(),
      userId,
      tickers,
      new Date()
    );
  }

  addTicker(symbol: string): void {
    if (!this.tickers.includes(symbol)) {
      this.tickers.push(symbol);
    }
  }

  removeTicker(symbol: string): void {
    const index = this.tickers.indexOf(symbol);
    if (index > -1) {
      this.tickers.splice(index, 1);
    }
  }
}
```

### Step 2: Define Repository Interface (Domain)
```typescript
// src/domain/repositories/watchlist.repository.ts
import { WatchlistEntity } from '@/domain/entities';

export interface IWatchlistRepository {
  save(watchlist: WatchlistEntity): Promise<void>;
  findByUserId(userId: string): Promise<WatchlistEntity | null>;
  exists(userId: string): Promise<boolean>;
}
```

### Step 3: Implement Repository (Infrastructure)
```typescript
// src/infrastructure/persistence/watchlist.repository.ts
import { Database } from '@/infrastructure/persistence/db';
import { IWatchlistRepository } from '@/domain/repositories';
import { WatchlistEntity } from '@/domain/entities';

export class WatchlistRepository implements IWatchlistRepository {
  constructor(private db: Database) {}

  async save(watchlist: WatchlistEntity): Promise<void> {
    await this.db.query(
      `INSERT INTO watchlists (id, user_id, tickers, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET tickers = ?`,
      [
        watchlist.id,
        watchlist.userId,
        JSON.stringify(watchlist.tickers),
        watchlist.createdAt.toISOString(),
        JSON.stringify(watchlist.tickers),
      ]
    );
  }

  async findByUserId(userId: string): Promise<WatchlistEntity | null> {
    const row = await this.db.queryOne(
      'SELECT * FROM watchlists WHERE user_id = ?',
      [userId]
    );

    if (!row) return null;

    return new WatchlistEntity(
      row.id,
      row.user_id,
      JSON.parse(row.tickers),
      new Date(row.created_at)
    );
  }

  async exists(userId: string): Promise<boolean> {
    const count = await this.db.queryOne(
      'SELECT COUNT(*) as count FROM watchlists WHERE user_id = ?',
      [userId]
    );
    return count.count > 0;
  }
}
```

### Step 4: Use in Use Case (Application)
```typescript
// src/application/use-cases/user/create-watchlist.usecase.ts
import { IWatchlistRepository } from '@/domain/repositories';
import { WatchlistEntity } from '@/domain/entities';

export class CreateWatchlistUseCase {
  constructor(private watchlistRepository: IWatchlistRepository) {}

  async execute(userId: string): Promise<WatchlistEntity> {
    const watchlist = WatchlistEntity.create(userId);
    await this.watchlistRepository.save(watchlist);
    return watchlist;
  }
}
```

---

## Example 4: Background Job

**Scenario**: "I need a background job that analyzes all subscribed tickers every hour"

**Decision**: Is this an entrypoint? YES (worker/job) → Create job

**Implementation**:

### Step 1: Create Job (Interfaces)
```typescript
// src/interfaces/worker/jobs/market-analysis.job.ts
import { IEventBus } from '@/shared/event-bus';
import { AnalyzeMarketUseCase } from '@/application/use-cases/ticker';
import { ITickerRepository } from '@/domain/repositories';
import { Logger } from '@/shared/logger';

export class MarketAnalysisJob {
  constructor(
    private analyzeMarketUseCase: AnalyzeMarketUseCase,
    private tickerRepository: ITickerRepository,
    private eventBus: IEventBus,
    private logger: Logger,
  ) {}

  async execute(): Promise<void> {
    try {
      this.logger.info('Market analysis job started');

      // Get all tickers from database (business layer)
      const allTickers = await this.tickerRepository.getAll();
      const symbols = allTickers.map(t => t.symbol);

      if (symbols.length === 0) {
        this.logger.info('No tickers to analyze');
        return;
      }

      // Run analysis (business logic in use case)
      const results = await this.analyzeMarketUseCase.execute(symbols);

      // Publish event for other components (e.g., Discord delivery)
      await this.eventBus.publish({
        type: 'market-analysis:complete',
        source: 'worker',
        timestamp: new Date(),
        data: { results },
      });

      this.logger.info(`Analysis complete: ${results.length} tickers analyzed`);
    } catch (error) {
      this.logger.error('Market analysis job failed', { error });
      throw error;
    }
  }
}
```

### Step 2: Create Scheduler (Interfaces)
```typescript
// src/interfaces/worker/schedulers/market-analysis.scheduler.ts
import { CronJob } from 'cron';
import { MarketAnalysisJob } from '@/interfaces/worker/jobs';
import { Logger } from '@/shared/logger';

export class MarketAnalysisScheduler {
  private job: CronJob;

  constructor(
    private marketAnalysisJob: MarketAnalysisJob,
    private logger: Logger,
    private cronExpression: string = '0 * * * *', // Every hour
  ) {
    this.job = new CronJob(this.cronExpression, () => this.run());
  }

  start(): void {
    this.job.start();
    this.logger.info('Market analysis scheduler started');
  }

  stop(): void {
    this.job.stop();
    this.logger.info('Market analysis scheduler stopped');
  }

  private async run(): Promise<void> {
    await this.marketAnalysisJob.execute();
  }
}
```

### Step 3: Wire in Bootstrap
```typescript
// src/bootstrap/main.worker.ts
import { MarketAnalysisJob } from '@/interfaces/worker/jobs';
import { MarketAnalysisScheduler } from '@/interfaces/worker/schedulers';
import { AnalyzeMarketUseCase } from '@/application/use-cases/ticker';

const analyzeMarketUseCase = new AnalyzeMarketUseCase(yahooAdapter);
const job = new MarketAnalysisJob(analyzeMarketUseCase, tickerRepository, eventBus, logger);
const scheduler = new MarketAnalysisScheduler(job, logger);

scheduler.start();
```

---

## Summary

| Example | Layers Touched | Files Created |
|---------|---|---|
| Add command | Application + Interfaces | use case + command |
| External API | Application + Infrastructure | contract + adapter |
| Database | Domain + Infrastructure | entity + repo interface + repo impl |
| Background job | Application + Interfaces | job + scheduler |

**Pattern**: Always go from most specific (Interfaces) → most general (Domain/Shared).
