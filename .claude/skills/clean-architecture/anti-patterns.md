# Common Anti-Patterns & How to Fix Them

## Anti-Pattern 1: The God Orchestrator

**Problem**: One class that orchestrates everything (violates single responsibility)

```typescript
// ❌ WRONG: MarketAnalysisOrchestrator doing everything
export class MarketAnalysisOrchestrator {
  async analyze(symbols: string[]) {
    const data = await yahooAdapter.getQuote(symbols[0]);
    const sentiment = await gptAdapter.analyzeSentiment(data);
    await tickerRepository.save({ ...data, sentiment });
    await eventBus.publish({ type: 'analysis:complete' });
    const channel = await discordClient.channels.fetch(channelId);
    await channel.send(`Analyzed ${symbols[0]}`);
  }
}
```

**Issues**:
- Mixes use case logic, infrastructure calls, and interface delivery
- Hard to test (needs all dependencies)
- Hard to reuse (coupled to Discord)
- Violates layer boundaries

**Fix**: Separate into layers

```typescript
// ✅ CORRECT: Use case handles business logic
export class AnalyzeMarketUseCase {
  constructor(
    private marketDataAdapter: IMarketDataAdapter,
    private sentimentAdapter: ISentimentAdapter,
    private tickerRepository: ITickerRepository,
    private eventBus: IEventBus,
  ) {}

  async execute(symbols: string[]): Promise<AnalysisResult[]> {
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        const data = await this.marketDataAdapter.getQuote(symbol);
        const sentiment = await this.sentimentAdapter.analyze(data);
        const result = { ...data, sentiment };
        await this.tickerRepository.save(result);
        await this.eventBus.publish({
          type: 'market-analysis:complete',
          data: result,
        });
        return result;
      })
    );
    return results;
  }
}

// ✅ Handler delivers to Discord (interfaces layer)
export class MarketAnalysisCommand {
  constructor(
    private analyzeMarketUseCase: AnalyzeMarketUseCase,
  ) {}

  async execute(interaction: CommandInteraction) {
    const results = await this.analyzeMarketUseCase.execute(['AAPL']);
    await interaction.reply(`Analyzed: ${results[0].symbol}`);
  }
}
```

---

## Anti-Pattern 2: Circular Dependencies

**Problem**: Layer A imports Layer B, and B imports A

```typescript
// ❌ WRONG: Circular dependency
// application/use-cases/analyze.usecase.ts
import { MarketAnalysisJob } from '@/interfaces/worker';

export class AnalyzeMarketUseCase {
  async execute() {
    const job = new MarketAnalysisJob();
    await job.run();
  }
}

// interfaces/worker/jobs/market-analysis.job.ts
import { AnalyzeMarketUseCase } from '@/application/use-cases';

export class MarketAnalysisJob {
  async run() {
    const useCase = new AnalyzeMarketUseCase();
    await useCase.execute();
  }
}
```

**Issues**:
- Cannot import one without the other
- Breaks dependency injection
- Makes testing impossible

**Fix**: Use events or dependency injection

```typescript
// ✅ CORRECT: No circular dependency
// application/use-cases/analyze.usecase.ts
export class AnalyzeMarketUseCase {
  constructor(private eventBus: IEventBus) {}

  async execute() {
    // Publish event, let worker pick it up
    await this.eventBus.publish({
      type: 'market-analysis:trigger',
    });
  }
}

// interfaces/worker/jobs/market-analysis.job.ts
export class MarketAnalysisJob {
  constructor(private useCase: AnalyzeMarketUseCase) {}

  async run() {
    await this.useCase.execute();
  }
}

// Bootstrap: Wires them without circularity
const useCase = new AnalyzeMarketUseCase(eventBus);
const job = new MarketAnalysisJob(useCase);
```

---

## Anti-Pattern 3: Business Logic in Handlers

**Problem**: Handler/command/route doing the actual work

```typescript
// ❌ WRONG: Logic in the command handler
@Slash()
async analyzeMarket(
  @SlashOption() symbol: string,
) {
  // Business logic should not be here
  const response = await fetch(`https://api.yahoo.com/quote/${symbol}`);
  const data = await response.json();
  const sentiment = Math.random() > 0.5 ? 'BULLISH' : 'BEARISH';
  
  return {
    symbol,
    price: data.regularMarketPrice,
    sentiment,
  };
}
```

**Issues**:
- Can't reuse logic from other interfaces (API, worker, etc.)
- Hard to test
- Hard to change logic without modifying multiple handlers
- Violates single responsibility

**Fix**: Move logic to use case

```typescript
// ✅ CORRECT: Logic in use case
export class AnalyzeMarketUseCase {
  constructor(
    private marketDataAdapter: IMarketDataAdapter,
    private sentimentAdapter: ISentimentAdapter,
  ) {}

  async execute(symbol: string) {
    const data = await this.marketDataAdapter.getQuote(symbol);
    const sentiment = await this.sentimentAdapter.analyze(data);
    return { symbol, price: data.price, sentiment };
  }
}

// Handler just orchestrates
@Slash()
async analyzeMarket(
  @SlashOption() symbol: string,
) {
  return this.analyzeMarketUseCase.execute(symbol);
}
```

---

## Anti-Pattern 4: Direct SDK Calls in Use Cases

**Problem**: Use case calls external SDK directly

```typescript
// ❌ WRONG: SDK call in use case
import yahooFinance from 'yahoo-finance2';

export class AnalyzeMarketUseCase {
  async execute(symbol: string) {
    const quote = await yahooFinance.quote(symbol); // Direct SDK call!
    return { price: quote.regularMarketPrice };
  }
}
```

**Issues**:
- Can't swap implementations (Yahoo → AlphaVantage)
- Hard to test (need real API)
- Violates dependency inversion

**Fix**: Use adapter pattern

```typescript
// ✅ CORRECT: Use case depends on contract
export class AnalyzeMarketUseCase {
  constructor(private marketDataAdapter: IMarketDataAdapter) {}

  async execute(symbol: string) {
    const data = await this.marketDataAdapter.getQuote(symbol);
    return { price: data.price };
  }
}

// Adapter handles SDK
export class YahooAdapter implements IMarketDataAdapter {
  async getQuote(symbol: string) {
    const quote = await yahooFinance.quote(symbol);
    return { price: quote.regularMarketPrice };
  }
}
```

---

## Anti-Pattern 5: Infrastructure Calling Interfaces

**Problem**: Adapter or repository trying to deliver to Discord/API

```typescript
// ❌ WRONG: Infrastructure knowing about Discord
export class GitHubAdapter {
  async createIssue(title: string) {
    const issue = await octokit.issues.create({ title });
    
    // Wrong layer! Should not know about Discord
    const channel = await discordClient.channels.fetch('channelId');
    await channel.send(`Issue created: ${issue.html_url}`);
    
    return issue;
  }
}
```

**Issues**:
- Adapter is now coupled to Discord
- Can't use adapter from API without Discord
- Hard to test

**Fix**: Let Interfaces orchestrate delivery

```typescript
// ✅ CORRECT: Adapter is independent
export class GitHubAdapter implements IGitHubAdapter {
  async createIssue(title: string) {
    return await octokit.issues.create({ title });
  }
}

// Interfaces handles delivery
export class IssueCreatedHandler {
  async handle(event: IssueCreatedEvent) {
    const channel = await discordClient.channels.fetch('channelId');
    await channel.send(`Issue created: ${event.url}`);
  }
}
```

---

## Anti-Pattern 6: Configuration in Code

**Problem**: Hardcoding configuration values

```typescript
// ❌ WRONG: Hardcoded values
export class MarketAnalysisScheduler {
  private cronExpression = '0 0 * * * *'; // What if this changes?
  private channelId = '123456789'; // What if we need a different channel?
  private maxRetries = 3; // Business decision, not code

  constructor() {
    this.job = new CronJob(this.cronExpression, () => this.run());
  }
}
```

**Issues**:
- Can't change without redeploying code
- Different environments have different needs
- Not twelve-factor compliant

**Fix**: Inject configuration

```typescript
// ✅ CORRECT: Configuration from environment
export class MarketAnalysisScheduler {
  private cronExpression: string;
  private channelId: string;
  private maxRetries: number;

  constructor(config: ISchedulerConfig) {
    this.cronExpression = config.cronExpression;
    this.channelId = config.channelId;
    this.maxRetries = config.maxRetries;
    this.job = new CronJob(this.cronExpression, () => this.run());
  }
}

// Bootstrap injects from env
const scheduler = new MarketAnalysisScheduler({
  cronExpression: env.MARKET_ANALYSIS_CRON,
  channelId: env.DISCORD_CHANNEL_ID,
  maxRetries: parseInt(env.MAX_RETRIES),
});
```

---

## Anti-Pattern 7: Mixing Concerns in Entities

**Problem**: Entity doing more than representing data

```typescript
// ❌ WRONG: Entity doing work
export class Ticker {
  symbol: string;

  async save() {
    await db.query('INSERT INTO tickers...');
  }

  async fetch() {
    return await db.query('SELECT * FROM tickers...');
  }

  getAnalysis() {
    return yahooAdapter.getQuote(this.symbol);
  }
}
```

**Issues**:
- Entity is tightly coupled to database
- Can't move entity to different database
- Hard to test
- Violates single responsibility

**Fix**: Keep entity pure, use repository

```typescript
// ✅ CORRECT: Entity is pure data
export class Ticker {
  constructor(
    public symbol: string,
    public name: string,
  ) {}

  static create(symbol: string, name: string) {
    return new Ticker(symbol, name);
  }
}

// Repository handles persistence
export class TickerRepository implements ITickerRepository {
  async save(ticker: Ticker) {
    await db.query('INSERT INTO tickers...');
  }

  async findBySymbol(symbol: string) {
    const row = await db.query('SELECT * FROM tickers WHERE symbol = ?', [symbol]);
    return new Ticker(row.symbol, row.name);
  }
}
```

---

## Summary: Clean Architecture Checklist

Before committing code, ask:

1. **Is business logic in the right place?** (Use case, not handler)
2. **Are dependencies injected?** (Not hardcoded)
3. **Does application depend on contracts?** (Not implementations)
4. **Is there any circular dependency?** (A → B → A is wrong)
5. **Is domain independent?** (No SDK, DB, or framework calls)
6. **Are errors translated?** (Adapter maps external errors to domain errors)
7. **Can this be tested without mocks?** (Domain should be)
8. **Can this be tested with mocks?** (Application should be)

If you answered "no" to any, refactor before committing.
