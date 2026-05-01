# Test Mocks

This directory contains centralized mock data for tests in JSON format.

## Directory Structure

```
tests/mocks/
├── worker/                                    # Mocks for worker tests
│   ├── market-analysis-single-request.json   # Single ticker request
│   ├── market-analysis-multiple-request.json # Multiple tickers request
│   ├── market-analysis-empty-request.json    # Empty tickers request
│   ├── market-analysis-single-response.json  # Market analysis response (single & multiple)
│   ├── market-analysis-empty-response.json   # Empty analysis response
│   ├── webhook-single-ticker-request.json    # Webhook payload for single ticker
│   ├── webhook-multiple-ticker-request.json  # Webhook payload for multiple tickers
│   ├── webhook-success-response.json         # HTTP 200 success response
│   ├── webhook-server-error-response.json    # HTTP 500 error response
│   ├── webhook-bad-request-response.json     # HTTP 400 error response
│   └── webhook-unauthorized-response.json    # HTTP 401 error response
├── common/                                    # Shared mocks (for future expansion)
└── loader.ts                                  # Mock loader utility
```

## File Organization

### Request Files (Input Data)
- **market-analysis-*-request.json** - Ticker data for market analysis
  - `single-request`: Single ticker (BBCA.JK)
  - `multiple-request`: Array of 2 tickers (BBCA.JK, BMRI.JK)
  - `empty-request`: Empty array

- **webhook-*-request.json** - Webhook payload data
  - `single-ticker-request`: Payload with 1 analysis result
  - `multiple-ticker-request`: Payload with 2 analysis results

### Response Files (Output Data)
- **market-analysis-*-response.json** - Market analysis API responses
  - `single-response`: Contains both single and multiple analysis results
  - `empty-response`: Empty analysis array

- **webhook-*-response.json** - HTTP responses from webhook calls
  - `success-response`: HTTP 200 OK
  - `server-error-response`: HTTP 500 Internal Server Error
  - `bad-request-response`: HTTP 400 Bad Request
  - `unauthorized-response`: HTTP 401 Unauthorized

## Usage

### Loading Mocks in Tests

Tests now import JSON files directly rather than using a loader utility:

```typescript
// Import mocks directly from JSON files
import singleTickerRequest from '../../../mocks/worker/market-analysis-single-request.json';
import multipleTickersRequest from '../../../mocks/worker/market-analysis-multiple-request.json';
import analysisResponseData from '../../../mocks/worker/market-analysis-single-response.json';
import webhookSuccessResponse from '../../../mocks/worker/webhook-success-response.json';
import webhookServerErrorResponse from '../../../mocks/worker/webhook-server-error-response.json';

// Use imported data directly
const mockTickers = [
  Ticker.create(singleTickerRequest.symbol, singleTickerRequest.name),
];
```

## Examples

### Using Tickers in Tests

```typescript
import singleTickerRequest from '../../../mocks/worker/market-analysis-single-request.json';
import multipleTickersRequest from '../../../mocks/worker/market-analysis-multiple-request.json';

const mockTickers = [
  Ticker.create(multipleTickersRequest[0].symbol, multipleTickersRequest[0].name),
  Ticker.create(multipleTickersRequest[1].symbol, multipleTickersRequest[1].name),
];
```

### Using HTTP Responses

```typescript
import webhookSuccessResponse from '../../../mocks/worker/webhook-success-response.json';

const mockResponse = {
  ok: webhookSuccessResponse.ok,
  status: webhookSuccessResponse.status,
  json: jest.fn().mockResolvedValue(webhookSuccessResponse.body),
};
```

### Using Market Analysis Data

```typescript
import analysisResponseData from '../../../mocks/worker/market-analysis-single-response.json';

mockAnalyzeMarketUseCase.prototype.analyzeMultipleTickers = jest
  .fn()
  .mockResolvedValue(analysisResponseData.multiple);
```

## Benefits

1. **Direct Imports**: No loader utility needed - import JSON directly
2. **Simple**: Straightforward file imports that any IDE understands
3. **Maintainable**: JSON files are easy to read and modify
4. **Reusable**: Share mock files across multiple tests
5. **Type-safe**: Use with TypeScript for better IDE support
6. **Version-controllable**: Mock data is tracked in git

## Adding New Mocks

1. Create a new JSON file in the appropriate subdirectory following the naming convention
2. Import the file directly in your test:
   ```typescript
   import myNewMock from '../../../mocks/worker/my-new-mock.json';
   ```
3. Use the imported data directly in your test
4. Update this README with the new file documentation

### Naming Convention
- `feature-request.json` - Input/request data
- `feature-response.json` - Output/response data
