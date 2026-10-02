import playwright from '../node_modules/playwright-core/index.js';
const { chromium } = playwright;

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage({ ignoreHTTPSErrors: true });

  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('response', res => {
    if (res.url().includes('/api/')) {
      console.log(`API [${res.status()}] ${res.url()}`);
    }
  });

  console.log('Visiting https://webdiag.ru/account ...');
  await page.goto('https://webdiag.ru/account', { waitUntil: 'networkidle' });

  // Get network failures or responses
  await page.waitForTimeout(2000);
  await browser.close();
}

run().catch(console.error);
