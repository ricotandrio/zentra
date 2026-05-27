/**
 * Event Bus - Type definitions for all domain events
 * Defines the contract for events that can be published and subscribed to
 * across API, Worker, and Bot interfaces
 */

// Base event structure
export interface DomainEvent {
  type: string;
  timestamp: Date;
  traceId?: string;
  source: 'api' | 'worker' | 'bot';
}

/**
 * Trigger market analysis job from API or Bot
 * Published by: API, Bot
 * Subscribed by: Worker scheduler
 */
export interface WorkerMarketAnalysisTriggerEvent extends DomainEvent {
  type: 'worker:market-analysis:trigger';
  source: 'api' | 'bot';
}

/**
 * Market analysis job has completed
 * Published by: Worker
 * Subscribed by: API (for Discord delivery), Bot (for notifications)
 */
export interface MarketAnalysisCompleteEvent extends DomainEvent {
  type: 'market-analysis:complete';
  source: 'worker';
  data: {
    channelId: string;
    timestamp: string;
    results: Array<{
      ticker: string;
      price: number;
      changePercent: number;
      sentiment: string;
      volume: number;
      fiftyTwoWeekHigh: number;
      fiftyTwoWeekLow: number;
      newsCount: number;
      topHeadlines: string[];
    }>;
  };
}

/**
 * Market analysis job failed
 * Published by: Worker
 * Subscribed by: API (for error logging), Bot (for notifications)
 */
export interface MarketAnalysisErrorEvent extends DomainEvent {
  type: 'market-analysis:error';
  source: 'worker';
  data: {
    error: string;
    timestamp: string;
  };
}

/**
 * Market summary job has completed
 * Published by: Worker
 * Subscribed by: Bot (for Discord delivery)
 */
export interface MarketSummaryCompleteEvent extends DomainEvent {
  type: 'market-summary:complete';
  source: 'worker';
  data: {
    channelId: string;
    timestamp: string;
    summary: any; // MarketSummary type - flexible to avoid circular imports
  };
}

/**
 * Ticker added by bot command or API
 * Published by: Bot, API
 * Subscribed by: Worker (to start tracking)
 */
export interface TickerAddedEvent extends DomainEvent {
  type: 'ticker:added';
  source: 'api' | 'bot';
  data: {
    symbol: string;
    addedBy: string;
    timestamp: string;
  };
}

/**
 * Ticker removed by bot command or API
 * Published by: Bot, API
 * Subscribed by: Worker (to stop tracking)
 */
export interface TickerRemovedEvent extends DomainEvent {
  type: 'ticker:removed';
  source: 'api' | 'bot';
  data: {
    symbol: string;
    removedBy: string;
    timestamp: string;
  };
}

// Union type of all events
export type ApplicationEvent =
  | WorkerMarketAnalysisTriggerEvent
  | MarketAnalysisCompleteEvent
  | MarketAnalysisErrorEvent
  | MarketSummaryCompleteEvent
  | TickerAddedEvent
  | TickerRemovedEvent;

// Type-safe event handler
export type EventHandler<T extends ApplicationEvent = ApplicationEvent> = (
  event: T
) => Promise<void> | void;
