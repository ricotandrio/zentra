import { Logger } from 'pino';

export const createLlmLogger = (logger: Logger) => {
  return {
    moduleInit: () => {
      logger.info(
        { source: 'system', operation: 'llm-module-init' },
        'LLM module initialized'
      );
    },

    responseGenerated: (params: { promptLength: number; responseLength: number }) => {
      logger.info(
        { source: 'llm', operation: 'generate-response', metadata: { promptLength: params.promptLength, responseLength: params.responseLength } },
        'LLM response generated'
      );
    },

    responseFailed: (params: { error: unknown }) => {
      logger.error(
        { source: 'llm', operation: 'generate-response', error: params.error },
        'LLM response generation failed'
      );
    },

    messageReceived: (params: { userId: string }) => {
      logger.info(
        { source: 'llm', operation: 'process-message', metadata: { userId: params.userId } },
        'Processing user message with LLM'
      );
    },
  };
};
