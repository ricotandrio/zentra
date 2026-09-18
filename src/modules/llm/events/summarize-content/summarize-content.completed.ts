import type { DomainEvent } from '@/shared/event-bus';
import type { LlmResponseContext } from '../response-context';

export interface SummarizeContentCompletedEvent extends DomainEvent {
  type: 'llm:summarize-content:completed';
  source: 'worker';
  data: {
    markdown: string;
    summary: string;
    responseContext: LlmResponseContext;
  };
}
