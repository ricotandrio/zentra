import { ModuleHandle, Runtime } from '@/shared/runtime';
import { GeminiAdapter } from './infrastructure/gemini/gemini.adapter';
import { GenerateResponseUseCase } from './application/usecases/generate-response.usecase';

export interface LlmModule {
  generate: GenerateResponseUseCase;
}

export function createLlmModule(): ModuleHandle<LlmModule> {
  let service: LlmModule | null = null;

  return {
    getService() {
      if (!service) throw new Error('LLM module is not registered');
      return service;
    },

    register(runtime: Runtime) {
      const { apiKey, modelName } = runtime.config.llm;

      const geminiAdapter = new GeminiAdapter(apiKey, modelName);
      const generateUseCase = new GenerateResponseUseCase(geminiAdapter);

      service = {
        generate: generateUseCase,
      };
      runtime.logging.llm.moduleInit();
    },
  };
}
