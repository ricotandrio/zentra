export class Ticker {
  constructor(
    readonly symbol: string,
    readonly addedAt: Date = new Date()
  ) {
    if (!symbol || !symbol.includes('.JK')) {
      throw new Error('Invalid ticker symbol. Must be in format: SYMBOL.JK');
    }
  }

  equals(other: Ticker): boolean {
    return this.symbol === other.symbol;
  }
}
