import type { DomainEvent } from '@/shared/event-bus';
import type { LlmResponseContext } from '../response-context';

export interface SummarizeContentRequestedEvent extends DomainEvent {
  type: 'llm:summarize-content:requested';
  source: 'worker';
  data: {
    url: string;
    userId: string;
    responseContext: LlmResponseContext;
  };
}
