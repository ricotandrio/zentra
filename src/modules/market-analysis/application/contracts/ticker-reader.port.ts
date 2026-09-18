export interface TickerReaderPort {
  getTickers(): Promise<Array<{ symbol: string }>>;
}
