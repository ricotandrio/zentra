import { SummarizeContentUseCase } from '@/modules/content-summary/application/usecases/summarize-content.usecase';

describe('SummarizeContentUseCase', () => {
  let mockScraperPort: any;
  let mockGenerateUseCase: any;

  beforeEach(() => {
    mockScraperPort = {
      extractMarkdown: jest.fn().mockResolvedValue('# Hello\n\nThis is some article content.'),
    };
    mockGenerateUseCase = {
      execute: jest.fn().mockResolvedValue('**Summary:** The article covers the key highlights.'),
    };
  });

  describe('execute', () => {
    it('should scrape content and return markdown + summary', async () => {
      const useCase = new SummarizeContentUseCase(mockScraperPort, mockGenerateUseCase);

      const result = await useCase.execute('https://example.com/article');

      expect(mockScraperPort.extractMarkdown).toHaveBeenCalledWith('https://example.com/article');
      expect(mockGenerateUseCase.execute).toHaveBeenCalledWith(
        expect.stringContaining('# Hello')
      );
      expect(result.markdown).toBe('# Hello\n\nThis is some article content.');
      expect(result.summary).toBe('**Summary:** The article covers the key highlights.');
    });

    it('should throw error for invalid URL', async () => {
      const useCase = new SummarizeContentUseCase(mockScraperPort, mockGenerateUseCase);

      await expect(useCase.execute('not-a-url')).rejects.toThrow('Invalid URL');
      expect(mockScraperPort.extractMarkdown).not.toHaveBeenCalled();
      expect(mockGenerateUseCase.execute).not.toHaveBeenCalled();
    });

    it('should truncate long markdown content before sending to LLM', async () => {
      const longMarkdown = 'word '.repeat(20000);
      mockScraperPort.extractMarkdown.mockResolvedValue(longMarkdown);

      const useCase = new SummarizeContentUseCase(mockScraperPort, mockGenerateUseCase);

      await useCase.execute('https://example.com/long-article');

      const prompt = mockGenerateUseCase.execute.mock.calls[0][0];
      expect(prompt).toContain('[Content truncated]');
      expect(prompt.length).toBeLessThan(20000);
    });

    it('should propagate scraper errors', async () => {
      mockScraperPort.extractMarkdown.mockRejectedValue(
        new Error('Content scraper error: failed to fetch')
      );

      const useCase = new SummarizeContentUseCase(mockScraperPort, mockGenerateUseCase);

      await expect(useCase.execute('https://example.com/broken')).rejects.toThrow(
        'Content scraper error'
      );
      expect(mockGenerateUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
