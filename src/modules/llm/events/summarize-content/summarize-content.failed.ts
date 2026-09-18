import type { DomainEvent } from '@/shared/event-bus';

export interface SummarizeContentFailedEvent extends DomainEvent {
  type: 'llm:summarize-content:failed';
  source: 'worker';
  data: {
    error: string;
  };
}
