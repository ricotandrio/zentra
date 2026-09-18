export interface Llm {
  generate(prompt: string): Promise<string>;
}
