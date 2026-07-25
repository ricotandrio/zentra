import { Module, Runtime } from '@/shared/runtime';
import { GeminiAdapter } from './infrastructure/gemini/gemini.adapter';
import { GenerateResponseUseCase } from './application/usecases/generate-response.usecase';

export interface LlmModule {
  generate: GenerateResponseUseCase;
}

export function createLlmModule(): Module {
  return {
    register(runtime: Runtime) {
      const { API_KEY, MODEL_NAME } = runtime.config.LLM;

      const geminiAdapter = new GeminiAdapter(API_KEY, MODEL_NAME);
      const generateUseCase = new GenerateResponseUseCase(geminiAdapter);

      const llmModule: LlmModule = {
        generate: generateUseCase,
      };

      runtime.modules.set('llm', llmModule);
      runtime.logging.llm.moduleInit();
    },
  };
}
