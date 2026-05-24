/**
 * Market Analysis Results DTO
 * Data transfer object for webhook payload from worker
 */
export interface MarketAnalysisResultDTO {
  ticker: string;
  price: number;
  changePercent: number;
  sentiment: {
    label: 'bullish' | 'bearish' | 'neutral';
    score: number;
    signals: string[];
  };
  volume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  newsCount: number;
  topHeadlines: string[];
}

export interface WorkerWebhookPayload {
  source: 'market-analysis-job';
  timestamp: string;
  results: MarketAnalysisResultDTO[];
  channelId: string;
}
