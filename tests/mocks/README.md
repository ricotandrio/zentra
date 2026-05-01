# Test Mocks

This directory contains centralized mock data for tests in JSON format.

## Directory Structure

```
tests/mocks/
├── worker/              # Mocks specific to worker tests
│   ├── tickers.json    # Mock ticker data (single, multiple, empty)
│   ├── market-analysis-response.json  # Mock market analysis API responses
│   ├── http-responses.json            # Mock HTTP responses (success, errors)
│   └── webhook-payload.json           # Mock webhook payloads
├── common/             # Shared mocks (for future expansion)
└── loader.ts          # Mock loader utility
```

## Usage

### Loading Mocks in Tests

```typescript
import mocker from '../../../mocks/loader';

// Load all worker mocks
const mocks = mocker.loadWorkerMocks();

// Access specific mocks
const singleTicker = mocks.tickers.single;
const multipleTickers = mocks.tickers.multiple;
const successResponse = mocks.httpResponses.webhookSuccess;
const marketAnalysis = mocks.marketAnalysisResponse.single;
```

### Available Mock Data

#### Tickers (`tickers.json`)
- `single`: Single ticker object (BBCA.JK)
- `multiple`: Array of 2 tickers (BBCA.JK, BMRI.JK)
- `empty`: Empty array for no-data scenarios

#### Market Analysis Response (`market-analysis-response.json`)
- `single`: Single ticker analysis result
- `multiple`: Array of 2 ticker analysis results
- `empty`: Empty array

#### HTTP Responses (`http-responses.json`)
- `webhookSuccess`: 200 OK response
- `webhookServerError`: 500 Internal Server Error
- `webhookBadRequest`: 400 Bad Request
- `webhookUnauthorized`: 401 Unauthorized

#### Webhook Payload (`webhook-payload.json`)
- `singleTicker`: Payload with 1 result
- `multipleTickets`: Payload with 2 results

## Benefits

1. **Centralized**: All mock data in one place, easy to update
2. **Maintainable**: JSON files are easy to read and modify
3. **Reusable**: Share mocks across multiple tests
4. **Type-safe**: Use with TypeScript for better IDE support
5. **Version-controllable**: Mock data is tracked in git

## Adding New Mocks

1. Create a new JSON file in the appropriate subdirectory
2. Update `loader.ts` to load and expose the new mocks
3. Update this README with the new mock structure
4. Import and use the mocks in your tests

## Example: Using Tickers in Tests

```typescript
const mockTickers = [
  Ticker.create(mocks.tickers.multiple[0].symbol, mocks.tickers.multiple[0].name),
  Ticker.create(mocks.tickers.multiple[1].symbol, mocks.tickers.multiple[1].name),
];
```

## Example: Using HTTP Responses

```typescript
const mockResponse = {
  ok: mocks.httpResponses.webhookSuccess.ok,
  status: mocks.httpResponses.webhookSuccess.status,
  json: jest.fn().mockResolvedValue(mocks.httpResponses.webhookSuccess.body),
};
```
