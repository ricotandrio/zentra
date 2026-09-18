import type { DomainEvent } from '@/shared/event-bus';
import type { LlmResponseContext } from '../response-context';

export interface GenerateResponseCompletedEvent extends DomainEvent {
  type: 'llm:generate-response:completed';
  source: 'worker';
  data: {
    response: string;
    promptLength: number;
    responseLength: number;
    responseContext: LlmResponseContext;
  };
}
