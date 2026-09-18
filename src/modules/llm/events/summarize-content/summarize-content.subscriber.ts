import { IEventBus } from '@/shared/event-bus';
import { SummarizeContentUseCase } from '../../application/usecases/summarize-content.usecase';
import { SummarizeContentCompletedEvent } from './summarize-content.completed';
import { SummarizeContentFailedEvent } from './summarize-content.failed';
import { SummarizeContentRequestedEvent } from './summarize-content.requested';

export function subscribeToSummarizeContentRequests(
  eventBus: IEventBus,
  useCase: SummarizeContentUseCase
): () => void {
  return eventBus.subscribe<SummarizeContentRequestedEvent>(
    'llm:summarize-content:requested',
    async (event) => {
      try {
        const result = await useCase.execute(event.data.url);
        const completedEvent: SummarizeContentCompletedEvent = {
          type: 'llm:summarize-content:completed',
          source: 'worker',
          timestamp: new Date(),
          traceId: event.traceId,
          data: {
            ...result,
            responseContext: event.data.responseContext,
          },
        };
        await eventBus.publish(completedEvent);
      } catch (error) {
        const failedEvent: SummarizeContentFailedEvent = {
          type: 'llm:summarize-content:failed',
          source: 'worker',
          timestamp: new Date(),
          traceId: event.traceId,
          data: {
            error: error instanceof Error ? error.message : String(error),
            responseContext: event.data.responseContext,
          },
        };
        await eventBus.publish(failedEvent);
      }
    }
  );
}
