import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({
    headless: false,
  });

  const page = await browser.newPage();

  // Open page
  await page.goto(
    'https://www.idx.co.id/primary/TradingSummary/GetStockSummary?length=9999&start=0',
    {
      waitUntil: 'networkidle',
    }
  );

  // Get raw response text
  const content = await page.textContent('body');

  // Parse JSON
  const result = JSON.parse(content || '{}');

  console.log(result);

  await browser.close();
}

main().catch(console.error);