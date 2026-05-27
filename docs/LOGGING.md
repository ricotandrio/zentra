# LogQL Query Language

## Overview

Zentra uses a simplified LogQL query language for filtering and searching logs. While the web UI provides form-based filters for simplicity, the API still supports direct LogQL queries for advanced use cases.

## Query Syntax

### Label Filters

Match logs by structured fields using curly braces:

```
{source="api"}
{source="bot", operation="ping"}
{source="api", operation="market-analysis"}
```

**Available Labels:**
- `source` - Origin of the log: `api`, `bot`, `worker`, `system`
- `operation` - Operation name: `ping`, `market-analysis`, `login`, etc.
- `traceId` - Trace identifier for tracking related events
- `requestId` - Request identifier
- `eventId` - Event identifier

### Level Filter

Filter by log level:

```
level="error"
level="warn"
level="info"
level="debug"
```

**Supported Levels:** `trace`, `debug`, `info`, `warn`, `error`, `fatal`

### Trace ID Filter

Filter logs by trace ID to track related events across the system:

```
{traceId="2026-05-27T14:08:04.171Z"}
```

**Use Cases:**
- Track a complete market analysis workflow from trigger to completion
- Correlate logs from multiple services handling the same event
- Debug multi-step operations by finding all related log entries

### Message Filter

Search within log messages:

```
message contains "error"
message contains "timeout"
message contains "failed"
```

## Combined Queries

Queries can be combined using pipe (`|`) syntax:

```
{source="api"} | level="error"
{source="bot", operation="login"} | message contains "failed"
{source="api", operation="market-analysis"} | message contains "timeout"
{traceId="2026-05-27T14:08:04.171Z"}
```

## API Usage

### Query Logs Endpoint

```bash
GET /logs/query?query={query}&limit={limit}&offset={offset}&startDate={date}&endDate={date}
```

**Parameters:**
- `query` (string) - LogQL query. Default: `{source="system"}`
- `limit` (number) - Results per page. Max: 1000, Default: 100
- `offset` (number) - Pagination offset. Default: 0
- `startDate` (string) - Filter by start date (YYYY-MM-DD format)
- `endDate` (string) - Filter by end date (YYYY-MM-DD format)

**Example Requests:**

```bash
# Get API logs
curl "http://localhost:3000/logs/query?query={source=\"api\"}&limit=50"

# Get error logs from bot
curl "http://localhost:3000/logs/query?query={source=\"bot\"} | level=\"error\"&limit=100"

# Get market analysis logs with date range
curl "http://localhost:3000/logs/query?query={source=\"api\", operation=\"market-analysis\"}&startDate=2026-05-27&endDate=2026-05-27"
```

### Response Format

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "timestamp": "2026-05-27T14:08:04.171Z",
        "level": "info",
        "source": "api",
        "operation": "server-startup",
        "message": "API server running on http://localhost:3000",
        "metadata": {
          "port": 3000
        }
      }
    ],
    "total": 42,
    "limit": 50,
    "offset": 0
  }
}
```

## Web UI Filter Form

The web UI converts form inputs into LogQL queries automatically:

| Form Field | LogQL Equivalent |
|---|---|
| Source: "api" | `{source="api"}` |
| Source: "api" + Operation: "ping" | `{source="api", operation="ping"}` |
| Trace ID: "trace-123" | `{traceId="trace-123"}` |
| Request ID: "req-456" | `{requestId="req-456"}` |
| Event ID: "evt-789" | `{eventId="evt-789"}` |
| Level: "error" | `\| level="error"` |
| Message: "timeout" | `\| message contains "timeout"` |
| Multiple filters | Combined with `\|` |

## Default Behavior

When no query is provided, the system defaults to:

```
{source="system"}
```

This returns system-level logs only.

## Performance Notes

- Logs are stored by date in separate files: `data/log/YYYY-MM-DD/app.log`
- Date range filtering (`startDate`, `endDate`) improves query performance
- Results are paginated with a maximum of 1000 entries per request
- In-memory filtering is used; large date ranges may impact performance

## Limitations

- Cannot combine multiple label values with OR logic (e.g., `{source="api" OR source="bot"}`)
- Regex patterns are not supported in message filters
- Queries are case-insensitive for values
- Maximum query result size: 1000 entries
