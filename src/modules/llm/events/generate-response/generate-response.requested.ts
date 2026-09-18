import type { DomainEvent } from '@/shared/event-bus';

export interface GenerateResponseRequestedEvent extends DomainEvent {
  type: 'llm:generate-response:requested';
  source: 'worker';
  data: {
    prompt: string;
    userId: string;
  };
}
