export interface IScraperPort {
  extractMarkdown(url: string): Promise<string>;
}
