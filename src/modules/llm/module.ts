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
      const { API_KEY, MODEL_NAME } = runtime.config.LLM;

      const geminiAdapter = new GeminiAdapter(API_KEY, MODEL_NAME);
      const generateUseCase = new GenerateResponseUseCase(geminiAdapter);

      service = {
        generate: generateUseCase,
      };
      runtime.logging.llm.moduleInit();
    },
  };
}
