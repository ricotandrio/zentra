import fs from 'fs';
import path from 'path';

export interface ParsedLogEntry {
  timestamp: string;
  level: string;
  source?: string;
  operation?: string;
  traceId?: string;
  requestId?: string;
  eventId?: string;
  message: string;
  metadata?: Record<string, unknown>;
  error?: unknown;
}

/**
 * Parse LogQL-style filters
 * Examples:
 * - {source="api"}
 * - {source="api", operation="ping"}
 * - {source="api"} | json message="error"
 */
export interface LogQLFilter {
  labelFilters: Record<string, string>;
  messageFilter?: string;
  level?: string;
}

export class LogReader {
  private logDir = path.join(process.cwd(), 'data', 'log');

  /**
   * Parse LogQL query format
   * Format: {label="value", label2="value2"} | json message="filter"
   */
  parseLogQL(query: string): LogQLFilter {
    const filter: LogQLFilter = {
      labelFilters: {},
    };

    // Extract label filters: {source="api", operation="ping"}
    const labelMatch = query.match(/\{([^}]+)\}/);
    if (labelMatch) {
      const labelStr = labelMatch[1];
      const pairs = labelStr!.split(',').map((p) => p.trim());

      pairs.forEach((pair) => {
        const [key, value] = pair.split('=').map((s) => s.trim());
        if (key && value) {
          // Remove quotes from value
          const cleanValue = value.replace(/^["']|["']$/g, '');
          filter.labelFilters[key] = cleanValue;
        }
      });
    }

    // Extract message filter: | message contains "pattern"
    const messageMatch = query.match(/\|\s*message\s*contains?\s*["']([^"']+)["']/i);
    if (messageMatch) {
      filter.messageFilter = messageMatch[1]!;
    }

    // Extract level filter: level="error"
    const levelMatch = query.match(/level\s*=\s*["']([^"']+)["']/i);
    if (levelMatch) {
      filter.level = levelMatch[1]!.toLowerCase();
    }

    return filter;
  }

  /**
   * Read all log files from a date range
   */
  async readLogsFromDateRange(startDate?: Date, endDate?: Date): Promise<ParsedLogEntry[]> {
    const logs: ParsedLogEntry[] = [];

    try {
      if (!fs.existsSync(this.logDir)) {
        return logs;
      }

      const dateDirs = fs.readdirSync(this.logDir).filter((f) => {
        const stat = fs.statSync(path.join(this.logDir, f));
        return stat.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(f);
      });

      // Filter by date range
      const filteredDates = dateDirs.filter((dateStr) => {
        const fileDate = new Date(dateStr);
        if (startDate && fileDate < startDate) return false;
        if (endDate && fileDate > endDate) return false;
        return true;
      });

      // Read logs from each date directory
      for (const dateStr of filteredDates) {
        const logFilePath = path.join(this.logDir, dateStr, 'app.log');
        if (fs.existsSync(logFilePath)) {
          const fileLogs = this.readLogFile(logFilePath);
          logs.push(...fileLogs);
        }
      }

      return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error reading logs:', error);
      return logs;
    }
  }

  /**
   * Read and parse a single log file
   */
  private readLogFile(filePath: string): ParsedLogEntry[] {
    const logs: ParsedLogEntry[] = [];

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter((line) => line.trim());

      lines.forEach((line) => {
        try {
          const parsed = JSON.parse(line);
          const entry: ParsedLogEntry = {
            timestamp: parsed.time || new Date().toISOString(),
            level: parsed.level || 'info',
            source: parsed.source,
            operation: parsed.operation,
            traceId: parsed.traceId,
            requestId: parsed.requestId,
            eventId: parsed.eventId,
            message: parsed.msg || '',
            metadata: parsed.metadata,
            error: parsed.error,
          };
          logs.push(entry);
        } catch (e) {
          // Skip malformed JSON lines
          console.warn(e);
        }
      });
    } catch (error) {
      console.error(`Error reading log file ${filePath}:`, error);
    }

    return logs;
  }

  /**
   * Filter logs based on LogQL filter
   */
  filterLogs(logs: ParsedLogEntry[], filter: LogQLFilter): ParsedLogEntry[] {
    return logs.filter((log) => {
      // Check label filters
      for (const [key, value] of Object.entries(filter.labelFilters)) {
        if (key === 'source' && log.source !== value) return false;
        if (key === 'operation' && log.operation !== value) return false;
        if (key === 'traceId' && log.traceId !== value) return false;
        if (key === 'requestId' && log.requestId !== value) return false;
        if (key === 'eventId' && log.eventId !== value) return false;
      }

      // Check level filter
      if (filter.level && log.level !== filter.level) return false;

      // Check message filter
      if (filter.messageFilter && !log.message.toLowerCase().includes(filter.messageFilter.toLowerCase())) {
        return false;
      }

      return true;
    });
  }

  /**
   * Query logs with pagination
   */
  async queryLogs(
    logqlQuery: string,
    limit: number = 100,
    offset: number = 0,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    logs: ParsedLogEntry[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const logs = await this.readLogsFromDateRange(startDate, endDate);
    const filter = this.parseLogQL(logqlQuery);
    const filtered = this.filterLogs(logs, filter);

    return {
      logs: filtered.slice(offset, offset + limit),
      total: filtered.length,
      limit,
      offset,
    };
  }
}

export const logReader = new LogReader();
