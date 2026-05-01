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
    // Load ticker request files
    const singleTickerPath = path.join(__dirname, 'worker', 'market-analysis-single-request.json');
    const multipleTickersPath = path.join(__dirname, 'worker', 'market-analysis-multiple-request.json');
    const emptyTickersPath = path.join(__dirname, 'worker', 'market-analysis-empty-request.json');

    // Load market analysis response files
    const marketAnalysisResponsePath = path.join(__dirname, 'worker', 'market-analysis-single-response.json');
    const emptyAnalysisPath = path.join(__dirname, 'worker', 'market-analysis-empty-response.json');

    // Load webhook response files
    const webhookSuccessPath = path.join(__dirname, 'worker', 'webhook-success-response.json');
    const webhookServerErrorPath = path.join(__dirname, 'worker', 'webhook-server-error-response.json');
    const webhookBadRequestPath = path.join(__dirname, 'worker', 'webhook-bad-request-response.json');
    const webhookUnauthorizedPath = path.join(__dirname, 'worker', 'webhook-unauthorized-response.json');

    // Load webhook payload request files
    const webhookSinglePayloadPath = path.join(__dirname, 'worker', 'webhook-single-ticker-request.json');
    const webhookMultiplePayloadPath = path.join(__dirname, 'worker', 'webhook-multiple-ticker-request.json');

    const marketAnalysisData = JSON.parse(fs.readFileSync(marketAnalysisResponsePath, 'utf-8'));
    const emptyAnalysisData = JSON.parse(fs.readFileSync(emptyAnalysisPath, 'utf-8'));

    return {
      tickers: {
        single: JSON.parse(fs.readFileSync(singleTickerPath, 'utf-8')),
        multiple: JSON.parse(fs.readFileSync(multipleTickersPath, 'utf-8')),
        empty: JSON.parse(fs.readFileSync(emptyTickersPath, 'utf-8')),
      },
      marketAnalysisResponse: {
        single: marketAnalysisData.single,
        multiple: marketAnalysisData.multiple,
        empty: emptyAnalysisData,
      },
      httpResponses: {
        webhookSuccess: JSON.parse(fs.readFileSync(webhookSuccessPath, 'utf-8')),
        webhookServerError: JSON.parse(fs.readFileSync(webhookServerErrorPath, 'utf-8')),
        webhookBadRequest: JSON.parse(fs.readFileSync(webhookBadRequestPath, 'utf-8')),
        webhookUnauthorized: JSON.parse(fs.readFileSync(webhookUnauthorizedPath, 'utf-8')),
      },
      webhookPayload: {
        singleTicker: JSON.parse(fs.readFileSync(webhookSinglePayloadPath, 'utf-8')),
        multipleTickets: JSON.parse(fs.readFileSync(webhookMultiplePayloadPath, 'utf-8')),
      },
    };
  },
};

export default mocker;
