import type { DomainEvent } from '@/shared/event-bus';
import type { LlmResponseContext } from '../response-context';

export interface SummarizeContentFailedEvent extends DomainEvent {
  type: 'llm:summarize-content:failed';
  source: 'worker';
  data: {
    error: string;
    responseContext: LlmResponseContext;
  };
}
