import { Ticker } from '../entities/ticker.entity';

/**
 * Ticker Repository Interface
 * Abstracts persistence layer for ticker subscriptions
 */
export interface ITickerRepository {
  /**
   * Add a new ticker to subscriptions
   */
  add(ticker: Ticker): Promise<void>;

  /**
   * Get a ticker by symbol
   */
  get(symbol: string): Promise<Ticker | null>;

  /**
   * Get all subscribed tickers
   */
  getAll(): Promise<Ticker[]>;

  /**
   * Remove a ticker from subscriptions
   */
  remove(symbol: string): Promise<void>;
}
