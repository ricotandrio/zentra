import YahooFinance from 'yahoo-finance2';
import {
  MarketQuote,
  NewsArticle,
  SentimentResult,
  MarketAnalysis,
} from './yahoo.types';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// ─── Sentiment Keywords ───────────────────────────────────────────────────────
// Simple lexicon-based sentiment — no LLM needed for POC
// Can be replaced with Gemini call for better accuracy

const BULLISH_SIGNALS: string[] = [
  'profit', 'growth', 'surge', 'rally', 'beat', 'record', 'strong',
  'upgrade', 'buy', 'outperform', 'positive', 'gain', 'rise', 'up',
  'laba', 'naik', 'tumbuh', 'kuat', 'meningkat', 'untung', 'dividen',
  'bullish', 'rebound', 'recovery', 'expand', 'acquisition', 'partnership',
];

const BEARISH_SIGNALS: string[] = [
  'loss', 'decline', 'drop', 'fall', 'miss', 'weak', 'downgrade',
  'sell', 'underperform', 'negative', 'risk', 'concern', 'below',
  'rugi', 'turun', 'melemah', 'menurun', 'tekanan', 'jual',
  'bearish', 'crash', 'default', 'debt', 'lawsuit', 'fraud', 'cut',
];

// ─── Sentiment Analysis ───────────────────────────────────────────────────────

function analyzeSentiment(text: string): SentimentResult {
  const normalized = text.toLowerCase();
  const words = normalized.split(/\s+/);

  const foundBullish = BULLISH_SIGNALS.filter((s) =>
    words.some((w) => w.includes(s))
  );

  const foundBearish = BEARISH_SIGNALS.filter((s) =>
    words.some((w) => w.includes(s))
  );

  const bullishCount = foundBullish.length;
  const bearishCount = foundBearish.length;
  const total = bullishCount + bearishCount;

  const score =
    total === 0 ? 0 : parseFloat(((bullishCount - bearishCount) / total).toFixed(2));

  const label: SentimentResult['label'] =
    score > 0.1 ? 'bullish' : score < -0.1 ? 'bearish' : 'neutral';

  return {
    label,
    score,
    signals: [
      ...foundBullish.map((s) => `+${s}`),
      ...foundBearish.map((s) => `-${s}`),
    ].slice(0, 8),
  };
}

function aggregateSentiments(articles: NewsArticle[]): SentimentResult {
  if (articles.length === 0) {
    return { label: 'neutral', score: 0, signals: [] };
  }

  // Analyze sentiment for each article
  const sentiments = articles.map((a) => analyzeSentiment(a.title));

  // Weight recent articles more (first = most recent)
  const weightedScore = sentiments.reduce((sum, sentiment, i) => {
    const weight = 1 / (i + 1);
    return sum + sentiment.score * weight;
  }, 0);

  const totalWeight = sentiments.reduce((sum, _, i) => sum + 1 / (i + 1), 0);
  const score = parseFloat((weightedScore / totalWeight).toFixed(2));

  const allSignals = sentiments.flatMap((s) => s.signals);
  const signalFreq: Record<string, number> = {};
  for (const s of allSignals) {
    signalFreq[s] = (signalFreq[s] ?? 0) + 1;
  }

  const topSignals = Object.entries(signalFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([s]) => s);

  const label: SentimentResult['label'] =
    score > 0.1 ? 'bullish' : score < -0.1 ? 'bearish' : 'neutral';

  return { label, score, signals: topSignals };
}

// ─── Data Fetchers ───────────────────────────────────────────────────────────

async function fetchQuote(ticker: string): Promise<MarketQuote> {
  const result = await yahooFinance.quote(ticker);

  return {
    ticker,
    name: result.longName ?? result.shortName ?? ticker,
    price: result.regularMarketPrice ?? 0,
    previousClose: result.regularMarketPreviousClose ?? 0,
    change: result.regularMarketChange ?? 0,
    changePercent: result.regularMarketChangePercent ?? 0,
    volume: result.regularMarketVolume ?? 0,
    marketCap: result.marketCap ?? null,
    fiftyTwoWeekHigh: result.fiftyTwoWeekHigh ?? 0,
    fiftyTwoWeekLow: result.fiftyTwoWeekLow ?? 0,
  };
}

async function fetchNews(ticker: string, newsLimit: number = 10): Promise<NewsArticle[]> {
  const result = await yahooFinance.search(ticker, {
    newsCount: newsLimit,
    quotesCount: 0,
  });

  return (result.news ?? []).map((item) => ({
    title: item.title,
    publisher: item.publisher ?? 'Unknown',
    publishedAt: new Date((Number(item.providerPublishTime) || 0) * 1000),
    url: item.link ?? '',
  }));
}

function generateSummary(quote: MarketQuote, sentiment: SentimentResult): string {
  const direction = quote.change >= 0 ? 'up' : 'down';
  const emoji =
    sentiment.label === 'bullish' ? '🟢' : sentiment.label === 'bearish' ? '🔴' : '🟡';

  const changePercent = quote.changePercent as number;
  const priceStr = `${quote.ticker} is ${direction} ${Math.abs(changePercent).toFixed(2)}% at Rp${quote.price.toLocaleString()}`;
  const sentimentStr = `News sentiment is ${sentiment.label} (score: ${sentiment.score})`;
  const signalStr =
    sentiment.signals.length > 0
      ? `Key signals: ${sentiment.signals.join(', ')}`
      : 'No strong signals detected';

  return `${emoji} ${priceStr}. ${sentimentStr}. ${signalStr}.`;
}

// ─── Main Analyzer ───────────────────────────────────────────────────────────

export async function analyzeMarket(ticker: string): Promise<MarketAnalysis> {
  const [quote, news] = await Promise.all([
    fetchQuote(ticker),
    fetchNews(ticker),
  ]);

  const overallSentiment = aggregateSentiments(news);
  const summary = generateSummary(quote, overallSentiment);

  return { quote, news, overallSentiment, summary };
}

export async function analyzeMultipleTickers(tickers: string[]): Promise<MarketAnalysis[]> {
  return Promise.all(tickers.map((ticker) => analyzeMarket(ticker)));
}
