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
   * Get all subscribed tickers
   */
  getAll(): Promise<Ticker[]>;

  /**
   * Check if a ticker already exists
   */
  exists(symbol: string): Promise<boolean>;

  /**
   * Remove a ticker from subscriptions
   */
  remove(symbol: string): Promise<void>;
}
