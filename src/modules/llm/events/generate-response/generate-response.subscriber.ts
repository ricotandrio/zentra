import { IEventBus } from '@/shared/event-bus';
import { GenerateResponseUseCase } from '../../application/usecases/generate-response.usecase';
import { GenerateResponseCompletedEvent } from './generate-response.completed';
import { GenerateResponseFailedEvent } from './generate-response.failed';
import { GenerateResponseRequestedEvent } from './generate-response.requested';

export function subscribeToGenerateResponseRequests(
  eventBus: IEventBus,
  useCase: GenerateResponseUseCase
): () => void {
  return eventBus.subscribe<GenerateResponseRequestedEvent>(
    'llm:generate-response:requested',
    async (event) => {
      try {
        const response = await useCase.execute(event.data.prompt);
        const completedEvent: GenerateResponseCompletedEvent = {
          type: 'llm:generate-response:completed',
          source: 'worker',
          timestamp: new Date(),
          traceId: event.traceId,
          data: {
            response,
            promptLength: event.data.prompt.length,
            responseLength: response.length,
          },
        };
        await eventBus.publish(completedEvent);
      } catch (error) {
        const failedEvent: GenerateResponseFailedEvent = {
          type: 'llm:generate-response:failed',
          source: 'worker',
          timestamp: new Date(),
          traceId: event.traceId,
          data: {
            error: error instanceof Error ? error.message : String(error),
          },
        };
        await eventBus.publish(failedEvent);
      }
    }
  );
}
