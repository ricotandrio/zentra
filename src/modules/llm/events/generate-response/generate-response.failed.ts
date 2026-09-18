import type { DomainEvent } from '@/shared/event-bus';
import type { LlmResponseContext } from '../response-context';

export interface GenerateResponseFailedEvent extends DomainEvent {
  type: 'llm:generate-response:failed';
  source: 'worker';
  data: {
    error: string;
    responseContext: LlmResponseContext;
  };
}
