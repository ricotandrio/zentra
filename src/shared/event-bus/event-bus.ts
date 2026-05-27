import { ApplicationEvent, EventHandler } from './event.types';
import { logger } from '../logger/logger';

/**
 * In-memory Event Bus
 * Minimal pub/sub implementation for decoupling API, Worker, and Bot interfaces
 */
export interface IEventBus {
  /**
   * Subscribe to events of a specific type
   * @param eventType - The type of event to subscribe to (e.g., 'market-analysis:complete')
   * @param handler - Function to execute when event is published
   * @returns Unsubscribe function
   */
  subscribe<T extends ApplicationEvent>(
    eventType: T['type'],
    handler: EventHandler<T>
  ): () => void;

  /**
   * Publish an event to all subscribers
   * @param event - The event to publish
   */
  publish(event: ApplicationEvent): Promise<void>;

  /**
   * Clear all subscriptions (useful for testing)
   */
  clear(): void;
}

/**
 * Default implementation of the event bus
 * Uses a Map to store subscribers by event type
 */
export class InMemoryEventBus implements IEventBus {
  private subscribers: Map<string, EventHandler[]> = new Map();

  subscribe<T extends ApplicationEvent>(
    eventType: T['type'],
    handler: EventHandler<T>
  ): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }

    const handlers = this.subscribers.get(eventType)!;
    handlers.push(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      const index = handlers.indexOf(handler as EventHandler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  async publish(event: ApplicationEvent): Promise<void> {
    // Log event publication
    logger.info({
      source: event.source,
      operation: `publish-${event.type}`,
      traceId: event.traceId,
      event: {
        type: event.type,
      },
    }, `Event published: ${event.type}`);

    const handlers = this.subscribers.get(event.type) || [];

    // Execute all handlers concurrently but don't let one failure stop others
    const results = await Promise.allSettled(
      handlers.map((handler) => Promise.resolve(handler(event)))
    );

    // Log failures if any
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error({
          source: event.source,
          operation: `handle-${event.type}`,
          traceId: event.traceId,
          error: result.reason,
        }, `Event handler ${index} failed for ${event.type}`);
      }
    });
  }

  clear(): void {
    this.subscribers.clear();
  }
}

// Global event bus singleton
let globalEventBus: IEventBus | null = null;

/**
 * Initialize the global event bus
 * Should be called once during application startup
 */
export const initializeEventBus = (): IEventBus => {
  if (!globalEventBus) {
    globalEventBus = new InMemoryEventBus();
  }
  return globalEventBus;
};

/**
 * Get the global event bus instance
 * Must call initializeEventBus() first
 */
export const getEventBus = (): IEventBus => {
  if (!globalEventBus) {
    throw new Error(
      'Event bus not initialized. Call initializeEventBus() first.'
    );
  }
  return globalEventBus;
};

/**
 * Reset event bus (useful for testing)
 */
export const resetEventBus = (): void => {
  if (globalEventBus) {
    globalEventBus.clear();
  }
  globalEventBus = null;
};
