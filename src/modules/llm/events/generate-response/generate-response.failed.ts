import type { DomainEvent } from '@/shared/event-bus';

export interface GenerateResponseFailedEvent extends DomainEvent {
  type: 'llm:generate-response:failed';
  source: 'worker';
  data: {
    error: string;
  };
}
