import { Logger } from 'pino';
import { logger as defaultLogger } from './logger';
import { createApiLogger } from './api.logger';
import { createSystemLogger } from './system.logger';
import { createEventBusLogger } from './event-bus.logger';
import { createBotLogger } from './bot.logger';
import { createSchedulerLogger } from './scheduler.logger';
import { createMarketAnalysisLogger } from './market-analysis.logger';
import { createLlmLogger } from './llm.logger';
import { createInfraLogger } from './infra.logger';

export interface RequestInfo {
  method?: string;
  path?: string;
  params?: unknown;
  query?: unknown;
  body?: unknown;
}

export interface ResponseInfo {
  statusCode?: number;
  body?: unknown;
}

export class LoggingService {
  private logger: Logger;
  readonly api;
  readonly bot;
  readonly marketAnalysis;
  readonly scheduler;
  readonly eventBus;
  readonly system;
  readonly llm;
  readonly infra;

  constructor(logger: Logger = defaultLogger) {
    this.logger = logger;
    this.api = createApiLogger(this.logger);
    this.bot = createBotLogger(this.logger);
    this.marketAnalysis = createMarketAnalysisLogger(this.logger);
    this.scheduler = createSchedulerLogger(this.logger);
    this.eventBus = createEventBusLogger(this.logger);
    this.system = createSystemLogger(this.logger);
    this.llm = createLlmLogger(this.logger);
    this.infra = createInfraLogger(this.logger);
  }
}

export const logging = new LoggingService();
