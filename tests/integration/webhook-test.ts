/**
 * Webhook Integration Test
 * 
 * Tests the market analysis webhook integration between worker and API
 * 
 * Run with:
 * 1. Terminal 1: npm run dev:api
 * 2. Terminal 2: npm run dev:worker
 * 3. Terminal 3: npx ts-node tests/integration/webhook-test.ts
 */

import fetch from 'node-fetch';
import { WorkerWebhookPayload } from '@/application/dto/market-results.dto';

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/webhooks/market-results';
const CHANNEL_ID = process.env.DISCORD_STANDUP_CHANNEL_ID || '123456789';

// Mock market analysis results
const mockPayload: WorkerWebhookPayload = {
  source: 'market-analysis-job',
  timestamp: new Date().toISOString(),
  channelId: CHANNEL_ID,
  results: [
    {
      ticker: 'BBCA.JK',
      price: 8650,
      changePercent: 1.25,
      sentiment: {
        label: 'bullish',
        score: 0.45,
        signals: ['+growth', '+positive', '-risk'],
      },
      volume: 15000000,
      fiftyTwoWeekHigh: 9500,
      fiftyTwoWeekLow: 7800,
      newsCount: 5,
      topHeadlines: [
        'BBCA posts strong Q1 profit',
        'Dividend announcement confirmed',
        'Market share increases',
      ],
    },
    {
      ticker: 'BBRI.JK',
      price: 4200,
      changePercent: -0.85,
      sentiment: {
        label: 'neutral',
        score: 0.05,
        signals: ['+growth', '-weakness'],
      },
      volume: 25000000,
      fiftyTwoWeekHigh: 4800,
      fiftyTwoWeekLow: 3500,
      newsCount: 3,
      topHeadlines: [
        'BBRI maintains market position',
        'Slight pressure from competition',
      ],
    },
  ],
};

async function testWebhook(): Promise<void> {
  try {
    console.log('🚀 Testing webhook integration...\n');
    console.log(`📨 Sending to: ${WEBHOOK_URL}`);
    console.log(`📍 Channel ID: ${CHANNEL_ID}`);
    console.log(`📊 Tickers: ${mockPayload.results.map((r) => r.ticker).join(', ')}\n`);

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockPayload),
    });

    const responseData = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      console.error('❌ Webhook failed:\n', responseData);
      process.exit(1);
    }

    console.log('✅ Webhook successful!\n');
    console.log('📋 Response:\n', JSON.stringify(responseData, null, 2));

    console.log('\n🎉 Check your Discord channel for the market analysis embeds!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testWebhook();
