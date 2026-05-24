import { chromium, Browser, Page } from 'playwright';
import { MarketTickerData, MarketApiResponse } from './market-scraper.types';
import { logger } from '@/shared/logger';
import { MARKET_SUMMARY_URL } from '@/shared/config';
import { MarketSummary } from './market-scraper.types';
import { isoDateToLocaleString } from '../../../../shared/utils/function';

const MARKET_DATA_URL = MARKET_SUMMARY_URL;

export class MarketScraperAdapter {
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor() {}

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing market scraper adapter');
      this.browser = await chromium.launch({
        headless: false,
        // headless: true,
        // args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
      });
      this.page = await this.browser.newPage();
    } catch (error) {
      logger.error(`Failed to initialize browser: ${error}`);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      logger.info('Market scraper adapter closed');
    }
  }

  /**
   * Fetch raw trading summary data from market data source
   */
  async getRawTradingSummary(): Promise<MarketApiResponse> {
    if (!this.page) {
      throw new Error('Adapter not initialized. Call initialize() first.');
    }

    try {
      logger.info('Fetching raw trading summary from market data source');

      await this.page.goto(MARKET_DATA_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      // Get the JSON response from the page
      const content = await this.page.textContent('body');

      if (!content) {
        throw new Error('Failed to retrieve market data');
      }

      const response: MarketApiResponse = JSON.parse(content || '{}');

      if (!response.data || !Array.isArray(response.data)) {
        logger.error('Invalid market response format');
        throw new Error('Invalid market response format - missing data array');
      }

      logger.info(`Retrieved ${response.data.length} tickers from market data source`);
      return response;
    } catch (error) {
      logger.error(`Failed to fetch market data: ${error}`);
      // eslint-disable-next-line preserve-caught-error
      throw new Error(
        `Market scraper error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get trading summary with mapped field names
   */
  async getTradingSummary(): Promise<MarketTickerData[]> {
    const response = await this.getRawTradingSummary();
    return response.data.map((item: any) => this.mapToMarketTickerData(item));
  }

  /**
   * Map raw market response to MarketTickerData
   */
  private mapToMarketTickerData(item: any): MarketTickerData {
    return {
      no: item.No || 0,
      idStockSummary: item.IDStockSummary || 0,
      date: item.Date || '',
      stockCode: item.StockCode || '',
      stockName: item.StockName || '',
      remarks: item.Remarks || '',
      previous: parseFloat(item.Previous || 0),
      openPrice: parseFloat(item.OpenPrice || 0),
      firstTrade: parseFloat(item.FirstTrade || 0),
      high: parseFloat(item.High || 0),
      low: parseFloat(item.Low || 0),
      close: parseFloat(item.Close || 0),
      change: parseFloat(item.Change || 0),
      volume: parseInt(item.Volume || 0),
      value: parseInt(item.Value || 0),
      frequency: parseInt(item.Frequency || 0),
      indexIndividual: parseFloat(item.IndexIndividual || 0),
      offer: parseFloat(item.Offer || 0),
      offerVolume: parseInt(item.OfferVolume || 0),
      bid: parseFloat(item.Bid || 0),
      bidVolume: parseInt(item.BidVolume || 0),
      listedShares: parseInt(item.ListedShares || 0),
      tradableShares: parseInt(item.TradebleShares || 0),
      weightForIndex: parseInt(item.WeightForIndex || 0),
      foreignSell: parseInt(item.ForeignSell || 0),
      foreignBuy: parseInt(item.ForeignBuy || 0),
      delistingDate: item.DelistingDate || '',
      nonRegularVolume: parseInt(item.NonRegularVolume || 0),
      nonRegularValue: parseInt(item.NonRegularValue || 0),
      nonRegularFrequency: parseInt(item.NonRegularFrequency || 0),
    };
  }

  /**
   * Get market summary with top/bottom performers
   */
  async getMarketSummary(): Promise<MarketSummary> {
    const tickers = await this.getTradingSummary();

    if (tickers.length === 0) {
      throw new Error('No ticker data available');
    }

    // Calculate aggregated statistics
    const totalVolume = tickers.reduce((sum, t) => sum + t.volume, 0);
    const totalValue = tickers.reduce((sum, t) => sum + t.value, 0);
    const totalChange = tickers.reduce((sum, t) => sum + t.change, 0);
    const averageChangePercent = totalChange / tickers.length;

    // Top volume: sort by volume descending
    const topVolume = [...tickers].sort((a, b) => b.volume - a.volume).slice(0, 10);

    // Bottom volume: sort by volume ascending
    const bottomVolume = [...tickers].sort((a, b) => a.volume - b.volume).slice(0, 10);

    // Top value: sort by value descending
    const topValue = [...tickers].sort((a, b) => b.value - a.value).slice(0, 10);

    // Top frequency: sort by frequency descending
    const topFrequency = [...tickers]
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // Foreign top net buy: sort by (foreignBuy - foreignSell) descending
    const foreignTopNetBuy = [...tickers]
      .map((t) => ({
        ...t,
        netBuy: t.foreignBuy - t.foreignSell,
      }))
      .sort((a, b) => b.netBuy - a.netBuy)
      .slice(0, 10)
      .map(({ netBuy: _, ...t }) => t);

    // Foreign top net sell: sort by (foreignSell - foreignBuy) descending
    const foreignTopNetSell = [...tickers]
      .map((t) => ({
        ...t,
        netSell: t.foreignSell - t.foreignBuy,
      }))
      .sort((a, b) => b.netSell - a.netSell)
      .slice(0, 10)
      .map(({ netSell: _, ...t }) => t);

    // Date
    const date = tickers[0] ? isoDateToLocaleString(tickers[0].date) : 'Error: No date available';

    return {
      date,
      topVolume,
      bottomVolume,
      topValue,
      topFrequency,
      foreignTopNetBuy,
      foreignTopNetSell,
      totalTickers: tickers.length,
      totalVolume,
      totalValue,
      averageChangePercent,
    };
  }
}
