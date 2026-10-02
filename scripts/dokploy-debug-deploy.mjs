import playwright from '../node_modules/playwright-core/index.js';
const { chromium } = playwright;
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('deploy') || msg.text().includes('trpc')) {
      console.log('BROWSER CONSOLE:', msg.type(), msg.text());
    }
  });

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('trpc') || url.includes('deploy')) {
      try {
        const text = await res.text();
        console.log(`HTTP ${res.status()} ${url.split('?')[0]}: ${text.slice(0, 300)}`);
      } catch (e) {}
    }
  });

  console.log('Logging in...');
  await page.goto('https://cp.flatero.ru/', { waitUntil: 'networkidle' });
  const inputs = await page.$$eval('input', els => els.map(e => ({ id: e.id, name: e.name })));
  if (inputs.length >= 2) {
    await page.fill(inputs[0].id ? `#${inputs[0].id}` : 'input[name="email"]', 'fedorovich.web@yandex.ru');
    await page.fill(inputs[1].id ? `#${inputs[1].id}` : 'input[name="password"]', 'nwRL8aK6mnJJ6edYL1');
    await page.click('button:has-text("Login")');
    await page.waitForTimeout(2000);
  }

  const serviceUrl = 'https://cp.flatero.ru/dashboard/project/9djFlwtZhfuug-jt9o0Vt/environment/Ur07yx99KXKMS7S_hlAXl/services/compose/IIFs-ezxHret2rViaDEek';
  await page.goto(serviceUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // Click Deploy button directly
  console.log('Clicking Deploy button...');
  const deployBtn = await page.$('button:has-text("Deploy")');
  if (deployBtn) {
    await deployBtn.click();
    console.log('Clicked Deploy!');
    await page.waitForTimeout(5000);
  }

  // Also check "Preview Compose" button to verify what Dokploy parses from GitHub
  console.log('Checking Preview Compose button...');
  const previewBtn = await page.$('button:has-text("Preview Compose")');
  if (previewBtn) {
    await previewBtn.click();
    await page.waitForTimeout(3000);

    const previewScreen = path.join(__dirname, 'dokploy-preview-compose.png');
    await page.screenshot({ path: previewScreen, fullPage: true });
    console.log('Saved Preview Compose screenshot to:', previewScreen);
  }

  await browser.close();
}

run().catch(console.error);
