import playwright from '../node_modules/playwright-core/index.js';
const { chromium } = playwright;

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage({ ignoreHTTPSErrors: true });

  await page.goto('https://webdiag.ru/', { waitUntil: 'networkidle' });

  const result = await page.evaluate(async () => {
    try {
      const res = await fetch('/api/account/me');
      return {
        status: res.status,
        text: await res.text()
      };
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log('Result of fetch(/api/account/me):', JSON.stringify(result, null, 2));

  await browser.close();
}

run().catch(console.error);
