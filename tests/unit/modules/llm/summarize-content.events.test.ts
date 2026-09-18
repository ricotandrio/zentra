import { InMemoryEventBus } from '@/shared/event-bus';
import {
  SummarizeContentCompletedEvent,
  SummarizeContentFailedEvent,
  SummarizeContentRequestedEvent,
  subscribeToSummarizeContentRequests,
} from '@/modules/llm/events';

describe('LLM summarize-content events', () => {
  it('publishes a completed event with the summary result', async () => {
    const eventBus = new InMemoryEventBus();
    const useCase = {
      execute: jest.fn().mockResolvedValue({ markdown: '# Article', summary: 'Summary' }),
    };
    const completed: SummarizeContentCompletedEvent[] = [];

    subscribeToSummarizeContentRequests(eventBus, useCase as never);
    eventBus.subscribe<SummarizeContentCompletedEvent>(
      'llm:summarize-content:completed',
      (event) => completed.push(event)
    );

    const request: SummarizeContentRequestedEvent = {
      type: 'llm:summarize-content:requested',
      source: 'worker',
      timestamp: new Date(),
      traceId: 'summary-trace-123',
      data: { url: 'https://example.com/article', userId: 'user-1' },
    };

    await eventBus.publish(request);

    expect(useCase.execute).toHaveBeenCalledWith('https://example.com/article');
    expect(completed[0]).toMatchObject({
      type: 'llm:summarize-content:completed',
      source: 'worker',
      traceId: 'summary-trace-123',
      data: { markdown: '# Article', summary: 'Summary' },
    });
  });

  it('publishes a failed event when summarization rejects', async () => {
    const eventBus = new InMemoryEventBus();
    const useCase = { execute: jest.fn().mockRejectedValue(new Error('scrape failed')) };
    const failed: SummarizeContentFailedEvent[] = [];

    subscribeToSummarizeContentRequests(eventBus, useCase as never);
    eventBus.subscribe<SummarizeContentFailedEvent>(
      'llm:summarize-content:failed',
      (event) => failed.push(event)
    );

    await eventBus.publish({
      type: 'llm:summarize-content:requested',
      source: 'worker',
      timestamp: new Date(),
      traceId: 'summary-trace-456',
      data: { url: 'https://example.com/broken', userId: 'user-1' },
    });

    expect(failed[0]).toMatchObject({
      type: 'llm:summarize-content:failed',
      source: 'worker',
      traceId: 'summary-trace-456',
      data: { error: 'scrape failed' },
    });
  });
});
