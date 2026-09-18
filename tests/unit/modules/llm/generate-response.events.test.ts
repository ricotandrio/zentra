import { InMemoryEventBus } from '@/shared/event-bus';
import {
  GenerateResponseCompletedEvent,
  GenerateResponseFailedEvent,
  GenerateResponseRequestedEvent,
  subscribeToGenerateResponseRequests,
} from '@/modules/llm/events';

describe('LLM generate-response events', () => {
  it('publishes a completed event with the request trace ID', async () => {
    const eventBus = new InMemoryEventBus();
    const useCase = { execute: jest.fn().mockResolvedValue('generated response') };
    const completed: GenerateResponseCompletedEvent[] = [];

    subscribeToGenerateResponseRequests(eventBus, useCase as never);
    eventBus.subscribe<GenerateResponseCompletedEvent>(
      'llm:generate-response:completed',
      (event) => {
        completed.push(event);
      }
    );

    const request: GenerateResponseRequestedEvent = {
      type: 'llm:generate-response:requested',
      source: 'worker',
      timestamp: new Date(),
      traceId: 'trace-123',
      data: { prompt: 'hello', userId: 'user-1' },
    };

    await eventBus.publish(request);

    expect(useCase.execute).toHaveBeenCalledWith('hello');
    expect(completed[0]).toMatchObject({
      type: 'llm:generate-response:completed',
      traceId: 'trace-123',
      data: {
        response: 'generated response',
        promptLength: 5,
        responseLength: 18,
      },
    });
  });

  it('publishes a failed event when the use case rejects', async () => {
    const eventBus = new InMemoryEventBus();
    const useCase = { execute: jest.fn().mockRejectedValue(new Error('provider failed')) };
    const failed: GenerateResponseFailedEvent[] = [];

    subscribeToGenerateResponseRequests(eventBus, useCase as never);
    eventBus.subscribe<GenerateResponseFailedEvent>(
      'llm:generate-response:failed',
      (event) => {
        failed.push(event);
      }
    );

    await eventBus.publish({
      type: 'llm:generate-response:requested',
      source: 'worker',
      timestamp: new Date(),
      traceId: 'trace-456',
      data: { prompt: 'hello', userId: 'user-1' },
    });

    expect(failed[0]).toMatchObject({
      type: 'llm:generate-response:failed',
      traceId: 'trace-456',
      data: { error: 'provider failed' },
    });
  });
});
