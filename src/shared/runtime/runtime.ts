import { IEventBus, initializeEventBus } from '@/shared/event-bus';
import { Scheduler } from '@/shared/scheduler';
import { LoggingService, logging } from '@/shared/logger';
import { env } from '@/shared/config';
import { rotateLogs } from '@/shared/logger/log-rotate';

export interface Module {
  register(runtime: Runtime): Promise<void> | void;
  shutdown?(): Promise<void> | void;
}

export interface Runtime {
  eventBus: IEventBus;
  scheduler: Scheduler;
  config: typeof env;
  logging: LoggingService;
  modules: Map<string, unknown>;
  registerModule(module: Module): Promise<void>;
  onShutdown(handler: () => Promise<void> | void): void;
  shutdown(): Promise<void>;
}

export function createRuntime(): Runtime {
  const eventBus = initializeEventBus();
  const scheduler = new Scheduler();
  const registeredModules: Module[] = [];
  const shutdownHandlers: Array<() => Promise<void> | void> = [];

  const runtime: Runtime = {
    eventBus,
    scheduler,
    config: env,
    logging,
    modules: new Map(),

    async registerModule(module: Module) {
      await module.register(runtime);
      registeredModules.push(module);
    },

    onShutdown(handler: () => Promise<void> | void) {
      shutdownHandlers.push(handler);
    },

    async shutdown() {
      logging.system.shutdown();

      for (const handler of [...shutdownHandlers].reverse()) {
        await handler();
      }

      for (const module of [...registeredModules].reverse()) {
        await module.shutdown?.();
      }

      scheduler.stopAll();
    },
  };

  scheduler.register({
    name: 'log-rotation',
    schedule: '0 0 * * *',
    execute: async () => {
      rotateLogs(env.LOG.HOT_ROTATE, env.LOG.COLD_ROTATE);
    },
  });

  rotateLogs(env.LOG.HOT_ROTATE, env.LOG.COLD_ROTATE);

  return runtime;
}
