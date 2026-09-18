import type { DomainEvent } from '@/shared/event-bus';
import type { LlmResponseContext } from '../response-context';

export interface GenerateResponseRequestedEvent extends DomainEvent {
  type: 'llm:generate-response:requested';
  source: 'worker';
  data: {
    prompt: string;
    userId: string;
    responseContext: LlmResponseContext;
  };
}
