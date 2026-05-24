/**
 * Market Ticker Data
 * Represents individual stock data from market data source
 */
export interface MarketTickerData {
  no: number;
  idStockSummary: number;
  date: string;
  stockCode: string;
  stockName: string;
  remarks: string;
  previous: number;
  openPrice: number;
  firstTrade: number;
  high: number;
  low: number;
  close: number;
  change: number;
  volume: number;
  value: number;
  frequency: number;
  indexIndividual: number;
  offer: number;
  offerVolume: number;
  bid: number;
  bidVolume: number;
  listedShares: number;
  tradableShares: number;
  weightForIndex: number;
  foreignSell: number;
  foreignBuy: number;
  delistingDate: string;
  nonRegularVolume: number;
  nonRegularValue: number;
  nonRegularFrequency: number;
}

/**
 * Market Summary
 * Contains aggregated market statistics
 */
export interface MarketSummary {
  date: string;
  topVolume: MarketTickerData[];
  bottomVolume: MarketTickerData[];
  topValue: MarketTickerData[];
  topFrequency: MarketTickerData[];
  foreignTopNetBuy: MarketTickerData[];
  foreignTopNetSell: MarketTickerData[];
  totalTickers: number;
  totalVolume: number;
  totalValue: number;
  averageChangePercent: number;
}

/**
 * Market API Response
 * Raw response from market data source trading summary endpoint
 */
export interface MarketApiResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: MarketTickerData[];
}
