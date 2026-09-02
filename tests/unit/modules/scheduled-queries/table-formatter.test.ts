import { markdownTableToPng, parseMarkdownTable } from '@/shared/utils';

describe('Scheduled query table formatter', () => {
  it('should parse markdown table input and render PNG bytes', async () => {
    const markdown = `
| Symbol | Price |
| --- | --- |
| BBCA | 1200 |
| BMRI | 980 |
`;

    const parsed = parseMarkdownTable(markdown);
    expect(parsed.headers).toEqual(['Symbol', 'Price']);
    expect(parsed.rows).toHaveLength(2);

    const png = await markdownTableToPng(markdown, { width: 500 });
    expect(png).toBeInstanceOf(Buffer);
    expect(png.length).toBeGreaterThan(100);
  });
});
