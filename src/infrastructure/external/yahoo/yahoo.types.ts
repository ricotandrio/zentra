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
  /** Overall sentiment label: bullish, bearish, or neutral */
  label: 'bullish' | 'bearish' | 'neutral';

  /** Sentiment score from -1.0 (very bearish) to +1.0 (very bullish) */
  score: number;

  /** Top signals contributing to sentiment (e.g. "strong buy", "weak sell") */
  signals: string[];
}

export interface MarketAnalysis {
  quote: MarketQuote;
  news: NewsArticle[];
  overallSentiment: SentimentResult;
  summary: string;
}
