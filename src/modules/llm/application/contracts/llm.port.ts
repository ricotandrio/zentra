export interface IGeminiPort {
  generate(prompt: string): Promise<string>;
}
