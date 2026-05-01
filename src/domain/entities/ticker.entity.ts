/**
 * Ticker Entity
 * Represents an IDX (Jakarta Stock Exchange) ticker subscription
 */
export class Ticker {
  constructor(
    readonly symbol: string, // e.g., "BBCA.JK"
    readonly name: string,
    readonly addedAt: Date = new Date()
  ) {
    if (!symbol || !symbol.includes('.JK')) {
      throw new Error('Invalid ticker symbol. Must be in format: SYMBOL.JK');
    }
    if (!name) {
      throw new Error('Ticker name is required');
    }
  }

  static create(symbol: string, name: string): Ticker {
    return new Ticker(symbol, name);
  }

  equals(other: Ticker): boolean {
    return this.symbol === other.symbol;
  }
}
