import { Request, Response } from 'express';
import { logging } from '@/shared/logger';
import { logReader } from '../utils/log-reader';

export const queryLogsController = () => {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { query = '{source="system"}', limit = 100, offset = 0, startDate, endDate } = req.query;

      logging.api.queryLogs({
        request: { method: req.method, path: req.path, query: { query, limit, offset, startDate, endDate } },
      });

      // Parse dates if provided
      let parsedStartDate: Date | undefined;
      let parsedEndDate: Date | undefined;

      if (typeof startDate === 'string') {
        parsedStartDate = new Date(startDate);
      }
      if (typeof endDate === 'string') {
        parsedEndDate = new Date(endDate);
      }

      const queryStr = typeof query === 'string' ? query : '{source="system"}';
      const limitNum = Math.min(parseInt(typeof limit === 'string' ? limit : '100'), 1000); // Max 1000
      const offsetNum = parseInt(typeof offset === 'string' ? offset : '0');

      const result = await logReader.queryLogs(queryStr, limitNum, offsetNum, parsedStartDate, parsedEndDate);

      logging.api.queryLogsFetched({ resultCount: result.logs.length, total: result.total });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      logging.api.queryLogsFailed({ error });

      res.status(500).json({
        success: false,
        error: message,
      });
    }
  };
};

export const getLogsStatsController = () => {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      logging.api.logsStats({
        request: { method: req.method, path: req.path },
      });

      let parsedStartDate: Date | undefined;
      let parsedEndDate: Date | undefined;

      if (typeof startDate === 'string') {
        parsedStartDate = new Date(startDate);
      }
      if (typeof endDate === 'string') {
        parsedEndDate = new Date(endDate);
      }

      const logs = await logReader.readLogsFromDateRange(parsedStartDate, parsedEndDate);

      // Calculate statistics
      const stats = {
        total: logs.length,
        bySource: {} as Record<string, number>,
        byOperation: {} as Record<string, number>,
        byLevel: {} as Record<string, number>,
        timeRange: {
          earliest: logs.length > 0 ? logs[logs.length - 1]!.timestamp : null,
          latest: logs.length > 0 ? logs[0]!.timestamp : null,
        },
      };

      logs.forEach((log) => {
        // Count by source
        if (log.source) {
          stats.bySource[log.source] = (stats.bySource[log.source] || 0) + 1;
        }

        // Count by operation
        if (log.operation) {
          stats.byOperation[log.operation] = (stats.byOperation[log.operation] || 0) + 1;
        }

        // Count by level
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      });

      logging.api.logsStatsFetched({ logCount: logs.length });

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      logging.api.logsStatsFailed({ error });

      res.status(500).json({
        success: false,
        error: message,
      });
    }
  };
};
