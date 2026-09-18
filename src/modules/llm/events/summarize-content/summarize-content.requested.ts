import type { DomainEvent } from '@/shared/event-bus';

export interface SummarizeContentRequestedEvent extends DomainEvent {
  type: 'llm:summarize-content:requested';
  source: 'worker';
  data: {
    url: string;
    userId: string;
  };
}
