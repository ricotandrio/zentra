/**
 * Market data types
 */
export interface MarketQuote {
  ticker: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number | null;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
}

export interface NewsArticle {
  title: string;
  publisher: string;
  publishedAt: Date;
  url: string;
}

export interface SentimentResult {
  label: 'bullish' | 'bearish' | 'neutral';
  score: number; // -1.0 (bearish) to +1.0 (bullish)
  signals: string[];
}

export interface MarketAnalysis {
  quote: MarketQuote;
  news: NewsArticle[];
  overallSentiment: SentimentResult;
  summary: string;
}
