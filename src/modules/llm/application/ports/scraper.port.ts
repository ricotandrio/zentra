export interface Scraper {
  extractMarkdown(url: string): Promise<string>;
}
