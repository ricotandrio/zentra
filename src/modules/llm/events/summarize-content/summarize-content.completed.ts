import type { DomainEvent } from '@/shared/event-bus';

export interface SummarizeContentCompletedEvent extends DomainEvent {
  type: 'llm:summarize-content:completed';
  source: 'worker';
  data: {
    markdown: string;
    summary: string;
  };
}
