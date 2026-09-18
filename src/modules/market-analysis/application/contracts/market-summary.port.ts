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

export interface MarketSummaryPort {
  initialize?(): Promise<void>;
  getMarketSummary(): Promise<MarketSummary>;
  close?(): Promise<void>;
}
