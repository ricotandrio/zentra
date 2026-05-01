import * as path from 'path';
import * as fs from 'fs';

interface MocksLoader {
  loadWorkerMocks: () => {
    tickers: Record<string, any>;
    marketAnalysisResponse: Record<string, any>;
    httpResponses: Record<string, any>;
    webhookPayload: Record<string, any>;
  };
}

const mocker: MocksLoader = {
  loadWorkerMocks() {
    const tickersPath = path.join(__dirname, 'worker', 'tickers.json');
    const marketAnalysisPath = path.join(__dirname, 'worker', 'market-analysis-response.json');
    const httpResponsesPath = path.join(__dirname, 'worker', 'http-responses.json');
    const webhookPayloadPath = path.join(__dirname, 'worker', 'webhook-payload.json');

    return {
      tickers: JSON.parse(fs.readFileSync(tickersPath, 'utf-8')),
      marketAnalysisResponse: JSON.parse(fs.readFileSync(marketAnalysisPath, 'utf-8')),
      httpResponses: JSON.parse(fs.readFileSync(httpResponsesPath, 'utf-8')),
      webhookPayload: JSON.parse(fs.readFileSync(webhookPayloadPath, 'utf-8')),
    };
  },
};

export default mocker;
